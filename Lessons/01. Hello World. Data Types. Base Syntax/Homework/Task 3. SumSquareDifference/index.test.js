import sumSquareDifference from './index';

describe('01.h.3 sumSquareDifference', () => {
    it('01.h.3 works correct', () => {
        expect(sumSquareDifference(1)).toEqual(0);
        expect(sumSquareDifference(5)).toEqual(170);
        expect(sumSquareDifference(10)).toEqual(2640);
        expect(sumSquareDifference(42)).toEqual(789824);
    });

    it('01.h.3.2 includes the last number in the range', () => {
        expect(sumSquareDifference(2)).toBe(4);
        expect(sumSquareDifference(3)).toBe(22);
    });

    it('01.h.3.3 handles a larger range', () => {
        expect(sumSquareDifference(1000)).toBe(250166416500);
    });
});
