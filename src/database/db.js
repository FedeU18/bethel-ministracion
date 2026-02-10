/**
 * Módulo de Base de Datos - SQLite con better-sqlite3
 * Gestiona la creación, inicialización y operaciones CRUD en la BD local
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

// Ruta de la base de datos en el directorio de datos de usuario
// Esto garantiza que funcione tanto en desarrollo como en producción
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "ministracion.db");

// Asegurar que el directorio de datos existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Crear o abrir la base de datos
let db = null;

/**
 * Agregá columnas faltantes a la tabla existente
 */
function addMissingColumns() {
  try {
    // Verificar e intentar agregar columna 'pastor'
    try {
      db.exec("SELECT pastor FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'pastor'...");
        db.exec("ALTER TABLE personas ADD COLUMN pastor TEXT");
      }
    }

    // Verificar e intentar agregar columna 'fecha_atencion'
    try {
      db.exec("SELECT fecha_atencion FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'fecha_atencion'...");
        db.exec("ALTER TABLE personas ADD COLUMN fecha_atencion DATETIME");
      }
    }

    // Verificar e intentar agregar columna 'estado' con valor por defecto
    try {
      db.exec("SELECT estado FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'estado'...");
        db.exec(
          "ALTER TABLE personas ADD COLUMN estado TEXT DEFAULT 'pendiente'",
        );
        // Actualizar registros existentes
        db.exec(
          "UPDATE personas SET estado = 'pendiente' WHERE estado IS NULL",
        );
      }
    }

    // Verificar e intentar agregar columna 'edad'
    try {
      db.exec("SELECT edad FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'edad'...");
        db.exec("ALTER TABLE personas ADD COLUMN edad INTEGER");
      }
    }

    // Verificar e intentar agregar columna 'lider'
    try {
      db.exec("SELECT lider FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'lider'...");
        db.exec("ALTER TABLE personas ADD COLUMN lider TEXT");
      }
    }

    // Verificar e intentar agregar columna 'coordinador'
    try {
      db.exec("SELECT coordinador FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'coordinador'...");
        db.exec("ALTER TABLE personas ADD COLUMN coordinador TEXT");
      }
    }

    // Verificar e intentar agregar columna 'tipo'
    try {
      db.exec("SELECT tipo FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columna 'tipo'...");
        db.exec("ALTER TABLE personas ADD COLUMN tipo TEXT DEFAULT 'hombre'");
      }
    }

    // Verificar e intentar agregar columnas para matrimonio
    try {
      db.exec("SELECT nombre_esposo FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columnas para matrimonio...");
        db.exec("ALTER TABLE personas ADD COLUMN apellido_esposo TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN nombre_esposo TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN edad_esposo INTEGER");
        db.exec("ALTER TABLE personas ADD COLUMN lider_esposo TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN apellido_esposa TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN nombre_esposa TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN edad_esposa INTEGER");
        db.exec("ALTER TABLE personas ADD COLUMN lider_esposa TEXT");
      }
    }

    // Verificar e intentar agregar apellidos de esposo/esposa (para bases existentes)
    try {
      db.exec("SELECT apellido_esposo FROM personas LIMIT 1");
    } catch (error) {
      if (error.message.includes("no such column")) {
        console.log("Agregando columnas de apellidos para matrimonio...");
        db.exec("ALTER TABLE personas ADD COLUMN apellido_esposo TEXT");
        db.exec("ALTER TABLE personas ADD COLUMN apellido_esposa TEXT");
      }
    }
  } catch (error) {
    console.warn("Aviso al agregar columnas:", error.message);
  }
}

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
        estado TEXT DEFAULT 'pendiente',
        pastor TEXT,
        fecha_atencion DATETIME
      )
    `;

    db.exec(createTableSQL);

    // Agregar columnas faltantes si es una tabla existente
    addMissingColumns();

    console.log("Base de datos inicializada correctamente");
    return true;
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    return false;
  }
}

/**
 * Agrega una nueva persona a la base de datos
 * @param {Object} personData - Datos de la persona
 * @returns {number} ID de la persona agregada
 */
function addPerson(personData) {
  try {
    const tipo = personData.tipo || "hombre";

    if (tipo === "matrimonio") {
      // Validar datos de matrimonio
      if (!personData.nombre_esposo || !personData.nombre_esposa) {
        throw new Error("Los nombres de esposo y esposa son requeridos");
      }

      const insertSQL = `
        INSERT INTO personas (
          tipo, apellido, nombre, apellido_esposo, nombre_esposo, edad_esposo, lider_esposo,
          apellido_esposa, nombre_esposa, edad_esposa, lider_esposa, coordinador, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
      `;

      const stmt = db.prepare(insertSQL);
      const result = stmt.run(
        "matrimonio",
        "Matrimonio",
        personData.nombre_esposo ? personData.nombre_esposo.trim() : "-",
        personData.apellido_esposo ? personData.apellido_esposo.trim() : null,
        personData.nombre_esposo.trim(),
        personData.edad_esposo || null,
        personData.lider_esposo ? personData.lider_esposo.trim() : null,
        personData.apellido_esposa ? personData.apellido_esposa.trim() : null,
        personData.nombre_esposa.trim(),
        personData.edad_esposa || null,
        personData.lider_esposa ? personData.lider_esposa.trim() : null,
        personData.coordinador ? personData.coordinador.trim() : null,
      );

      console.log(
        `Matrimonio agregado: ${personData.apellido_esposo || ""} ${personData.nombre_esposo} y ${personData.apellido_esposa || ""} ${personData.nombre_esposa} (ID: ${result.lastInsertRowid})`,
      );
      return result.lastInsertRowid;
    } else {
      // Validar datos para hombre/mujer
      if (!personData.apellido || !personData.nombre) {
        throw new Error("El apellido y nombre son requeridos");
      }

      const trimmedApellido = personData.apellido.trim();
      const trimmedNombre = personData.nombre.trim();

      if (trimmedApellido.length === 0 || trimmedNombre.length === 0) {
        throw new Error("El apellido y nombre no pueden estar vacíos");
      }

      const edad = personData.edad || null;
      const lider = personData.lider ? personData.lider.trim() : null;
      const coordinador = personData.coordinador
        ? personData.coordinador.trim()
        : null;

      const insertSQL = `
        INSERT INTO personas (tipo, apellido, nombre, edad, lider, coordinador, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
      `;

      const stmt = db.prepare(insertSQL);
      const result = stmt.run(
        tipo,
        trimmedApellido,
        trimmedNombre,
        edad,
        lider,
        coordinador,
      );

      console.log(
        `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} agregado: ${trimmedApellido}, ${trimmedNombre} (ID: ${result.lastInsertRowid})`,
      );
      return result.lastInsertRowid;
    }
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

/**
 * Asigna un pastor a una persona y cambia su estado a "atendido"
 * @param {number} id - ID de la persona
 * @param {string} pastor - Nombre del pastor
 * @returns {boolean} Verdadero si se actualizó correctamente
 */
function assignPastorAndAttend(id, pastor) {
  try {
    const updateSQL = `
      UPDATE personas
      SET pastor = ?, estado = 'atendido', fecha_atencion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const stmt = db.prepare(updateSQL);
    const result = stmt.run(pastor, id);

    return result.changes > 0;
  } catch (error) {
    console.error("Error al asignar pastor:", error);
    throw error;
  }
}

/**
 * Actualiza los datos de una persona
 * @param {number} id - ID de la persona
 * @param {Object} data - Objeto con los datos a actualizar
 * @returns {boolean} Verdadero si se actualizó correctamente
 */
function updatePerson(id, data) {
  try {
    const tipo = data.tipo || "hombre";

    if (tipo === "matrimonio") {
      // Actualizar matrimonio
      const updateSQL = `
        UPDATE personas
        SET apellido_esposo = ?, nombre_esposo = ?, edad_esposo = ?, lider_esposo = ?,
            apellido_esposa = ?, nombre_esposa = ?, edad_esposa = ?, lider_esposa = ?,
            coordinador = ?
        WHERE id = ?
      `;

      const stmt = db.prepare(updateSQL);
      const result = stmt.run(
        data.apellido_esposo ? data.apellido_esposo.trim() : null,
        data.nombre_esposo.trim(),
        data.edad_esposo || null,
        data.lider_esposo ? data.lider_esposo.trim() : null,
        data.apellido_esposa ? data.apellido_esposa.trim() : null,
        data.nombre_esposa.trim(),
        data.edad_esposa || null,
        data.lider_esposa ? data.lider_esposa.trim() : null,
        data.coordinador ? data.coordinador.trim() : null,
        id,
      );

      console.log(`Matrimonio actualizado (ID: ${id})`);
      return result.changes > 0;
    } else {
      // Actualizar hombre/mujer
      const updateSQL = `
        UPDATE personas
        SET apellido = ?, nombre = ?, edad = ?, lider = ?, coordinador = ?
        WHERE id = ?
      `;

      const stmt = db.prepare(updateSQL);
      const result = stmt.run(
        data.apellido.trim(),
        data.nombre.trim(),
        data.edad || null,
        data.lider ? data.lider.trim() : null,
        data.coordinador ? data.coordinador.trim() : null,
        id,
      );

      console.log(
        `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} actualizado (ID: ${id})`,
      );
      return result.changes > 0;
    }
  } catch (error) {
    console.error("Error al actualizar persona:", error);
    throw error;
  }
}

/**
 * Obtiene todas las personas con estado "pendiente"
 * @returns {Array} Array de personas pendientes
 */
function getPendingPeople() {
  try {
    const selectSQL = `
      SELECT id, tipo, apellido, nombre, edad, lider, coordinador,
             apellido_esposo, nombre_esposo, edad_esposo, lider_esposo,
             apellido_esposa, nombre_esposa, edad_esposa, lider_esposa,
             fecha_registro, estado, pastor
      FROM personas
      WHERE estado = 'pendiente'
      ORDER BY fecha_registro ASC
    `;

    const stmt = db.prepare(selectSQL);
    const people = stmt.all();

    // Convertir fechas a strings para evitar problemas de clonado en IPC
    return people.map((person) => ({
      ...person,
      fecha_registro:
        person.fecha_registro instanceof Date
          ? person.fecha_registro.toISOString()
          : person.fecha_registro,
    }));
  } catch (error) {
    console.error("Error al obtener personas pendientes:", error);
    throw error;
  }
}

/**
 * Obtiene todas las personas con estado "atendido"
 * @returns {Array} Array de personas atendidas
 */
function getAttendedPeople() {
  try {
    const selectSQL = `
      SELECT id, tipo, apellido, nombre, edad, lider, coordinador,
             apellido_esposo, nombre_esposo, edad_esposo, lider_esposo,
             apellido_esposa, nombre_esposa, edad_esposa, lider_esposa,
             fecha_registro, estado, pastor, fecha_atencion
      FROM personas
      WHERE estado = 'atendido'
      ORDER BY fecha_atencion DESC
    `;

    const stmt = db.prepare(selectSQL);
    const people = stmt.all();

    // Convertir fechas a strings para evitar problemas de clonado en IPC
    return people.map((person) => ({
      ...person,
      fecha_registro:
        person.fecha_registro instanceof Date
          ? person.fecha_registro.toISOString()
          : person.fecha_registro,
      fecha_atencion:
        person.fecha_atencion instanceof Date
          ? person.fecha_atencion.toISOString()
          : person.fecha_atencion,
    }));
  } catch (error) {
    console.error("Error al obtener personas atendidas:", error);
    throw error;
  }
}

/**
 * Elimina una persona de la base de datos
 * @param {number} id - ID de la persona a eliminar
 * @returns {boolean} Verdadero si se eliminó correctamente
 */
function deletePerson(id) {
  try {
    const deleteSQL = `
      DELETE FROM personas
      WHERE id = ?
    `;

    const stmt = db.prepare(deleteSQL);
    const result = stmt.run(id);

    if (result.changes > 0) {
      console.log(`Persona eliminada (ID: ${id})`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al eliminar persona:", error);
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
  assignPastorAndAttend,
  updatePerson,
  deletePerson,
  getPendingPeople,
  getAttendedPeople,
};
