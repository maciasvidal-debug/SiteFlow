// Le damos un nombre a nuestra "memoria caché"
const NOMBRE_CACHE = 'cta-app-v1';

// Lista de archivos que queremos guardar en el teléfono
const archivosACachear = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Paso 1: Instalación del Service Worker
self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(NOMBRE_CACHE)
            .then(cache => {
                console.log('Archivos cacheados con éxito');
                return cache.addAll(archivosACachear);
            })
    );
});

// Paso 2: Interceptar las peticiones (Funcionamiento Offline)
self.addEventListener('fetch', evento => {
    evento.respondWith(
        caches.match(evento.request)
            .then(respuesta => {
                // Si el archivo está en caché, lo devuelve sin usar internet
                if (respuesta) {
                    return respuesta;
                }
                // Si no está, lo busca en internet
                return fetch(evento.request);
            })
    );
});