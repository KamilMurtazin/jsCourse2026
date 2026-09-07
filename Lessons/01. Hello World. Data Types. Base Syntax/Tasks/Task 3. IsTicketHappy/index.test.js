import isTicketHappy from './index';

describe('01.c.3 isTicketHappy', () => {
    it('01.c.3.1 happy ticket', () => {
        expect(isTicketHappy('060006')).toBe(true);
        expect(isTicketHappy('123321')).toBe(true);
        expect(isTicketHappy('341800')).toBe(true);
        expect(isTicketHappy('812146')).toBe(true);
    });

    it('01.c.3.2 unhappy ticket', () => {
        expect(isTicketHappy('000001')).toBe(false);
        expect(isTicketHappy('123567')).toBe(false);
        expect(isTicketHappy('213612')).toBe(false);
    });

    it('01.c.3.3 supports different even lengths', () => {
        expect(isTicketHappy('33')).toBe(true);
        expect(isTicketHappy('12')).toBe(false);
        expect(isTicketHappy('2341')).toBe(true);
        expect(isTicketHappy('1552')).toBe(false);
        expect(isTicketHappy('12344321')).toBe(true);
        expect(isTicketHappy('12340000')).toBe(false);
    });

    it('01.c.3.4 preserves leading zeros and sums digits as numbers', () => {
        expect(isTicketHappy('00')).toBe(true);
        expect(isTicketHappy('0000')).toBe(true);
        expect(isTicketHappy('012210')).toBe(true);
        expect(isTicketHappy('000123')).toBe(false);
    });
});
