import type { LessonOption, TaskOption, TextLoader } from '../types';

const lessonReadmes = import.meta.glob<string>('../../Lessons/*/README.md', { query: '?raw', import: 'default' });
const sources = import.meta.glob<string>([
    '../../Lessons/*/{Tasks,Homework}/*/index.{js,ts,html}',
    '../../Lessons/*/{Tasks,Homework}/*/App.vue',
    '../../Lessons/*/{Tasks,Homework}/*/{src,Example}/index.html',
], { query: '?raw', import: 'default' });
const readmes = import.meta.glob<string>('../../Lessons/*/{Tasks,Homework}/*/README.md', { query: '?raw', import: 'default' });

export function getLessonsOptions(): LessonOption[] {
    return Object.entries(lessonReadmes).map(([path, loader]) => ({
        id: path.split('/')[3], path, loader,
    })).sort((a, b) => a.id.localeCompare(b.id, 'ru', { numeric: true }));
}

// Discovering tasks never imports or executes student code.
export function buildTasksMap(lessons: LessonOption[], files: Record<string, TextLoader>, descriptions: Record<string, TextLoader>) {
    const map = new Map<string, TaskOption[]>(lessons.map(lesson => [lesson.id, []]));
    for (const [path, codeLoader] of Object.entries(files)) {
        const match = path.match(/^\.\.\/\.\.\/Lessons\/([^/]+)\/(Tasks|Homework)\/(Task (\d+)\. [^/]+)\/(?:(src|Example)\/)?(index\.(js|ts|html)|App\.vue)$/);
        if (!match || !map.has(match[1])) continue;
        const [, lesson, group, name, num, subdir, , ext] = match;
        const extension = ext ?? 'vue';
        const directory = `Lessons/${lesson}/${group}/${name}`;
        const suffix = subdir === 'Example' ? ' | Example' : '';
        map.get(lesson)!.push({
            id: `${name} | ${group} | ${extension}${suffix}`,
            title: `${name}${suffix ? ' · Пример' : ''}`,
            lesson, group: group as TaskOption['group'], num: Number(num), extension,
            type: extension === 'html' ? 'html' : extension === 'vue' ? 'vue' : 'js',
            path: path.slice(6), directory, codeLoader,
            readmeLoader: descriptions[`../../${directory}/README.md`],
        });
    }
    for (const tasks of map.values()) {
        tasks.sort((a, b) => (a.group === b.group ? 0 : a.group === 'Tasks' ? -1 : 1)
            || a.num - b.num || a.id.localeCompare(b.id));
    }
    return map;
}
export const getTasksMap = (lessons: LessonOption[]) => buildTasksMap(lessons, sources, readmes);

