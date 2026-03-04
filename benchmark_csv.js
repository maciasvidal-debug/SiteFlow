const performance = require('perf_hooks').performance;

// Mock data generator
function generateMockData(numItems) {
    const data = [];
    for (let i = 0; i < numItems; i++) {
        data.push({
            fecha: `2023-10-${(i % 28) + 1}`,
            protocolo: `PROT-${i % 100}`,
            categoria: ['monitoreo', 'documentacion', 'entrenamiento'][i % 3],
            descripcion: `Actividad descriptiva de prueba con índice ${i}`,
            horas: (Math.random() * 8).toFixed(2)
        });
    }
    return data;
}

// 1. Current implementation (String concatenation)
function currentImplementation(listaActividades) {
    let contenidoCSV = "Fecha,Protocolo,Categoria,Descripcion,Horas\n";
    listaActividades.forEach(act => {
        contenidoCSV += `${act.fecha},${act.protocolo},${act.categoria},${act.descripcion},${act.horas}\n`;
    });
    return contenidoCSV;
}

// 2. Optimized implementation (Array.push / join) with escaping logic
function escaparCSV(valor) {
    if (valor === null || valor === undefined) return "";
    let texto = String(valor);

    if (["=", "+", "-", "@", "\t", "\r"].some(char => texto.startsWith(char))) {
        texto = "'" + texto;
    }

    if (texto.includes(",") || texto.includes('"') || texto.includes("\n") || texto.includes("\r")) {
        texto = '"' + texto.replace(/"/g, '""') + '"';
    }
    return texto;
}

function optimizedImplementation(listaActividades) {
    const headers = "Fecha,Protocolo,Categoria,Descripcion,Horas";
    const rows = [headers];

    // We can preallocate the array or just map over it.
    // .map() is usually very fast.
    const mappedRows = listaActividades.map(act => {
        return `${escaparCSV(act.fecha)},${escaparCSV(act.protocolo)},${escaparCSV(act.categoria)},${escaparCSV(act.descripcion)},${escaparCSV(act.horas)}`;
    });

    // The previous implementation had a trailing newline. We can emulate that.
    return rows.concat(mappedRows).join('\n') + '\n';
}

function runBenchmark() {
    console.log("Generating 100,000 mock items...");
    const data = generateMockData(100000);

    console.log("Running baseline (String concatenation)...");
    const startBaseline = performance.now();
    const resultBaseline = currentImplementation(data);
    const endBaseline = performance.now();
    const timeBaseline = endBaseline - startBaseline;
    console.log(`Baseline time: ${timeBaseline.toFixed(2)} ms`);

    console.log("Running optimized (Array.map + join + escaparCSV)...");
    const startOptimized = performance.now();
    const resultOptimized = optimizedImplementation(data);
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;
    console.log(`Optimized time: ${timeOptimized.toFixed(2)} ms`);

    console.log(`Difference in length (bytes roughly): Baseline: ${resultBaseline.length}, Optimized: ${resultOptimized.length}`);
    console.log(`Improvement: ${((timeBaseline - timeOptimized) / timeBaseline * 100).toFixed(2)}%`);
}

runBenchmark();
