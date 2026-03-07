import re

app_file = "app.js"
with open(app_file, "r") as f:
    app_js = f.read()

# Completely remove all Global Error Handlers with preventDefault() and console.clear()
app_js = re.sub(r'// Global Error Handler\nwindow\.addEventListener\(\'error\', function\(event\) \{\n    event\.preventDefault\(\);\n    console\.clear\(\);\n    mostrarToast\(\'Ha ocurrido un error inesperado\.\', \'error\'\);\n\}\);\n\nwindow\.addEventListener\(\'unhandledrejection\', function\(event\) \{\n    event\.preventDefault\(\);\n    console\.clear\(\);\n    mostrarToast\(.*?\'error\'\);\n\}\);\n', '', app_js)

# Fallback in case regex doesn't match perfectly
app_js = app_js.replace("event.preventDefault();\n    console.clear();", "")
app_js = app_js.replace("event.preventDefault();\n    console.clear();\n", "")
app_js = app_js.replace("window.addEventListener('error', function(event) {", "window.addEventListener('error', function(event) { console.error('Caught global error:', event.error); mostrarLogin();")
app_js = app_js.replace("window.addEventListener('unhandledrejection', function(event) {", "window.addEventListener('unhandledrejection', function(event) { console.error('Caught unhandled rejection:', event.reason); mostrarLogin();")

with open(app_file, "w") as f:
    f.write(app_js)

print("Patched error handlers.")
