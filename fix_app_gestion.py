import re

with open('app.js', 'r') as f:
    app_js = f.read()

old_logic = r"""async function cargarVistaCatalogos\(\) \{.*?\}"""

new_logic = """async function cargarVistaCatalogos() {
    if (State.profile.role === 'staff') return;

    try {
        // Fetch protocols
        const { data: protocolos, error } = await supabaseClient
            .from('protocols')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('cuerpoTablaAdminProtocolos');
        if (tbody) {
            tbody.innerHTML = '';
            protocolos.forEach(p => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${escapeHTML(p.code)}</strong></td>
                        <td>${escapeHTML(p.name)}</td>
                        <td><span class="status-badge status-approved">Activo</span></td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error("Error loading catalogs:", err.message);
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
});"""

app_js = re.sub(old_logic, new_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
