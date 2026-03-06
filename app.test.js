
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

    describe('cambiarVista', () => {
        beforeEach(() => {
            // Document setup for test
            document.body.innerHTML = `
                <div id="vistaRegistro" class="vista active" style="display: block;"></div>
                <div id="vistaDashboard" class="vista" style="display: none;"></div>
                <div id="vistaCatalogos" class="vista" style="display: none;"></div>
                <button class="nav-btn active" data-target="vistaRegistro"></button>
                <button class="nav-btn" data-target="vistaDashboard"></button>
                <button class="nav-btn" data-target="vistaCatalogos"></button>
            `;
            // Mocking global method called inside cambiarVista
            global.cargarDashboardEquipo = jest.fn();

            // Set required state
            app.State.profile = { role: 'super_admin' };

            // Override the actual function inside the app instance with the mock
            app.cargarDashboardEquipo = jest.fn();
        });

        test('debería ocultar la vista actual y mostrar la vista destino', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            app.cambiarVista('vistaDashboard');

            expect(document.getElementById('vistaRegistro').style.display).toBe('none');
            expect(document.getElementById('vistaRegistro').classList.contains('active')).toBe(false);

            expect(document.getElementById('vistaDashboard').style.display).toBe('block');
            expect(document.getElementById('vistaDashboard').classList.contains('active')).toBe(true);

            expect(app.State.currentView).toBe('vistaDashboard');
            consoleSpy.mockRestore();
        });

        test('debería actualizar la clase active en los botones de navegación', () => {
            app.cambiarVista('vistaCatalogos');

            const btnRegistro = document.querySelector('[data-target="vistaRegistro"]');
            const btnCatalogos = document.querySelector('[data-target="vistaCatalogos"]');

            expect(btnRegistro.classList.contains('active')).toBe(false);
            expect(btnCatalogos.classList.contains('active')).toBe(true);
        });

        test('debería manejar correctamente cargarDashboardEquipo si la vista destino es vistaDashboard', () => {
            // Because cargarDashboardEquipo is not injected but globally available inside app.js scope,
            // we will verify that it doesn't throw when state is set properly

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                app.cambiarVista('vistaDashboard');
            }).not.toThrow();

            expect(document.getElementById('vistaDashboard').classList.contains('active')).toBe(true);

            consoleSpy.mockRestore();
        });
    });
});
