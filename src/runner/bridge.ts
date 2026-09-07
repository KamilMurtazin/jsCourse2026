import { formatValue } from '../utils/execution';

export const runId = new URLSearchParams(location.search).get('run');
export function send(type: string, data: Record<string, unknown> = {}) {
    if (window.parent !== window) {
        window.parent.postMessage(
            {
                channel: 'course-runner',
                runId,
                type,
                ...data,
            },
            location.origin,
        );
    }
}
// The bridge runs only in the disposable task frame, never on the course page.
if (window.parent !== window && runId) {
    const counter = {
        messages: 0,
    };
    for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
        const original = console[level].bind(console);
        console[level] = (...args: unknown[]) => {
            original(...args);
            counter.messages += 1;
            if (counter.messages <= 500) {
                send('log', {
                    level: level === 'debug' ? 'log' : level,
                    text: args
                        .map((arg) => (typeof arg === 'string' ? arg.slice(0, 20000) : formatValue(arg)))
                        .join(' ')
                        .slice(0, 20000),
                });
            } else if (counter.messages === 501) {
                send('log', {
                    level: 'warn',
                    text: 'Лимит 500 сообщений за запуск. Остановите задачу, если вывод бесконечный.',
                });
            }
        };
    }
    window.addEventListener('error', (event) => {
        send('failure', {
            text: event.error
                ? formatValue(event.error)
                : `${event.message}\n${event.filename}:${event.lineno}`,
        });
    });
    window.addEventListener('unhandledrejection', (event) => send('failure', {
        text: formatValue(event.reason),
    }));
}
