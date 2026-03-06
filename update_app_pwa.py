import re

with open('app.js', 'r') as f:
    content = f.read()

# Replace the old service worker update logic with the new one
old_sw_logic = r"""// Registro del Service Worker \(PWA\)
if \('serviceWorker' in navigator\) \{
    window\.addEventListener\('load', \(\) => \{
        navigator\.serviceWorker\.register\('\./sw\.js'\)
            \.then\(registro => \{
                console\.log\('Service Worker registrado con éxito:', registro\.scope\);

                // Detectar si hay una nueva versión esperando
                registro\.addEventListener\('updatefound', \(\) => \{
                    const nuevoWorker = registro\.installing;
                    nuevoWorker\.addEventListener\('statechange', \(\) => \{
                        if \(\(nuevoWorker\.state === 'installed'\) && navigator\.serviceWorker\.controller\) \{
                            // Mostrar toast al usuario
                            const toast = document\.getElementById\('toastActualizacion'\);
                            if \(toast\) \{
                                toast\.hidden = false;
                                toast\.style\.display = 'flex';
                            \}
                        \}
                    \}\);
                \}\);
            \}\)
            \.catch\(error => \{
                console\.error\('Error al registrar el Service Worker:', error\);
            \}\);
    \}\);

    // Activar la nueva versión cuando el usuario haga clic
    const btnActualizar = document\.getElementById\('btnActualizarApp'\);
    if \(btnActualizar\) \{
        btnActualizar\.addEventListener\('click', \(\) => \{
            navigator\.serviceWorker\.ready\.then\(registro => \{
                if \(registro\.waiting\) \{
                    registro\.waiting\.postMessage\('SKIP_WAITING'\);
                \}
            \}\);
        \}\);
    \}

    // Recargar la página cuando el nuevo Service Worker toma el control
    let recargando = false;
    navigator\.serviceWorker\.addEventListener\('controllerchange', \(\) => \{
        if \(!recargando\) \{
            window\.location\.reload\(\);
            recargando = true;
        \}
    \}\);
\}"""

new_sw_logic = """// Registro del Service Worker (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => {
                console.log('Service Worker registrado con éxito:', registro.scope);

                // Detectar si hay una nueva versión esperando
                registro.addEventListener('updatefound', () => {
                    const nuevoWorker = registro.installing;
                    nuevoWorker.addEventListener('statechange', () => {
                        if ((nuevoWorker.state === 'installed') && navigator.serviceWorker.controller) {
                            // Mostrar banner animado, no intrusivo
                            const updateBanner = document.getElementById('updateBannerOverlay');
                            if (updateBanner) {
                                updateBanner.classList.add('show');
                                document.body.classList.add('has-update-banner');
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error al registrar el Service Worker:', error);
            });
    });

    // Activar la nueva versión cuando el usuario haga clic en Actualizar
    const btnUpdateAppNow = document.getElementById('btnUpdateAppNow');
    if (btnUpdateAppNow) {
        btnUpdateAppNow.addEventListener('click', () => {
            navigator.serviceWorker.ready.then(registro => {
                if (registro.waiting) {
                    // Send skipWaiting to new service worker
                    registro.waiting.postMessage({ action: 'skipWaiting' });
                }
            });
        });
    }

    // Recargar la página cuando el nuevo Service Worker toma el control
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!recargando) {
            window.location.reload();
            recargando = true;
        }
    });
}"""

# Actually we can just find the old and replace. If regex is tricky because of formatting, let's use string replace on a smaller chunk or regex with DOTALL.
content = re.sub(r'// Registro del Service Worker \(PWA\).*?window\.location\.reload\(\);\s+recargando = true;\s+\}\s+\}\);\s+\}', new_sw_logic, content, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(content)
