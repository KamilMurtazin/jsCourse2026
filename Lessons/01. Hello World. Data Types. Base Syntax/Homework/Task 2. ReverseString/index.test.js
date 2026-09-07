import reverseString from './index';

describe('01.h.2 reverseString', () => {
    it('01.h.2.1 works with common strings', () => {
        expect(reverseString('javascript')).toBe('tpircsavaj');
        expect(reverseString('console')).toBe('elosnoc');
        expect(reverseString('ab')).toBe('ba');
    });

    it('01.h.2.2 works with empty string', () => {
        expect(reverseString('')).toBe('');
    });

    it('01.h.2.3 preserves single characters, spaces and punctuation', () => {
        expect(reverseString('a')).toBe('a');
        expect(reverseString('a b!')).toBe('!b a');
        expect(reverseString(' JS ')).toBe(' SJ ');
        expect(reverseString('123')).toBe('321');
        expect(reverseString('Привет')).toBe('тевирП');
    });
});
