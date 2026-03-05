
const fs = require('fs');

// Create a minimal app mock environment
global.window = {
    supabase: {
        createClient: jest.fn(() => ({
            auth: { onAuthStateChange: jest.fn(), getSession: jest.fn().mockResolvedValue({ data: { session: null } }) }
        }))
    }
};

let app;

describe('SiteFlow v2 Core Utilities', () => {
    beforeEach(() => {
        jest.isolateModules(() => {
            app = require('./app.js');
        });
    });

    describe('escaparCSV', () => {
        test('should return empty string for null or undefined', () => {
            expect(app.escaparCSV(null)).toBe('');
            expect(app.escaparCSV(undefined)).toBe('');
        });

        test('should return unchanged string for simple alphanumeric values', () => {
            expect(app.escaparCSV('hello')).toBe('hello');
            expect(app.escaparCSV('123')).toBe('123');
        });

        test('should prefix with single quote for formula injection characters', () => {
            expect(app.escaparCSV('=SUM(A1)')).toBe("'=SUM(A1)");
            expect(app.escaparCSV('+123')).toBe("'+123");
            expect(app.escaparCSV('-456')).toBe("'-456");
            expect(app.escaparCSV('@admin')).toBe("'@admin");
            expect(app.escaparCSV('\tTab')).toBe("'\tTab");
        });

        test('should escape standard CSV special characters with double quotes', () => {
            expect(app.escaparCSV('value,with,comma')).toBe('"value,with,comma"');
            expect(app.escaparCSV('value"with"quote')).toBe('"value""with""quote"');
            expect(app.escaparCSV('value\nwith\nnewline')).toBe('"value\nwith\nnewline"');
        });

        test('should handle both CSV injection and standard escaping together', () => {
            expect(app.escaparCSV('=SUM(A,B)')).toBe('"' + "'=SUM(A,B)" + '"');
        });
    });

    describe('escapeHTML', () => {
        test('should return empty string for null, undefined, or empty string', () => {
            expect(app.escapeHTML(null)).toBe('');
            expect(app.escapeHTML(undefined)).toBe('');
            expect(app.escapeHTML('')).toBe('');
        });

        test('should return unchanged string for normal alphanumeric values', () => {
            expect(app.escapeHTML('hello')).toBe('hello');
            expect(app.escapeHTML('123')).toBe('123');
        });

        test('should correctly convert specific HTML characters', () => {
            expect(app.escapeHTML('&')).toBe('&amp;');
            expect(app.escapeHTML('<')).toBe('&lt;');
            expect(app.escapeHTML('>')).toBe('&gt;');
            expect(app.escapeHTML('"')).toBe('&quot;');
            expect(app.escapeHTML("'")).toBe('&#039;');
        });

        test('should safely handle and convert full XSS payloads', () => {
            expect(app.escapeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        test('should stringify non-string inputs like numbers before escaping', () => {
            expect(app.escapeHTML(123)).toBe('123');
            expect(app.escapeHTML(0)).toBe('0');
            expect(app.escapeHTML(false)).toBe('false');
            expect(app.escapeHTML(true)).toBe('true');
        });
    });
});
