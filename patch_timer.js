const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');

const regex = /<div class="form-row tiempo-input-group">[\s\S]*?<label for="inputHoras">Horas:<\/label>\s*<input type="number" id="inputHoras"/;

const replacement = `<div class="form-row tiempo-input-group">
                        <div class="form-group" style="flex: 100%; margin-bottom: 0.5rem;">
                            <button type="button" id="btnSmartTimer" class="btn btn-secondary" style="padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; background: var(--surface-color); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                <span style="font-size: 1.2rem;">⏱️</span> <span id="textSmartTimer">Iniciar Smart Timer</span>
                            </button>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="inputHoras">Horas:</label>
                            <input type="number" id="inputHoras"`;

index = index.replace(regex, replacement);
fs.writeFileSync('index.html', index);
