import re

with open('app.js', 'r') as f:
    app_js = f.read()

# Enhance user profile routing
routing_logic_pattern = r"// Simple role-based routing\n\s*if \(userProfile\.role === 'super_admin' \|\| userProfile\.role === 'manager'\) \{\n\s*document\.getElementById\('btnNavDashboard'\)\.style\.display = 'block';\n\s*document\.getElementById\('btnNavCatalogos'\)\.style\.display = 'block';\n\s*\} else \{\n\s*document\.getElementById\('btnNavDashboard'\)\.style\.display = 'none';\n\s*document\.getElementById\('btnNavCatalogos'\)\.style\.display = 'none';\n\s*\}"

new_routing_logic = """// Enhanced role-based routing (RBAC)
        const btnRegistro = document.querySelector('[data-target="vistaRegistro"]');
        const btnDashboard = document.getElementById('btnNavDashboard');
        const btnGestion = document.getElementById('btnNavCatalogos');

        // Default resets
        if(btnRegistro) btnRegistro.style.display = 'flex';
        if(btnDashboard) btnDashboard.style.display = 'none';
        if(btnGestion) btnGestion.style.display = 'none';

        if (userProfile.role === 'vp') {
            // VP strictly reviews, no data entry
            if(btnRegistro) btnRegistro.style.display = 'none';
            if(btnDashboard) btnDashboard.style.display = 'flex';
            if(btnGestion) btnGestion.style.display = 'none';

            // Force navigate to Dashboard
            btnDashboard.click();
        } else if (userProfile.role === 'it_admin') {
            // IT Admin strictly manages catalogs
            if(btnRegistro) btnRegistro.style.display = 'none';
            if(btnDashboard) btnDashboard.style.display = 'none';
            if(btnGestion) btnGestion.style.display = 'flex';

            // Force navigate to Gestion
            btnGestion.click();
        } else if (userProfile.role === 'super_admin' || userProfile.role === 'manager') {
            if(btnDashboard) btnDashboard.style.display = 'flex';
            if(btnGestion) btnGestion.style.display = 'flex';
        }"""

app_js = re.sub(routing_logic_pattern, new_routing_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(app_js)
