import { createApp, type Component } from 'vue';
import { createPinia } from 'pinia';
import { invokeTask, parseArguments, formatValue } from '../utils/execution';
import { runId, send } from './bridge';

const scripts = import.meta.glob<{
    default?: unknown;
    payload?: unknown;
}>('../../Lessons/*/{Tasks,Homework}/*/index.{js,ts}');
const components = import.meta.glob<{
    default: Component;
}>('../../Lessons/*/{Tasks,Homework}/*/App.vue');
let started = false;
window.addEventListener('message', async (event) => {
    if (
        event.source !== window.parent
        || event.origin !== location.origin
        || event.data?.channel !== 'course-runner'
        || event.data?.runId !== runId
        || event.data?.type !== 'execute'
        || started
    ) {
        return;
    }
    started = true;
    const { path, input, debug } = event.data as {
        path: string;
        input: string;
        debug: boolean;
    };
    const key = `../../${path}`;
    try {
        if (Object.hasOwn(components, key)) {
            const module = await components[key]();
            const app = createApp(module.default);
            app.use(createPinia());
            app.config.errorHandler = (error) => send('failure', {
                text: formatValue(error),
            });
            app.mount('#task-root');
            send('complete');
        } else if (Object.hasOwn(scripts, key)) {
            const module = await scripts[key]();
            const args = parseArguments(
                input,
                module.payload
                    ?? (
                        window as Window & {
                            payload?: unknown;
                        }
                    ).payload
                    ?? [],
            );
            send('log', {
                level: 'info',
                text: `Аргументы: ${formatValue(args)}`,
            });
            if (debug) {
                // Open DevTools first. Step into invokeTask to enter the student's source.
                // eslint-disable-next-line no-debugger -- Intentional classroom debugging control.
                debugger;
            }
            const start = performance.now();
            const result = await invokeTask(module.default, args);
            send('log', {
                level: 'result',
                text: `Результат: ${formatValue(result)}`,
            });
            send('complete', {
                duration: Math.round((performance.now() - start) * 100) / 100,
            });
        } else {
            throw new Error('Исполняемый файл задачи не найден.');
        }
    } catch (error) {
        send('failure', {
            text: formatValue(error),
        });
    }
});
send('ready');
