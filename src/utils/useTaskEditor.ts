import {
    computed, onBeforeUnmount, onMounted, ref, watch, type Ref,
} from 'vue';
import { readStorage, writeStorage } from './storage';

export interface FileSnapshot {
    source: string;
    revision: string;
}
interface StoredDraft extends FileSnapshot {
    base: string;
}
const normalized = (value: string) => value.replace(/\r\n/g, '\n');

export class EditorRequestError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
    }
}

async function request<T>(endpoint: string, method = 'GET', data?: unknown): Promise<T> {
    const response = await fetch(`/__course/editor/${endpoint}`, {
        method,
        headers: { 'X-Course-Editor': '1', ...(data ? { 'Content-Type': 'application/json' } : {}) },
        body: data ? JSON.stringify(data) : undefined,
        cache: 'no-store',
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new EditorRequestError(503, 'Редактор доступен через локальный сервер yarn watch.');
    }
    const result = await response.json();
    if (!response.ok) {
        throw new EditorRequestError(response.status, result.error ?? 'Сервер не выполнил запрос.');
    }
    return result as T;
}

export function useTaskEditor(sourceRef: Ref<string>) {
    const source = sourceRef;
    const available = ref(false);
    const editing = ref(false);
    const saving = ref(false);
    const error = ref('');
    const message = ref('');
    const conflict = ref(false);
    const base = ref('');
    const currentPath = ref('');
    const dirty = computed(() => !!currentPath.value && normalized(source.value) !== normalized(base.value));
    const ranSource = ref<string | null>(null);
    const resultOutdated = computed(
        () => ranSource.value !== null && normalized(source.value) !== normalized(ranSource.value),
    );
    let revision = '';
    let generation = 0;
    let paused = false;
    let storageFailed = false;
    const key = (file: string) => `course:draft:${file}`;

    function persist() {
        if (paused || !currentPath.value) {
            return;
        }
        const draft: StoredDraft | null = dirty.value
            ? { source: source.value, base: base.value, revision }
            : null;
        if (!writeStorage(key(currentPath.value), draft)) {
            storageFailed = true;
            error.value = 'Браузер не сохранил черновик. Скопируйте код перед закрытием страницы.';
        } else {
            storageFailed = false;
        }
    }

    function clear() {
        persist();
        generation += 1;
        currentPath.value = '';
        available.value = false;
        saving.value = false;
        error.value = '';
        message.value = '';
        conflict.value = false;
        ranSource.value = null;
    }

    async function load(file: string, fallback: string) {
        generation += 1;
        const current = generation;
        let snapshot: FileSnapshot = { source: fallback, revision: '' };
        let local = false;
        let failure = '';
        if (import.meta.env.DEV) {
            try {
                snapshot = await request<FileSnapshot>(`file?path=${encodeURIComponent(file)}`);
                local = true;
            } catch (cause) {
                failure = cause instanceof Error ? cause.message : 'Нет связи с локальным сервером.';
            }
        }
        if (current !== generation) {
            return;
        }
        paused = true;
        currentPath.value = file;
        available.value = local;
        base.value = snapshot.source;
        revision = snapshot.revision;
        source.value = snapshot.source;
        const draft = readStorage<StoredDraft | null>(key(file), null);
        if (
            draft
            && typeof draft.source === 'string'
            && typeof draft.base === 'string'
            && typeof draft.revision === 'string'
            && normalized(draft.source) !== normalized(snapshot.source)
        ) {
            source.value = draft.source;
            base.value = draft.base;
            revision = draft.revision;
            conflict.value = normalized(snapshot.source) !== normalized(draft.base);
            editing.value = true;
            message.value = 'Восстановлен черновик из этого браузера.';
        }
        error.value = failure;
        paused = false;
        persist();
    }

    async function draftUrl(text = source.value) {
        if (!available.value) {
            throw new Error('Для запуска черновика откройте локальный сервер yarn watch.');
        }
        const result = await request<{ url: string }>('draft', 'POST', {
            path: currentPath.value,
            source: text,
        });
        return result.url;
    }

    async function save() {
        if (!available.value || !dirty.value || saving.value || conflict.value) {
            return;
        }
        const current = generation;
        const file = currentPath.value;
        const text = source.value;
        const originalBase = base.value;
        saving.value = true;
        error.value = '';
        message.value = '';
        try {
            const result = await request<FileSnapshot>('file', 'PUT', { path: file, source: text, revision });
            // Even after navigation, update the saved draft's baseline without discarding newer edits.
            if (current !== generation) {
                const draft = readStorage<StoredDraft | null>(key(file), null);
                if (draft?.base === originalBase) {
                    writeStorage(
                        key(file),
                        normalized(draft.source) === normalized(result.source)
                            ? null
                            : { source: draft.source, base: result.source, revision: result.revision },
                    );
                }
                return;
            }
            paused = true;
            base.value = result.source;
            revision = result.revision;
            if (source.value === text) {
                source.value = result.source;
            }
            conflict.value = false;
            paused = false;
            persist();
            message.value = dirty.value
                ? 'Файл обновлён. Более новые правки ещё в черновике.'
                : 'Локальный файл обновлён.';
        } catch (cause) {
            if (current !== generation) {
                return;
            }
            conflict.value = cause instanceof EditorRequestError && cause.status === 409;
            error.value = cause instanceof Error ? cause.message : 'Не удалось сохранить файл.';
        } finally {
            if (current === generation) {
                saving.value = false;
            }
        }
    }

    async function reset() {
        if (!available.value || saving.value) {
            return;
        }
        if (dirty.value && !window.confirm('Отменить черновик и загрузить текущий файл с диска?')) {
            return;
        }
        const current = generation;
        try {
            const snapshot = await request<FileSnapshot>(
                `file?path=${encodeURIComponent(currentPath.value)}`,
            );
            if (current !== generation) {
                return;
            }
            paused = true;
            base.value = snapshot.source;
            source.value = snapshot.source;
            revision = snapshot.revision;
            conflict.value = false;
            error.value = '';
            paused = false;
            persist();
            message.value = 'Загружен текущий файл с диска.';
        } catch (cause) {
            if (current === generation) {
                error.value = (cause as Error).message;
            }
        }
    }

    function beforeUnload(event: BeforeUnloadEvent) {
        persist();
        if (dirty.value && storageFailed) {
            event.preventDefault();
            // eslint-disable-next-line no-param-reassign -- Required by browsers for the unload confirmation.
            event.returnValue = '';
        }
    }
    watch(
        source,
        () => {
            message.value = '';
            persist();
        },
        { flush: 'sync' },
    );
    onMounted(() => window.addEventListener('beforeunload', beforeUnload));
    onBeforeUnmount(() => {
        persist();
        generation += 1;
        window.removeEventListener('beforeunload', beforeUnload);
    });
    return {
        available,
        editing,
        saving,
        error,
        message,
        conflict,
        dirty,
        ranSource,
        resultOutdated,
        load,
        clear,
        save,
        reset,
        draftUrl,
    };
}
