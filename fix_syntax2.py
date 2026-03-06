import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Remove the broken 'formNuevaCategoria' event listener that was partially overwritten
old_broken = r"    document\.getElementById\('formNuevaCategoria'\)\.addEventListener\('submit', async \(e\) => \{.*?\n\}\n"
app_js = re.sub(old_broken, "", app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
