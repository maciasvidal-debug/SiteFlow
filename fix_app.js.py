import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Replace old PWA update logic
old_logic = r"// --- PWA Service Worker Registration & Update Flow ---.*?\}\);"

new_logic = """// --- PWA Service Worker Registration & Update Flow ---
let nuevoWorker;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker registrado:', reg.scope);

            reg.addEventListener('updatefound', () => {
                nuevoWorker = reg.installing;
                nuevoWorker.addEventListener('statechange', () => {
                    if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Show update banner
                        const updateBanner = document.getElementById('updateBannerOverlay');
                        if (updateBanner) {
                            updateBanner.classList.add('show');
                            document.body.classList.add('has-update-banner');
                        }
                    }
                });
            });
        }).catch(err => {
            console.error('Error al registrar Service Worker:', err);
        });

        // Listen for controller change to reload
        let recargando = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!recargando) {
                window.location.reload();
                recargando = true;
            }
        });
    });
}

// Attach event listener for the update button
document.addEventListener('DOMContentLoaded', () => {
    const btnUpdateAppNow = document.getElementById('btnUpdateAppNow');
    if (btnUpdateAppNow) {
        btnUpdateAppNow.addEventListener('click', () => {
            if (nuevoWorker) {
                nuevoWorker.postMessage({ action: 'skipWaiting' });
            }
            const updateBanner = document.getElementById('updateBannerOverlay');
            if(updateBanner) {
                updateBanner.classList.remove('show');
                document.body.classList.remove('has-update-banner');
            }
        });
    }
});"""

app_js = re.sub(old_logic, new_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
