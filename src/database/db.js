/**
 * Módulo de Base de Datos - SQLite con better-sqlite3
 * Gestiona la creación, inicialización y operaciones CRUD en la BD local
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ruta de la base de datos
const dbPath = path.join(__dirname, "..", "..", "data", "ministracion.db");

// Asegurar que el directorio de datos existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Crear o abrir la base de datos
let db = null;

/**
 * Inicializa la base de datos y crea las tablas si no existen
 */
function initializeDatabase() {
  try {
    db = new Database(dbPath);

    // Crear tabla de personas si no existe
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS personas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        apellido TEXT NOT NULL,
        nombre TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'registrado'
      )
    `;

    db.exec(createTableSQL);
    console.log("Base de datos inicializada correctamente");
    return true;
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    return false;
  }
}

/**
 * Agrega una nueva persona a la base de datos
 * @param {string} apellido - Apellido de la persona
 * @param {string} nombre - Nombre de la persona
 * @returns {number} ID de la persona agregada
 */
function addPerson(apellido, nombre) {
  try {
    // Validar datos
    if (!apellido || !nombre) {
      throw new Error("El apellido y nombre son requeridos");
    }

    const trimmedApellido = apellido.trim();
    const trimmedNombre = nombre.trim();

    if (trimmedApellido.length === 0 || trimmedNombre.length === 0) {
      throw new Error("El apellido y nombre no pueden estar vacíos");
    }

    const insertSQL = `
      INSERT INTO personas (apellido, nombre)
      VALUES (?, ?)
    `;

    const stmt = db.prepare(insertSQL);
    const result = stmt.run(trimmedApellido, trimmedNombre);

    console.log(`Persona agregada: ${trimmedApellido}, ${trimmedNombre}`);
    return result.lastInsertRowid;
  } catch (error) {
    console.error("Error al agregar persona:", error);
    throw error;
  }
}

/**
 * Obtiene todas las personas registradas en la base de datos
 * @returns {Array} Array de objetos con datos de personas
 */
function getAllPeople() {
  try {
    const selectSQL = `
      SELECT id, apellido, nombre, fecha_registro, estado
      FROM personas
      ORDER BY fecha_registro DESC
    `;

    const stmt = db.prepare(selectSQL);
    const people = stmt.all();

    console.log(`Se obtuvieron ${people.length} personas`);
    return people;
  } catch (error) {
    console.error("Error al obtener personas:", error);
    throw error;
  }
}

/**
 * Obtiene una persona por ID
 * @param {number} id - ID de la persona
 * @returns {Object} Objeto con datos de la persona
 */
function getPersonById(id) {
  try {
    const selectSQL = `
      SELECT id, apellido, nombre, fecha_registro, estado
      FROM personas
      WHERE id = ?
    `;

    const stmt = db.prepare(selectSQL);
    return stmt.get(id);
  } catch (error) {
    console.error("Error al obtener persona:", error);
    throw error;
  }
}

/**
 * Actualiza el estado de una persona
 * @param {number} id - ID de la persona
 * @param {string} estado - Nuevo estado
 * @returns {boolean} Verdadero si se actualizó correctamente
 */
function updatePersonStatus(id, estado) {
  try {
    const updateSQL = `
      UPDATE personas
      SET estado = ?
      WHERE id = ?
    `;

    const stmt = db.prepare(updateSQL);
    const result = stmt.run(estado, id);

    return result.changes > 0;
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw error;
  }
}

// Exportar funciones
module.exports = {
  initializeDatabase,
  addPerson,
  getAllPeople,
  getPersonById,
  updatePersonStatus,
};
