const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');

const regex = /<section id="vistaCatalogos" class="vista" style="display: none;">[\s\S]*?<\/section>/;

const newHTML = `<section id="vistaCatalogos" class="vista" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Gestión Administrativa</h2>
                    <button id="btnVolverMenuGestion" class="btn-secundario" style="display: none; padding: 0.5rem 1rem; border-radius: 6px; background: #e5e7eb; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"><span style="font-size: 1.2rem;">🔙</span> Volver</button>
                </div>

                <!-- Menu Tarjetas -->
                <div id="menuTarjetasGestion" class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="stat-card" style="cursor: pointer; transition: transform 0.2s; background: var(--surface-color); border: 1px solid var(--border-color);" onclick="document.getElementById('menuTarjetasGestion').style.display='none'; document.getElementById('seccionProtocolos').style.display='block'; document.getElementById('btnVolverMenuGestion').style.display='flex';">
                        <div class="stat-icon bg-blue" style="font-size: 2rem;">📋</div>
                        <div class="stat-details">
                            <span class="stat-value" style="font-size: 1.2rem;">Protocolos</span>
                            <span class="stat-label">Añadir y gestionar códigos de protocolo</span>
                        </div>
                    </div>

                    <div class="stat-card" style="cursor: pointer; transition: transform 0.2s; background: var(--surface-color); border: 1px solid var(--border-color);" onclick="document.getElementById('menuTarjetasGestion').style.display='none'; document.getElementById('seccionCatalogos').style.display='grid'; document.getElementById('btnVolverMenuGestion').style.display='flex';">
                        <div class="stat-icon bg-green" style="font-size: 2rem;">📁</div>
                        <div class="stat-details">
                            <span class="stat-value" style="font-size: 1.2rem;">Catálogos</span>
                            <span class="stat-label">Gestión de categorías y actividades</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <!-- Protocolos Card -->
                    <div id="seccionProtocolos" class="dashboard-card" style="grid-column: 1 / -1; display: none;">
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
                    <div id="seccionCatalogos" class="dashboard-card" style="grid-column: 1 / -1; display: none; grid-template-columns: 1fr; gap: 2rem;">

                        <!-- Categorías -->
                        <div>
                            <h3 class="dashboard-card-title">Gestión de Categorías</h3>
                            <form id="formNuevaCategoria" class="form-row" style="margin-bottom: 1rem;">
                                <div class="form-group" style="flex: 2;">
                                    <input type="text" id="inputNuevaCatNombre" placeholder="Nombre de Categoría" required>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <button type="submit" class="btn-principal" style="height: 100%;">Añadir</button>
                                </div>
                            </form>
                            <div class="table-container" style="margin-top:0;">
                                <table aria-label="Lista de categorías">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cuerpoTablaAdminCategorias">
                                        <!-- Dynamic -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Actividades -->
                        <div style="border-top: 1px solid var(--border-color); padding-top: 2rem;">
                            <h3 class="dashboard-card-title">Gestión de Actividades</h3>
                            <form id="formNuevaActividad" class="form-row" style="margin-bottom: 1rem;">
                                <div class="form-group" style="flex: 2;">
                                    <select id="selectCatParaActividad" required>
                                        <option value="" disabled selected>Seleccione Categoría</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 2;">
                                    <input type="text" id="inputNuevaActNombre" placeholder="Nombre de Actividad" required>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <button type="submit" class="btn-principal" style="height: 100%;">Añadir</button>
                                </div>
                            </form>
                            <div class="table-container" style="margin-top:0;">
                                <table aria-label="Lista de actividades">
                                    <thead>
                                        <tr>
                                            <th>Categoría</th>
                                            <th>Actividad</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cuerpoTablaAdminActividades">
                                        <!-- Dynamic -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;

index = index.replace(regex, newHTML);
fs.writeFileSync('index.html', index);

// Inyectar JS para el boton volver
let app = fs.readFileSync('app.js', 'utf8');
const jsCode = `
    const btnVolverGestion = document.getElementById('btnVolverMenuGestion');
    if (btnVolverGestion) {
        btnVolverGestion.addEventListener('click', () => {
            document.getElementById('seccionProtocolos').style.display = 'none';
            document.getElementById('seccionCatalogos').style.display = 'none';
            document.getElementById('menuTarjetasGestion').style.display = 'grid';
            btnVolverGestion.style.display = 'none';
        });
    }
`;
app = app.replace(/document\.getElementById\('formularioBitacora'\)\.addEventListener\('submit', guardarActividad\);/, jsCode + '\n    document.getElementById(\'formularioBitacora\').addEventListener(\'submit\', guardarActividad);');
fs.writeFileSync('app.js', app);
