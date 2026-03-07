import re

app_file = "app.js"
with open(app_file, "r") as f:
    app_js = f.read()

# Make checkSession robust against unhandled failures
old_checksession = """async function checkSession() {
    if (!supabaseClient) { return mostrarLogin(); }
    try {
        const result = await supabaseClient.auth.getSession();
        if (result.error) throw result.error;
        const session = result.data.session;
        if (session) {
            await initializeUser(session.user);
        } else {
            mostrarLogin();
        }
    } catch (e) {
        console.error("Supabase no configurado o falló:", e);
        mostrarLogin();
        return;
    }
}"""

new_checksession = """async function checkSession() {
    try {
        if (!supabaseClient) { return mostrarLogin(); }
        const result = await supabaseClient.auth.getSession();
        if (result.error) throw result.error;
        const session = result.data.session;
        if (session) {
            await initializeUser(session.user);
        } else {
            mostrarLogin();
        }
    } catch (e) {
        console.error("Supabase no configurado o falló:", e);
        mostrarLogin();
    }
}"""

if old_checksession in app_js:
    app_js = app_js.replace(old_checksession, new_checksession)
    print("Patched checkSession")

# Make sure the initialize call wraps checkSession in a hard try/catch in DOMContentLoaded
old_init = """    // Initialize check
    checkSession();
});"""

new_init = """    // Initialize check
    try {
        checkSession();
    } catch (e) {
        console.error("Hard error calling checkSession:", e);
        mostrarLogin();
    }
});"""

if old_init in app_js:
    app_js = app_js.replace(old_init, new_init)
    print("Patched DOMContentLoaded checkSession call")

with open(app_file, "w") as f:
    f.write(app_js)
