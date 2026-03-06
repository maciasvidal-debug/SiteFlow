import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Fix the broken string around 882
old_broken = r"""\n\}\);\s*=\s*await supabaseClient\.from\('protocols'\)\.insert\(\[\{ name: nombre \}\]\);.*?\}\);\n"""
app_js = re.sub(old_broken, "\n});\n", app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
