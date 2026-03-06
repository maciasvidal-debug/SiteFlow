import re

with open('index.html', 'r') as f:
    content = f.read()

replacement = """                <div id="bannerEstadisticas" class="stats-banner modern-dashboard" aria-live="polite">
                    <h2 class="dashboard-title">Resumen de Actividad</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon bg-blue">⏱️</div>
                            <div class="stat-details">
                                <span class="stat-label">Total Horas hoy</span>
                                <span id="totalHorasDia" class="stat-value">0 h</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon bg-green">✅</div>
                            <div class="stat-details">
                                <span class="stat-label">Horas Semanales</span>
                                <span id="totalHorasSemana" class="stat-value">0 h</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon bg-purple">📊</div>
                            <div class="stat-details">
                                <span class="stat-label">Tareas de Hoy</span>
                                <span id="totalTareasDia" class="stat-value">0</span>
                            </div>
                        </div>
                    </div>
                </div>"""

pattern = re.compile(r'<div id="bannerEstadisticas"[^>]*>.*?</div>\s*</div>', re.DOTALL)
# The original has:
#                 <div id="bannerEstadisticas" class="stats-banner" aria-live="polite">
#                     <div class="stat-item">
#                         <span class="stat-label">Total Horas hoy:</span>
#                         <span id="totalHorasDia" class="stat-value">0</span>
#                     </div>
#                 </div>

content = re.sub(r'<div id="bannerEstadisticas" class="stats-banner" aria-live="polite">\s*<div class="stat-item">\s*<span class="stat-label">Total Horas hoy:</span>\s*<span id="totalHorasDia" class="stat-value">0</span>\s*</div>\s*</div>', replacement, content)

with open('index.html', 'w') as f:
    f.write(content)
