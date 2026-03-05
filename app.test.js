/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Mock DOM elements and IndexedDB before requiring app.js
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('actualizarReloj', () => {
    let app;
    let displayTiempo;

    beforeEach(() => {
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockReturnValue({
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            })
        };

        // Mock Navigator and Service Worker
        global.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue({})
        };

        // Set up our document body
        document.body.innerHTML = html;
        displayTiempo = document.getElementById('displayTiempo');

        // Mock Date.now
        jest.useFakeTimers();
        jest.spyOn(Date, 'now');

        // Require app.js (we need to clear cache because it runs code on load)
        jest.isolateModules(() => {
            app = require('./app.js');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    test('should format time correctly for 0 seconds', () => {
        const startTime = 1000000;
        Date.now.mockReturnValue(startTime);
        app.setTiempoInicio(startTime);

        app.actualizarReloj();

        expect(displayTiempo.textContent).toBe('00:00:00');
    });

    test('should format time correctly for 1 second', () => {
        const startTime = 1000000;
        Date.now.mockReturnValue(startTime + 1000);
        app.setTiempoInicio(startTime);

        app.actualizarReloj();

        expect(displayTiempo.textContent).toBe('00:00:01');
    });

    test('should format time correctly for 1 minute and 5 seconds', () => {
        const startTime = 1000000;
        Date.now.mockReturnValue(startTime + 65000);
        app.setTiempoInicio(startTime);

        app.actualizarReloj();

        expect(displayTiempo.textContent).toBe('00:01:05');
    });

    test('should format time correctly for 1 hour, 2 minutes and 3 seconds', () => {
        const startTime = 1000000;
        // (1 * 3600 + 2 * 60 + 3) * 1000 = (3600 + 120 + 3) * 1000 = 3723000
        Date.now.mockReturnValue(startTime + 3723000);
        app.setTiempoInicio(startTime);

        app.actualizarReloj();

        expect(displayTiempo.textContent).toBe('01:02:03');
    });

    test('should format time correctly for 10 hours', () => {
        const startTime = 1000000;
        Date.now.mockReturnValue(startTime + 10 * 3600 * 1000);
        app.setTiempoInicio(startTime);

        app.actualizarReloj();

        expect(displayTiempo.textContent).toBe('10:00:00');
    });
});

describe('actualizarTablaBitacora', () => {
    let app;
    let cuerpoTabla;

    beforeEach(() => {
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockReturnValue({
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            })
        };

        // Mock Navigator and Service Worker
        global.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue({})
        };

        // Set up our document body
        document.body.innerHTML = html;
        cuerpoTabla = document.querySelector('#tablaBitacora tbody');

        // Require app.js
        jest.isolateModules(() => {
            app = require('./app.js');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should render empty state message across all 6 columns when listaActividades is empty', () => {
        // Ensure the list is empty
        app.setListaActividades([]);

        // Update the table
        app.actualizarTablaBitacora();

        // Check if the empty state row is rendered correctly
        expect(cuerpoTabla.innerHTML).toContain("<tr><td colspan=\"6\" style=\"text-align: center;\">Sin actividades.</td></tr>");
    });
});

describe('escaparCSV', () => {
    let app;

    beforeEach(() => {
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockReturnValue({
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            })
        };

        // Mock Navigator and Service Worker
        global.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue({})
        };

        // Require app.js
        jest.isolateModules(() => {
            app = require('./app.js');
        });
    });

    test('should return empty string for null or undefined', () => {
        expect(app.escaparCSV(null)).toBe('');
        expect(app.escaparCSV(undefined)).toBe('');
    });

    test('should return unchanged string for simple alphanumeric values', () => {
        expect(app.escaparCSV('Hola123')).toBe('Hola123');
        expect(app.escaparCSV(123)).toBe('123');
    });

    test('should prefix with single quote for formula injection characters', () => {
        expect(app.escaparCSV('=SUM(1,2)')).toBe('"\'=SUM(1,2)"'); // Starts with =, contains comma
        expect(app.escaparCSV('+44')).toBe("'+44");
        expect(app.escaparCSV('-5')).toBe("'-5");
        expect(app.escaparCSV('@admin')).toBe("'@admin");
        expect(app.escaparCSV('\tTab')).toBe("'\tTab");
        expect(app.escaparCSV('\rReturn')).toBe('"\'\rReturn"'); // Starts with \r, also contains \r (CSV escaping)
    });

    test('should escape standard CSV special characters with double quotes', () => {
        expect(app.escaparCSV('Texto, con coma')).toBe('"Texto, con coma"');
        expect(app.escaparCSV('Texto "con comillas"')).toBe('"Texto ""con comillas"""');
        expect(app.escaparCSV('Texto con\nsalto de linea')).toBe('"Texto con\nsalto de linea"');
    });

    test('should handle both CSV injection and standard escaping together', () => {
        // Starts with '=' and contains a comma
        expect(app.escaparCSV('=A1+B1,C1')).toBe('"\'=A1+B1,C1"');
    });
});

describe('escapeHTML', () => {
    let app;

    beforeEach(() => {
        // Mock IndexedDB
        global.indexedDB = {
            open: jest.fn().mockReturnValue({
                onupgradeneeded: null,
                onsuccess: null,
                onerror: null
            })
        };

        // Mock Navigator and Service Worker
        global.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue({})
        };

        // Require app.js
        jest.isolateModules(() => {
            app = require('./app.js');
        });
    });

    test('should return empty string for null, undefined, or empty string', () => {
        expect(app.escapeHTML(null)).toBe('');
        expect(app.escapeHTML(undefined)).toBe('');
        expect(app.escapeHTML('')).toBe('');
    });

    test('should return unchanged string for normal alphanumeric values', () => {
        expect(app.escapeHTML('Hola123')).toBe('Hola123');
        expect(app.escapeHTML('This is a test')).toBe('This is a test');
    });

    test('should correctly convert specific HTML characters', () => {
        expect(app.escapeHTML('&')).toBe('&amp;');
        expect(app.escapeHTML('<')).toBe('&lt;');
        expect(app.escapeHTML('>')).toBe('&gt;');
        expect(app.escapeHTML('"')).toBe('&quot;');
        expect(app.escapeHTML("'")).toBe('&#039;');
    });

    test('should safely handle and convert full XSS payloads', () => {
        const xssPayload = `<script>alert("XSS & 'XSS'")</script>`;
        const expected = `&lt;script&gt;alert(&quot;XSS &amp; &#039;XSS&#039;&quot;)&lt;/script&gt;`;
        expect(app.escapeHTML(xssPayload)).toBe(expected);
    });

    test('should stringify non-string inputs like numbers before escaping', () => {
        expect(app.escapeHTML(123)).toBe('123');
        expect(app.escapeHTML(0)).toBe('0');
        expect(app.escapeHTML(false)).toBe('false');
        expect(app.escapeHTML(true)).toBe('true');
    });
});
