export function readStorage<T>(key: string, fallback: T): T {
    try {
        return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback;
    } catch {
        return fallback;
    }
}
export function writeStorage(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}
