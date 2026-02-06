/**
 * Preload Script - Puente seguro entre el contexto de Electron y el renderizador
 * Expone APIs seguras a través de contextBridge
 */

const { contextBridge, ipcRenderer } = require("electron");

// Exponer API segura al renderizador
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Agrega una nueva persona a la base de datos
   * @param {Object} personData - Datos de la persona { apellido, nombre }
   * @returns {Promise<Object>} Resultado de la operación
   */
  addPerson: (personData) => ipcRenderer.invoke("add-person", personData),

  /**
   * Obtiene todas las personas registradas
   * @returns {Promise<Object>} Lista de personas
   */
  getAllPeople: () => ipcRenderer.invoke("get-all-people"),
});
