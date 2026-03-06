import re

with open('index.html', 'r') as f:
    content = f.read()

old_gestion = r"""<section id="vistaCatalogos" class="vista" style="display: none;">
                <h2>Gestión Administrativa</h2>
                <!-- Catalog Management UI will be here -->
                <p>Módulo de catálogos en desarrollo\.\.\.</p>
            </section>"""

new_gestion = """<section id="vistaCatalogos" class="vista" style="display: none;">
                <h2>Gestión Administrativa</h2>

                <div class="dashboard-grid">
                    <!-- Protocolos Card -->
                    <div class="dashboard-card" style="grid-column: 1 / -1;">
                        <h3 class="dashboard-card-title">Gestión de Protocolos</h3>
                        <form id="formNuevoProtocolo" class="form-row" style="margin-bottom: 1rem;">
                            <div class="form-group" style="flex: 2;">
                                <input type="text" id="inputNuevoCodigoP" placeholder="Código (ej. PROT-001)" required>
                            </div>
                            <div class="form-group" style="flex: 3;">
                                <input type="text" id="inputNuevoNombreP" placeholder="Nombre descriptivo" required>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <button type="submit" class="btn-principal" style="height: 100%;">Añadir Protocolo</button>
                            </div>
                        </form>
                        <div class="table-container" style="margin-top:0;">
                            <table aria-label="Lista de protocolos">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody id="cuerpoTablaAdminProtocolos">
                                    <!-- Dynamic -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Categorías y Actividades Card -->
                    <div class="dashboard-card" style="grid-column: 1 / -1;">
                        <h3 class="dashboard-card-title">Categorías y Actividades</h3>
                        <p style="font-size:0.875rem; color:#6b7280; margin-bottom: 1rem;">El modelo de datos requiere configurar las categorías y actividades a través de scripts de inicialización o migraciones en Supabase directamente para garantizar la integridad referencial y las dependencias de la UI (Micro Operaciones, Micro Administrativas).</p>
                        <button class="btn-secundario" disabled>Gestionar (En desarrollo)</button>
                    </div>
                </div>
            </section>"""

content = re.sub(old_gestion, new_gestion, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
