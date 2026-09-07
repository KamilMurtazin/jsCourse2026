import roundAndRootNumber from './index';

describe('01.c.4 roundAndRootNumber', () => {
    it('01.c.4.1', () => {
        expect(roundAndRootNumber(5843)).toBe('76.43');
        expect(roundAndRootNumber(18248)).toBe('135.08');
        expect(roundAndRootNumber(0)).toBe('0');
        expect(roundAndRootNumber(5)).toBe('2.23');
        expect(roundAndRootNumber(-100)).toBe('error');
    });

    it('01.c.4.2 does not append unnecessary decimal zeros', () => {
        expect(roundAndRootNumber(1)).toBe('1');
        expect(roundAndRootNumber(4)).toBe('2');
        expect(roundAndRootNumber(0.25)).toBe('0.5');
    });

    it('01.c.4.3 rounds down instead of to nearest', () => {
        expect(roundAndRootNumber(2)).toBe('1.41');
        expect(roundAndRootNumber(3)).toBe('1.73');
        expect(roundAndRootNumber(-0.25)).toBe('error');
    });
});
