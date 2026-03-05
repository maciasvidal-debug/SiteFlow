# 🏥 SiteFlow | Clinical Activity Logger

Una aplicación web progresiva (PWA) diseñada específicamente para agilizar el registro de actividades y horas facturables en el entorno de los Ensayos Clínicos. Creada para todo el equipo de operaciones del sitio: Coordinadores (CRC), Clinical Trial Assistants (CTA) y equipos de Data Entry.

## ✨ Características Principales

* **Cronómetro Inteligente:** Mide el tiempo exacto invertido en cada tarea y lo convierte automáticamente a horas decimales.
* **Formularios Dinámicos:** Lógica condicional que adapta las opciones según la categoría seleccionada (Monitoreo, Regulatorio, Data Entry, etc.).
* **Sala Situacional (Dashboard):** Una tabla integrada para visualizar el historial de actividades recientes.
* **Exportación de Datos:** Genera un archivo `.csv` compatible con Excel, PowerBI y Microsoft Business Central.
* **Funcionamiento Offline (Sin Internet):** Utiliza *IndexedDB* y un *Service Worker* para guardar datos localmente y permitir el uso de la app en hospitales o clínicas sin conexión a la red.
* **Diseño Responsivo (Mobile-First):** Interfaz fluida que funciona como una app nativa en teléfonos móviles y se adapta a un diseño de columnas en monitores de escritorio.

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica de la aplicación.
* **CSS3:** Diseño responsivo, Flexbox y CSS Grid.
* **Vanilla JavaScript (ES6+):** Lógica del negocio, manipulación del DOM y manejo de eventos.
* **IndexedDB:** Base de datos en el navegador para almacenamiento persistente.
* **Service Workers & Web App Manifest:** Funcionalidad PWA para instalación móvil y soporte fuera de línea.

## 🚀 Cómo usar

1. Abre el enlace de la aplicación en tu navegador móvil o de escritorio.
2. Haz clic en "Instalar" (o "Añadir a la pantalla de inicio" en iOS) para usarla como una app nativa.
3. Registra tus actividades diarias e inicia el cronómetro.
4. Exporta tu bitácora al final del día o de la semana para sincronizarla con tu timesheet principal.

---

## 🚀 Versión 2.0: Backoffice & Backend (Supabase)

La aplicación ahora soporta jerarquías organizacionales, dashboards de equipo y almacenamiento en la nube mediante Supabase.

### 🌐 ¿Cómo ver la versión 2.0 usando GitHub Pages?

1. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. Bajo "Build and deployment", en la sección **Source**, selecciona `Deploy from a branch`.
4. En **Branch**, selecciona tu rama principal (ej. `main` o esta misma rama del PR) y la carpeta `/ (root)`.
5. Haz clic en **Save**. En un par de minutos, GitHub te dará un enlace (ej. `https://[tu-usuario].github.io/[repositorio]`) donde podrás ver la app v2.0 funcionando y conectada a tu base de datos Supabase en la nube.

### 🕰️ ¿Dónde está la versión 1.x (Legacy sin conexión)?

La versión antigua puramente local (IndexedDB offline) ha sido guardada y preservada en una rama separada llamada **`v1-legacy`**.
Para verla en GitHub, simplemente haz clic en el botón desplegable de ramas (donde dice `main`) en la página principal del repositorio y selecciona `v1-legacy`. Ahí estará el código intacto de la versión 1.x.
