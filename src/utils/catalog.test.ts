import {
    describe, expect, it, vi,
} from 'vitest';
import { buildTasksMap, getLessonsOptions, getTasksMap } from './getSelectorOptions';

describe('task catalog', () => {
    it('finds actual course lessons and nested HTML descriptions without eager loads', () => {
        const lessons = getLessonsOptions();
        expect(lessons.length).toBe(14);
        const tasks = getTasksMap(lessons).get('05. DOM. Events')!;
        const html = tasks.find((task) => task.path.endsWith('Task 1. Counter/src/index.html'));
        expect(html?.id).toBe('Task 1. Counter | Tasks | html');
        expect(html?.readmeLoader).toBeTypeOf('function');
        for (const entries of getTasksMap(lessons).values()) {
            expect(new Set(entries.map((task) => task.id)).size).toBe(entries.length);
        }
    });
    it('allows missing README and sorts naturally within practice and homework', () => {
        const loader = vi.fn(async () => '');
        const prefix = '../../Lessons/01. Intro';
        const map = buildTasksMap(
            [
                {
                    id: '01. Intro',
                    path: '',
                    loader,
                },
            ],
            {
                [prefix + '/Tasks/Task 10. Ten/index.ts']: loader,
                [prefix + '/Homework/Task 1. Home/App.vue']: loader,
                [prefix + '/Tasks/Task 2. Two/src/index.html']: loader,
                [prefix + '/Tasks/Task 2. Two/Example/index.html']: loader,
            },
            {},
        );
        expect(loader).not.toHaveBeenCalled();
        const tasks = map.get('01. Intro')!;
        expect(tasks.map((task) => task.num)).toEqual([2, 2, 10, 1]);
        expect(tasks[0].readmeLoader).toBeUndefined();
        expect(tasks[3].type).toBe('vue');
        expect(tasks[2].extension).toBe('ts');
    });
});
