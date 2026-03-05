// ==========================================
// 1. BASE DE DATOS (IndexedDB)
// ==========================================
let db;
let listaActividades = [];
let listaTareas = [];
let listaProtocolos = JSON.parse(localStorage.getItem('protocolos')) || [];
let plantillasGuardadas = JSON.parse(localStorage.getItem('plantillas')) || [];

const solicitudDB = indexedDB.open("BaseDatosCTA", 2); // Subimos versión a 2
solicitudDB.onupgradeneeded = evento => {
    db = evento.target.result;
    if (!db.objectStoreNames.contains("actividades")) {
        db.createObjectStore("actividades", { autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("tareas")) {
        db.createObjectStore("tareas", { autoIncrement: true });
    }
};
solicitudDB.onsuccess = evento => {
    db = evento.target.result;
    cargarDatosGuardados();
    cargarTareasGuardadas();
};

function cargarDatosGuardados() {
    const transaccion = db.transaction(["actividades"], "readonly");
    const almacen = transaccion.objectStore("actividades");
    const solicitud = almacen.getAll();
    solicitud.onsuccess = () => {
        listaActividades = solicitud.result;
        actualizarTablaBitacora(); // Actualizamos la tabla al iniciar
        actualizarEstadisticas(); // Actualizamos meta FTE al iniciar
    };
}

function cargarTareasGuardadas() {
    if (!db.objectStoreNames.contains("tareas")) return;
    const transaccion = db.transaction(["tareas"], "readonly");
    const almacen = transaccion.objectStore("tareas");
    const solicitud = almacen.getAll();
    solicitud.onsuccess = () => {
        listaTareas = solicitud.result;
        actualizarListaTareas();
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

function guardarTareaEnDB(tarea) {
    const transaccion = db.transaction(["tareas"], "readwrite");
    const almacen = transaccion.objectStore("tareas");
    const solicitud = almacen.add(tarea);
    solicitud.onsuccess = (evento) => {
        tarea.id = evento.target.result;
    };
}

function actualizarTareaEnDB(id, tarea) {
    const transaccion = db.transaction(["tareas"], "readwrite");
    const almacen = transaccion.objectStore("tareas");
    almacen.put(tarea, id);
}

function eliminarTareaDeDB(id) {
    const transaccion = db.transaction(["tareas"], "readwrite");
    const almacen = transaccion.objectStore("tareas");
    almacen.delete(id);
}

// ==========================================
// 2. NAVEGACIÓN INFERIOR (Cambio de pantallas)
// ==========================================
const btnNavRegistro = document.getElementById('navBtnRegistro');
const btnNavBitacora = document.getElementById('navBtnBitacora');
const btnNavTareas = document.getElementById('navBtnTareas');
const btnNavStats = document.getElementById('navBtnStats');
const vistaRegistro = document.getElementById('vistaRegistro');
const vistaBitacora = document.getElementById('vistaBitacora');
const vistaTareas = document.getElementById('vistaTareas');
const vistaStats = document.getElementById('vistaEstadisticas');

function cambiarVista(vistaDestino) {
    // Apagamos todo primero
    vistaRegistro.classList.remove('activa');
    vistaBitacora.classList.remove('activa');
    if (vistaTareas) vistaTareas.classList.remove('activa');
    if (vistaStats) vistaStats.classList.remove('activa');

    btnNavRegistro.classList.remove('activo');
    btnNavBitacora.classList.remove('activo');
    if (btnNavTareas) btnNavTareas.classList.remove('activo');
    if (btnNavStats) btnNavStats.classList.remove('activo');

    // Encendemos solo lo que el usuario pidió
    if (vistaDestino === 'registro') {
        vistaRegistro.classList.add('activa');
        btnNavRegistro.classList.add('activo');
    } else if (vistaDestino === 'bitacora') {
        vistaBitacora.classList.add('activa');
        btnNavBitacora.classList.add('activo');
        actualizarTablaBitacora();
    } else if (vistaDestino === 'tareas') {
        if (vistaTareas) vistaTareas.classList.add('activa');
        if (btnNavTareas) btnNavTareas.classList.add('activo');
        actualizarListaTareas();

        if (listaActividades.length === 0) {
            mostrarToast("ℹ️ La bitácora está vacía.\n¡Registra tu primera actividad!");
        }
    } else if (vistaDestino === 'stats') {
        if (vistaStats) vistaStats.classList.add('activa');
        if (btnNavStats) btnNavStats.classList.add('activo');
        actualizarEstadisticas();
    }
}

btnNavRegistro.addEventListener('click', () => cambiarVista('registro'));
btnNavBitacora.addEventListener('click', () => cambiarVista('bitacora'));
if (btnNavTareas) btnNavTareas.addEventListener('click', () => cambiarVista('tareas'));
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
const inputHoras = document.getElementById('inputHoras');
const inputMinutos = document.getElementById('inputMinutos');

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

    // Calcular horas y minutos enteros en lugar de decimales
    let totalSegundos = Math.floor(tiempoTranscurrido / 1000);
    let horas = Math.floor(totalSegundos / 3600);
    let minutos = Math.floor((totalSegundos % 3600) / 60);

    inputHoras.value = horas;
    inputMinutos.value = minutos;

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
        setCronometroEnMarcha: (v) => { cronometroEnMarcha = v; },
        actualizarTablaBitacora: () => { if (typeof actualizarTablaBitacora === 'function') actualizarTablaBitacora(); },
        actualizarEstadisticas: () => { if (typeof actualizarEstadisticas === 'function') actualizarEstadisticas(); },
        setListaActividades: (arr) => { listaActividades = arr; }
    };
}

// ==========================================
// 4. LÓGICA DE FORMULARIO Y PLANTILLAS
// ==========================================
function actualizarPlantillas() {
    const contenedor = document.getElementById('contenedorPlantillas');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (plantillasGuardadas.length === 0) return;

    const fragment = document.createDocumentFragment();
    plantillasGuardadas.forEach((plantilla, index) => {
        const btn = document.createElement('button');
        btn.className = 'plantilla-btn';
        btn.textContent = `⚡ ${plantilla.nombre}`;
        btn.onclick = (e) => {
            e.preventDefault();
            aplicarPlantilla(plantilla);
        };
        fragment.appendChild(btn);
    });
    contenedor.appendChild(fragment);
}

function aplicarPlantilla(plantilla) {
    document.getElementById('protocolo').value = plantilla.protocolo || "";
    selectCategoria.value = plantilla.categoria || "";
    selectCategoria.dispatchEvent(new Event('change'));

    setTimeout(() => {
        if (opcionesPorCategoria[plantilla.categoria] && opcionesPorCategoria[plantilla.categoria].includes(plantilla.descripcion)) {
            selectActividad.value = plantilla.descripcion;
            textareaDescripcion.classList.add('oculto');
            labelDescripcion.classList.add('oculto');
        } else {
            selectActividad.value = "Otra";
            textareaDescripcion.value = plantilla.descripcion || "";
            textareaDescripcion.classList.remove('oculto');
            labelDescripcion.classList.remove('oculto');
        }
    }, 50);

    const horasTotales = parseFloat(plantilla.horas) || 0;
    document.getElementById('inputHoras').value = Math.floor(horasTotales);
    document.getElementById('inputMinutos').value = Math.round((horasTotales - Math.floor(horasTotales)) * 60);

    mostrarToast(`Plantilla "${plantilla.nombre}" aplicada`);
}

document.getElementById('btnGuardarPlantilla').addEventListener('click', () => {
    let descripcionFinal = selectCategoria.value === "otra" || selectActividad.value === "Otra"
        ? textareaDescripcion.value : selectActividad.value;

    if (!selectCategoria.value || !descripcionFinal) {
        mostrarToast("⚠️ Completa Categoría y Actividad para guardar plantilla.");
        return;
    }

    const nombre = prompt("Dale un nombre corto a esta plantilla (Ej: Review Diario):");
    if (!nombre) return;

    const hrs = parseInt(document.getElementById('inputHoras').value) || 0;
    const mins = parseInt(document.getElementById('inputMinutos').value) || 0;
    const horasCalculadas = parseFloat((hrs + (mins / 60)).toFixed(2));

    const nuevaPlantilla = {
        nombre: nombre,
        protocolo: document.getElementById('protocolo').value,
        categoria: selectCategoria.value,
        descripcion: descripcionFinal,
        horas: horasCalculadas
    };

    plantillasGuardadas.push(nuevaPlantilla);
    localStorage.setItem('plantillas', JSON.stringify(plantillasGuardadas));
    actualizarPlantillas();
    mostrarToast("✅ Plantilla guardada.");
});

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
    ],
    micro_operaciones: [
        "Resolver Query (Rápida)",
        "Actualizar dato aislado en EDC",
        "Revisión rápida de eCRF",
        "Verificación de Alerta de Sistema",
        "Otra"
    ],
    micro_administrativas: [
        "Responder Email Corto",
        "Llamada breve (PI/CRA/Sponsor)",
        "Archivar Documento Simple (Ej. ICF)",
        "Agendar/Modificar Reunión",
        "Otra"
    ]
};

selectCategoria.addEventListener('change', () => {
    const cat = selectCategoria.value;
    selectActividad.innerHTML = "";
    selectActividad.appendChild(crearOpcion("", "-- Selecciona una actividad --"));

    if (cat === "otra") {
        selectActividad.classList.add('oculto'); labelActividad.classList.add('oculto');
        textareaDescripcion.classList.remove('oculto'); labelDescripcion.classList.remove('oculto');
    } else if (cat !== "") {
        const fragment = document.createDocumentFragment();
        opcionesPorCategoria[cat].forEach(act => {
            fragment.appendChild(crearOpcion(act, act));
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

// Variables de Filtro
let actividadesFiltradas = [];
let filtrosActivos = false;

document.getElementById('btnAplicarFiltros').addEventListener('click', () => {
    filtrosActivos = true;
    actualizarTablaBitacora();
});

document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
    document.getElementById('filtroFechaInicio').value = "";
    document.getElementById('filtroFechaFin').value = "";
    document.getElementById('filtroProtocolo').value = "";
    filtrosActivos = false;
    actualizarTablaBitacora();
});

function actualizarTablaBitacora() {
    cuerpoTabla.innerHTML = "";

    if (listaActividades.length === 0) {
        cuerpoTabla.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Sin actividades.</td></tr>";
        return;
    }

    // Obtener valores de filtro
    const fInicio = document.getElementById('filtroFechaInicio').value;
    const fFin = document.getElementById('filtroFechaFin').value;
    const fProtocolo = document.getElementById('filtroProtocolo').value;

    // Aplicar Filtros
    actividadesFiltradas = listaActividades.filter(act => {
        let pasaFiltro = true;
        if (fInicio && act.fecha < fInicio) pasaFiltro = false;
        if (fFin && act.fecha > fFin) pasaFiltro = false;
        if (fProtocolo && act.protocolo !== fProtocolo) pasaFiltro = false;
        return pasaFiltro;
    });

    if (actividadesFiltradas.length === 0) {
        cuerpoTabla.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No se encontraron resultados para los filtros aplicados.</td></tr>";
        return;
    }

    const nombresCategorias = {
        "monitoreo": "Monitoreo",
        "documentacion": "Documentación / TMF",
        "entrenamiento": "Entrenamiento",
        "reuniones": "Reuniones",
        "coordinacion": "Coordinación Clínica",
        "data_entry": "Data Entry",
        "regulatorio": "Regulatorio",
        "micro_operaciones": "Micro (Ops)",
        "micro_administrativas": "Micro (Admin)",
        "otra": "Otra"
    };

    const fragment = document.createDocumentFragment();
    actividadesFiltradas.slice().reverse().forEach((actividad) => {
        // Necesitamos el index original para editar/eliminar correctamente
        const indexOriginal = listaActividades.findIndex(a => a.id === actividad.id);
        const fila = document.createElement('tr');
        const nombreCategoriaRaw = nombresCategorias[actividad.categoria] || actividad.categoria;
        const nombreCategoria = escapeHTML(nombreCategoriaRaw);
        const escProtocolo = escapeHTML(actividad.protocolo || "-");
        const escDescripcion = escapeHTML(actividad.descripcion);

        // Sanitización para prevenir XSS
        const escProtocolo = escapeHTML(actividad.protocolo || "-");
        const escCategoria = escapeHTML(nombreCategoria);
        const escDescripcion = escapeHTML(actividad.descripcion);

        fila.innerHTML = `
            <td>${actividad.fecha}</td>
            <td>${escProtocolo}</td>
            <td>${nombreCategoria}</td>
            <td>${escDescripcion}</td>
            <td><strong>${actividad.horas}</strong></td>
            <td>
                <button aria-label="Editar actividad" onclick="cargarParaEditar(${actividad.id}, ${indexOriginal})" style="background:none; border:none; cursor:pointer;">✏️</button>
                <button aria-label="Eliminar actividad" onclick="eliminarRegistro(${actividad.id}, ${indexOriginal})" style="background:none; border:none; cursor:pointer;">🗑️</button>
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

    // Convertir decimal de vuelta a horas y minutos para los inputs
    const horasTotales = parseFloat(act.horas) || 0;
    const hrsEnteras = Math.floor(horasTotales);
    const minsEnteros = Math.round((horasTotales - hrsEnteras) * 60);

    document.getElementById('inputHoras').value = hrsEnteras;
    document.getElementById('inputMinutos').value = minsEnteros;

    cambiarVista('registro');
    document.querySelector('#formularioTimesheet button[type="submit"]').textContent = "Actualizar Actividad";
};

formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const editId = document.getElementById('editId').value;

    let descripcionFinal = selectCategoria.value === "otra" || selectActividad.value === "Otra"
        ? textareaDescripcion.value.replace(/,/g, " ") : selectActividad.value;

    // Calcular el decimal de horas en base a horas y minutos enteros
    const hrs = parseInt(document.getElementById('inputHoras').value) || 0;
    const mins = parseInt(document.getElementById('inputMinutos').value) || 0;
    const horasCalculadas = parseFloat((hrs + (mins / 60)).toFixed(2));

    const datosActividad = {
        fecha: document.getElementById('fecha').value,
        protocolo: document.getElementById('protocolo').value,
        categoria: selectCategoria.value,
        descripcion: descripcionFinal,
        horas: horasCalculadas
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

    // Lógica para Action Items
    const checkboxActionItem = document.getElementById('checkboxActionItem');
    if (checkboxActionItem && checkboxActionItem.checked) {
        const nuevaTarea = {
            titulo: `Pendiente de: ${datosActividad.descripcion}`,
            protocolo: datosActividad.protocolo,
            fechaCreacion: datosActividad.fecha,
            estado: 'pendiente'
        };
        listaTareas.push(nuevaTarea);
        guardarTareaEnDB(nuevaTarea);
        actualizarListaTareas();
        mostrarToast("📝 Action Item creado en Tareas.");
        checkboxActionItem.checked = false;
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

// ==========================================
// LÓGICA DE ACTION ITEMS (TAREAS)
// ==========================================
function actualizarListaTareas() {
    const contenedor = document.getElementById('listaActionItems');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (listaTareas.length === 0) {
        contenedor.innerHTML = "<p style='text-align: center; color: #777;'>No hay tareas pendientes. ¡Todo al día! 🎉</p>";
        return;
    }

    const fragment = document.createDocumentFragment();
    listaTareas.forEach((tarea, index) => {
        const div = document.createElement('div');
        div.className = 'tarea-item';
        if (tarea.estado === 'completado') {
            div.style.opacity = '0.6';
            div.style.backgroundColor = '#f8f9fa';
        }

        const btnColor = tarea.estado === 'completado' ? '#6c757d' : '#28a745';
        const btnText = tarea.estado === 'completado' ? 'Deshacer' : 'Completar';

        const escTitulo = escapeHTML(tarea.titulo);
        const escProtocolo = escapeHTML(tarea.protocolo || 'Sin protocolo');

        div.innerHTML = `
            <div class="tarea-info">
                <div class="tarea-titulo" style="${tarea.estado === 'completado' ? 'text-decoration: line-through;' : ''}">${escTitulo}</div>
                <div class="tarea-meta">${escProtocolo} • ${tarea.fechaCreacion}</div>
            </div>
            <div class="tarea-acciones">
                <button aria-label="${btnText}" onclick="toggleTarea(${tarea.id}, ${index})" style="background-color: ${btnColor}; padding: 6px 10px; font-size: 12px; margin: 0; width: auto;">✔️</button>
                <button aria-label="Eliminar tarea" onclick="eliminarTarea(${tarea.id}, ${index})" style="background-color: #dc3545; padding: 6px 10px; font-size: 12px; margin: 0; width: auto;">🗑️</button>
            </div>
        `;
        fragment.appendChild(div);
    });
    contenedor.appendChild(fragment);
}

window.toggleTarea = (id, index) => {
    const tarea = listaTareas[index];
    tarea.estado = tarea.estado === 'pendiente' ? 'completado' : 'pendiente';
    actualizarTareaEnDB(id, tarea);
    actualizarListaTareas();
};

window.eliminarTarea = (id, index) => {
    if (confirm("¿Eliminar este Action Item?")) {
        listaTareas.splice(index, 1);
        eliminarTareaDeDB(id);
        actualizarListaTareas();
        mostrarToast("🗑️ Action Item eliminado.");
    }
};


botonExportar.addEventListener('click', () => {
    // Usar actividadesFiltradas en lugar de listaActividades completa para la exportación inteligente
    const datosAExportar = filtrosActivos ? actividadesFiltradas : listaActividades;

    if (datosAExportar.length === 0) { mostrarToast("⚠️ No hay datos para exportar."); return; }

    const filasCSV = ["Fecha,Protocolo,Categoria,Descripcion,Horas"];
    datosAExportar.forEach(act => {
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
    mostrarToast("📥 Excel descargado (filtrado).");
});

// ==========================================
// 6. FUNCIONES ADICIONALES
// ==========================================

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Crea un elemento <option> de forma segura y eficiente.
 * 🛡️ Sentinel: El uso de .textContent previene ataques XSS al tratar el texto como contenido literal.
 */
function crearOpcion(valor, texto) {
    const opt = document.createElement('option');
    opt.value = valor;
    opt.textContent = texto || valor;
    return opt;
}

function actualizarDatalistProtocolos() {
    const datalist = document.getElementById('listaProtocolos');
    if (!datalist) return;
    datalist.innerHTML = "";
    const fragment = document.createDocumentFragment();
    listaProtocolos.forEach(p => {
        fragment.appendChild(crearOpcion(p));
    });
    datalist.appendChild(fragment);

    // Actualizar también el filtro de protocolos
    const selectFiltro = document.getElementById('filtroProtocolo');
    if (selectFiltro) {
        selectFiltro.innerHTML = "";
        const fragmentFiltro = document.createDocumentFragment();
        fragmentFiltro.appendChild(crearOpcion("", "Todos los Protocolos"));
        listaProtocolos.forEach(p => {
            fragmentFiltro.appendChild(crearOpcion(p, p));
        });
        selectFiltro.appendChild(fragmentFiltro);
    }
}
actualizarDatalistProtocolos();
actualizarPlantillas();

function actualizarEstadisticas() {
    const totalHoras = listaActividades.reduce((sum, act) => sum + (parseFloat(act.horas) || 0), 0);
    const elHoras = document.getElementById('statTotalHoras');
    const elActs = document.getElementById('statTotalActividades');
    if (elHoras) elHoras.textContent = totalHoras.toFixed(1);
    if (elActs) elActs.textContent = listaActividades.length;

    // Lógica FTE Semanal
    const inputMeta = document.getElementById('inputMetaSemanal');
    let metaSemanal = parseInt(localStorage.getItem('metaFTE')) || 40;
    if (inputMeta) {
        inputMeta.value = metaSemanal;
        inputMeta.onchange = (e) => {
            const nuevaMeta = parseInt(e.target.value) || 0;
            localStorage.setItem('metaFTE', nuevaMeta);
            actualizarEstadisticas();
            mostrarToast("🎯 Meta semanal actualizada");
        };
    }

    const hoy = new Date();
    // Ajustar para que la semana empiece en Lunes (0=Dom, 1=Lun)
    const diaDeLaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaDeLaSemana);
    lunes.setHours(0,0,0,0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23,59,59,999);

    let horasEstaSemana = 0;

    const statsPorCategoria = {};
    const statsPorProtocolo = {};
    const statsPorFecha = {};
    let microTareasCount = 0;
    let microTareasHoras = 0;

    listaActividades.forEach(act => {
        const horasAct = parseFloat(act.horas) || 0;

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
        const fechaAct = new Date(act.fecha + "T12:00:00"); // Medio día para evitar problemas de TZ
        if (fechaAct >= lunes && fechaAct <= domingo) {
            horasEstaSemana += horasAct;
        }
    });

    // Actualizar UI del FTE Tracker
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

    // 1. Renderizar Insights
    const insightsContainer = document.getElementById('insightsContainer');
    if (insightsContainer) {
        insightsContainer.innerHTML = "";
        const insightsFragment = document.createDocumentFragment();

        // Insight: Alerta de Burnout (> 10 horas en un día)
        const fechasBurnout = Object.keys(statsPorFecha).filter(fecha => statsPorFecha[fecha] > 10);
        if (fechasBurnout.length > 0) {
            const burnoutAlert = document.createElement('div');
            burnoutAlert.style.cssText = "background-color: #ffebee; color: #c62828; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #c62828;";
            burnoutAlert.innerHTML = `<strong>⚠️ Alerta de Sobrecarga:</strong> Has registrado más de 10 horas en ${fechasBurnout.length} día(s). Recuerda cuidar tu bienestar.`;
            insightsFragment.appendChild(burnoutAlert);
        }

        if (listaActividades.length > 0) {
            // Insight: Protocolo más intensivo
            const protocoloTop = Object.keys(statsPorProtocolo).reduce((a, b) => statsPorProtocolo[a] > statsPorProtocolo[b] ? a : b);
            if (protocoloTop && protocoloTop !== "Sin Protocolo") {
                const protocoloInsight = document.createElement('div');
                protocoloInsight.style.cssText = "background-color: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #2e7d32;";
                // Security Fix: Wrap user input with escapeHTML to prevent XSS
                const escProtocoloTop = escapeHTML(protocoloTop);
                protocoloInsight.innerHTML = `<strong>💡 Foco Principal:</strong> El protocolo <em>${escProtocoloTop}</em> consumió la mayor parte de tus horas.`;
                insightsFragment.appendChild(protocoloInsight);
            }

            // Insight: Micro-tareas
            if (microTareasCount > 0) {
                // Formateo inteligente del tiempo de micro-tareas
                let textoTiempo;
                if (microTareasHoras < 1) {
                    const minutosCalculados = Math.round(microTareasHoras * 60);
                    textoTiempo = `${minutosCalculados} minutos totales`;
                } else {
                    textoTiempo = `${microTareasHoras.toFixed(1)} horas totales`;
                }

                const microInsight = document.createElement('div');
                microInsight.style.cssText = "background-color: #fff3e0; color: #ef6c00; padding: 12px; border-radius: 6px; font-size: 14px; border-left: 4px solid #ef6c00;";
                microInsight.innerHTML = `<strong>⚡ Eficiencia:</strong> Has completado ${microTareasCount} micro-tareas (${textoTiempo}).`;
                insightsFragment.appendChild(microInsight);
            }
        }

        insightsContainer.appendChild(insightsFragment);
    }

    const nombresCategoriasBonitos = {
        "monitoreo": "Monitoreo",
        "documentacion": "Doc/TMF",
        "entrenamiento": "Entrenamiento",
        "reuniones": "Reuniones",
        "coordinacion": "Coord. Clínica",
        "data_entry": "Data Entry",
        "regulatorio": "Regulatorio",
        "micro_operaciones": "Micro (Ops)",
        "micro_administrativas": "Micro (Admin)",
        "otra": "Otra"
    };

    // 2. Renderizar Barras por Categoría
    const catContenedor = document.getElementById('categoriaStats');
    if (catContenedor) {
        catContenedor.innerHTML = "";
        const catFragment = document.createDocumentFragment();
        Object.keys(statsPorCategoria).sort((a, b) => statsPorCategoria[b] - statsPorCategoria[a]).forEach(cat => {
            const horas = statsPorCategoria[cat];
            const porcentaje = totalHoras > 0 ? (horas / totalHoras * 100).toFixed(0) : 0;
            const nombreRaw = nombresCategoriasBonitos[cat] || cat;
            const nombre = escapeHTML(nombreRaw);

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
            catFragment.appendChild(bar);
        });
        catContenedor.appendChild(catFragment);
    }

    // 3. Renderizar Barras por Protocolo
    const protContenedor = document.getElementById('protocoloStats');
    if (protContenedor) {
        protContenedor.innerHTML = "";
        const protFragment = document.createDocumentFragment();
        Object.keys(statsPorProtocolo).sort((a, b) => statsPorProtocolo[b] - statsPorProtocolo[a]).forEach(prot => {
            const horas = statsPorProtocolo[prot];
            const porcentaje = totalHoras > 0 ? (horas / totalHoras * 100).toFixed(0) : 0;
            const escProt = escapeHTML(prot);

            const bar = document.createElement('div');
            bar.style.marginBottom = "10px";
            // Sanitización para prevenir XSS
            const escProt = escapeHTML(prot);
            bar.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 4px;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${escProt}</span>
                    <span>${horas.toFixed(1)}h (${porcentaje}%)</span>
                </div>
                <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #107c41; width: ${porcentaje}%; height: 100%;"></div>
                </div>
            `;
            protFragment.appendChild(bar);
        });
        protContenedor.appendChild(protFragment);
    }
}

// ==========================================
// 7. REGISTRO DEL SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registro => {
                console.log('✅ Service Worker registrado con éxito. App lista para offline.', registro.scope);

                // Lógica para detectar actualizaciones
                registro.addEventListener('updatefound', () => {
                    const nuevoWorker = registro.installing;
                    if (nuevoWorker == null) {
                        return;
                    }

                    nuevoWorker.addEventListener('statechange', () => {
                        if (nuevoWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Hay una nueva versión lista para activarse
                                mostrarToastActualizacion(nuevoWorker);
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('⚠️ Error al registrar el Service Worker:', error);
            });
    });

    // Escuchar cuando el nuevo Service Worker toma el control y recargar la página
    let refrescando;
    if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refrescando) return;
            window.location.reload();
            refrescando = true;
        });
    }
}

function mostrarToastActualizacion(nuevoWorker) {
    const updateToast = document.getElementById('updateToast');
    const btnActualizarApp = document.getElementById('btnActualizarApp');

    if (updateToast && btnActualizarApp) {
        updateToast.classList.remove('oculto');

        btnActualizarApp.addEventListener('click', () => {
            // Mandamos el mensaje al nuevo SW para que se active inmediatamente
            nuevoWorker.postMessage('SKIP_WAITING');
        });
    }
}
