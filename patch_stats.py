import re

with open('app.js', 'r') as f:
    content = f.read()

replacement = """function actualizarEstadisticas(entries) {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    // Calcular inicio de semana (lunes)
    const inicioSemana = new Date(hoy);
    const day = inicioSemana.getDay();
    const diff = inicioSemana.getDate() - day + (day === 0 ? -6 : 1); // Ajustar si es domingo
    inicioSemana.setDate(diff);
    const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];

    // Métricas
    let horasHoy = 0;
    let horasSemana = 0;
    let tareasHoy = 0;

    entries.forEach(e => {
        const h = parseFloat(e.total_hours) || 0;
        if (e.date >= inicioSemanaStr && e.date <= hoyStr) {
            horasSemana += h;
        }
        if (e.date === hoyStr) {
            horasHoy += h;
            tareasHoy++;
        }
    });

    document.getElementById('totalHorasDia').textContent = horasHoy.toFixed(2) + ' h';
    document.getElementById('totalHorasSemana').textContent = horasSemana.toFixed(2) + ' h';
    document.getElementById('totalTareasDia').textContent = tareasHoy.toString();
}"""

# Reemplazamos la función original
content = re.sub(r'function actualizarEstadisticas\(entries\)\s*\{\s*const hoy = new Date\(\)\.toISOString\(\)\.split\(\'T\'\)\[0\];\s*const horasHoy = entries\s*\.filter\(e => e\.date === hoy\)\s*\.reduce\(\(sum, e\) => sum \+ parseFloat\(e\.total_hours\), 0\);\s*document\.getElementById\(\'totalHorasDia\'\)\.textContent = horasHoy\.toFixed\(2\) \+ \' h\';\s*\}', replacement, content)

with open('app.js', 'w') as f:
    f.write(content)
