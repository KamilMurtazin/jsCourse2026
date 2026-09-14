// @vitest-environment node
import {
    afterEach, beforeEach, describe, expect, it,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import { createEditorStore, isLocalEditorRequest } from './courseEditor';

const relative = 'Lessons/01. Test/Tasks/Task 1. Example/index.js';
let root: string;
let store: ReturnType<typeof createEditorStore>;
beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'course-editor-test-'));
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.writeFileSync(path.join(root, relative), 'export default () => 1;\n');
    store = createEditorStore(root);
});
afterEach(() => {
    const target = path.resolve(root);
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep + 'course-editor-test-')) {
        throw new Error('Unexpected cleanup target');
    }
    fs.rmSync(target, { recursive: true, force: true });
});

describe('local file saving', () => {
    it('writes exactly the selected source file and returns its new revision', () => {
        const before = store.read(relative);
        const after = store.save(relative, 'export default () => 2;\n', before.revision);
        expect(after.source).toBe('export default () => 2;\n');
        expect(after.revision).not.toBe(before.revision);
        expect(store.read(relative)).toEqual(after);
        expect(fs.readdirSync(path.dirname(path.join(root, relative)))).toEqual(['index.js']);
    });
    it('rejects stale saves instead of overwriting an external edit', () => {
        const before = store.read(relative);
        fs.writeFileSync(path.join(root, relative), 'external change');
        expect(() => store.save(relative, 'my draft', before.revision)).toThrow('другом редакторе');
        expect(store.read(relative).source).toBe('external change');
    });
    it('rejects a second writer holding the same original revision', () => {
        const before = store.read(relative);
        store.save(relative, 'first writer', before.revision);
        expect(() => store.save(relative, 'second writer', before.revision)).toThrow();
        expect(store.read(relative).source).toBe('first writer');
    });
    it('preserves CRLF and UTF-8 BOM', () => {
        fs.writeFileSync(path.join(root, relative), '\uFEFFconst n = 1;\r\nexport default n;\r\n');
        const before = store.read(relative);
        store.save(relative, 'const n = 2;\nexport default n;\n', before.revision);
        expect(store.read(relative).source).toBe('\uFEFFconst n = 2;\r\nexport default n;\r\n');
    });
    it.each([
        '../package.json',
        'package.json',
        'Lessons/01. Test/Tasks/Task 1. Example/../../index.js',
        relative.replaceAll('/', '\\'),
        '/etc/passwd',
        'Lessons/01. Test/Tasks/Task 1. Example/helper.js',
    ])('rejects paths outside the editable task entries: %s', (value) => {
        expect(() => store.read(value)).toThrow();
    });
    it('rejects hard links', () => {
        fs.linkSync(path.join(root, relative), path.join(root, 'linked.js'));
        expect(() => store.read(relative)).toThrow('ссылкой');
    });
    it('rejects symlinked directories even when they lead inside the project', () => {
        const folder = path.join(root, 'Lessons/01. Test/Tasks/Task 2. Link');
        fs.symlinkSync(path.dirname(path.join(root, relative)), folder, 'junction');
        expect(() => store.read(relative.replace('Task 1. Example', 'Task 2. Link'))).toThrow('Ссылки');
    });
    it('does not create missing files or accept oversized source', () => {
        expect(() => store.save(relative.replace('index.js', 'index.ts'), '', '')).toThrow('не найден');
        const before = store.read(relative);
        expect(() => store.save(relative, 'x'.repeat(512 * 1024 + 1), before.revision)).toThrow('512');
        expect(store.read(relative)).toEqual(before);
    });
});

describe('local API access', () => {
    const request = (headers: IncomingMessage['headers'] = {}, peer = '127.0.0.1', method = 'PUT') => ({
        method,
        socket: { remoteAddress: peer } as IncomingMessage['socket'],
        headers: {
            host: 'localhost:5173',
            origin: 'http://localhost:5173',
            'x-course-editor': '1',
            ...headers,
        },
    });
    it('accepts same-origin loopback requests including IPv4-mapped IPv6', () => {
        expect(isLocalEditorRequest(request())).toBe(true);
        expect(isLocalEditorRequest(request({}, '::ffff:127.0.0.1'))).toBe(true);
        expect(isLocalEditorRequest(request({ origin: undefined }, '::1', 'GET'))).toBe(true);
    });
    it('rejects remote clients, foreign origins, preflights and DNS rebinding hosts', () => {
        expect(isLocalEditorRequest(request({}, '192.168.0.10'))).toBe(false);
        expect(isLocalEditorRequest(request({ origin: 'https://foreign.example' }))).toBe(false);
        expect(isLocalEditorRequest(request({ host: 'rebinding.example' }))).toBe(false);
        expect(isLocalEditorRequest(request({ 'x-course-editor': undefined }))).toBe(false);
        expect(isLocalEditorRequest(request({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
        expect(isLocalEditorRequest(request({ origin: undefined }))).toBe(false);
    });
});
