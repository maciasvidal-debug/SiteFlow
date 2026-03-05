
// --- PWA Service Worker Registration & Update Flow ---
let nuevoWorker;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker registrado:', reg.scope);

            reg.addEventListener('updatefound', () => {
                nuevoWorker = reg.installing;
                nuevoWorker.addEventListener('statechange', () => {
                    if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Show update toast
                        const toast = document.getElementById('toastActualizacion');
                        if(toast) toast.hidden = false;
                    }
                });
            });
        }).catch(err => {
            console.error('Error al registrar Service Worker:', err);
        });

        // Listen for controller change to reload
        let recargando = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!recargando) {
                window.location.reload();
                recargando = true;
            }
        });
    });
}

// Attach event listener for the update button
document.addEventListener('DOMContentLoaded', () => {
    const btnActualizar = document.getElementById('btnActualizarApp');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', () => {
            if (nuevoWorker) {
                nuevoWorker.postMessage({ action: 'skipWaiting' });
            }
        });
    }
});

// SiteFlow v2.0 - Core Application Logic
const SUPABASE_URL = 'https://frawcmqosmutjlusnmpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXdjbXFvc211dGpsdXNubXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDMwNjUsImV4cCI6MjA4ODMxOTA2NX0.h9RiAF2BRsyBjwv4OjFqpH6VUbpLdOwgoF9DMPedU00'; // Legacy anon key for now, could use publishable

// Initialize Supabase Client
const supabase = typeof window !== 'undefined' && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Fallback in case Supabase library fails to load
document.addEventListener('DOMContentLoaded', () => {
    if (!supabase) {
        const errorDiv = document.getElementById('mensajeErrorLogin');
        if (errorDiv) errorDiv.textContent = 'Error: Por favor configure las credenciales de su proyecto Supabase en el archivo app.js (SUPABASE_URL y SUPABASE_ANON_KEY).';
        mostrarLogin();
    }
});

// State Management
const State = {
    user: null,
    profile: null,
    protocols: [],
    categories: [],
    activities: [],
    timeEntries: [],
    currentView: 'vistaRegistro'
};

// --- Authentication & Session Management ---
async function checkSession() {
    if (!supabase) { return mostrarLogin(); }
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error checking session:", error.message);
        mostrarLogin();
        return;
    }
    } catch (e) {
        console.error("Supabase no configurado o falló:", e);
        mostrarLogin();
        return;
    }

    if (session) {
        await initializeUser(session.user);
    } else {
        mostrarLogin();
    }
}

if (supabase) supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
        await initializeUser(session.user);
    } else if (event === 'SIGNED_OUT') {
        State.user = null;
        State.profile = null;
        mostrarLogin();
    }
});

async function initializeUser(user) {
    State.user = user;
    document.getElementById('userEmailDisplay').textContent = user.email;

    try {
        // Fetch user profile to get role
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        State.profile = profile;

        mostrarAppPrincipal();
        configurarUIporRol(profile.role);

        // Load initial data
        await cargarCatalogos();
        await cargarBitacora();

    } catch (err) {
        console.error("Error initializing user profile:", err.message);
        // Fallback or error state
    }
}

// --- UI & Polymorphism ---
function mostrarLogin() {
    document.getElementById('pantallaLogin').style.display = 'block';
    document.getElementById('pantallaPrincipal').style.display = 'none';
}

function mostrarAppPrincipal() {
    document.getElementById('pantallaLogin').style.display = 'none';
    document.getElementById('pantallaPrincipal').style.display = 'block';
}

function configurarUIporRol(rol) {
    const navMenu = document.getElementById('navMenu');
    const btnNavDashboard = document.getElementById('btnNavDashboard');
    const btnNavCatalogos = document.getElementById('btnNavCatalogos');

    navMenu.style.display = 'flex'; // Show navigation

    if (rol === 'super_admin' || rol === 'manager') {
        btnNavDashboard.style.display = 'inline-block';
        btnNavCatalogos.style.display = 'inline-block';
    } else {
        // Staff role
        btnNavDashboard.style.display = 'none';
        btnNavCatalogos.style.display = 'none';
    }

    // Reset view
    cambiarVista('vistaRegistro');
}

function cambiarVista(vistaId) {
    // Hide all views
    document.querySelectorAll('.vista').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.target === vistaId) b.classList.add('active');
    });

    // Show target view
    const targetView = document.getElementById(vistaId);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active');

        if(vistaId === 'vistaDashboard') cargarDashboardEquipo();
    }
    State.currentView = vistaId;
}

// --- Event Listeners Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    document.getElementById('formularioLogin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('inputEmail').value;
        const password = document.getElementById('inputPassword').value;
        const errorDiv = document.getElementById('mensajeErrorLogin');

        try {
            errorDiv.textContent = 'Iniciando sesión...';
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            errorDiv.textContent = '';
        } catch (err) {
            errorDiv.textContent = 'Error: ' + err.message;
        }
    });

    // Logout
    document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
        await supabase.auth.signOut();
    });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cambiarVista(e.target.dataset.target);
        });
    });

    // Initialize check
    checkSession();
});

// Stubs for core functions to be implemented in next step



// Exports for testing
if (typeof module !== 'undefined' && module.exports) {
    }

// --- Utility Functions (Clean, Efficient, Secure) ---
function escaparCSV(valor) {
    if (valor == null || valor === '') return '';
    let valStr = String(valor);
    if (/^[=+\-@\t\r]/.test(valStr)) {
        valStr = "'" + valStr;
    }
    if (valStr.includes('"') || valStr.includes(',') || valStr.includes('\n')) {
        valStr = '"' + valStr.replace(/"/g, '""') + '"';
    }
    return valStr;
}

function escapeHTML(str) {
    if (str == null || str === '') return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function crearOpcion(valor, texto) {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = texto;
    return opcion;
}

// --- Data Fetching & Rendering ---
async function cargarCatalogos() {
    try {
        // Fetch Protocols
        const { data: protocolos, error: errP } = await supabase.from('protocols').select('id, name').order('name');
        if (errP) throw errP;
        State.protocols = protocolos;

        // Fetch Categories
        const { data: categorias, error: errC } = await supabase.from('categories').select('id, name, role_target').order('name');
        if (errC) throw errC;
        State.categories = categorias;

        // Fetch Activities
        const { data: actividades, error: errA } = await supabase.from('activities').select('id, category_id, name').order('name');
        if (errA) throw errA;
        State.activities = actividades;

        renderizarSelects();
    } catch (err) {
        console.error("Error loading catalogs:", err.message);
    }
}

function renderizarSelects() {
    const selectProtocolo = document.getElementById('inputProtocolo');
    const selectCategoria = document.getElementById('selectCategoria');
    const selectActividad = document.getElementById('selectActividad');

    // Clean existing
    selectProtocolo.innerHTML = '<option value="" disabled selected>Seleccione protocolo</option>';
    selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione categoría</option>';
    selectActividad.innerHTML = '<option value="" disabled selected>Seleccione actividad</option>';

    // Use DocumentFragment for performance
    const fragmentProtocolo = document.createDocumentFragment();
    State.protocols.forEach(p => fragmentProtocolo.appendChild(crearOpcion(p.id, p.name)));
    selectProtocolo.appendChild(fragmentProtocolo);

    const fragmentCategoria = document.createDocumentFragment();
    // Filter categories based on role if necessary, though RLS might already do this
    State.categories.forEach(c => {
        // Simple client-side filtering logic based on profile role (target role)
        if (!c.role_target || c.role_target === State.profile.role || State.profile.role === 'super_admin') {
             fragmentCategoria.appendChild(crearOpcion(c.id, c.name));
        }
    });
    selectCategoria.appendChild(fragmentCategoria);

    // Event listener for Category change to load Activities
    selectCategoria.addEventListener('change', (e) => {
        const catId = e.target.value;
        const actividadesFiltradas = State.activities.filter(a => a.category_id === catId);

        selectActividad.innerHTML = '<option value="" disabled selected>Seleccione actividad</option>';
        const fragmentAct = document.createDocumentFragment();
        actividadesFiltradas.forEach(a => fragmentAct.appendChild(crearOpcion(a.id, a.name)));
        selectActividad.appendChild(fragmentAct);
        selectActividad.disabled = actividadesFiltradas.length === 0;
    });
}

// Initializing event listener for save
document.addEventListener('DOMContentLoaded', () => {
     document.getElementById('formularioBitacora').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarRegistro();
    });
});

async function guardarRegistro() {
    const inputFecha = document.getElementById('inputFecha').value;
    const inputProtocolo = document.getElementById('inputProtocolo').value;
    const selectActividad = document.getElementById('selectActividad').value;
    const inputHoras = parseInt(document.getElementById('inputHoras').value, 10) || 0;
    const inputMinutos = parseInt(document.getElementById('inputMinutos').value, 10) || 0;
    const entryId = document.getElementById('inputIdEdicion').value;

    const totalHoras = parseFloat((inputHoras + (inputMinutos / 60)).toFixed(2));

    if (totalHoras <= 0) {
        alert("El tiempo debe ser mayor a 0.");
        return;
    }

    const payload = {
        date: inputFecha,
        protocol_id: inputProtocolo,
        activity_id: selectActividad,
        hours: inputHoras,
        minutes: inputMinutos,
        total_hours: totalHoras,
        user_id: State.profile.id
    };

    try {
        if (entryId) {
             const { error } = await supabase.from('time_entries').update(payload).eq('id', entryId);
             if (error) throw error;
        } else {
             const { error } = await supabase.from('time_entries').insert([payload]);
             if (error) throw error;
        }

        // Reset form
        document.getElementById('formularioBitacora').reset();
        document.getElementById('inputIdEdicion').value = '';
        document.getElementById('btnGuardar').textContent = 'Guardar Actividad';
        document.getElementById('selectActividad').disabled = true;

        await cargarBitacora();

    } catch (err) {
        console.error("Error saving entry:", err.message);
        alert("Error al guardar: " + err.message);
    }
}

async function cargarBitacora() {
    try {
        const { data: entries, error } = await supabase
            .from('time_entries')
            .select(`
                id, date, hours, minutes, total_hours, status,
                activities(id, name, category_id),
                protocols(id, name)
            `)
            .eq('user_id', State.profile.id)
            .order('date', { ascending: false })
            .limit(50); // limit for now

        if (error) throw error;
        State.timeEntries = entries;

        renderizarTablaBitacora(entries);
        actualizarEstadisticas(entries);
    } catch(err) {
         console.error("Error fetching entries:", err.message);
    }
}

function renderizarTablaBitacora(entries) {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = '';

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #6b7280;">No hay actividades registradas</td></tr>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach(entry => {
        const tr = document.createElement('tr');

        // Safe data retrieval
        const fechaSafe = escapeHTML(entry.date);
        const protocoloSafe = entry.protocols ? escapeHTML(entry.protocols.name) : 'N/A';
        const actividadSafe = entry.activities ? escapeHTML(entry.activities.name) : 'N/A';

        // Find category name manually since we didn't nest it deeply in the query
        let categoriaName = 'N/A';
        if (entry.activities && State.categories) {
            const cat = State.categories.find(c => c.id === entry.activities.category_id);
            if(cat) categoriaName = escapeHTML(cat.name);
        }

        const tiempoFmt = `${entry.hours}h ${entry.minutes}m`;

        const spanStatus = `<span class="status-badge status-${entry.status}">${escapeHTML(entry.status)}</span>`;

        // Actions
        let accionesHtml = '';
        if (entry.status === 'pending' || entry.status === 'queried') {
             accionesHtml = `
                <button class="btn-secundario btn-accion" onclick="editarRegistro('${entry.id}')">Editar</button>
             `;
        } else {
             accionesHtml = `<span style="font-size: 0.8em; color: gray;">Bloqueado</span>`;
        }

        tr.innerHTML = `
            <td>${fechaSafe}</td>
            <td>${protocoloSafe}</td>
            <td>${categoriaName}</td>
            <td>${actividadSafe}</td>
            <td>${tiempoFmt}</td>
            <td>${spanStatus}</td>
            <td class="acciones-celda">${accionesHtml}</td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
}

function editarRegistro(id) {
    const entry = State.timeEntries.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('inputIdEdicion').value = entry.id;
    document.getElementById('inputFecha').value = entry.date;

    if (entry.protocols) {
        document.getElementById('inputProtocolo').value = entry.protocols.id;
    }

    if (entry.activities) {
        // Need to set category first to trigger activity options load
        const cat = State.categories.find(c => c.id === entry.activities.category_id);
        if (cat) {
            document.getElementById('selectCategoria').value = cat.id;
            // Manually trigger the change event to populate activities
            document.getElementById('selectCategoria').dispatchEvent(new Event('change'));
            document.getElementById('selectActividad').value = entry.activities.id;
        }
    }

    document.getElementById('inputHoras').value = entry.hours;
    document.getElementById('inputMinutos').value = entry.minutes;

    document.getElementById('btnGuardar').textContent = 'Actualizar Actividad';
}

function actualizarEstadisticas(entries) {
    const hoy = new Date().toISOString().split('T')[0];
    const horasHoy = entries
        .filter(e => e.date === hoy)
        .reduce((sum, e) => sum + parseFloat(e.total_hours), 0);

    document.getElementById('totalHorasDia').textContent = horasHoy.toFixed(2) + ' h';
}

// --- Dashboard & Audit Flow (Managers & Super Admins) ---
async function cargarDashboardEquipo() {
    if (State.profile.role === 'staff') return;

    try {
        // Build the query to get subordinates' entries
        let query = supabase
            .from('time_entries')
            .select(`
                id, date, total_hours, status, user_id,
                profiles!inner(first_name, last_name, role),
                activities(name),
                protocols(name)
            `)
            .order('date', { ascending: false });

        // If manager, only get staff where manager_id = this.user.id
        // We use the auth.uid() in RLS, but we can also filter explicitly
        if (State.profile.role === 'manager') {
             // RLS already filters this, but just to be explicit
             // We don't need to add explicit filters if RLS is tight.
             query = query.neq('user_id', State.profile.id); // exclude self from audit view
        }

        const { data: teamEntries, error } = await query;
        if (error) throw error;

        renderizarTablaAuditoria(teamEntries);
        renderizarKPIsEquipo(teamEntries);

    } catch (err) {
        console.error("Error loading team dashboard:", err.message);
    }
}

function renderizarTablaAuditoria(entries) {
    const tbody = document.getElementById('cuerpoTablaAuditoria');
    tbody.innerHTML = '';

    if (!entries || entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280;">No hay actividades del equipo pendientes de revisión</td></tr>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach(entry => {
        const tr = document.createElement('tr');

        const nombre = entry.profiles ? `${escapeHTML(entry.profiles.first_name)} ${escapeHTML(entry.profiles.last_name)}` : 'Usuario Desconocido';
        const fecha = escapeHTML(entry.date);
        const actividad = entry.activities ? escapeHTML(entry.activities.name) : 'N/A';
        const tiempo = `${entry.total_hours} h`;
        const spanStatus = `<span class="status-badge status-${entry.status}">${escapeHTML(entry.status)}</span>`;

        let acciones = '';
        if (entry.status === 'pending') {
            acciones = `
                <button class="btn-principal btn-accion" onclick="aprobarRegistro('${entry.id}')">Aprobar</button>
                <button class="btn-peligro btn-accion" onclick="abrirModalQuery('${entry.id}')">Query</button>
            `;
        } else if (entry.status === 'queried') {
            acciones = `<span style="font-size: 0.8em; color: var(--error-color);">Esperando corrección</span>`;
        } else {
             acciones = `<span style="font-size: 0.8em; color: var(--success-color);">Auditado</span>`;
        }

        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${fecha}</td>
            <td>${actividad}</td>
            <td>${tiempo}</td>
            <td>${spanStatus}</td>
            <td class="acciones-celda">${acciones}</td>
        `;
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
}

function renderizarKPIsEquipo(entries) {
    const grid = document.getElementById('dashboardStats');

    // Bolt Optimization: Calculate all totals in a single pass O(N)
    let totalPending = 0;
    let totalApproved = 0;
    let totalQueried = 0;

    entries.forEach(e => {
        const hs = parseFloat(e.total_hours) || 0;
        if (e.status === 'pending') totalPending += hs;
        else if (e.status === 'approved') totalApproved += hs;
        else if (e.status === 'queried') totalQueried += hs;
    });

    const totalHours = totalPending + totalApproved + totalQueried;

    // Safe division to prevent NaN
    const pctPending = totalHours > 0 ? (totalPending / totalHours) * 100 : 0;
    const pctApproved = totalHours > 0 ? (totalApproved / totalHours) * 100 : 0;
    const pctQueried = totalHours > 0 ? (totalQueried / totalHours) * 100 : 0;

    // Palette UX: Visual progress bars using CSS instead of heavy charting libraries
    grid.innerHTML = `
        <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
            <h4 style="margin: 0 0 0.5rem 0; color: #6b7280;">Horas Pendientes</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${totalPending.toFixed(1)} h</div>
            <div class="progress-container" aria-hidden="true">
                <div class="progress-bar bg-warning" style="width: ${pctPending}%;"></div>
            </div>
            <span style="font-size: 0.8rem; color: #6b7280;">${pctPending.toFixed(0)}% del total</span>
        </div>

        <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
            <h4 style="margin: 0 0 0.5rem 0; color: #6b7280;">Horas Aprobadas</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${totalApproved.toFixed(1)} h</div>
            <div class="progress-container" aria-hidden="true">
                <div class="progress-bar bg-success" style="width: ${pctApproved}%;"></div>
            </div>
            <span style="font-size: 0.8rem; color: #6b7280;">${pctApproved.toFixed(0)}% del total</span>
        </div>

        <div class="stat-card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
            <h4 style="margin: 0 0 0.5rem 0; color: #6b7280;">Horas en Revisión (Queries)</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--error-color);">${totalQueried.toFixed(1)} h</div>
            <div class="progress-container" aria-hidden="true">
                <div class="progress-bar bg-error" style="width: ${pctQueried}%;"></div>
            </div>
            <span style="font-size: 0.8rem; color: #6b7280;">${pctQueried.toFixed(0)}% del total</span>
        </div>
    `;

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    grid.style.gap = '1rem';
    grid.style.marginBottom = '2rem';
}

async function aprobarRegistro(id) {
    if (!confirm('¿Estás seguro de aprobar este registro?')) return;

    try {
        const { error } = await supabase
            .from('time_entries')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) throw error;

        await cargarDashboardEquipo();
        alert('Registro aprobado exitosamente.');
    } catch (err) {
        console.error("Error approving entry:", err.message);
        alert('Error al aprobar: ' + err.message);
    }
}

// Modal Query Logic
function abrirModalQuery(entryId) {
    document.getElementById('hiddenEntryIdForQuery').value = entryId;
    document.getElementById('inputQueryText').value = '';
    document.getElementById('modalQuery').hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
document.getElementById('btnCancelQuery').addEventListener('click', () => {
    document.getElementById('modalQuery').hidden = true;
});

document.getElementById('btnSaveQuery').addEventListener('click', async () => {
    const entryId = document.getElementById('hiddenEntryIdForQuery').value;
    const text = document.getElementById('inputQueryText').value.trim();

    if (!text) {
        alert('Debes ingresar un motivo para el query.');
        return;
    }

    try {
        // 1. Create audit query record
        const { error: err1 } = await supabase.from('audit_queries').insert([{
            time_entry_id: entryId,
            author_id: State.profile.id,
            comment: text
        }]);
        if (err1) throw err1;

        // 2. Update time_entry status to 'queried'
        const { error: err2 } = await supabase
            .from('time_entries')
            .update({ status: 'queried' })
            .eq('id', entryId);
        if (err2) throw err2;

        document.getElementById('modalQuery').hidden = true;
        await cargarDashboardEquipo();
        alert('Query enviado exitosamente al subordinado.');

    } catch (err) {
        console.error("Error creating query:", err.message);
        alert('Error al guardar query: ' + err.message);
    }
});


// --- Backoffice / Catalog Management ---
async function cargarVistaCatalogos() {
    if (State.profile.role === 'staff') return;

    const vista = document.getElementById('vistaCatalogos');
    vista.innerHTML = `
        <h2>Gestión de Catálogos Rápidos</h2>
        <div style="display: flex; gap: 2rem; margin-top: 2rem;">

            <div style="flex: 1; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Nuevo Protocolo</h3>
                <form id="formNuevoProtocolo">
                    <div class="form-group">
                        <label>Nombre del Protocolo (ID interno):</label>
                        <input type="text" id="inputNombreProtocolo" required>
                    </div>
                    <button type="submit" class="btn-principal" style="width: auto;">Crear Protocolo</button>
                </form>
                <ul id="listaProtocolos" style="margin-top: 1rem; padding-left: 20px; color: #4b5563;"></ul>
            </div>

            <div style="flex: 1; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>Nueva Categoría (Restringida por Rol)</h3>
                <form id="formNuevaCategoria">
                    <div class="form-group">
                        <label>Nombre de Categoría:</label>
                        <input type="text" id="inputNombreCategoria" required>
                    </div>
                    <div class="form-group">
                        <label>Visible Para (Rol):</label>
                        <select id="selectRoleTarget">
                            <option value="">Todos (Global)</option>
                            <option value="staff">Solo Staff (CRC/Data Entry)</option>
                            <option value="manager">Solo Managers</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-principal" style="width: auto;">Crear Categoría</button>
                </form>
                <ul id="listaCategorias" style="margin-top: 1rem; padding-left: 20px; color: #4b5563;"></ul>
            </div>

        </div>
    `;

    // Render lists
    renderizarListasCatalogos();

    // Attach events
    document.getElementById('formNuevoProtocolo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('inputNombreProtocolo').value.trim();
        if(!nombre) return;
        try {
            const { error } = await supabase.from('protocols').insert([{ name: nombre }]);
            if (error) throw error;
            document.getElementById('formNuevoProtocolo').reset();
            await cargarCatalogos(); // reload state
            renderizarListasCatalogos();
        } catch(err) {
            alert('Error al crear protocolo: ' + err.message);
        }
    });

    document.getElementById('formNuevaCategoria').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('inputNombreCategoria').value.trim();
        const role = document.getElementById('selectRoleTarget').value || null;
        if(!nombre) return;
        try {
            const { error } = await supabase.from('categories').insert([{ name: nombre, role_target: role }]);
            if (error) throw error;
            document.getElementById('formNuevaCategoria').reset();
            await cargarCatalogos(); // reload state
            renderizarListasCatalogos();
        } catch(err) {
            alert('Error al crear categoría: ' + err.message);
        }
    });
}

function renderizarListasCatalogos() {
    const ulProt = document.getElementById('listaProtocolos');
    const ulCat = document.getElementById('listaCategorias');

    if(ulProt) {
        ulProt.innerHTML = '';
        State.protocols.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.name;
            ulProt.appendChild(li);
        });
    }

    if(ulCat) {
        ulCat.innerHTML = '';
        State.categories.forEach(c => {
            const li = document.createElement('li');
            li.textContent = `${c.name} [${c.role_target || 'Global'}]`;
            ulCat.appendChild(li);
        });
    }
}

// Ensure the Catalog view gets loaded when navigating
document.getElementById('btnNavCatalogos').addEventListener('click', () => {
    cargarVistaCatalogos();
});
});



// Exports for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkSession,
        initializeUser,
        configurarUIporRol,
        escaparCSV,
        escapeHTML,
        crearOpcion,
        actualizarEstadisticas,
        State, // export state for testing if needed
        renderizarTablaBitacora
    };
}
