export type TextLoader = () => Promise<string>;
export interface LessonOption {
    id: string;
    path: string;
    loader: TextLoader;
}
export interface TaskOption {
    id: string;
    title: string;
    lesson: string;
    group: 'Tasks' | 'Homework';
    type: 'js' | 'html' | 'vue';
    extension: string;
    num: number;
    path: string;
    directory: string;
    codeLoader: TextLoader;
    readmeLoader?: TextLoader;
}
export interface LogEntry {
    id: number;
    level: 'log' | 'info' | 'warn' | 'error' | 'result';
    text: string;
    time: string;
}
export type RunStatus = 'idle' | 'loading' | 'running' | 'done' | 'error' | 'stopped' | 'node';
