// ==========================================
// 1. BASE DE DATOS (IndexedDB)
// ==========================================
let db;
let listaActividades = [];

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
    solicitud.onsuccess = () => {
        listaActividades = solicitud.result;
        actualizarTablaBitacora(); // Actualizamos la tabla al iniciar
    };
}

function guardarEnDB(actividad) {
    const transaccion = db.transaction(["actividades"], "readwrite");
    const almacen = transaccion.objectStore("actividades");
    almacen.add(actividad);
}

// ==========================================
// 2. NAVEGACIÓN INFERIOR (Cambio de pantallas)
// ==========================================
const btnNavRegistro = document.getElementById('navBtnRegistro');
const btnNavBitacora = document.getElementById('navBtnBitacora');
const vistaRegistro = document.getElementById('vistaRegistro');
const vistaBitacora = document.getElementById('vistaBitacora');

function cambiarVista(vistaDestino) {
    // Apagamos todo primero
    vistaRegistro.classList.remove('activa');
    vistaBitacora.classList.remove('activa');
    btnNavRegistro.classList.remove('activo');
    btnNavBitacora.classList.remove('activo');

    // Encendemos solo lo que el usuario pidió
    if (vistaDestino === 'registro') {
        vistaRegistro.classList.add('activa');
        btnNavRegistro.classList.add('activo');
    } else if (vistaDestino === 'bitacora') {
        vistaBitacora.classList.add('activa');
        btnNavBitacora.classList.add('activo');
        actualizarTablaBitacora(); // Refrescamos la tabla al entrar

        // CORRECCIÓN UX: Si la bitácora está vacía al entrar, lanzamos un Toast
        if (listaActividades.length === 0) {
            mostrarToast("ℹ️ La bitácora está vacía. ¡Registra tu primera actividad!");
        }
    }
}

btnNavRegistro.addEventListener('click', () => cambiarVista('registro'));
btnNavBitacora.addEventListener('click', () => cambiarVista('bitacora'));

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
        "Verificación / Revisión de documentos (SDV/SDR"),
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
        opcionesPorCategoria[cat].forEach(act => {
            const opt = document.createElement('option'); opt.value = act; opt.textContent = act;
            selectActividad.appendChild(opt);
        });
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
    if (valor === null || valor === undefined) return "";
    let texto = String(valor);

    // Mitigación de CSV Injection (Formula Injection)
    if (["=", "+", "-", "@", "\t", "\r"].some(char => texto.startsWith(char))) {
        texto = "'" + texto;
    }

    // Escapado estándar de CSV para comas, comillas y saltos de línea
    if (texto.includes(",") || texto.includes('"') || texto.includes("\n") || texto.includes("\r")) {
        texto = '"' + texto.replace(/"/g, '""') + '"';
    }

    return texto;
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

    const fragmento = document.createDocumentFragment();

    listaActividades.slice().reverse().forEach(actividad => {
        const fila = document.createElement('tr');

        // Buscamos el nombre bonito de la categoría, si no lo encuentra, usa el original
        const nombreCategoria = nombresCategorias[actividad.categoria] || actividad.categoria;

        // CORRECCIÓN 4: Insertamos la celda de la categoría en el orden correcto
        const tdFecha = document.createElement('td');
        tdFecha.textContent = actividad.fecha;
        fila.appendChild(tdFecha);

        const tdProtocolo = document.createElement('td');
        tdProtocolo.textContent = actividad.protocolo || "-";
        fila.appendChild(tdProtocolo);

        const tdCategoria = document.createElement('td');
        tdCategoria.textContent = nombreCategoria;
        fila.appendChild(tdCategoria);

        const tdDescripcion = document.createElement('td');
        tdDescripcion.textContent = actividad.descripcion;
        fila.appendChild(tdDescripcion);

        const tdHoras = document.createElement('td');
        const strongHoras = document.createElement('strong');
        strongHoras.textContent = actividad.horas;
        tdHoras.appendChild(strongHoras);
        fila.appendChild(tdHoras);

        fragmento.appendChild(fila);
    });

    cuerpoTabla.appendChild(fragmento);
}

formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    let descripcionFinal = selectCategoria.value === "otra" || selectActividad.value === "Otra" 
        ? textareaDescripcion.value.replace(/,/g, " ") : selectActividad.value;

    const datosActividad = {
        fecha: document.getElementById('fecha').value,
        protocolo: document.getElementById('protocolo').value,
        categoria: selectCategoria.value,
        descripcion: descripcionFinal,
        horas: parseFloat(document.getElementById('horas').value)
    };

    listaActividades.push(datosActividad);
    guardarEnDB(datosActividad);
    actualizarTablaBitacora(); // Actualiza la tabla en segundo plano
    mostrarToast(`✅ Guardado. Tienes ${listaActividades.length} actividades.`);
    
    formulario.reset();
    selectActividad.classList.add('oculto'); labelActividad.classList.add('oculto');
    textareaDescripcion.classList.add('oculto'); labelDescripcion.classList.add('oculto');
});

botonExportar.addEventListener('click', () => {
    if (listaActividades.length === 0) { mostrarToast("⚠️ No hay datos para exportar."); return; }
    const headers = "Fecha,Protocolo,Categoria,Descripcion,Horas";
    const rows = listaActividades.map(act => {
        return `${escaparCSV(act.fecha)},${escaparCSV(act.protocolo)},${escaparCSV(act.categoria)},${escaparCSV(act.descripcion)},${escaparCSV(act.horas)}`;
    });
    const contenidoCSV = [headers].concat(rows).join("\n") + "\n";
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.setAttribute("href", url);
    enlace.setAttribute("download", "Timesheet_Clinico.csv");
    document.body.appendChild(enlace); enlace.click(); document.body.removeChild(enlace);
    mostrarToast("📥 Excel descargado.");
});

// ==========================================
// 6. REGISTRO DEL SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(error => {
                // console.error('⚠️ Error al registrar el Service Worker:', error);
            });
    });

}

