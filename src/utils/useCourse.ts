import {
    computed, nextTick, onBeforeUnmount, onMounted, ref, watch,
} from 'vue';
import { getLessonsOptions, getTasksMap } from './getSelectorOptions';
import { parseArguments, requiresNode } from './execution';
import { renderMarkdown } from './markdown';
import { readStorage, writeStorage } from './storage';
import { useTaskEditor } from './useTaskEditor';
import type { LogEntry, RunStatus } from '../types';

export function useCourse() {
    const lessons = getLessonsOptions();
    const taskMap = getTasksMap(lessons);
    const lesson = ref('');
    const taskId = ref('');
    const query = ref('');
    const group = ref('all');
    const source = ref('');
    const editor = useTaskEditor(source);
    const description = ref('');
    const lessonDescription = ref('');
    const loading = ref(false);
    const loadError = ref('');
    const input = ref('');
    const inputError = ref('');
    const status = ref<RunStatus>('idle');
    const duration = ref<number | null>(null);
    const logs = ref<LogEntry[]>([]);
    const frame = ref<HTMLIFrameElement | null>(null);
    const frameUrl = ref('');
    const runId = ref('');
    const slow = ref(false);
    const presentation = ref(false);
    const activeLine = ref(1);
    const walkthrough = ref(false);
    const lineNote = ref('');
    const notice = ref('');
    const logFilter = ref('all');
    const tasks = computed(() => taskMap.get(lesson.value) ?? []);
    const task = computed(() => tasks.value.find((item) => item.id === taskId.value));
    const filteredTasks = computed(() => tasks.value.filter(
        (item) => (group.value === 'all' || item.group === group.value)
                && item.title.toLowerCase().includes(query.value.toLowerCase().trim()),
    ));
    const visibleLogs = computed(() => logs.value.filter(
        (item) => logFilter.value === 'all' || item.level === logFilter.value,
    ));
    const lines = computed(() => source.value.replace(/\r\n/g, '\n').split('\n'));
    const isNode = computed(() => task.value?.type === 'js' && requiresNode(source.value));
    const testCommand = computed(() => `yarn test "${task.value?.directory ?? `Lessons/${lesson.value}`}"`);
    const filePath = computed(() => task.value?.path ?? '');
    const lineCount = computed(() => lines.value.length);
    let revision = 0;
    let launchRevision = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    let logId = 0;
    let runInput = '';
    let runDebug = false;
    let runModuleUrl = '';
    let ignoreInputSave = false;
    const storageKey = () => `course:args:${task.value?.path ?? ''}`;
    const noteKey = () => `course:note:${filePath.value}:${activeLine.value}`;

    function flash(text: string) {
        notice.value = text;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => {
            notice.value = '';
        }, 5000);
    }

    function addLog(level: LogEntry['level'], text: string) {
        logs.value.push({
            id: (logId += 1),
            level,
            text: text.slice(0, 20000),
            time: new Date().toLocaleTimeString('ru-RU'),
        });
        if (logs.value.length > 500) {
            logs.value.splice(0, logs.value.length - 500);
        }
    }

    function stop(mark = true) {
        launchRevision += 1;
        clearTimeout(timer);
        runId.value = '';
        frameUrl.value = '';
        slow.value = false;
        if (mark) {
            status.value = 'stopped';
        }
    }

    function saveUrl(replace = false) {
        const url = new URL(location.href);
        if (lesson.value) {
            url.searchParams.set('lesson', lesson.value);
        } else {
            url.searchParams.delete('lesson');
        }
        if (taskId.value) {
            url.searchParams.set('task', taskId.value);
        } else {
            url.searchParams.delete('task');
        }
        if (url.href !== location.href) {
            history[replace ? 'replaceState' : 'pushState']({}, '', url);
        }
        writeStorage('course:last', {
            lesson: lesson.value,
            task: taskId.value,
        });
    }
    async function run(debug = false) {
        const selected = task.value;
        if (!selected || loading.value || isNode.value) {
            return;
        }
        inputError.value = '';
        if (selected.type === 'js') {
            try {
                parseArguments(input.value);
            } catch (error) {
                inputError.value = (error as Error).message;
                return;
            }
        }
        stop(false);
        logs.value = [];
        duration.value = null;
        const current = revision;
        const launch = launchRevision;
        const runSource = source.value;
        const useDraft = editor.dirty.value;
        await nextTick(); // Destroy the old browsing context, including its timers and Vue app.
        if (current !== revision || launch !== launchRevision) {
            return;
        }
        runModuleUrl = '';
        if (useDraft) {
            status.value = 'loading';
            try {
                const moduleUrl = await editor.draftUrl(runSource);
                if (current !== revision || launch !== launchRevision) {
                    return;
                }
                runModuleUrl = moduleUrl;
            } catch (error) {
                if (current !== revision || launch !== launchRevision) {
                    return;
                }
                status.value = 'error';
                addLog('error', error instanceof Error ? error.message : 'Не удалось запустить черновик.');
                return;
            }
        }
        editor.ranSource.value = runSource;
        runId.value = crypto.randomUUID();
        runInput = input.value;
        runDebug = debug;
        const url = selected.type === 'html'
            ? new URL(runModuleUrl || `../${selected.path}`, location.href)
            : new URL('./runner.html', location.href);
        url.searchParams.set('run', runId.value);
        frameUrl.value = url.href;
        status.value = 'running';
        timer = setTimeout(() => {
            slow.value = true;
        }, 10000);
    }
    async function loadSelection() {
        revision += 1;
        const current = revision;
        stop(false);
        editor.clear();
        logs.value = [];
        source.value = '';
        description.value = '';
        lessonDescription.value = '';
        loadError.value = '';
        inputError.value = '';
        status.value = 'idle';
        duration.value = null;
        activeLine.value = 1;
        const selected = task.value;
        ignoreInputSave = true;
        const savedInput = readStorage<unknown>(storageKey(), '');
        input.value = typeof savedInput === 'string' ? savedInput : '';
        ignoreInputSave = false;
        if (!lesson.value) {
            loading.value = false;
            return;
        }
        loading.value = true;
        try {
            if (!selected) {
                const entry = lessons.find((item) => item.id === lesson.value);
                const markdown = entry ? await entry.loader() : '';
                const html = await renderMarkdown(markdown, `Lessons/${lesson.value}`);
                if (current === revision) {
                    lessonDescription.value = html;
                }
            } else {
                const results = await Promise.allSettled([
                    selected.codeLoader(),
                    selected.readmeLoader?.() ?? Promise.resolve(''),
                ]);
                if (current !== revision) {
                    return;
                }
                if (results[0].status === 'rejected') {
                    throw results[0].reason;
                }
                source.value = results[0].value;
                await editor.load(selected.path, results[0].value);
                if (current !== revision) {
                    return;
                }
                const raw = results[1].status === 'fulfilled' ? results[1].value : '';
                const html = await renderMarkdown(
                    raw || 'Условие пока не добавлено. Откройте README.md в папке задачи.',
                    selected.directory,
                );
                if (current !== revision) {
                    return;
                }
                description.value = html;
                loading.value = false;
                if (results[1].status === 'rejected') {
                    flash('Не удалось загрузить условие. Код задачи доступен.');
                }
                if (isNode.value) {
                    status.value = 'node';
                } else {
                    await run();
                }
            }
        } catch (error) {
            if (current !== revision) {
                return;
            }
            const reason = error instanceof Error ? error.message : String(error);
            loadError.value = `Не удалось загрузить материалы: ${reason}`;
            status.value = 'error';
        } finally {
            if (current === revision) {
                loading.value = false;
            }
        }
    }

    function chooseLesson(id: string) {
        lesson.value = lessons.some((item) => item.id === id) ? id : '';
        taskId.value = '';
        query.value = '';
        group.value = 'all';
        saveUrl();
        loadSelection();
    }

    function chooseTask(id: string) {
        taskId.value = tasks.value.some((item) => item.id === id) ? id : '';
        saveUrl();
        loadSelection();
    }

    function restore(initial = false) {
        const url = new URL(location.href);
        const saved = readStorage<{
            lesson?: string;
            task?: string;
        }>('course:last', {});
        const useSaved = initial && !url.searchParams.has('lesson') && !url.searchParams.has('task');
        const requestedLesson = (useSaved ? saved?.lesson : url.searchParams.get('lesson')) ?? '';
        lesson.value = lessons.some((item) => item.id === requestedLesson) ? requestedLesson : '';
        const requestedTask = (useSaved ? saved?.task : url.searchParams.get('task')) ?? '';
        taskId.value = tasks.value.some((item) => item.id === requestedTask) ? requestedTask : '';
        if ((requestedLesson && !lesson.value) || (requestedTask && !taskId.value)) {
            flash('Задача из ссылки не найдена. Выберите её из списка.');
        }
        query.value = '';
        group.value = 'all';
        saveUrl(true);
        loadSelection();
    }

    function frameLoaded() {
        if (task.value?.type === 'html' && status.value === 'running') {
            status.value = 'done';
            clearTimeout(timer);
        }
    }

    function message(event: MessageEvent) {
        if (
            event.source !== frame.value?.contentWindow
            || event.origin !== location.origin
            || event.data?.channel !== 'course-runner'
            || event.data?.runId !== runId.value
            || !runId.value
        ) {
            return;
        }
        const data = event.data;
        if (data.type === 'ready') {
            frame.value?.contentWindow?.postMessage(
                {
                    channel: 'course-runner',
                    type: 'execute',
                    runId: runId.value,
                    path: task.value?.path,
                    input: runInput,
                    debug: runDebug,
                    moduleUrl: runModuleUrl,
                },
                location.origin,
            );
        }
        if (
            data.type === 'log'
            && ['log', 'info', 'warn', 'error', 'result'].includes(data.level)
            && typeof data.text === 'string'
        ) {
            addLog(data.level, data.text);
        }
        if (data.type === 'failure' && typeof data.text === 'string') {
            status.value = 'error';
            addLog('error', data.text);
            clearTimeout(timer);
            slow.value = false;
        }
        if (data.type === 'complete') {
            if (status.value !== 'error') {
                status.value = 'done';
            }
            duration.value = typeof data.duration === 'number' ? data.duration : null;
            clearTimeout(timer);
            slow.value = false;
        }
    }

    function moveTask(direction: number) {
        const index = tasks.value.findIndex((item) => item.id === taskId.value);
        const next = tasks.value[index + direction];
        if (next) {
            chooseTask(next.id);
        }
    }

    function moveLine(direction: number) {
        activeLine.value = Math.min(lineCount.value, Math.max(1, activeLine.value + direction));
    }

    function saveNote(value: string) {
        lineNote.value = value;
        if (!writeStorage(noteKey(), value)) {
            flash('Браузер не разрешил сохранить заметку. Она доступна до смены строки.');
        }
    }
    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            flash('Скопировано');
        } catch {
            flash('Буфер обмена недоступен. Выделите и скопируйте текст вручную.');
        }
    }

    function keyboard(event: KeyboardEvent) {
        const target = event.target as HTMLElement | null;
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            run();
        }
        if (event.key === 'Escape') {
            presentation.value = false;
        }
        if (!walkthrough.value || target?.closest('input, textarea, select, [contenteditable]')) {
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveLine(event.key === 'ArrowDown' ? 1 : -1);
        }
    }
    watch(
        input,
        (value) => {
            inputError.value = '';
            if (!ignoreInputSave && task.value && !writeStorage(storageKey(), value)) {
                flash('Не удалось сохранить аргументы в браузере.');
            }
        },
        {
            flush: 'sync',
        },
    );
    watch(
        [activeLine, filePath],
        () => {
            const value = readStorage<unknown>(noteKey(), '');
            lineNote.value = typeof value === 'string' ? value : '';
        },
        {
            flush: 'sync',
        },
    );
    const popstate = () => restore();
    onMounted(() => {
        window.addEventListener('message', message);
        window.addEventListener('popstate', popstate);
        window.addEventListener('keydown', keyboard);
        restore(true);
    });
    onBeforeUnmount(() => {
        revision += 1;
        stop(false);
        clearTimeout(noticeTimer);
        window.removeEventListener('message', message);
        window.removeEventListener('popstate', popstate);
        window.removeEventListener('keydown', keyboard);
    });
    return {
        lessons,
        lesson,
        taskId,
        tasks,
        task,
        query,
        group,
        filteredTasks,
        source,
        editor,
        description,
        lessonDescription,
        loading,
        loadError,
        input,
        inputError,
        status,
        duration,
        logs,
        visibleLogs,
        frame,
        frameUrl,
        runId,
        slow,
        presentation,
        activeLine,
        walkthrough,
        lineNote,
        notice,
        logFilter,
        lines,
        lineCount,
        isNode,
        testCommand,
        filePath,
        chooseLesson,
        chooseTask,
        loadSelection,
        run,
        stop,
        frameLoaded,
        moveTask,
        moveLine,
        saveNote,
        copy,
    };
}
