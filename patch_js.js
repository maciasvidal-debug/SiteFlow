const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');
const jsCode = `
    const btnVolverGestion = document.getElementById('btnVolverMenuGestion');
    if (btnVolverGestion) {
        btnVolverGestion.addEventListener('click', () => {
            document.getElementById('seccionProtocolos').style.display = 'none';
            document.getElementById('seccionCatalogos').style.display = 'none';
            document.getElementById('menuTarjetasGestion').style.display = 'grid';
            btnVolverGestion.style.display = 'none';
        });
    }
`;
app = app.replace(
    /document\.getElementById\('inputFechaFiltro'\)\.addEventListener\('change'/,
    jsCode + '\n    document.getElementById(\'inputFechaFiltro\').addEventListener(\'change\''
);
fs.writeFileSync('app.js', app);
