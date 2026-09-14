import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const API = '/__course/editor';
const MAX_BYTES = 512 * 1024;
const DRAFT_TTL = 30 * 60 * 1000;
const normalize = (value: string) => value.replaceAll('\\', '/');

export class EditorError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

const version = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Only existing task entry files are editable; neither arbitrary paths nor symlink targets are accepted. */
export function createEditorStore(root: string) {
    const canonicalRoot = fs.realpathSync(root);
    function resolveFile(relative: string) {
        if (
            typeof relative !== 'string'
            || relative.includes('\\')
            || relative.includes('\0')
            || relative.split('/').some((part) => part === '.' || part === '..')
            // eslint-disable-next-line @stylistic/max-len -- Keep the editable path grammar in one expression.
            || !/^Lessons\/[^/]+\/(Tasks|Homework)\/Task \d+\. [^/]+\/(?:(src|Example)\/)?(?:index\.(?:js|ts|html)|App\.vue)$/.test(
                relative,
            )
        ) {
            throw new EditorError(400, 'Разрешено изменять только исходный файл выбранной задачи.');
        }
        const segments = relative.split('/');
        let filename = canonicalRoot;
        for (const segment of segments) {
            filename = path.join(filename, segment);
            if (!fs.existsSync(filename)) {
                throw new EditorError(404, 'Файл задачи не найден.');
            }
            if (fs.lstatSync(filename).isSymbolicLink()) {
                throw new EditorError(403, 'Ссылки на файлы и папки недоступны для записи.');
            }
        }
        const real = fs.realpathSync(filename);
        const inside = path.relative(canonicalRoot, real);
        const stat = fs.statSync(real);
        if (inside.startsWith('..') || path.isAbsolute(inside) || !stat.isFile() || stat.nlink !== 1) {
            throw new EditorError(403, 'Файл должен находиться внутри проекта и не быть ссылкой.');
        }
        if (stat.size > MAX_BYTES) {
            throw new EditorError(413, 'Редактор поддерживает файлы до 512 КБ.');
        }
        return real;
    }
    function read(relative: string) {
        const bytes = fs.readFileSync(resolveFile(relative));
        return { source: bytes.toString('utf8'), revision: version(bytes) };
    }
    function save(relative: string, source: string, revision: string) {
        if (typeof source !== 'string' || Buffer.byteLength(source) > MAX_BYTES) {
            throw new EditorError(413, 'Редактор поддерживает файлы до 512 КБ.');
        }
        const filename = resolveFile(relative);
        const previous = fs.readFileSync(filename);
        if (version(previous) !== revision) {
            throw new EditorError(409, 'Файл изменён в другом редакторе. Ваш черновик сохранён в браузере.');
        }
        // Preserve the project's line endings and UTF-8 BOM. No await between comparison and atomic replacement.
        let content = source.replace(/\r\n/g, '\n');
        if (previous.includes(Buffer.from('\r\n'))) {
            content = content.replace(/\n/g, '\r\n');
        }
        if (
            previous.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))
            && !content.startsWith('\uFEFF')
        ) {
            content = `\uFEFF${content}`;
        }
        const temporary = `${filename}.${randomUUID()}.tmp`;
        try {
            fs.writeFileSync(temporary, content, { flag: 'wx', mode: fs.statSync(filename).mode });
            // Revalidate the target after creating the temporary file, including external edits.
            if (resolveFile(relative) !== filename || version(fs.readFileSync(filename)) !== revision) {
                throw new EditorError(409, 'Файл изменился во время сохранения. Черновик не записан.');
            }
            fs.renameSync(temporary, filename);
        } finally {
            if (fs.existsSync(temporary)) {
                fs.unlinkSync(temporary);
            }
        }
        return read(relative);
    }
    return { resolveFile, read, save };
}

export function isLocalEditorRequest(request: Pick<IncomingMessage, 'headers' | 'socket' | 'method'>) {
    const peer = request.socket.remoteAddress?.replace(/^::ffff:/, '');
    if (peer !== '::1' && !/^127\.\d+\.\d+\.\d+$/.test(peer ?? '')) {
        return false;
    }
    const host = request.headers.host ?? '';
    if (!/^(localhost|127\.\d+\.\d+\.\d+|\[::1\])(?::\d+)?$/.test(host)) {
        return false;
    }
    if (request.headers['x-course-editor'] !== '1') {
        return false;
    }
    if (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin') {
        return false;
    }
    const origin = request.headers.origin;
    return origin ? origin === `http://${host}` || origin === `https://${host}` : request.method === 'GET';
}

async function readBody(request: IncomingMessage) {
    if (!request.headers['content-type']?.startsWith('application/json')) {
        throw new EditorError(415, 'Ожидался JSON.');
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
        size += Buffer.byteLength(chunk);
        if (size > MAX_BYTES * 2 + 4096) {
            throw new EditorError(413, 'Запрос слишком большой.');
        }
        chunks.push(Buffer.from(chunk));
    }
    try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new Error('object expected');
        }
        return body as { path?: string; source?: string; revision?: string };
    } catch {
        throw new EditorError(400, 'Не удалось прочитать запрос.');
    }
}

function reply(response: ServerResponse, status: number, value: unknown) {
    response.removeHeader('Access-Control-Allow-Origin');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.writeHead(status);
    response.end(JSON.stringify(value));
}

interface Draft {
    filename: string;
    url: string;
    source: string;
    created: number;
}

export default function courseEditor(): Plugin {
    const drafts = new Map<string, Draft>();
    let root = '';
    function findDraft(id: string) {
        const filename = id.split('?')[0].replace(/^\0/, '');
        return [...drafts.values()].find((draft) => draft.filename === filename || draft.url === filename);
    }
    return {
        name: 'course-local-editor',
        apply: 'serve',
        enforce: 'pre',
        resolveId(id, importer) {
            const htmlDraft = importer?.startsWith('\0') ? findDraft(importer) : undefined;
            if (htmlDraft && !id.includes('html-proxy')) {
                return this.resolve(id, htmlDraft.filename, { skipSelf: true });
            }
            const draft = findDraft(id);
            if (draft && !id.includes('html-proxy')) {
                return draft.filename + (id.includes('?') ? `?${id.split('?')[1]}` : '');
            }
            return null;
        },
        load(id) {
            const draft = findDraft(id);
            const query = new URLSearchParams(id.split('?')[1]);
            if (draft && !query.has('vue') && !query.has('html-proxy')) {
                return draft.source;
            }
            return null;
        },
        configureServer(server) {
            root = normalize(server.config.root);
            const store = createEditorStore(root);
            server.middlewares.use(async (request, response, next) => {
                const url = new URL(request.url ?? '/', 'http://localhost');
                let decoded: string;
                try {
                    decoded = decodeURI(url.pathname);
                } catch {
                    next();
                    return;
                }
                const draft = findDraft(decoded);
                if (draft && draft.filename.endsWith('.html')) {
                    try {
                        const html = await server.transformIndexHtml(draft.url, draft.source, request.url);
                        response.setHeader('Content-Type', 'text/html; charset=utf-8');
                        response.setHeader('Cache-Control', 'no-store');
                        response.end(html);
                    } catch (error) {
                        next(error);
                    }
                    return;
                }
                if (!url.pathname.startsWith(`${API}/`)) {
                    next();
                    return;
                }
                if (!isLocalEditorRequest(request)) {
                    reply(response, 403, {
                        error: 'Откройте приложение через localhost на компьютере с yarn watch.',
                    });
                    return;
                }
                try {
                    if (url.pathname === `${API}/file` && request.method === 'GET') {
                        reply(response, 200, store.read(url.searchParams.get('path') ?? ''));
                    } else if (url.pathname === `${API}/file` && request.method === 'PUT') {
                        const body = await readBody(request);
                        reply(response, 200, store.save(body.path ?? '', body.source!, body.revision ?? ''));
                    } else if (url.pathname === `${API}/draft` && request.method === 'POST') {
                        const body = await readBody(request);
                        const filename = store.resolveFile(body.path ?? '');
                        if (typeof body.source !== 'string' || Buffer.byteLength(body.source) > MAX_BYTES) {
                            throw new EditorError(413, 'Редактор поддерживает файлы до 512 КБ.');
                        }
                        for (const [id, entry] of drafts) {
                            if (Date.now() - entry.created > DRAFT_TTL) {
                                drafts.delete(id);
                            }
                        }
                        if (drafts.size >= 64) {
                            drafts.delete(drafts.keys().next().value!);
                        }
                        const id = randomUUID();
                        const virtual = normalize(
                            path.join(path.dirname(filename), `.course-draft-${id}${path.extname(filename)}`),
                        );
                        const draftUrl = `/${normalize(path.relative(root, virtual))}`;
                        drafts.set(id, {
                            filename: virtual,
                            url: draftUrl,
                            source: body.source,
                            created: Date.now(),
                        });
                        if (!filename.endsWith('.html')) {
                            try {
                                await server.transformRequest(draftUrl);
                            } catch (cause) {
                                drafts.delete(id);
                                const error = cause as { message?: string; frame?: string };
                                const detail = error.message ?? 'не удалось обработать код';
                                throw new EditorError(
                                    422,
                                    `Ошибка в черновике: ${detail}\n${error.frame ?? ''}`,
                                );
                            }
                        }
                        reply(response, 200, { url: draftUrl.split('/').map(encodeURIComponent).join('/') });
                    } else {
                        reply(response, 405, { error: 'Действие недоступно.' });
                    }
                } catch (error) {
                    const status = error instanceof EditorError ? error.status : 500;
                    reply(response, status, {
                        error:
                            error instanceof EditorError
                                ? error.message
                                : 'Не удалось записать файл. Проверьте доступ к папке проекта.',
                    });
                }
            });
        },
    };
}
