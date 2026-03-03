function escaparCSV(valor) {
    if (valor === null || valor === undefined) return "";
    let texto = String(valor);

    // Mitigación de CSV Injection (Formula Injection)
    // Si el campo comienza con =, +, -, @, le anteponemos un apóstrofe
    if (["=", "+", "-", "@"].some(char => texto.startsWith(char))) {
        texto = "'" + texto;
    }

    // Escapado estándar de CSV para comas, comillas y saltos de línea
    if (texto.includes(",") || texto.includes('"') || texto.includes("\n") || texto.includes("\r")) {
        texto = '"' + texto.replace(/"/g, '""') + '"';
    }

    return texto;
}

const tests = [
    { input: "normal", expected: "normal" },
    { input: "=1+2", expected: "'=1+2" },
    { input: "+sum(a1:a2)", expected: "'+sum(a1:a2)" },
    { input: "-123", expected: "'-123" },
    { input: "@something", expected: "'@something" },
    { input: "text, with comma", expected: '"text, with comma"' },
    { input: 'text with "quotes"', expected: '"text with ""quotes"""' },
    { input: "text with\nnewline", expected: '"text with\nnewline"' },
    { input: "=formula, with comma", expected: '"\'=formula, with comma"' },
];

let allPassed = true;
tests.forEach((t, i) => {
    const result = escaparCSV(t.input);
    if (result !== t.expected) {
        console.error(`Test ${i} failed: input [${t.input}], expected [${t.expected}], got [${result}]`);
        allPassed = false;
    } else {
        console.log(`Test ${i} passed: input [${t.input}] -> [${result}]`);
    }
});

if (!allPassed) {
    process.exit(1);
}
console.log("All tests passed!");
