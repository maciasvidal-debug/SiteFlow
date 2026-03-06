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
    /document\.getElementById\('btnNavCatalogos'\)\.addEventListener\('click', \(\) => \{/,
    jsCode + '\ndocument.getElementById(\'btnNavCatalogos\').addEventListener(\'click\', () => {'
);
fs.writeFileSync('app.js', app);
