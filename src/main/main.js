/**
 * Archivo principal de Electron - Proceso Principal
 * Gestiona la ventana de la aplicación y eventos del sistema
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  initializeDatabase,
  addPerson,
  getAllPeople,
} = require("../database/db");

// Variable global para mantener la referencia a la ventana
let mainWindow;

/**
 * Crea la ventana principal de la aplicación
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Cargar el archivo HTML
  const startUrl = path.join(__dirname, "..", "renderer", "index.html");
  mainWindow.loadFile(startUrl);

  // Abrir DevTools en modo desarrollo (comentar para producción)
  // mainWindow.webContents.openDevTools();

  // Evento cuando se cierra la ventana
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

/**
 * Evento cuando Electron termina de inicializarse
 */
app.on("ready", () => {
  // Inicializar la base de datos
  initializeDatabase();

  // Crear la ventana principal
  createWindow();
});

/**
 * Cerrar la aplicación cuando se cierren todas las ventanas (en Windows)
 */
app.on("window-all-closed", function () {
  // En macOS, las aplicaciones permanecen activas hasta que el usuario las cierre explícitamente
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Cuando se activa la aplicación nuevamente (macOS)
 */
app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * IPC Handlers - Comunicación entre el renderer y el proceso principal
 */

// Agregar una nueva persona a la base de datos
ipcMain.handle("add-person", async (event, personData) => {
  try {
    const result = addPerson(personData.apellido, personData.nombre);
    return { success: true, id: result };
  } catch (error) {
    console.error("Error al agregar persona:", error);
    return { success: false, error: error.message };
  }
});

// Obtener todas las personas de la base de datos
ipcMain.handle("get-all-people", async (event) => {
  try {
    const people = getAllPeople();
    return { success: true, data: people };
  } catch (error) {
    console.error("Error al obtener personas:", error);
    return { success: false, error: error.message };
  }
});
