# Configuración de Equipos en Supabase

Para que la aplicación SiteFlow muestre correctamente los datos en el Dashboard del Equipo ("Operación del Equipo") para los roles de **Vicepresidente (VP)** y **Gerente (Manager)**, es necesario configurar la estructura jerárquica en la base de datos de Supabase.

La arquitectura actual está optimizada para ser simple pero granular, basándose en el campo `department` de la tabla `profiles`.

## Pasos para el Administrador (IT Admin)

1. **Ingresa a tu proyecto en Supabase.**
2. Ve a la sección **Table Editor** en el menú izquierdo.
3. Selecciona la tabla **`profiles`**.
4. Verás la lista de todos los usuarios registrados en el sistema. Localiza la columna llamada **`department`**.

### Regla de Asignación

Para que un VP (ej. Vicepresidente de Ventas) vea las métricas de su gerente (ej. Gerente Regional) y del equipo de ese gerente (ej. Staff de Ventas), **todos ellos deben compartir exactamente el mismo texto en la columna `department`**.

**Ejemplo Práctico:**

Supongamos que tienes el departamento de "Operaciones Clínicas" (Clinical Operations).

| Email del Usuario | Rol (`role`) | Departamento (`department`) |
| :--- | :--- | :--- |
| vp.operaciones@siteflow.com | `vp` | `clinical_operations` |
| gerente.norte@siteflow.com | `manager` | `clinical_operations` |
| staff.analista1@siteflow.com| `staff` | `clinical_operations` |
| staff.analista2@siteflow.com| `staff` | `clinical_operations` |

*Al configurar la base de datos de esta manera:*
- Cuando **`vp.operaciones@siteflow.com`** inicie sesión, su Dashboard calculará automáticamente las horas totales, tareas y estadísticas de **todos** los usuarios que tengan `clinical_operations`. Él verá el progreso de `gerente.norte` y de todo el `staff`.
- Si tienes otro VP con el departamento `marketing`, él **no verá** los datos de `clinical_operations`.

### Recomendaciones Adicionales

* **Consistencia:** Asegúrate de escribir el nombre del departamento exactamente igual (respetando mayúsculas y minúsculas o preferiblemente usando solo minúsculas y guiones bajos como `ventas_directas`).
* **Seguridad (RLS):** Esta aplicación asume que las políticas de seguridad a nivel de fila (Row Level Security - RLS) en Supabase están configuradas para permitir que los usuarios con rol `vp` o `manager` puedan consultar las tablas `profiles` y `time_entries` filtrando por su propio `department`. Si experimentas problemas donde el dashboard sigue vacío a pesar de configurar el departamento, verifica las políticas RLS en Supabase SQL Editor.
