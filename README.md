# 🏥 Bitácora Clínica CTA (PWA)

Una aplicación web progresiva (PWA) diseñada específicamente para agilizar el registro de actividades y horas facturables en el entorno de los Ensayos Clínicos. Creada para Clinical Trial Assistants (CTA), Coordinadores (CRC) y equipos de Data Entry.

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
