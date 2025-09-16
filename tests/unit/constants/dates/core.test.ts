import { createDateConstants, type GettextFns } from '../../../../constants/dates/core.js';

describe('createDateConstants', () => {
    let mockGettextFns: GettextFns;
    let underscoreSpy: jest.SpyInstance
    let pgetextSpy: jest.SpyInstance;
    let dateConstants: ReturnType<typeof createDateConstants>;

    beforeEach(() => {
        underscoreSpy = jest.fn((s: string) => `translated:${s}`);
        pgetextSpy = jest.fn((context: string, message: string) => `translated:${message}`);

        mockGettextFns = {
            _: underscoreSpy as any,
            ngettext: jest.fn((s: string, p: string, n: number) => n === 1 ? s : p),
            pgettext: pgetextSpy as any,
        };

        dateConstants = createDateConstants(mockGettextFns);
    });

    describe('dateOnly', () => {
        it('should return the date-only format template', () => {
            const dateOnly = dateConstants.dateOnly();
            expect(dateOnly).toBe('translated:the %s');
        });

        it('should call pgettext with correct context and message', () => {
            dateConstants.dateOnly();
            expect(pgetextSpy).toHaveBeenCalledWith(
                'This is how someone would say the day of the month only. As in, "My rent is due on the %s."',
                'the %s'
            );
        });

        it('should return consistent results on multiple calls', () => {
            const first = dateConstants.dateOnly();
            const second = dateConstants.dateOnly();
            expect(first).toBe(second);
        });
    });

    describe('weekdays', () => {
        it('should return exactly 7 weekday formats', () => {
            const weekdays = dateConstants.weekdays();
            expect(weekdays).toHaveLength(7);
        });

        it('should have all weekdays in correct order', () => {
            const weekdays = dateConstants.weekdays();
            expect(weekdays[0]).toBe('translated:sunday the %s');
            expect(weekdays[1]).toBe('translated:monday the %s');
            expect(weekdays[2]).toBe('translated:tuesday the %s');
            expect(weekdays[3]).toBe('translated:wednesday the %s');
            expect(weekdays[4]).toBe('translated:thursday the %s');
            expect(weekdays[5]).toBe('translated:friday the %s');
            expect(weekdays[6]).toBe('translated:saturday the %s');
        });

        it('should call pgettext with detailed context for each weekday', () => {
            dateConstants.weekdays();

            expect(pgetextSpy).toHaveBeenCalledWith(
                'The day of the week and the date. The date will be substituted in the %s. For example, "Sunday the fifth".',
                'sunday the %s'
            );
            expect(pgetextSpy).toHaveBeenCalledWith(
                'The day of the week and the date. The date will be substituted in the %s. For example, "Monday the sixth".',
                'monday the %s'
            );
            expect(pgetextSpy).toHaveBeenCalledWith(
                'The day of the week and the date. The date will be substituted in the %s. For example, "Saturday the eleventh".',
                'saturday the %s'
            );
        });

        it('should return new array instances on each call', () => {
            const weekdays1 = dateConstants.weekdays();
            const weekdays2 = dateConstants.weekdays();

            expect(weekdays1).toEqual(weekdays2);
            expect(weekdays1).not.toBe(weekdays2); // Different instances
        });

        it('should have lowercase weekday names', () => {
            const weekdays = dateConstants.weekdays();
            weekdays.forEach(day => {
                expect(day).toMatch(/^translated:[a-z]/);
            });
        });
    });

    describe('daysOfMonth', () => {
        it('should return exactly 31 day names', () => {
            const days = dateConstants.daysOfMonth();
            expect(days).toHaveLength(31);
        });

        it('should have ordinal numbers in correct order', () => {
            const days = dateConstants.daysOfMonth();
            expect(days[0]).toBe('translated:first');
            expect(days[1]).toBe('translated:second');
            expect(days[2]).toBe('translated:third');
            expect(days[9]).toBe('translated:tenth');
            expect(days[19]).toBe('translated:twentieth');
            expect(days[30]).toBe('translated:thirty first');
        });

        it('should call underscore function for all day names', () => {
            dateConstants.daysOfMonth();

            expect(underscoreSpy).toHaveBeenCalledWith('first');
            expect(underscoreSpy).toHaveBeenCalledWith('second');
            expect(underscoreSpy).toHaveBeenCalledWith('third');
            expect(underscoreSpy).toHaveBeenCalledWith('tenth');
            expect(underscoreSpy).toHaveBeenCalledWith('twentieth');
            expect(underscoreSpy).toHaveBeenCalledWith('thirty first');
        });

        it('should handle special ordinal patterns correctly', () => {
            const days = dateConstants.daysOfMonth();

            // Check -st endings
            expect(days[0]).toBe('translated:first');
            expect(days[20]).toBe('translated:twenty first');
            expect(days[30]).toBe('translated:thirty first');

            // Check -nd endings
            expect(days[1]).toBe('translated:second');
            expect(days[21]).toBe('translated:twenty second');

            // Check -rd endings
            expect(days[2]).toBe('translated:third');
            expect(days[22]).toBe('translated:twenty third');

            // Check -th endings
            expect(days[3]).toBe('translated:fourth');
            expect(days[10]).toBe('translated:eleventh');
            expect(days[11]).toBe('translated:twelfth');
            expect(days[12]).toBe('translated:thirteenth');
        });

        it('should return new array instances on each call', () => {
            const days1 = dateConstants.daysOfMonth();
            const days2 = dateConstants.daysOfMonth();

            expect(days1).toEqual(days2);
            expect(days1).not.toBe(days2); // Different instances
        });

        it('should call underscore function exactly 31 times', () => {
            dateConstants.daysOfMonth();
            expect(underscoreSpy).toHaveBeenCalledTimes(31);
        });
    });

    describe('function behavior', () => {
        it('should use both underscore and pgettext functions', () => {
            dateConstants.dateOnly();
            dateConstants.weekdays();
            dateConstants.daysOfMonth();

            expect(underscoreSpy).toHaveBeenCalled();
            expect(pgetextSpy).toHaveBeenCalled();
        });

        it('should handle functions being called in any order', () => {
            // Call in different order
            dateConstants.daysOfMonth();
            dateConstants.dateOnly();
            dateConstants.weekdays();

            expect(underscoreSpy).toHaveBeenCalledTimes(31);
            expect(pgetextSpy).toHaveBeenCalledTimes(8); // 1 for dateOnly + 7 for weekdays
        });
    });

    describe('edge cases', () => {
        it('should handle gettext functions that return original strings', () => {
            const passthroughGettext: GettextFns = {
                _: (s: string) => s,
                ngettext: (s: string, p: string, n: number) => n === 1 ? s : p,
                pgettext: (context: string, message: string) => message,
            };

            const constants = createDateConstants(passthroughGettext);

            expect(constants.dateOnly()).toBe('the %s');
            expect(constants.weekdays()[0]).toBe('sunday the %s');
            expect(constants.daysOfMonth()[0]).toBe('first');
        });

        it('should work with gettext functions that throw errors', () => {
            const errorGettext: GettextFns = {
                _: jest.fn().mockImplementation(() => { throw new Error('Translation error'); }),
                ngettext: jest.fn().mockImplementation(() => { throw new Error('Translation error'); }),
                pgettext: jest.fn().mockImplementation(() => { throw new Error('Translation error'); }),
            };

            expect(() => createDateConstants(errorGettext)).not.toThrow();
            expect(() => createDateConstants(errorGettext).dateOnly()).toThrow();
            expect(() => createDateConstants(errorGettext).weekdays()).toThrow();
            expect(() => createDateConstants(errorGettext).daysOfMonth()).toThrow();
        });

        it('should handle empty string returns from gettext', () => {
            const emptyGettext: GettextFns = {
                _: jest.fn().mockReturnValue(''),
                ngettext: jest.fn().mockReturnValue(''),
                pgettext: jest.fn().mockReturnValue(''),
            };

            const constants = createDateConstants(emptyGettext);

            expect(constants.dateOnly()).toBe('');
            expect(constants.weekdays()[0]).toBe('');
            expect(constants.daysOfMonth()[0]).toBe('');
        });

        it('should handle null/undefined returns from gettext', () => {
            const nullGettext: GettextFns = {
                _: jest.fn().mockReturnValue(null),
                ngettext: jest.fn().mockReturnValue(null),
                pgettext: jest.fn().mockReturnValue(null),
            };

            const constants = createDateConstants(nullGettext);

            expect(constants.dateOnly()).toBe(null);
            expect(constants.weekdays()[0]).toBe(null);
            expect(constants.daysOfMonth()[0]).toBe(null);
        });
    });

    describe('integration', () => {
        it('should work together to format complete date strings', () => {
            // Simulate how these would be used together
            const dateOnly = dateConstants.dateOnly(); // "the %s"
            const weekday = dateConstants.weekdays()[0]; // "sunday the %s"
            const dayOfMonth = dateConstants.daysOfMonth()[4]; // "fifth"

            // These could be combined like: "sunday the fifth" or just "the fifth"
            expect(dateOnly).toContain('%s');
            expect(weekday).toContain('%s');
            expect(dayOfMonth).not.toContain('%s');
        });

        it('should maintain consistent translation contexts', () => {
            dateConstants.dateOnly();
            dateConstants.weekdays();

            // Check that contexts are descriptive and unique
            const calls = pgetextSpy.mock.calls;
            const contexts = calls.map(call => call[0]);

            expect(contexts).toContain('This is how someone would say the day of the month only. As in, "My rent is due on the %s."');
            expect(contexts.some(ctx => ctx.includes('Sunday the fifth'))).toBe(true);
            expect(contexts.some(ctx => ctx.includes('Saturday the eleventh'))).toBe(true);
        });
    });
});