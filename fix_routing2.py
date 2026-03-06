import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Enhance user profile routing
old_logic = r"""function configurarUIporRol\(rol\) \{
    const navMenu = document\.getElementById\('navMenu'\);
    const btnNavDashboard = document\.getElementById\('btnNavDashboard'\);
    const btnNavCatalogos = document\.getElementById\('btnNavCatalogos'\);

    navMenu\.style\.display = 'flex'; // Show navigation

    if \(rol === 'super_admin' \|\| rol === 'manager'\) \{
        btnNavDashboard\.style\.display = 'inline-block';
        btnNavCatalogos\.style\.display = 'inline-block';
    \} else \{
        // Staff role
        btnNavDashboard\.style\.display = 'none';
        btnNavCatalogos\.style\.display = 'none';
    \}

    // Reset view
    cambiarVista\('vistaRegistro'\);
\}"""

new_logic = """function configurarUIporRol(rol) {
    const navMenu = document.getElementById('navMenu');
    const btnRegistro = document.querySelector('[data-target="vistaRegistro"]');
    const btnNavDashboard = document.getElementById('btnNavDashboard');
    const btnNavCatalogos = document.getElementById('btnNavCatalogos');

    navMenu.style.display = 'flex'; // Show navigation

    // Reset all tabs to hidden initially
    if(btnRegistro) btnRegistro.style.display = 'none';
    if(btnNavDashboard) btnNavDashboard.style.display = 'none';
    if(btnNavCatalogos) btnNavCatalogos.style.display = 'none';

    if (rol === 'vp') {
        // VP only reviews team dashboard
        if(btnNavDashboard) btnNavDashboard.style.display = 'flex';
        // Auto navigate
        setTimeout(() => btnNavDashboard.click(), 100);
    } else if (rol === 'it_admin') {
        // IT Admin strictly manages catalogs
        if(btnNavCatalogos) btnNavCatalogos.style.display = 'flex';
        // Auto navigate
        setTimeout(() => btnNavCatalogos.click(), 100);
    } else if (rol === 'super_admin' || rol === 'manager') {
        // Full access
        if(btnRegistro) btnRegistro.style.display = 'flex';
        if(btnNavDashboard) btnNavDashboard.style.display = 'flex';
        if(btnNavCatalogos) btnNavCatalogos.style.display = 'flex';
        cambiarVista('vistaRegistro');
    } else {
        // Staff role
        if(btnRegistro) btnRegistro.style.display = 'flex';
        cambiarVista('vistaRegistro');
    }
}"""

app_js = app_js.replace("btnNavDashboard.style.display = 'inline-block';", "btnNavDashboard.style.display = 'flex';")
app_js = app_js.replace("btnNavCatalogos.style.display = 'inline-block';", "btnNavCatalogos.style.display = 'flex';")

app_js = re.sub(old_logic, new_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
