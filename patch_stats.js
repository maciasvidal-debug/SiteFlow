const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');

const regex = /<section id="vistaEstadisticas" class="vista" style="display: none;">[\s\S]*?<\/section>/;

const newHTML = `<section id="vistaEstadisticas" class="vista" style="display: none;">
                <div class="stats-header" style="padding: 1rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
                    <h2 style="color: var(--primary-color); margin: 0; font-size: 2rem; font-weight: 800; text-transform: uppercase;">Rendimiento Analítico</h2>

                    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                        <!-- Data Bridge (Universal) -->
                        <button id="btnExportCSV" class="btn-secundario" title="Exportar para SPSS/STATA">📥 Descargar Excel</button>
                        <button id="btnExportJSON" class="btn-secundario" title="Exportar para Power BI">📊 Datos para BI</button>
                    </div>
                </div>

                <!-- Accordion 1: Métricas Atómicas -->
                <div class="accordion-item" style="border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1rem; background: var(--surface-color); overflow: hidden;">
                    <button class="accordion-header" style="width: 100%; text-align: left; padding: 1rem 1.5rem; background: #f9fafb; border: none; font-weight: 600; font-size: 1.1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--text-color);" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.icon').textContent = this.nextElementSibling.style.display === 'none' ? '➕' : '➖';">
                        <span>🎯 Métricas Personales (Últimos 30 días)</span>
                        <span class="icon">➖</span>
                    </button>
                    <div class="accordion-content" style="padding: 1.5rem; display: block;">
                        <div class="atomic-metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title">🔥 Top Burner (Protocolo)</div>
                                <div class="metric-value-huge" id="statTopBurner">--</div>
                                <div class="metric-subtitle">Mayor carga horaria</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">⚡ Atomic Task Ratio</div>
                                <div class="metric-value-huge" id="statAtomicRatio">0%</div>
                                <div class="metric-subtitle">Registros &lt; 5 minutos</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">🎯 Quality Score</div>
                                <div class="metric-value-huge" id="statQualityScore" style="color: var(--success-color);">0%</div>
                                <div class="metric-subtitle">Aprobación Directa</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Accordion 2: Head-to-Head (H2H) -->
                <div id="h2hAccordion" class="accordion-item" style="border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1rem; background: var(--surface-color); overflow: hidden; display: none;">
                    <button class="accordion-header" style="width: 100%; text-align: left; padding: 1rem 1.5rem; background: #f9fafb; border: none; font-weight: 600; font-size: 1.1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--text-color);" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('.icon').textContent = this.nextElementSibling.style.display === 'none' ? '➕' : '➖';">
                        <span>⚖️ Head-to-Head (H2H) vs Equipo</span>
                        <span class="icon">➖</span>
                    </button>
                    <div class="accordion-content" style="padding: 1.5rem; display: block;">
                        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; background: #f3f4f6; padding: 1rem; border-radius: 8px;">
                            <div style="flex: 1; min-width: 200px;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: #6b7280; display: block; margin-bottom: 0.5rem;">Comparar Usuario:</label>
                                <select id="selectUsuarioH2H" class="h2h-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                    <option value="me">Mi Rendimiento</option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label style="font-size: 0.85rem; font-weight: 600; color: #6b7280; display: block; margin-bottom: 0.5rem;">Vs. Rol de Equipo:</label>
                                <select id="selectRolH2H" class="h2h-select" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                                    <option value="all">Todo el equipo (Promedio)</option>
                                    <option value="cra">Solo CRAs</option>
                                    <option value="crc">Solo CRCs</option>
                                    <option value="data_entry">Solo Data Entry</option>
                                </select>
                            </div>
                        </div>

                        <div id="h2hContainer" class="h2h-container" style="display: block;">
                            <div class="h2h-row">
                                <div class="h2h-label">Total Horas (30d)</div>
                                <div class="h2h-bars">
                                    <div class="h2h-bar-wrapper">
                                        <span class="h2h-val user-val" id="h2hUserHours">0</span>
                                        <div class="progress-bg"><div id="barUserHours" class="progress-bar-neon neon-blue" style="width: 0%;"></div></div>
                                    </div>
                                    <div class="h2h-bar-wrapper">
                                        <span class="h2h-val team-val" id="h2hTeamHours">0</span>
                                        <div class="progress-bg"><div id="barTeamHours" class="progress-bar-neon neon-pink" style="width: 0%;"></div></div>
                                    </div>
                                </div>
                            </div>
                            <div class="h2h-row">
                                <div class="h2h-label">Eficiencia Atómica (&lt; 5m)</div>
                                <div class="h2h-bars">
                                    <div class="h2h-bar-wrapper">
                                        <span class="h2h-val user-val" id="h2hUserAtomic">0%</span>
                                        <div class="progress-bg"><div id="barUserAtomic" class="progress-bar-neon neon-blue" style="width: 0%;"></div></div>
                                    </div>
                                    <div class="h2h-bar-wrapper">
                                        <span class="h2h-val team-val" id="h2hTeamAtomic">0%</span>
                                        <div class="progress-bg"><div id="barTeamAtomic" class="progress-bar-neon neon-pink" style="width: 0%;"></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;

index = index.replace(regex, newHTML);
fs.writeFileSync('index.html', index);
