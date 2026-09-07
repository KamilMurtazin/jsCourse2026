import { vi } from 'vitest';
import helloWorld from './index.js';

describe('01.c.0 helloWorld', () => {
    let spy;

    beforeEach(() => {
        spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        spy.mockRestore();
    });

    it('01.c.0.1 hello', () => {
        helloWorld();
        expect(spy.mock.calls).toEqual([['Hello World!']]);
    });

    it('01.c.0.2 prints once on every call', () => {
        helloWorld();
        helloWorld();
        expect(spy.mock.calls).toEqual([['Hello World!'], ['Hello World!']]);
    });

    it('01.c.0.3 does not print when the module is imported', async () => {
        vi.resetModules();
        await import('./index.js');
        expect(spy).not.toHaveBeenCalled();
    });
});
