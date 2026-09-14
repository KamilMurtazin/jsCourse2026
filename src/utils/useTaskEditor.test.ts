import {
    afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
    createApp, defineComponent, h, ref, type App,
} from 'vue';
import { useTaskEditor } from './useTaskEditor';

let app: App;
let editor: ReturnType<typeof useTaskEditor>;
let source = ref('');
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
});
const file = 'Lessons/01. Test/Tasks/Task 1. Example/index.js';

beforeEach(() => {
    localStorage.clear();
    source = ref('');
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => response({ source: 'disk code', revision: 'v1' })),
    );
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(
        defineComponent({
            setup() {
                editor = useTaskEditor(source);
                return () => h('div');
            },
        }),
    );
    app.mount(root);
});
afterEach(() => {
    app.unmount();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('browser drafts', () => {
    it('keeps drafts by file, restores them, and runs without writing to the file endpoint', async () => {
        await editor.load(file, 'fallback');
        source.value = 'my draft';
        editor.clear();
        source.value = '';
        await editor.load(file, 'fallback');
        expect(source.value).toBe('my draft');
        expect(editor.dirty.value).toBe(true);
        vi.mocked(fetch).mockResolvedValueOnce(response({ url: '/draft.js' }));
        expect(await editor.draftUrl()).toBe('/draft.js');
        const [, options] = vi.mocked(fetch).mock.calls.at(-1)!;
        expect(options?.method).toBe('POST');
        expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
    });
    it('saves using the base revision and clears dirty state only on success', async () => {
        await editor.load(file, 'fallback');
        source.value = 'my draft';
        vi.mocked(fetch).mockResolvedValueOnce(response({ source: 'my draft', revision: 'v2' }));
        await editor.save();
        expect(JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as string)).toEqual({
            path: file,
            source: 'my draft',
            revision: 'v1',
        });
        expect(editor.dirty.value).toBe(false);
    });
    it('retains browser text when the server reports a conflict', async () => {
        await editor.load(file, 'fallback');
        source.value = 'my draft';
        vi.mocked(fetch).mockResolvedValueOnce(response({ error: 'external edit' }, 409));
        await editor.save();
        expect(editor.conflict.value).toBe(true);
        expect(source.value).toBe('my draft');
        expect(editor.dirty.value).toBe(true);
    });
    it('preserves edits made while an earlier save is in flight', async () => {
        await editor.load(file, 'fallback');
        source.value = 'first draft';
        let complete!: (value: Response) => void;
        vi.mocked(fetch).mockImplementationOnce(
            () => new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const saving = editor.save();
        source.value = 'newer draft';
        complete(response({ source: 'first draft', revision: 'v2' }));
        await saving;
        expect(source.value).toBe('newer draft');
        expect(editor.dirty.value).toBe(true);
    });
    it('does not apply an old file response after clearing the selection', async () => {
        let complete!: (value: Response) => void;
        vi.mocked(fetch).mockImplementationOnce(
            () => new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const loading = editor.load(file, 'fallback');
        editor.clear();
        source.value = 'new task';
        complete(response({ source: 'old file', revision: 'old' }));
        await loading;
        expect(source.value).toBe('new task');
    });
    it('detects external changes when restoring a draft after page reload', async () => {
        await editor.load(file, 'fallback');
        source.value = 'my draft';
        editor.clear();
        vi.mocked(fetch).mockResolvedValueOnce(response({ source: 'external', revision: 'v2' }));
        await editor.load(file, 'fallback');
        expect(editor.conflict.value).toBe(true);
        expect(source.value).toBe('my draft');
    });
    it('requires confirmation before resetting and reads the latest file', async () => {
        await editor.load(file, 'fallback');
        source.value = 'my draft';
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        await editor.reset();
        expect(source.value).toBe('my draft');
        vi.mocked(window.confirm).mockReturnValue(true);
        vi.mocked(fetch).mockResolvedValueOnce(response({ source: 'latest file', revision: 'v2' }));
        await editor.reset();
        expect(source.value).toBe('latest file');
        expect(editor.dirty.value).toBe(false);
    });
    it('keeps the source view functional when the local API is unavailable', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(new Response('<html>preview</html>'));
        await editor.load(file, 'fallback');
        expect(source.value).toBe('fallback');
        expect(editor.available.value).toBe(false);
    });
});
