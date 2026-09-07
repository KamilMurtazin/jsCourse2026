export function parseArguments(input: string, defaults: unknown = []): unknown[] {
    if (!input.trim()) {
        if (!Array.isArray(defaults)) {
            throw new Error('Экспорт payload должен быть массивом аргументов.');
        }
        return defaults;
    }
    try {
        return JSON.parse(`[${input}]`) as unknown[];
    } catch {
        throw new Error('Аргументы должны быть в формате JSON через запятую. Например: 42, "текст", [1, 2].');
    }
}
export async function invokeTask(value: unknown, args: unknown[]) {
    if (typeof value !== 'function') {
        throw new Error('Добавьте export default с функцией или классом в файл задачи.');
    }
    // Ordinary functions also have a prototype. Only native class syntax needs new.
    if (/^class\s/.test(Function.prototype.toString.call(value))) {
        return Reflect.construct(value, args) as unknown;
    }
    return (await Reflect.apply(value, undefined, args)) as unknown;
}
export function formatValue(value: unknown): string {
    const seen = new WeakSet<object>();

    function format(item: unknown, depth: number): string {
        if (item === null) {
            return 'null';
        }
        if (item === undefined) {
            return 'undefined';
        }
        if (typeof item === 'string') {
            return JSON.stringify(item.length > 12000 ? `${item.slice(0, 12000)}…` : item);
        }
        if (typeof item === 'bigint') {
            return `${item}n`;
        }
        if (typeof item === 'function') {
            return `[Function: ${item.name || 'anonymous'}]`;
        }
        if (typeof item !== 'object') {
            return String(item);
        }
        if (item instanceof Error) {
            return `${item.name}: ${item.message}${item.stack ? `\n${item.stack}` : ''}`;
        }
        if (typeof Element !== 'undefined' && item instanceof Element) {
            return item.outerHTML.slice(0, 12000);
        }
        if (item instanceof Date) {
            return String(item);
        }
        if (seen.has(item)) {
            return '[Circular]';
        }
        if (depth > 5) {
            return '[…]';
        }
        seen.add(item);
        let output: string;
        if (Array.isArray(item)) {
            output = `[${item
                .slice(0, 100)
                .map((x) => format(x, depth + 1))
                .join(', ')}${item.length > 100 ? ', …' : ''}]`;
        } else if (item instanceof Map) {
            output = `Map ${format([...item.entries()], depth + 1)}`;
        } else if (item instanceof Set) {
            output = `Set ${format([...item], depth + 1)}`;
        } else {
            output = `{${Object.keys(item)
                .slice(0, 100)
                .map((key) => {
                    const descriptor = Object.getOwnPropertyDescriptor(item, key);
                    const text = descriptor && 'value' in descriptor
                        ? format(descriptor.value, depth + 1) : '[Getter]';
                    return `${key}: ${text}`;
                })
                .join(', ')}}`;
        }
        seen.delete(item);
        return output;
    }
    try {
        return format(value, 0).slice(0, 20000);
    } catch {
        return '[Не удалось прочитать значение]';
    }
}
export function requiresNode(source: string) {
    return /(?:from\s*|import\s*\(|require\s*\()\s*['"](?:node:|fs(?:\/|['"])|path['"]|os['"]|child_process['"])/.test(
        source,
    );
}
