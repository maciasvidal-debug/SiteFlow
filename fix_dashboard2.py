import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Replace the old cargarDashboardEquipo logic
old_logic = r"""async function cargarDashboardEquipo\(\) \{.*?\}\s*\}"""

new_logic = """async function cargarDashboardEquipo() {
    if (State.profile.role === 'staff') return;

    try {
        // Fetch profiles in the same department (handled securely via RLS)
        const { data: teamMembers, error: teamError } = await supabaseClient
            .from('profiles')
            .select('id, email, first_name, last_name, role, department')
            .order('role', { ascending: true });

        if (teamError) throw teamError;

        // Fetch recent time entries for the department
        const { data: entries, error: entriesError } = await supabaseClient
            .from('time_entries')
            .select(`
                id, date, total_hours, status, notes, user_id,
                profiles ( email, first_name, last_name, role ),
                activities ( name ),
                categories ( name ),
                protocols ( name, code )
            `)
            .order('date', { ascending: false })
            .limit(100);

        if (entriesError) throw entriesError;

        // Calculate KPIs
        const totalHoras = entries.reduce((sum, e) => sum + e.total_hours, 0);
        const pendingCount = entries.filter(e => e.status === 'pending').length;
        const queriedCount = entries.filter(e => e.status === 'queried').length;

        // Render Dashboard Stats Cards
        const dashboardStats = document.getElementById('dashboardStats');
        let htmlStats = `
            <div class="dashboard-card">
                <div class="dashboard-card-title">Equipo</div>
                <div class="dashboard-card-value">${teamMembers.length}</div>
                <div class="dashboard-card-subtext">Miembros activos</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">Horas Totales</div>
                <div class="dashboard-card-value">${totalHoras.toFixed(2)} h</div>
                <div class="dashboard-card-subtext">Registradas por el equipo</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">Atención Requerida</div>
                <div class="dashboard-card-value" style="color: ${queriedCount > 0 || pendingCount > 0 ? 'var(--warning-color)' : 'var(--success-color)'};">${pendingCount + queriedCount}</div>
                <div class="dashboard-card-subtext">${pendingCount} Pendientes / ${queriedCount} Observadas</div>
            </div>
        `;

        // Render detailed team list
        let teamHtml = `<div class="dashboard-card" style="grid-column: 1 / -1;"><div class="dashboard-card-title">Miembros del Departamento</div><div style="display:flex; flex-direction:column;">`;
        teamMembers.forEach(m => {
            const memberEmail = m.email || (m.first_name + ' ' + m.last_name);
            const memberEntries = entries.filter(e => e.profiles && (e.profiles.email === m.email || e.profiles.first_name === m.first_name));
            const memberHours = memberEntries.reduce((sum, e) => sum + e.total_hours, 0);
            teamHtml += `
                <div class="miembro-card">
                    <div class="miembro-info">
                        <span class="miembro-email">${escapeHTML(memberEmail)}</span>
                        <span class="miembro-role">${escapeHTML(m.role.replace('_', ' '))}</span>
                    </div>
                    <div class="miembro-stats">
                        <span style="font-weight:bold;">${memberHours.toFixed(2)}h</span><br>
                        <span style="font-size:0.8rem; color:#6b7280;">${memberEntries.length} registros</span>
                    </div>
                </div>
            `;
        });
        teamHtml += `</div></div>`;
        dashboardStats.innerHTML = htmlStats + teamHtml;

        // Handle Audit table if needed for manager/super_admin
        // VP shouldn't be approving/rejecting according to rules, just reviewing
        const cuerpoAuditoria = document.getElementById('cuerpoTablaAuditoria');
        cuerpoAuditoria.innerHTML = '';

        entries.forEach(e => {
            if (e.user_id === State.profile.id) return; // don't show own entries in audit

            const emailDisplay = escapeHTML(e.profiles?.email || 'Desconocido');
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
                    <td>${emailDisplay}</td>
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
}"""

# Using regex DOTALL to replace exactly the block
app_js = re.sub(r'async function cargarDashboardEquipo\(\) \{.*?\}\n\}', new_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
