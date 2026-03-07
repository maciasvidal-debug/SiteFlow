// Le damos un nombre a nuestra "memoria caché" (usamos versionado semántico)
const NOMBRE_CACHE = 'siteflow-v2.4.1';

// Lista de archivos que queremos guardar en el teléfono
const archivosACachear = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './siteflow-logo.png'
];

// Paso 1: Instalación del Service Worker
self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(NOMBRE_CACHE)
            .then(cache => {
                // console.log('Archivos cacheados con éxito');
                return cache.addAll(archivosACachear);
            })
    );
});

// Paso 2: Activación y Limpieza de Cachés Antiguas
self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys().then(clavesCache => {
            return Promise.all(
                clavesCache.map(clave => {
                    // Si la caché no es la actual, la borramos
                    if (clave !== NOMBRE_CACHE) {
                        // console.log('Borrando caché antigua:', clave);
                        return caches.delete(clave);
                    }
                })
            );
        })
    );
});

// Paso 3: Interceptar las peticiones (Funcionamiento Offline)
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

// Escuchar mensaje para forzar la actualización (skipWaiting)
self.addEventListener('message', evento => {
    if (evento.data === 'SKIP_WAITING' || (evento.data && evento.data.action === 'skipWaiting')) {
        self.skipWaiting();
    }
});
