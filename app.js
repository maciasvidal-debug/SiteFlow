
// --- PWA Service Worker Registration & Update Flow ---
let nuevoWorker;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            // console.log('Service Worker registrado:', reg.scope);

            reg.addEventListener('updatefound', () => {
                nuevoWorker = reg.installing;
                nuevoWorker.addEventListener('statechange', () => {
                    if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Show update banner
                        const updateBanner = document.getElementById('updateBannerOverlay');
                        if (updateBanner) {
                            updateBanner.classList.add('show');
                            document.body.classList.add('has-update-banner');
                        }
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
    const btnUpdateAppNow = document.getElementById('btnUpdateAppNow');
    if (btnUpdateAppNow) {
        btnUpdateAppNow.addEventListener('click', () => {
            if (nuevoWorker) {
                nuevoWorker.postMessage({ action: 'skipWaiting' });
            }
            const updateBanner = document.getElementById('updateBannerOverlay');
            if(updateBanner) {
                updateBanner.classList.remove('show');
                document.body.classList.remove('has-update-banner');
            }
        });
    }
});

// SiteFlow v2.0 - Core Application Logic
const SUPABASE_URL = 'https://frawcmqosmutjlusnmpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXdjbXFvc211dGpsdXNubXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDMwNjUsImV4cCI6MjA4ODMxOTA2NX0.h9RiAF2BRsyBjwv4OjFqpH6VUbpLdOwgoF9DMPedU00'; // Legacy anon key for now, could use publishable

// Initialize Supabase Client
const supabaseClient = typeof window !== 'undefined' && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Fallback in case Supabase library fails to load
document.addEventListener('DOMContentLoaded', () => {
    if (!supabaseClient) {
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
    if (!supabaseClient) { return mostrarLogin(); }
    try {
        const result = await supabaseClient.auth.getSession();
        if (result.error) throw result.error;
        const session = result.data.session;
        if (session) {
            await initializeUser(session.user);
        } else {
            mostrarLogin();
        }
    } catch (e) {
        console.error("Supabase no configurado o falló:", e);
        mostrarLogin();
        return;
    }
}

if (supabaseClient) supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
        // Only initialize if not already initialized
        if (!State.user || State.user.id !== session.user.id) {
            await initializeUser(session.user);
        }
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
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();


        if (error) throw error;
        if (!profile) throw new Error('No se encontró el perfil en la base de datos.');
        State.profile = profile;

        mostrarAppPrincipal();
        configurarUIporRol(profile.role);

        // Load initial data
        await cargarCatalogos();
        await cargarBitacora();

    } catch (err) {
        console.error("Error initializing user profile:", err.message);
        alert("Error de sesión: " + err.message);
        mostrarLogin();
    }
}

function mostrarToast(mensaje) {
    const contenedor = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => { toast.classList.add("oculto"); setTimeout(() => toast.remove(), 500); }, 2500);
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
        // Extra assurance: completely remove the DOM element to prevent layout/CSS issues or accidental clicks
        if (btnRegistro) {
            btnRegistro.style.display = 'none';
            btnRegistro.remove();
        }
        // Auto navigate
        setTimeout(() => cambiarVista('vistaDashboard'), 100);
    } else if (rol === 'it_admin') {
        // IT Admin strictly manages catalogs
        if(btnNavCatalogos) btnNavCatalogos.style.display = 'flex';
        // Auto navigate
        setTimeout(() => cambiarVista('vistaCatalogos'), 100);
    } else if (rol === 'super_admin' || rol === 'manager') {
        // Full access
        if(btnRegistro) btnRegistro.style.display = 'flex';
        if(btnNavDashboard) btnNavDashboard.style.display = 'flex';
        if(btnNavCatalogos) btnNavCatalogos.style.display = 'flex';
        cambiarVista('vistaRegistro');
    } else {
        // General clinical roles (CRA, CRC, Data Entry, Regulatory Affairs)
        if(btnRegistro) btnRegistro.style.display = 'flex';
        cambiarVista('vistaRegistro');
    }
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
        const email = document.getElementById('inputEmail').value.trim();
        const password = document.getElementById('inputPassword').value;
        const errorDiv = document.getElementById('mensajeErrorLogin');

        // Garantizar idempotencia: reiniciar estado a nulo visualmente, mostrando mensaje de carga temporal
        errorDiv.textContent = 'Iniciando sesión...';

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                if (error.code === 'invalid_credentials' || error.message.includes('Invalid login') || error.status === 400) {
                    throw new Error('Usuario o contraseña inválidos');
                }
                throw error;
            }

            // Flujo de éxito
            errorDiv.textContent = '';
        } catch (err) {
            // Vincular el estado de error de forma reactiva en la UI
            errorDiv.textContent = err.message || 'Ocurrió un error al iniciar sesión';
        }
    });

    // Logout
    document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
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
        const { data: protocolos, error: errP } = await supabaseClient.from('protocols').select('id, name').order('name');
        if (errP) throw errP;
        State.protocols = protocolos;

        // Fetch Categories
        const { data: categorias, error: errC } = await supabaseClient.from('categories').select('id, name, role_target').order('name');
        if (errC) throw errC;
        State.categories = categorias;

        // Fetch Activities
        const { data: actividades, error: errA } = await supabaseClient.from('activities').select('id, category_id, name').order('name');
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

// Initializing event listeners for forms
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formularioBitacora').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarRegistro();
    });

    const btnLimpiar = document.getElementById('btnLimpiarLocal');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            document.getElementById('formularioBitacora').reset();
            document.getElementById('inputIdEdicion').value = '';
            document.getElementById('btnGuardar').textContent = 'Guardar Actividad';
            document.getElementById('selectActividad').disabled = true;
            document.getElementById('selectActividad').innerHTML = '<option value="" disabled selected>Seleccione actividad</option>';
        });
    }
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
             const { error } = await supabaseClient.from('time_entries').update(payload).eq('id', entryId);

        } else {
             const { error } = await supabaseClient.from('time_entries').insert([payload]);

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
        const { data: entries, error } = await supabaseClient
            .from('time_entries')
            .select(`
                id, date, hours, minutes, total_hours, status,
                activities(id, name, category_id),
                protocols(id, name)
            `)
            .eq('user_id', State.profile.id)
            .order('date', { ascending: false })
            .limit(50); // limit for now


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

        const tiempoFmt = `${escapeHTML(entry.hours)}h ${escapeHTML(entry.minutes)}m`;

        const spanStatus = `<span class="status-badge status-${escapeHTML(entry.status)}">${escapeHTML(entry.status)}</span>`;

        // Actions
        let accionesHtml = '';
        if (entry.status === 'pending' || entry.status === 'queried') {
             accionesHtml = `
                <button class="btn-secundario btn-accion btn-editar" data-id="${escapeHTML(entry.id)}">Editar</button>
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

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id') || e.target.closest('.btn-editar').getAttribute('data-id');
            editarRegistro(id);
        });
    });
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
}

// --- Dashboard & Audit Flow (Managers & Super Admins) ---
async function cargarDashboardEquipo() {
    const managementRoles = ['super_admin', 'manager', 'vp', 'it_admin'];
    if (!managementRoles.includes(State.profile.role)) return;

    try {
        // Fetch profiles in the same department (handled securely via RLS)
        const { data: teamMembers, error: teamError } = await supabaseClient
            .from('profiles')
            .select('id, first_name, last_name, role, department')
            .order('role', { ascending: true });

        if (teamError) throw teamError;

        // Fetch recent time entries for the department
        const { data: entries, error: entriesError } = await supabaseClient
            .from('time_entries')
            .select(`
                id, date, total_hours, status, notes, user_id,
                profiles (  first_name, last_name, role ),
                activities ( name ),
                categories ( name ),
                protocols ( name, code )
            `)
            .order('date', { ascending: false })
            .limit(100);

        if (entriesError) throw entriesError;

        // Render Dashboard Stats Cards
        const dashboardStats = document.getElementById('dashboardStats');
        const cuerpoAuditoria = document.getElementById('cuerpoTablaAuditoria');

        if (!teamMembers || teamMembers.length === 0) {
            dashboardStats.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <h3 style="color: #111827; margin-bottom: 0.5rem;">Aún no tienes un equipo asignado</h3>
                    <p style="color: #6b7280; max-width: 400px; margin: 0 auto;">
                        Contacta a tu Administrador IT para que te asigne al mismo departamento que tu equipo en la base de datos (Supabase).
                    </p>
                </div>
            `;
            cuerpoAuditoria.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">No hay actividades para auditar</td></tr>`;
            return;
        }

        // Calculate KPIs
        const totalHoras = entries.reduce((sum, e) => sum + e.total_hours, 0);
        const pendingCount = entries.filter(e => e.status === 'pending').length;
        const queriedCount = entries.filter(e => e.status === 'queried').length;
        let htmlStats = `
            <div class="stat-card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div class="stat-icon bg-blue">👥</div>
                <div class="stat-details">
                    <span class="stat-label">Equipo Activo</span>
                    <span class="stat-value">${teamMembers.length} <span style="font-size: 0.9rem; font-weight: normal; color: #6b7280;">miembros</span></span>
                </div>
            </div>
            <div class="stat-card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div class="stat-icon bg-green">⏱️</div>
                <div class="stat-details">
                    <span class="stat-label">Horas Registradas</span>
                    <span class="stat-value">${totalHoras.toFixed(2)} <span style="font-size: 0.9rem; font-weight: normal; color: #6b7280;">h</span></span>
                </div>
            </div>
            <div class="stat-card" style="box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div class="stat-icon" style="background: ${queriedCount > 0 || pendingCount > 0 ? '#fef3c7' : '#d1fae5'}; color: ${queriedCount > 0 || pendingCount > 0 ? '#d97706' : '#059669'};">⚠️</div>
                <div class="stat-details">
                    <span class="stat-label">Atención Requerida</span>
                    <span class="stat-value">${pendingCount + queriedCount}</span>
                    <span style="font-size: 0.75rem; color: #6b7280; margin-top: 2px;">${pendingCount} pendientes, ${queriedCount} queries</span>
                </div>
            </div>
        `;

        // Render detailed team list with progress visualizations
        let teamHtml = `<div class="dashboard-card" style="grid-column: 1 / -1; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 12px; padding: 0; overflow: hidden;">
            <div style="background: #f9fafb; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; font-size: 1rem; color: #111827;">Miembros del Departamento</h3>
            </div>
            <div style="display:flex; flex-direction:column;">`;

        // Find max hours for relative progress bars
        let maxHours = 0;
        teamMembers.forEach(m => {
            const mHours = entries.filter(e => e.user_id === m.id).reduce((sum, e) => sum + e.total_hours, 0);
            if(mHours > maxHours) maxHours = mHours;
        });

        teamMembers.forEach(m => {
            // Prefer name over email for better UX if available
            const nameDisplay = (m.first_name && m.last_name) ? `${m.first_name} ${m.last_name}` : (m.email || 'Desconocido');
            const memberEntries = entries.filter(e => e.user_id === m.id);
            const memberHours = memberEntries.reduce((sum, e) => sum + e.total_hours, 0);
            const isMe = m.id === State.profile.id;

            // Calculate progress bar width relative to the most active member
            const pct = maxHours > 0 ? (memberHours / maxHours) * 100 : 0;

            // Format Role
            const roleMap = { 'staff': 'Staff', 'manager': 'Gerente', 'vp': 'VP', 'it_admin': 'IT Admin', 'super_admin': 'Super Admin' };
            const roleDisplay = roleMap[m.role] || escapeHTML(m.role);

            teamHtml += `
                <div class="miembro-card" style="display: block; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; ${isMe ? 'background: #f8fafc;' : ''}">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div class="miembro-info">
                            <span class="miembro-email" style="font-size: 1.05rem; color: #111827;">${escapeHTML(nameDisplay)} ${isMe ? '<span class="badge-version" style="background:#e0f2fe; color:#0284c7; margin-left:8px;">Tú</span>' : ''}</span>
                            <span class="miembro-role" style="color: #6b7280; font-weight: 500;">${roleDisplay}</span>
                        </div>
                        <div class="miembro-stats" style="text-align: right;">
                            <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color);">${memberHours.toFixed(2)} <span style="font-size:0.8rem; font-weight:normal; color:#6b7280;">h</span></span><br>
                            <span style="font-size:0.8rem; color:#6b7280;">${memberEntries.length} reg</span>
                        </div>
                    </div>
                    <div class="progress-container" aria-hidden="true" style="height: 6px; background: #f3f4f6;">
                        <div class="progress-bar bg-blue" style="width: ${pct}%; background-color: ${isMe ? '#38bdf8' : '#3b82f6'};"></div>
                    </div>
                </div>
            `;
        });
        teamHtml += `</div></div>`;
        dashboardStats.innerHTML = htmlStats + teamHtml;

        // Handle Audit table if needed for manager/super_admin
        // VP shouldn't be approving/rejecting according to rules, just reviewing
        // const cuerpoAuditoria = document.getElementById('cuerpoTablaAuditoria'); // Already declared
        if (cuerpoAuditoria) cuerpoAuditoria.innerHTML = '';

        entries.forEach(e => {
            if (e.user_id === State.profile.id) return; // don't show own entries in audit

            const nombreDisplay = escapeHTML((e.profiles?.first_name && e.profiles?.last_name) ? (e.profiles.first_name + ' ' + e.profiles.last_name) : 'Desconocido');
            const actividadDisplay = escapeHTML(e.activities?.name || 'Desconocido');

            let btnActions = '';
            if(State.profile.role !== 'vp') {
                btnActions = `
                    <button class="btn-accion btn-aprobar" data-id="${escapeHTML(e.id)}">✅</button>
                    <button class="btn-accion btn-rechazar" data-id="${escapeHTML(e.id)}">❌</button>
                `;
            }

            cuerpoAuditoria.innerHTML += `
                <tr>
                    <td>${nombreDisplay}</td>
                    <td>${escapeHTML(e.date)}</td>
                    <td>${actividadDisplay}</td>
                    <td>${escapeHTML(e.total_hours)}</td>
                    <td><span class="status-badge status-${escapeHTML(e.status.toLowerCase())}">${escapeHTML(e.status)}</span></td>
                    <td class="acciones-celda">
                        ${btnActions}
                    </td>
                </tr>
            `;
        });

        if(State.profile.role !== 'vp') {
            document.querySelectorAll('.btn-aprobar').forEach(btn => {
                btn.addEventListener('click', () => aprobarRegistro(btn.dataset.id));
            });

            document.querySelectorAll('.btn-rechazar').forEach(btn => {
                btn.addEventListener('click', () => abrirModalQuery(btn.dataset.id));
            });
        }

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
        const tiempo = `${escapeHTML(entry.total_hours)} h`;
        const spanStatus = `<span class="status-badge status-${escapeHTML(entry.status)}">${escapeHTML(entry.status)}</span>`;

        let acciones = '';
        if (entry.status === 'pending') {
            acciones = `
                <button class="btn-principal btn-accion btn-aprobar-auditoria" data-id="${escapeHTML(entry.id)}">Aprobar</button>
                <button class="btn-peligro btn-accion btn-rechazar-auditoria" data-id="${escapeHTML(entry.id)}">Query</button>
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

    document.querySelectorAll('.btn-aprobar-auditoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id') || e.target.closest('.btn-aprobar-auditoria').getAttribute('data-id');
            aprobarRegistro(id);
        });
    });

    document.querySelectorAll('.btn-rechazar-auditoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id') || e.target.closest('.btn-rechazar-auditoria').getAttribute('data-id');
            abrirModalQuery(id);
        });
    });
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
        const { error } = await supabaseClient
            .from('time_entries')
            .update({ status: 'approved' })
            .eq('id', id);



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
        const { error: err1 } = await supabaseClient.from('audit_queries').insert([{
            time_entry_id: entryId,
            author_id: State.profile.id,
            comment: text
        }]);
        if (err1) throw err1;

        // 2. Update time_entry status to 'queried'
        const { error: err2 } = await supabaseClient
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
    const managementRoles = ['super_admin', 'manager', 'vp', 'it_admin'];
    if (!managementRoles.includes(State.profile.role)) return;

    try {
        // Fetch protocols
        const { data: protocolos, error } = await supabaseClient
            .from('protocols')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        State.protocols = protocolos;

        // Fetch Categories
        const { data: categorias, error: errC } = await supabaseClient.from('categories').select('*').order('name', { ascending: true });
        if (errC) throw errC;
        State.categories = categorias;

        // Fetch Activities
        const { data: actividades, error: errA } = await supabaseClient.from('activities').select('id, category_id, name, categories(name)').order('name', { ascending: true });
        if (errA) throw errA;
        State.activities = actividades;


        // Render Protocolos
        const tbodyP = document.getElementById('cuerpoTablaAdminProtocolos');
        if (tbodyP) {
            tbodyP.innerHTML = '';
            protocolos.forEach(p => {
                tbodyP.innerHTML += `
                    <tr>
                        <td><strong>${escapeHTML(p.code)}</strong></td>
                        <td>${escapeHTML(p.name)}</td>
                        <td><span class="status-badge status-approved">Activo</span></td>
                    </tr>
                `;
            });
        }

        // Render Categorias
        const tbodyC = document.getElementById('cuerpoTablaAdminCategorias');
        const selectCatForm = document.getElementById('selectCatParaActividad');
        if (tbodyC) {
            tbodyC.innerHTML = '';
            selectCatForm.innerHTML = '<option value="" disabled selected>Seleccione Categoría</option>';
            categorias.forEach(c => {
                tbodyC.innerHTML += `
                    <tr>
                        <td>${escapeHTML(c.name)}</td>
                        <td>
                            <button class="btn-peligro btn-accion" onclick="eliminarCatalogo('categories', '${c.id}')">Eliminar</button>
                        </td>
                    </tr>
                `;
                selectCatForm.appendChild(crearOpcion(c.id, c.name));
            });
        }

        // Render Actividades
        const tbodyA = document.getElementById('cuerpoTablaAdminActividades');
        if (tbodyA) {
            tbodyA.innerHTML = '';
            actividades.forEach(a => {
                const catName = a.categories ? a.categories.name : 'N/A';
                tbodyA.innerHTML += `
                    <tr>
                        <td><span style="font-size:0.8rem; color:#6b7280;">${escapeHTML(catName)}</span></td>
                        <td><strong>${escapeHTML(a.name)}</strong></td>
                        <td>
                            <button class="btn-peligro btn-accion" onclick="eliminarCatalogo('activities', '${a.id}')">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        console.error("Error loading catalogs:", err.message);
    }
}

// Function to delete a catalog item
window.eliminarCatalogo = async function(table, id) {
    if(!confirm(`¿Seguro que deseas eliminar este registro? Esto podría fallar si está siendo utilizado por registros de tiempo.`)) return;

    try {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) throw error;
        alert('Registro eliminado exitosamente');
        await cargarVistaCatalogos();
        await cargarCatalogos(); // Refresh global app state
    } catch(err) {
        alert('No se pudo eliminar: ' + err.message + '. Asegúrate de que no tenga datos asociados (Ej. registros de tiempo previos).');
    }
}

// Ensure event listener for the new protocol form exists
document.addEventListener('DOMContentLoaded', () => {
    const formNuevoProtocolo = document.getElementById('formNuevoProtocolo');
    if (formNuevoProtocolo) {
        formNuevoProtocolo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const codeInput = document.getElementById('inputNuevoCodigoP');
            const nameInput = document.getElementById('inputNuevoNombreP');

            const code = codeInput.value.trim();
            const name = nameInput.value.trim();

            if (!code || !name) return;

            btn.textContent = 'Guardando...';
            btn.disabled = true;

            try {
                const { error } = await supabaseClient
                    .from('protocols')
                    .insert([{ code, name }]);

                if (error) throw error;

                alert('Protocolo creado exitosamente');
                codeInput.value = '';
                nameInput.value = '';
                await cargarVistaCatalogos();
            } catch (err) {
                console.error("Error creating protocol:", err.message);
                alert('Error: ' + err.message);
            } finally {
                btn.textContent = 'Añadir Protocolo';
                btn.disabled = false;
            }
        });
    }

    const formNuevaCategoria = document.getElementById('formNuevaCategoria');
    if (formNuevaCategoria) {
        formNuevaCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const nameInput = document.getElementById('inputNuevaCatNombre');
            const name = nameInput.value.trim();
            if (!name) return;

            btn.textContent = 'Guardando...';
            btn.disabled = true;
            try {
                const { error } = await supabaseClient.from('categories').insert([{ name }]);
                if (error) throw error;
                nameInput.value = '';
                await cargarVistaCatalogos();
                await cargarCatalogos();
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                btn.textContent = 'Añadir';
                btn.disabled = false;
            }
        });
    }

    const formNuevaActividad = document.getElementById('formNuevaActividad');
    if (formNuevaActividad) {
        formNuevaActividad.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const catSelect = document.getElementById('selectCatParaActividad');
            const nameInput = document.getElementById('inputNuevaActNombre');
            const category_id = catSelect.value;
            const name = nameInput.value.trim();
            if (!name || !category_id) return;

            btn.textContent = 'Guardando...';
            btn.disabled = true;
            try {
                const { error } = await supabaseClient.from('activities').insert([{ category_id, name }]);
                if (error) throw error;
                nameInput.value = '';
                await cargarVistaCatalogos();
                await cargarCatalogos();
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                btn.textContent = 'Añadir';
                btn.disabled = false;
            }
        });
    }
});


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
        cambiarVista,
        escaparCSV,
        escapeHTML,
        crearOpcion,
        actualizarEstadisticas,
        State, // export state for testing if needed
        renderizarTablaBitacora,
        mostrarToast,
        cambiarVista
    };
}
