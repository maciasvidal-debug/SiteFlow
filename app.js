// ==========================================
// 1. BASE DE DATOS (IndexedDB)
// ==========================================
let db;
let listaActividades = [];
let listaProtocolos = JSON.parse(localStorage.getItem('protocolos')) || [];

const solicitudDB = indexedDB.open("BaseDatosCTA", 1);
solicitudDB.onupgradeneeded = evento => {
    db = evento.target.result;
    db.createObjectStore("actividades", { autoIncrement: true });
};
solicitudDB.onsuccess = evento => {
    db = evento.target.result;
    cargarDatosGuardados();
};

function cargarDatosGuardados() {
    const transaccion = db.transaction(["actividades"], "readonly");
    const almacen = transaccion.objectStore("actividades");

    const solicitud = almacen.getAll();
    const solicitudKeys = almacen.getAllKeys();

    solicitud.onsuccess = () => {
        const result = solicitud.result;
        solicitudKeys.onsuccess = () => {
            const keys = solicitudKeys.result;
            listaActividades = result.map((act, index) => ({
                ...act,
                id: keys[index]
            }));
            actualizarTablaBitacora();
        };
    };
}

function guardarEnDB(actividad) {
    const transaccion = db.transaction(["actividades"], "readwrite");
    const almacen = transaccion.objectStore("actividades");
    const solicitud = almacen.add(actividad);
    solicitud.onsuccess = (evento) => {
        actividad.id = evento.target.result;
    };
}

function eliminarDeDB(id) {
    const transaccion = db.transaction(["actividades"], "readwrite");
    const almacen = transaccion.objectStore("actividades");
    almacen.delete(id);
}

function actualizarEnDB(id, actividad) {
    const transaccion = db.transaction(["actividades"], "readwrite");
    const almacen = transaccion.objectStore("actividades");
    almacen.put(actividad, id);
}

// ==========================================
// 2. NAVEGACIÓN INFERIOR (Cambio de pantallas)
// ==========================================
const btnNavRegistro = document.getElementById('navBtnRegistro');
const btnNavBitacora = document.getElementById('navBtnBitacora');
const btnNavStats = document.getElementById('navBtnStats');
const vistaRegistro = document.getElementById('vistaRegistro');
const vistaBitacora = document.getElementById('vistaBitacora');
const vistaStats = document.getElementById('vistaEstadisticas');

function cambiarVista(vistaDestino) {
    // Apagamos todo primero
    vistaRegistro.classList.remove('activa');
    vistaBitacora.classList.remove('activa');
    if (vistaStats) vistaStats.classList.remove('activa');

    btnNavRegistro.classList.remove('activo');
    btnNavBitacora.classList.remove('activo');
    if (btnNavStats) btnNavStats.classList.remove('activo');

    // Encendemos solo lo que el usuario pidió
    if (vistaDestino === 'registro') {
        vistaRegistro.classList.add('activa');
        btnNavRegistro.classList.add('activo');
    } else if (vistaDestino === 'bitacora') {
        vistaBitacora.classList.add('activa');
        btnNavBitacora.classList.add('activo');
        actualizarTablaBitacora();

        if (listaActividades.length === 0) {
            mostrarToast("ℹ️ La bitácora está vacía. ¡Registra tu primera actividad!");
        }
    } else if (vistaDestino === 'stats') {
        if (vistaStats) vistaStats.classList.add('activa');
        if (btnNavStats) btnNavStats.classList.add('activo');
        actualizarEstadisticas();
    }
}

btnNavRegistro.addEventListener('click', () => cambiarVista('registro'));
btnNavBitacora.addEventListener('click', () => cambiarVista('bitacora'));
if (btnNavStats) btnNavStats.addEventListener('click', () => cambiarVista('stats'));

// ==========================================
// 3. TOASTS Y CRONÓMETRO
// ==========================================
function mostrarToast(mensaje) {
    const contenedor = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => { toast.classList.add('oculto'); setTimeout(() => toast.remove(), 500); }, 2500);
}

let intervaloReloj; let tiempoInicio; let tiempoTranscurrido = 0; let cronometroEnMarcha = false;
const displayTiempo = document.getElementById('displayTiempo');
const btnIniciar = document.getElementById('btnIniciar');
const btnDetener = document.getElementById('btnDetener');
const inputHoras = document.getElementById('horas');

btnIniciar.addEventListener('click', () => {
    if (cronometroEnMarcha) return;
    cronometroEnMarcha = true;
    tiempoInicio = Date.now() - tiempoTranscurrido;
    intervaloReloj = setInterval(actualizarReloj, 1000);
    btnIniciar.disabled = true; btnDetener.disabled = false;
    mostrarToast("⏳ Cronómetro iniciado");
});

btnDetener.addEventListener('click', () => {
    if (!cronometroEnMarcha) return;
    cronometroEnMarcha = false;
    clearInterval(intervaloReloj);
    btnIniciar.disabled = false; btnDetener.disabled = true;
    const horasDecimales = (tiempoTranscurrido / (1000 * 60 * 60)).toFixed(2);
    inputHoras.value = horasDecimales;
    mostrarToast(`⏱️ Tiempo detenido.`);
    tiempoTranscurrido = 0; displayTiempo.textContent = "00:00:00";
});

function actualizarReloj() {
    tiempoTranscurrido = Date.now() - tiempoInicio;
    let totalSegundos = Math.floor(tiempoTranscurrido / 1000);
    let horas = Math.floor(totalSegundos / 3600);
    let minutos = Math.floor((totalSegundos % 3600) / 60);
    let segundos = totalSegundos % 60;
    displayTiempo.textContent = String(horas).padStart(2, '0') + ":" + String(minutos).padStart(2, '0') + ":" + String(segundos).padStart(2, '0');
}

// Exportar para pruebas si estamos en un entorno de Node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        actualizarReloj,
        getTiempoTranscurrido: () => tiempoTranscurrido,
        setTiempoInicio: (v) => { tiempoInicio = v; },
        getTiempoInicio: () => tiempoInicio,
        setCronometroEnMarcha: (v) => { cronometroEnMarcha = v; }
    };
}

// ==========================================
// 4. LÓGICA DE FORMULARIO (Cascada)
// ==========================================
const selectCategoria = document.getElementById('categoria');
const selectActividad = document.getElementById('actividadEspecifica');
const labelActividad = document.getElementById('labelActividad');
const textareaDescripcion = document.getElementById('descripcion');
const labelDescripcion = document.getElementById('labelDescripcion');

const opcionesPorCategoria = {
    monitoreo: [
        "Visita de Selección (PSV)",
        "Visita de Inicio (SIV)",
        "Visita de Monitoreo Interino (IMV/RMV)",
        "Visita de Cierre (COV)",
        "Preparación/Atención de Auditorías o Inspecciones",
        "Seguimiento de Hallazgos (Action Items)",
        "Verificación / Revisión de documentos (SDV/SDR)",
        "Otra"
    ],
    documentacion: [
        "Actualización de TMF / ISF",
        "Control de Versiones y Archivo",
        "Gestión de Firmas (DOA, FDA 1572)",
        "Revisión de Calidad (QC) de Documentos",
        "Manejo de Correspondencia del Estudio",
        "Preparación de Manuales/Checklists",
        "Otra"
    ],
    entrenamiento: [
        "Entrenamiento en Protocolo / Enmiendas",
        "Entrenamiento en Buenas Prácticas Clínicas (GCP)",
        "Entrenamiento en Sistemas (EDC, CTMS, eISF)",
        "Inducción (Onboarding) de Equipo",
        "Otra"
    ],
    reuniones: [
        "Reunión de Equipo de Estudio (Interna)",
        "Reunión con el Sponsor / CRO",
        "Reunión de Investigadores (Investigator Meeting)",
        "Reunión con el Sitio Clínico / Proveedores",
        "Elaboración de Minutas de Reunión",
        "Otra"
    ],
    coordinacion: [
        "Pre-Screening y Reclutamiento de Pacientes",
        "Proceso de Consentimiento Informado (ICF)",
        "Visita de Paciente (Screening/Randomización)",
        "Visitas de Seguimiento de Paciente",
        "Manejo de Muestras Biológicas (Laboratorio/Envío)",
        "Manejo de Droga de Estudio (IP Accountability)",
        "Evaluación y Reporte de Eventos Adversos (AE/SAE)",
        "Educación y Retención de Pacientes",
        "Otra"
    ],
    data_entry: [
        "Ingreso de Datos en eCRF (EDC)",
        "Revisión y Resolución de Queries",
        "Control de Calidad (QC) de Datos Ingresados",
        "Conciliación de Datos (SAEs, Laboratorios)",
        "Gestión de Diarios de Pacientes (ePRO/eDiary)",
        "Revisión de Source Documents (Documentos Fuente)",
        "Otra"
    ],
    regulatorio: [
        "Sometimiento Inicial al Comité de Ética (IRB/IEC)",
        "Sometimiento de Enmiendas y Renovaciones Anuales",
        "Reporte de Seguridad (SAE/SUSAR) al Comité",
        "Sometimiento a Agencia Regulatoria",
        "Actualización de Documentos de Investigadores (CVs, Licencias)",
        "Otra"
    ]
};

selectCategoria.addEventListener('change', () => {
    const cat = selectCategoria.value;
    selectActividad.innerHTML = '<option value="">-- Selecciona una actividad --</option>';

    if (cat === "otra") {
        selectActividad.classList.add('oculto'); labelActividad.classList.add('oculto');
        textareaDescripcion.classList.remove('oculto'); labelDescripcion.classList.remove('oculto');
    } else if (cat !== "") {
        const fragment = document.createDocumentFragment();
        opcionesPorCategoria[cat].forEach(act => {
            const opt = document.createElement('option'); opt.value = act; opt.textContent = act;
            fragment.appendChild(opt);
        });
        selectActividad.appendChild(fragment);
        selectActividad.classList.remove('oculto'); labelActividad.classList.remove('oculto');
        textareaDescripcion.classList.add('oculto'); labelDescripcion.classList.add('oculto');
    } else {
        selectActividad.classList.add('oculto'); labelActividad.classList.add('oculto');
        textareaDescripcion.classList.add('oculto'); labelDescripcion.classList.add('oculto');
    }
});

selectActividad.addEventListener('change', () => {
    if (selectActividad.value === "Otra") {
        textareaDescripcion.classList.remove('oculto'); labelDescripcion.classList.remove('oculto');
    } else {
        textareaDescripcion.classList.add('oculto'); labelDescripcion.classList.add('oculto');
    }
});

// ==========================================
// 5. GUARDAR Y EXPORTAR
// ==========================================

function escaparCSV(valor) {
    if (valor === null || valor === undefined) return '';
    let strValor = String(valor);

    // Mitigación de Formula Injection (CSV Injection)
    if (/^[=+\-@\t\r]/.test(strValor)) {
        strValor = "'" + strValor;
    }

    // Escapado estándar de CSV si contiene comas, comillas o saltos de línea
    if (/[,"\n\r]/.test(strValor)) {
        strValor = '"' + strValor.replace(/"/g, '""') + '"';
    }

    return strValor;
}

const formulario = document.getElementById('formularioTimesheet');
const botonExportar = document.getElementById('btnExportar');
const cuerpoTabla = document.querySelector('#tablaBitacora tbody');

function actualizarTablaBitacora() {
    cuerpoTabla.innerHTML = "";

    if (listaActividades.length === 0) {
        // CORRECCIÓN 3: El colspan ahora es 5 porque tenemos 5 columnas
        cuerpoTabla.innerHTML = "<tr><td colspan='5' style='text-align: center;'>Sin actividades.</td></tr>";
        return;
    }

    // Un pequeño "diccionario" para que la categoría se vea profesional en la tabla
    const nombresCategorias = {
        "monitoreo": "Monitoreo",
        "documentacion": "Documentación / TMF",
        "entrenamiento": "Entrenamiento",
        "reuniones": "Reuniones",
        "coordinacion": "Coordinación Clínica",
        "data_entry": "Data Entry",
        "regulatorio": "Regulatorio",
        "otra": "Otra"
    };

    const fragment = document.createDocumentFragment();
    listaActividades.slice().reverse().forEach((actividad, indexOriginal) => {
        const fila = document.createElement('tr');
        const index = listaActividades.length - 1 - indexOriginal;

        const nombreCategoria = nombresCategorias[actividad.categoria] || actividad.categoria;

        fila.innerHTML = `
            <td>${actividad.fecha}</td>
            <td>${actividad.protocolo || "-"}</td>
            <td>${nombreCategoria}</td>
            <td>${actividad.descripcion}</td>
            <td><strong>${actividad.horas}</strong></td>
            <td>
                <button aria-label="Editar actividad" onclick="cargarParaEditar(${actividad.id}, ${index})" style="background:none; border:none; cursor:pointer;">✏️</button>
                <button aria-label="Eliminar actividad" onclick="eliminarRegistro(${actividad.id}, ${index})" style="background:none; border:none; cursor:pointer;">🗑️</button>
            </td>
        `;
        fragment.appendChild(fila);
    });
    cuerpoTabla.appendChild(fragment);
}

window.eliminarRegistro = (id, index) => {
    if (confirm("¿Estás seguro de eliminar esta actividad?")) {
        listaActividades.splice(index, 1);
        eliminarDeDB(id);
        actualizarTablaBitacora();
        mostrarToast("🗑️ Registro eliminado.");
    }
};

window.cargarParaEditar = (id, index) => {
    const act = listaActividades[index];
    document.getElementById('editId').value = id;
    document.getElementById('fecha').value = act.fecha;
    document.getElementById('protocolo').value = act.protocolo;
    selectCategoria.value = act.categoria;

    // Disparar el evento change para que se carguen las actividades específicas
    selectCategoria.dispatchEvent(new Event('change'));

    if (opcionesPorCategoria[act.categoria] && opcionesPorCategoria[act.categoria].includes(act.descripcion)) {
        selectActividad.value = act.descripcion;
        textareaDescripcion.classList.add('oculto');
        labelDescripcion.classList.add('oculto');
    } else {
        selectActividad.value = "Otra";
        textareaDescripcion.value = act.descripcion;
        textareaDescripcion.classList.remove('oculto');
        labelDescripcion.classList.remove('oculto');
    }

    document.getElementById('horas').value = act.horas;
    cambiarVista('registro');
    document.querySelector('#formularioTimesheet button[type="submit"]').textContent = "Actualizar Actividad";
};

formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const editId = document.getElementById('editId').value;

    let descripcionFinal = selectCategoria.value === "otra" || selectActividad.value === "Otra"
        ? textareaDescripcion.value.replace(/,/g, " ") : selectActividad.value;

    const datosActividad = {
        fecha: document.getElementById('fecha').value,
        protocolo: document.getElementById('protocolo').value,
        categoria: selectCategoria.value,
        descripcion: descripcionFinal,
        horas: parseFloat(document.getElementById('horas').value)
    };

    if (editId) {
        const idInt = parseInt(editId);
        const index = listaActividades.findIndex(a => a.id === idInt);
        if (index !== -1) {
            listaActividades[index] = { ...datosActividad, id: idInt };
            actualizarEnDB(idInt, datosActividad);
            mostrarToast("✅ Registro actualizado.");
        }
        document.getElementById('editId').value = "";
        document.querySelector('#formularioTimesheet button[type="submit"]').textContent = "Guardar Actividad";
    } else {
        listaActividades.push(datosActividad);
        guardarEnDB(datosActividad);
        mostrarToast(`✅ Guardado. Tienes ${listaActividades.length} actividades.`);
    }

    actualizarTablaBitacora();

    // Guardar protocolo si es nuevo
    if (datosActividad.protocolo && !listaProtocolos.includes(datosActividad.protocolo)) {
        listaProtocolos.push(datosActividad.protocolo);
        localStorage.setItem('protocolos', JSON.stringify(listaProtocolos));
        actualizarDatalistProtocolos();
    }

    formulario.reset();
    selectActividad.classList.add('oculto'); labelActividad.classList.add('oculto');
    textareaDescripcion.classList.add('oculto'); labelDescripcion.classList.add('oculto');
});

botonExportar.addEventListener('click', () => {
    if (listaActividades.length === 0) { mostrarToast("⚠️ No hay datos para exportar."); return; }
    const filasCSV = ["Fecha,Protocolo,Categoria,Descripcion,Horas"];
    listaActividades.forEach(act => {
        const pFecha = escaparCSV(act.fecha);
        const pProtocolo = escaparCSV(act.protocolo);
        const pCategoria = escaparCSV(act.categoria);
        const pDescripcion = escaparCSV(act.descripcion);
        const pHoras = escaparCSV(act.horas);
        filasCSV.push(`${pFecha},${pProtocolo},${pCategoria},${pDescripcion},${pHoras}`);
    });
    const contenidoCSV = filasCSV.join('\n') + '\n';
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.setAttribute("href", url);
    enlace.setAttribute("download", "Timesheet_Clinico.csv");
    document.body.appendChild(enlace); enlace.click(); document.body.removeChild(enlace);
    mostrarToast("📥 Excel descargado.");
});

// ==========================================
// 6. FUNCIONES ADICIONALES
// ==========================================
function actualizarDatalistProtocolos() {
    const datalist = document.getElementById('listaProtocolos');
    if (!datalist) return;
    datalist.innerHTML = "";
    const fragment = document.createDocumentFragment();
    listaProtocolos.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        fragment.appendChild(opt);
    });
    datalist.appendChild(fragment);
}
actualizarDatalistProtocolos();

function actualizarEstadisticas() {
    const totalHoras = listaActividades.reduce((sum, act) => sum + (parseFloat(act.horas) || 0), 0);
    const elHoras = document.getElementById('statTotalHoras');
    const elActs = document.getElementById('statTotalActividades');
    if (elHoras) elHoras.textContent = totalHoras.toFixed(1);
    if (elActs) elActs.textContent = listaActividades.length;

    const statsPorCategoria = {};
    listaActividades.forEach(act => {
        statsPorCategoria[act.categoria] = (statsPorCategoria[act.categoria] || 0) + (parseFloat(act.horas) || 0);
    });

    const contenedor = document.getElementById('categoriaStats');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const nombresCategoriasBonitos = {
        "monitoreo": "Monitoreo",
        "documentacion": "Doc/TMF",
        "entrenamiento": "Entrenamiento",
        "reuniones": "Reuniones",
        "coordinacion": "Coord. Clínica",
        "data_entry": "Data Entry",
        "regulatorio": "Regulatorio",
        "otra": "Otra"
    };

    const fragment = document.createDocumentFragment();
    Object.keys(statsPorCategoria).sort((a, b) => statsPorCategoria[b] - statsPorCategoria[a]).forEach(cat => {
        const horas = statsPorCategoria[cat];
        const porcentaje = totalHoras > 0 ? (horas / totalHoras * 100).toFixed(0) : 0;
        const nombre = nombresCategoriasBonitos[cat] || cat;

        const bar = document.createElement('div');
        bar.style.marginBottom = "10px";
        bar.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 4px;">
                <span>${nombre}</span>
                <span>${horas.toFixed(1)}h (${porcentaje}%)</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #0078D4; width: ${porcentaje}%; height: 100%;"></div>
            </div>
        `;
        fragment.appendChild(bar);
    });
    contenedor.appendChild(fragment);
}

// ==========================================
// 7. REGISTRO DEL SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => {
                console.log('✅ Service Worker registrado con éxito. App lista para offline.', registro.scope);
            })
            .catch(error => {
                console.error('⚠️ Error al registrar el Service Worker:', error);
            });
    });

}
