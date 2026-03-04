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
