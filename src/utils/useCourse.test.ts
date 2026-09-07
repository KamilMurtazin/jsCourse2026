import {
    afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
    createApp, defineComponent, h, nextTick, type App,
} from 'vue';
import { useCourse } from './useCourse';
import type { TaskOption } from '../types';

const fixtures = vi.hoisted(() => ({
    tasks: [] as TaskOption[],
}));
vi.mock('./getSelectorOptions', () => ({
    getLessonsOptions: () => [
        {
            id: '01. Test',
            loader: async () => 'Lesson',
            path: '',
        },
    ],
    getTasksMap: () => new Map([['01. Test', fixtures.tasks]]),
}));
vi.mock('./markdown', () => ({
    renderMarkdown: async (text: string) => text,
}));

let app: App;
let course: ReturnType<typeof useCourse>;
const flush = async () => {
    await new Promise(resolve => {
        setTimeout(resolve, 0);
    });
    await nextTick();
};
const task = (id: string, codeLoader = async () => id): TaskOption => ({
    id,
    title: id,
    lesson: '01. Test',
    group: 'Tasks',
    type: 'js',
    extension: 'js',
    num: 1,
    path: 'Lessons/01. Test/Tasks/' + id + '/index.js',
    directory: 'Lessons/01. Test/Tasks/' + id,
    codeLoader,
    readmeLoader: async () => 'readme ' + id,
});
async function mount() {
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(
        defineComponent({
            setup() {
                course = useCourse();
                return () => h('div');
            },
        }),
    );
    app.mount(root);
    await flush();
}

beforeEach(() => {
    localStorage.clear();
    history.replaceState({}, '', '/src/index.html');
    fixtures.tasks = [task('A'), task('B')];
});
afterEach(() => {
    app?.unmount();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('course lifecycle', () => {
    it('ignores a stale task load after switching to a newer task', async () => {
        let resolve!: (value: string) => void;
        fixtures.tasks[0].codeLoader = () => new Promise((done) => {
            resolve = done;
        });
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        course.chooseTask('B');
        await flush();
        resolve('OLD A');
        await flush();
        expect(course.source.value).toBe('B');
        expect(course.description.value).toBe('readme B');
        expect(course.status.value).toBe('running');
    });
    it('clears stale content when an invalid URL is restored', async () => {
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        history.pushState({}, '', '?lesson=missing&task=A');
        window.dispatchEvent(new PopStateEvent('popstate'));
        await flush();
        expect(course.task.value).toBeUndefined();
        expect(course.source.value).toBe('');
        expect(course.frameUrl.value).toBe('');
        expect(course.notice.value).toContain('не найдена');
    });
    it('persists per-task arguments and stops on invalid JSON before creating another run', async () => {
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        course.input.value = '42';
        await course.run();
        const previousRun = course.runId.value;
        course.input.value = 'invalid';
        await course.run();
        expect(course.runId.value).toBe(previousRun);
        expect(course.inputError.value).toContain('JSON');
        course.input.value = '42';
        course.chooseTask('B');
        await flush();
        expect(course.input.value).toBe('');
        course.chooseTask('A');
        await flush();
        expect(course.input.value).toBe('42');
    });
    it('Stop cancels even a run pending the next Vue render', async () => {
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        const pending = course.run();
        course.stop();
        await pending;
        expect(course.status.value).toBe('stopped');
        expect(course.frameUrl.value).toBe('');
    });
    it('survives denied storage and corrupted preferences', async () => {
        localStorage.setItem('course:last', '{broken');
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        course.input.value = '5';
        expect(course.notice.value).toContain('сохранить');
        expect(course.task.value?.id).toBe('A');
    });
    it('does not run a Node-only task in the browser', async () => {
        fixtures.tasks[0].codeLoader = async () => 'import fs from \'node:fs\'';
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        expect(course.status.value).toBe('node');
        expect(course.frameUrl.value).toBe('');
    });
    it('loads source even if README is missing and catches source loader failures', async () => {
        fixtures.tasks[0].readmeLoader = undefined;
        fixtures.tasks[1].codeLoader = async () => {
            throw new Error('broken module');
        };
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        expect(course.description.value).toContain('пока не добавлено');
        course.chooseTask('B');
        await flush();
        expect(course.loadError.value).toContain('broken module');
        expect(course.frameUrl.value).toBe('');
    });
    it('rejects foreign messages and messages from a previous run', async () => {
        await mount();
        course.chooseLesson('01. Test');
        course.chooseTask('A');
        await flush();
        const iframe = document.createElement('iframe');
        document.body.append(iframe);
        course.frame.value = iframe;
        const emit = (runId: string, origin: string) => window.dispatchEvent(
            new MessageEvent('message', {
                origin,
                source: iframe.contentWindow,
                data: {
                    channel: 'course-runner',
                    runId,
                    type: 'log',
                    level: 'log',
                    text: 'hello',
                },
            }),
        );
        emit(course.runId.value, 'https://foreign.example');
        emit('stale', location.origin);
        expect(course.logs.value).toHaveLength(0);
        emit(course.runId.value, location.origin);
        expect(course.logs.value).toHaveLength(1);
        course.stop();
        emit('', location.origin);
        expect(course.logs.value).toHaveLength(1);
    });
});
