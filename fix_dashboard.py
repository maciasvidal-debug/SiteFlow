import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Replace the old cargarDashboard logic
old_logic = r"""async function cargarDashboard\(\) \{
    if \(\!supabaseClient\) return;

    try \{
        // Simplified dashboard load for now
        const \{ data, error \} = await supabaseClient
            \.from\('time_entries'\)
            \.select\(`
                id, date, hours, status, notes,
                profiles \( email \),
                activities \( name \),
                categories \( name \),
                protocols \( code \)
            `\)
            \.order\('date', \{ ascending: false \}\)
            \.limit\(50\);

        if \(error\) throw error;

        renderizarTablaAuditoria\(data\);

    \} catch \(err\) \{
        console\.error\("Error loading dashboard:", err\.message\);
    \}
\}"""

new_logic = """async function cargarDashboard() {
    if (!supabaseClient) return;

    try {
        // Fetch profiles in the same department (handled securely via RLS)
        const { data: teamMembers, error: teamError } = await supabaseClient
            .from('profiles')
            .select('id, email, role, department')
            .order('role', { ascending: true });

        if (teamError) throw teamError;

        // Fetch recent time entries for the department
        const { data: entries, error: entriesError } = await supabaseClient
            .from('time_entries')
            .select(`
                id, date, hours, status, notes,
                profiles ( email ),
                activities ( name ),
                categories ( name ),
                protocols ( code )
            `)
            .order('date', { ascending: false })
            .limit(100);

        if (entriesError) throw entriesError;

        // Calculate KPIs
        const totalHoras = entries.reduce((sum, e) => sum + e.hours, 0);
        const pendingCount = entries.filter(e => e.status === 'pending').length;
        const queriedCount = entries.filter(e => e.status === 'queried').length;

        // Render Dashboard Stats Cards
        const dashboardStats = document.getElementById('dashboardStats');
        dashboardStats.innerHTML = `
            <div class="dashboard-card">
                <div class="dashboard-card-title">Equipo</div>
                <div class="dashboard-card-value">${teamMembers.length}</div>
                <div class="dashboard-card-subtext">Miembros activos</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">Horas Totales (Recientes)</div>
                <div class="dashboard-card-value">${totalHoras.toFixed(2)}</div>
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
            const memberEntries = entries.filter(e => e.profiles && e.profiles.email === m.email);
            const memberHours = memberEntries.reduce((sum, e) => sum + e.hours, 0);
            teamHtml += `
                <div class="miembro-card">
                    <div class="miembro-info">
                        <span class="miembro-email">${escapeHTML(m.email)}</span>
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
        dashboardStats.innerHTML += teamHtml;

        renderizarTablaAuditoria(entries);

    } catch (err) {
        console.error("Error loading dashboard:", err.message);
    }
}"""

app_js = re.sub(old_logic, new_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
