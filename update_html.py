import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace the old toast actualizacion with the new update banner overlay
old_toast_regex = r'<div id="toastActualizacion" class="toast-actualizacion" aria-live="polite" hidden>.*?</div>'
new_banner = """
    <!-- App update notification banner -->
    <div id="updateBannerOverlay" class="update-banner-overlay" aria-live="polite" role="alert">
        <div class="update-banner-content">
            <span style="font-size: 1.2rem;">✨</span>
            <span>Hay una nueva versión de SiteFlow.</span>
        </div>
        <button id="btnUpdateAppNow" class="btn-update-now">Actualizar</button>
    </div>
"""
content = re.sub(old_toast_regex, new_banner, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
