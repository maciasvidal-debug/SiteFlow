const fs = require('fs');
let index = fs.readFileSync('index.html', 'utf8');

const regex = /<div class="form-row tiempo-input-group">[\s\S]*?<label for="inputMinutos">Minutos:<\/label>\s*<input type="number" id="inputMinutos" min="0" max="59" value="0" required aria-required="true">\s*<\/div>\s*<\/div>/;

const replacement = `<div class="form-row" style="flex-direction: column; gap: 0.5rem;">
                        <button type="button" id="btnSmartTimer" class="btn btn-secundario" style="width: 100%; padding: 0.75rem; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; font-weight: 600;">
                            <span style="font-size: 1.2rem;">⏱️</span> <span id="textSmartTimer">Iniciar Smart Timer</span>
                        </button>
                        <div class="tiempo-input-group" style="display: flex; gap: 1rem; width: 100%;">
                            <div class="form-group" style="flex: 1;">
                                <label for="inputHoras">Horas:</label>
                                <input type="number" id="inputHoras" min="0" max="24" value="0" required aria-required="true" style="width: 100%;">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label for="inputMinutos">Minutos:</label>
                                <input type="number" id="inputMinutos" min="0" max="59" value="0" required aria-required="true" style="width: 100%;">
                            </div>
                        </div>
                    </div>`;

index = index.replace(regex, replacement);
fs.writeFileSync('index.html', index);
