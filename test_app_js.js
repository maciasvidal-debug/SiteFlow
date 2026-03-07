try {
    require('./app.js');
    console.log("app.js parsed successfully");
} catch (e) {
    console.error("Syntax error in app.js:", e);
}
