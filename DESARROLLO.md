## 🔧 Guía de Desarrollo

### Estructura de Archivos

#### `/src/main/main.js`

- Archivo principal de Electron que maneja el proceso principal
- Crea la ventana de la aplicación
- Configura los IPC handlers para comunicación con el renderer
- Inicia la base de datos

#### `/src/main/preload.js`

- Script de preload que expone APIs seguras
- Usa contextBridge para evitar exponer Node.js directamente
- Define las funciones disponibles para el renderer

#### `/src/renderer/index.html`

- Interfaz principal de la aplicación
- Formulario para registrar nuevas personas
- Tabla que lista todas las personas registradas

#### `/src/renderer/renderer.js`

- Lógica del frontend/UI
- Maneja eventos del formulario
- Comunica con el proceso principal mediante IPC
- Actualiza la interfaz con datos de la BD

#### `/src/renderer/styles.css`

- Estilos CSS de la aplicación
- Diseño responsivo
- Colores y animaciones

#### `/src/database/db.js`

- Módulo SQLite con better-sqlite3
- Funciones CRUD para la tabla "personas"
- Inicialización automática de la BD

### Flujo de Datos

```
Renderer (HTML/CSS/JS)
        ↓
contextBridge (electronAPI)
        ↓
IPC Main (/src/main/main.js)
        ↓
Database (/src/database/db.js)
        ↓
SQLite (/data/ministracion.db)
```

### Agregar Nuevas Funcionalidades

#### 1. Agregar un nuevo campo a la tabla

1. Modifica el SQL en `db.js`:

```javascript
CREATE TABLE IF NOT EXISTS personas (
  ...
  tu_nuevo_campo TEXT,
  ...
)
```

2. Añade una función en `db.js`:

```javascript
function updatePersonField(id, newValue) {
  const updateSQL = `UPDATE personas SET tu_campo = ? WHERE id = ?`;
  const stmt = db.prepare(updateSQL);
  return stmt.run(newValue, id);
}
module.exports = { ..., updatePersonField }
```

3. Añade un IPC handler en `main.js`:

```javascript
ipcMain.handle("update-person-field", async (event, id, value) => {
  try {
    const result = updatePersonField(id, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

4. Expón la función en `preload.js`:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  ...
  updatePersonField: (id, value) =>
    ipcRenderer.invoke('update-person-field', id, value)
});
```

5. Usa en `renderer.js`:

```javascript
const resultado = await window.electronAPI.updatePersonField(id, newValue);
```

### Modo Desarrollo

Para activar DevTools (útil para debugging):

En `src/main/main.js`, descomenta:

```javascript
mainWindow.webContents.openDevTools();
```

Luego ejecuta:

```bash
npm run dev
```

### Comandos Disponibles

```bash
# Ejecutar la aplicación
npm start

# Ejecutar en modo desarrollo (con logs)
npm run dev

# Instalar dependencias
npm install

# Actualizar dependencias
npm update
```

### Buenas Prácticas

1. **Seguridad**
   - Nunca habilites nodeIntegration
   - Siempre usa contextBridge
   - Valida datos en el renderer y en main

2. **Rendimiento**
   - Usa mejor-sqlite3 (sincrónico) para operaciones locales
   - No hagas operaciones pesadas en el renderer thread

3. **Mantenimiento**
   - Comenta el código
   - Usa nombres descriptivos
   - Separa responsabilidades (DB, UI, lógica)

### Deployar/Compilar

Para crear un ejecutable .exe (futuro):

1. Instala electron-builder:

```bash
npm install --save-dev electron-builder
```

2. Añade a package.json:

```json
"build": {
  "appId": "com.bethel.ministracion",
  "files": ["src/**/*", "node_modules/**/*"],
  "win": {
    "target": ["nsis", "portable"]
  }
}
```

3. Ejecuta:

```bash
npm run build
```

---

**Última actualización**: 6 de febrero de 2026
