import {
    describe, expect, it, vi,
} from 'vitest';
import {
    formatValue, invokeTask, parseArguments, requiresNode,
} from './execution';

describe('student code execution', () => {
    it.each([0, false, '', null, undefined, NaN])('preserves falsy result %s', async (value) => {
        function regularFunction() {
            return value;
        }
        expect(await invokeTask(regularFunction, [])).toBe(value);
    });
    it('constructs classes and passes constructor arguments', async () => {
        class Example {
            constructor(public value: number) {}
        }
        const result = await invokeTask(Example, [42]);
        expect(result).toBeInstanceOf(Example);
        expect(result).toEqual({
            value: 42,
        });
    });
    it('awaits Promise results and propagates rejections', async () => {
        expect(await invokeTask(async (a: number) => a + 1, [2])).toBe(3);
        await expect(
            invokeTask(async () => {
                throw new Error('async failure');
            }, []),
        ).rejects.toThrow('async failure');
    });
    it('rejects a missing default function', async () => {
        await expect(invokeTask({}, [])).rejects.toThrow('export default');
    });
    it('parses JSON arguments without flattening array arguments', () => {
        expect(parseArguments('42, "text", [1, 2], false')).toEqual([42, 'text', [1, 2], false]);
        expect(parseArguments(' ', [9])).toEqual([9]);
        expect(() => parseArguments('word')).toThrow('JSON');
        expect(() => parseArguments('', {})).toThrow('payload');
    });
    it('serializes circular objects, BigInt, errors, undefined and getters safely', () => {
        const getter = vi.fn(() => {
            throw new Error('should not execute');
        });
        const value = {
            n: 1n,
            value: undefined,
            get risky() {
                return getter();
            },
        };
        Object.assign(value, {
            self: value,
        });
        expect(formatValue(value)).toContain('[Circular]');
        expect(formatValue(value)).toContain('1n');
        expect(formatValue(value)).toContain('undefined');
        expect(formatValue(value)).toContain('[Getter]');
        expect(getter).not.toHaveBeenCalled();
        expect(formatValue(new Error('test error'))).toContain('test error');
        expect(formatValue('')).toBe('""');
    });
    it('bounds large output', () => {
        expect(formatValue('x'.repeat(100000)).length).toBeLessThanOrEqual(20000);
    });
    it('distinguishes browser tasks from Node imports', () => {
        expect(requiresNode('import { promises } from \'fs\';')).toBe(true);
        expect(requiresNode('import path from \'node:path\';')).toBe(true);
        expect(requiresNode('export default () => fetch(\'/api\')')).toBe(false);
    });
});
