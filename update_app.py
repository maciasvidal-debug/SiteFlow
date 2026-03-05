import re

with open('app.js', 'r') as f:
    content = f.read()

# Find the start of actualizarEstadisticas
start_idx = content.find('function actualizarEstadisticas() {')

# Find the end of it
end_idx = content.find('// ==========================================\n// 7. REGISTRO DEL SERVICE WORKER (PWA)', start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find the function boundaries.")
    exit(1)

original_function = content[start_idx:end_idx]

# Let's replace it with our new implementation

new_functions = """/**
 * Calcula todas las estadísticas necesarias de forma centralizada.
 * @param {Array} actividades - Lista de actividades a procesar
 * @param {number} metaSemanal - Meta de horas semanales
 * @returns {Object} Datos estadísticos agregados
 */
function calcularDatosEstadisticas(actividades, metaSemanal) {
    let totalHoras = 0;
    let horasEstaSemana = 0;
    const statsPorCategoria = {};
    const statsPorProtocolo = {};
    const statsPorFecha = {};
    let microTareasCount = 0;
    let microTareasHoras = 0;

    // Usar formato ISO para comparación eficiente sin instanciar Date en el bucle
    const hoy = new Date();
    const diaDeLaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaDeLaSemana);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    // Convert to simple ISO string format YYYY-MM-DD for fast comparison
    const isoLunes = lunes.toISOString().split('T')[0];
    const isoDomingo = domingo.toISOString().split('T')[0];

    actividades.forEach(act => {
        const horasAct = parseFloat(act.horas) || 0;
        totalHoras += horasAct;

        // Acumular por categoría
        statsPorCategoria[act.categoria] = (statsPorCategoria[act.categoria] || 0) + horasAct;

        // Acumular por protocolo
        const protocoloKey = act.protocolo || "Sin Protocolo";
        statsPorProtocolo[protocoloKey] = (statsPorProtocolo[protocoloKey] || 0) + horasAct;

        // Acumular por fecha para calcular burnout
        statsPorFecha[act.fecha] = (statsPorFecha[act.fecha] || 0) + horasAct;

        // Contar micro-tareas y su tiempo
        if (act.categoria === 'micro_operaciones' || act.categoria === 'micro_administrativas') {
            microTareasCount++;
            microTareasHoras += horasAct;
        }

        // Calcular horas FTE semanal
        // Using string comparison instead of creating Date objects
        if (act.fecha >= isoLunes && act.fecha <= isoDomingo) {
            horasEstaSemana += horasAct;
        }
    });

    return {
        totalHoras,
        horasEstaSemana,
        statsPorCategoria,
        statsPorProtocolo,
        statsPorFecha,
        microTareasCount,
        microTareasHoras
    };
}

/**
 * Renderiza la sección del progreso del FTE Semanal.
 */
function renderizarFTE(horasEstaSemana, metaSemanal) {
    const inputMeta = document.getElementById('inputMetaSemanal');
    if (inputMeta && inputMeta.value !== String(metaSemanal)) {
        inputMeta.value = metaSemanal;
        inputMeta.onchange = (e) => {
            const nuevaMeta = parseInt(e.target.value) || 0;
            localStorage.setItem('metaFTE', nuevaMeta);
            actualizarEstadisticas();
            mostrarToast("🎯 Meta semanal actualizada");
        };
    }

    const barraMeta = document.getElementById('barraProgresoMeta');
    const textoMeta = document.getElementById('textoProgresoMeta');
    if (barraMeta && textoMeta) {
        const porcentajeMeta = metaSemanal > 0 ? Math.min((horasEstaSemana / metaSemanal) * 100, 100) : 0;

        barraMeta.style.width = `${porcentajeMeta}%`;
        textoMeta.textContent = `${horasEstaSemana.toFixed(1)} / ${metaSemanal} horas`;

        if (porcentajeMeta >= 100) {
            barraMeta.style.backgroundColor = '#107c41'; // Verde más oscuro cuando se completa
        } else {
            barraMeta.style.backgroundColor = '#28a745'; // Verde estándar en progreso
        }
    }
}

/**
 * Renderiza los Insights (Burnout, Foco, Eficiencia).
 */
function renderizarInsights(stats, numActividades) {
    const insightsContainer = document.getElementById('insightsContainer');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = "";
    const insightsFragment = document.createDocumentFragment();

    // Insight: Alerta de Burnout (> 10 horas en un día)
    const fechasBurnout = Object.keys(stats.statsPorFecha).filter(fecha => stats.statsPorFecha[fecha] > 10);
    if (fechasBurnout.length > 0) {
        const burnoutAlert = document.createElement('div');
        burnoutAlert.style.cssText = "background-color: #ffebee; color: #c62828; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #c62828;";
        burnoutAlert.innerHTML = `<strong>⚠️ Alerta de Sobrecarga:</strong> Has registrado más de 10 horas en ${fechasBurnout.length} día(s). Recuerda cuidar tu bienestar.`;
        insightsFragment.appendChild(burnoutAlert);
    }

    if (numActividades > 0) {
        // Insight: Protocolo más intensivo
        const protocoloTop = Object.keys(stats.statsPorProtocolo).reduce((a, b) => stats.statsPorProtocolo[a] > stats.statsPorProtocolo[b] ? a : b);
        if (protocoloTop && protocoloTop !== "Sin Protocolo") {
            const protocoloInsight = document.createElement('div');
            protocoloInsight.style.cssText = "background-color: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #2e7d32;";
            const escProtocoloTop = escapeHTML(protocoloTop);
            protocoloInsight.innerHTML = `<strong>💡 Foco Principal:</strong> El protocolo <em>${escProtocoloTop}</em> consumió la mayor parte de tus horas.`;
            insightsFragment.appendChild(protocoloInsight);
        }

        // Insight: Micro-tareas
        if (stats.microTareasCount > 0) {
            let textoTiempo;
            if (stats.microTareasHoras < 1) {
                const minutosCalculados = Math.round(stats.microTareasHoras * 60);
                textoTiempo = `${minutosCalculados} minutos totales`;
            } else {
                textoTiempo = `${stats.microTareasHoras.toFixed(1)} horas totales`;
            }

            const microInsight = document.createElement('div');
            microInsight.style.cssText = "background-color: #fff3e0; color: #ef6c00; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #ef6c00;";
            microInsight.innerHTML = `<strong>⚡ Eficiencia:</strong> Has completado ${stats.microTareasCount} micro-tareas (${textoTiempo}).`;
            insightsFragment.appendChild(microInsight);
        }
    }

    insightsContainer.appendChild(insightsFragment);
}

/**
 * Renderiza las barras de progreso por categoría.
 */
function renderizarBarrasCategoria(statsPorCategoria, totalHoras) {
    const catContenedor = document.getElementById('categoriaStats');
    if (!catContenedor) return;

    catContenedor.innerHTML = "";
    const catFragment = document.createDocumentFragment();

    Object.keys(statsPorCategoria).sort((a, b) => statsPorCategoria[b] - statsPorCategoria[a]).forEach(cat => {
        const horas = statsPorCategoria[cat];
        const porcentaje = totalHoras > 0 ? (horas / totalHoras * 100).toFixed(0) : 0;
        const nombreRaw = NOMBRES_CATEGORIAS[cat] || cat;
        const nombre = escapeHTML(nombreRaw);

        const bar = document.createElement('div');
        bar.style.marginBottom = "10px";
        bar.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 4px;">
                <span>${nombre}</span>
                <span>${escapeHTML(String(horas.toFixed(1)))}h (${escapeHTML(String(porcentaje))}%)</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #0078D4; width: ${escapeHTML(String(porcentaje))}%; height: 100%;"></div>
            </div>
        `;
        catFragment.appendChild(bar);
    });

    catContenedor.appendChild(catFragment);
}

/**
 * Renderiza las barras de progreso por protocolo.
 */
function renderizarBarrasProtocolo(statsPorProtocolo, totalHoras) {
    const protContenedor = document.getElementById('protocoloStats');
    if (!protContenedor) return;

    protContenedor.innerHTML = "";
    const protFragment = document.createDocumentFragment();

    Object.keys(statsPorProtocolo).sort((a, b) => statsPorProtocolo[b] - statsPorProtocolo[a]).forEach(prot => {
        const horas = statsPorProtocolo[prot];
        const porcentaje = totalHoras > 0 ? (horas / totalHoras * 100).toFixed(0) : 0;
        const escProt = escapeHTML(prot);

        const bar = document.createElement('div');
        bar.style.marginBottom = "10px";
        bar.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 4px;">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${escProt}</span>
                <span>${escapeHTML(String(horas.toFixed(1)))}h (${escapeHTML(String(porcentaje))}%)</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #107c41; width: ${escapeHTML(String(porcentaje))}%; height: 100%;"></div>
            </div>
        `;
        protFragment.appendChild(bar);
    });

    protContenedor.appendChild(protFragment);
}

function actualizarEstadisticas() {
    let metaSemanal = parseInt(localStorage.getItem('metaFTE')) || 40;

    // 1. Data Aggregation
    const stats = calcularDatosEstadisticas(listaActividades, metaSemanal);

    // Update global headers
    const elHoras = document.getElementById('statTotalHoras');
    const elActs = document.getElementById('statTotalActividades');
    if (elHoras) elHoras.textContent = stats.totalHoras.toFixed(1);
    if (elActs) elActs.textContent = listaActividades.length;

    // 2. UI Rendering logic
    renderizarFTE(stats.horasEstaSemana, metaSemanal);
    renderizarInsights(stats, listaActividades.length);
    renderizarBarrasCategoria(stats.statsPorCategoria, stats.totalHoras);
    renderizarBarrasProtocolo(stats.statsPorProtocolo, stats.totalHoras);
}
"""

new_content = content[:start_idx] + new_functions + content[end_idx:]

# Need to make sure to update module.exports at the end of the file as well to optionally export the new methods if needed for tests.
# Actually, since tests don't strictly require these new internal methods, it's better not to bloat the exports, but let's see. The memory doesn't mandate it.

with open('app.js', 'w') as f:
    f.write(new_content)

print("Updated app.js successfully.")
