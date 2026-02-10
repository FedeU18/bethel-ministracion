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
  assignPastorAndAttend,
  updatePerson,
  deletePerson,
  getPendingPeople,
  getAttendedPeople,
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
    const result = addPerson(personData);
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

// Obtener personas pendientes
ipcMain.handle("get-pending-people", async (event) => {
  try {
    const people = getPendingPeople();
    return { success: true, data: people };
  } catch (error) {
    console.error("Error al obtener personas pendientes:", error);
    return { success: false, error: error.message };
  }
});

// Obtener personas atendidas
ipcMain.handle("get-attended-people", async (event) => {
  try {
    const people = getAttendedPeople();
    return { success: true, data: people };
  } catch (error) {
    console.error("Error al obtener personas atendidas:", error);
    return { success: false, error: error.message };
  }
});

// Asignar pastor y marcar como atendido
ipcMain.handle("assign-pastor", async (event, { id, pastor }) => {
  try {
    const result = assignPastorAndAttend(id, pastor);
    if (result) {
      return { success: true };
    } else {
      return { success: false, error: "No se pudo actualizar el registro" };
    }
  } catch (error) {
    console.error("Error al asignar pastor:", error);
    return { success: false, error: error.message };
  }
});

// Actualizar datos de una persona
ipcMain.handle("update-person", async (event, { id, data }) => {
  try {
    const result = updatePerson(id, data);
    if (result) {
      return { success: true };
    } else {
      return { success: false, error: "No se pudo actualizar el registro" };
    }
  } catch (error) {
    console.error("Error al actualizar persona:", error);
    return { success: false, error: error.message };
  }
});

// Eliminar una persona
ipcMain.handle("delete-person", async (event, id) => {
  try {
    const result = deletePerson(id);
    if (result) {
      return { success: true };
    } else {
      return { success: false, error: "No se pudo eliminar el registro" };
    }
  } catch (error) {
    console.error("Error al eliminar persona:", error);
    return { success: false, error: error.message };
  }
});
