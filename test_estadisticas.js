const fs = require('fs');

global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = {
    createElement: () => ({ style: {}, appendChild: () => {} }),
    getElementById: () => ({ addEventListener: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
    querySelector: () => ({ appendChild: () => {} }),
    createDocumentFragment: () => ({ appendChild: () => {} })
};
global.window = { addEventListener: () => {} };
global.navigator = { serviceWorker: { register: async () => ({}) } };
global.indexedDB = { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) };

const app = require('./app.js');
console.log(typeof app.actualizarEstadisticas);
