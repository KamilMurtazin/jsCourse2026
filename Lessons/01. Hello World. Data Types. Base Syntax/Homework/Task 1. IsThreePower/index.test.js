import isThreePower from './index';

describe('01.h.1 isThreePower', () => {
    it('01.h.1.1 should be a power of three', () => {
        expect(isThreePower(1)).toBe(true);
        expect(isThreePower(3)).toBe(true);
        expect(isThreePower(9)).toBe(true);
        expect(isThreePower(27)).toBe(true);
        expect(isThreePower(81)).toBe(true);
        expect(isThreePower(243)).toBe(true);
    });

    it('01.h.1.3 rejects negative integers', () => {
        expect(isThreePower(-1)).toBe(false);
        expect(isThreePower(-3)).toBe(false);
        expect(isThreePower(-27)).toBe(false);
    });

    it('01.h.1.4 handles powers beyond the introductory examples', () => {
        expect(isThreePower(59049)).toBe(true);
        expect(isThreePower(59048)).toBe(false);
        expect(isThreePower(59050)).toBe(false);
    });

    it('01.h.1.2 should not be a power of three', () => {
        expect(isThreePower(0)).toBe(false);
        expect(isThreePower(2)).toBe(false);
        expect(isThreePower(12)).toBe(false);
        expect(isThreePower(16)).toBe(false);
        expect(isThreePower(28)).toBe(false);
        expect(isThreePower(90)).toBe(false);
    });
});
