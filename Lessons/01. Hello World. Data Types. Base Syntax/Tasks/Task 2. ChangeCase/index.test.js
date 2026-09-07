import changeCase from './index';

describe('01.c.2 changeCase', () => {
    it('01.c.2.1 changeCase', () => {
        expect(changeCase('case')).toEqual('CASE');
        expect(changeCase('loveJS')).toEqual('LOVEjs');
        expect(changeCase('')).toEqual('');
        expect(changeCase('Hello World')).toEqual('hELLO wORLD');
    });

    it('01.c.2.2 preserves digits, spaces and punctuation', () => {
        expect(changeCase('JS 101!')).toBe('js 101!');
        expect(changeCase('  a-B?  ')).toBe('  A-b?  ');
        expect(changeCase('0123!?')).toBe('0123!?');
    });

    it('01.c.2.3 handles single letters and Russian text', () => {
        expect(changeCase('a')).toBe('A');
        expect(changeCase('Z')).toBe('z');
        expect(changeCase('Привет, Ёж!')).toBe('пРИВЕТ, ёЖ!');
    });
});
