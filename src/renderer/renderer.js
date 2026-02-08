/**
 * Script del Renderizador - Lógica de la interfaz de usuario
 * Maneja eventos del formulario y actualizaciones de la UI
 */

// Variables globales
const formulario = document.getElementById("registroForm");
const inputApellido = document.getElementById("apellido");
const inputNombre = document.getElementById("nombre");
const mensajeEstado = document.getElementById("mensajeEstado");

// Elementos para pendientes
const listadoPendientes = document.getElementById("listadoPendientes");
const btnRefrescarPendientes = document.getElementById(
  "btnRefrescarPendientes",
);

// Elementos para atendidas
const listadoAtendidas = document.getElementById("listadoAtendidas");
const btnRefrescarAtendidas = document.getElementById("btnRefrescarAtendidas");

// Elementos para asignación de pastor
const formularioAsignacion = document.getElementById("formularioAsignacion");
const selectorPastor = document.getElementById("selectorPastor");
const btnConfirmarAsignacion = document.getElementById(
  "btnConfirmarAsignacion",
);
const btnCancelarAsignacion = document.getElementById("btnCancelarAsignacion");
const mensajeAsignacion = document.getElementById("mensajeAsignacion");

let personaEnAsignacion = null;

/**
 * Muestra un mensaje en la UI
 * @param {string} elementoId - ID del elemento donde mostrar el mensaje
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo: 'exito', 'error', 'info'
 */
function mostrarMensaje(elementoId, mensaje, tipo = "info") {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  elemento.textContent = mensaje;
  elemento.className = `mensaje mensaje-${tipo}`;

  // Limpiar mensaje después de 4 segundos
  if (tipo === "exito") {
    setTimeout(() => {
      elemento.textContent = "";
      elemento.className = "mensaje";
    }, 4000);
  }
}

/**
 * Carga y muestra la lista de personas registradas
 */
async function cargarPersonas() {
  try {
    listadoPersonas.innerHTML = '<p class="loading">Cargando...</p>';

    const resultado = await window.electronAPI.getAllPeople();

    if (!resultado.success) {
      mostrarMensaje(
        "mensajeEstado",
        "Error al cargar personas: " + resultado.error,
        "error",
      );
      listadoPersonas.innerHTML = '<p class="error">Error al cargar datos</p>';
      return;
    }

    const personas = resultado.data;

    if (personas.length === 0) {
      listadoPersonas.innerHTML =
        '<p class="vacio">No hay personas registradas aún</p>';
      return;
    }

    // Construir HTML de la lista
    let html =
      '<table class="tabla-personas"><thead><tr><th>#</th><th>Apellido</th><th>Nombre</th><th>Fecha/Hora</th><th>Estado</th></tr></thead><tbody>';

    personas.forEach((persona, index) => {
      const fecha = new Date(persona.fecha_registro).toLocaleString("es-ES");
      html += `
        <tr>
          <td>${persona.id}</td>
          <td>${escapeHtml(persona.apellido)}</td>
          <td>${escapeHtml(persona.nombre)}</td>
          <td>${fecha}</td>
          <td><span class="estado estado-${persona.estado}">${persona.estado}</span></td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    listadoPersonas.innerHTML = html;
  } catch (error) {
    console.error("Error al cargar personas:", error);
    mostrarMensaje("mensajeEstado", "Error al cargar personas", "error");
  }
}

/**
 * Carga y muestra la lista de personas pendientes
 */
async function cargarPendientes() {
  try {
    listadoPendientes.innerHTML = '<p class="loading">Cargando...</p>';

    const resultado = await window.electronAPI.getPendingPeople();

    if (!resultado.success) {
      mostrarMensaje("listadoPendientes", "Error: " + resultado.error, "error");
      return;
    }

    const personas = resultado.data;

    if (personas.length === 0) {
      listadoPendientes.innerHTML =
        '<p class="vacio">No hay personas pendientes</p>';
      return;
    }

    // Construir tabla con botones de acción
    let html =
      '<table class="tabla-personas"><thead><tr><th>#</th><th>Apellido</th><th>Nombre</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>';

    personas.forEach((persona) => {
      const fecha = new Date(persona.fecha_registro).toLocaleString("es-ES");
      html += `
        <tr>
          <td>${persona.id}</td>
          <td>${escapeHtml(persona.apellido)}</td>
          <td>${escapeHtml(persona.nombre)}</td>
          <td>${fecha}</td>
          <td>
            <button class="btn btn-asignar" onclick="abrirAsignacion(${persona.id}, '${escapeHtml(persona.apellido)}', '${escapeHtml(persona.nombre)}')">
              Asignar Pastor
            </button>
          </td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    listadoPendientes.innerHTML = html;
  } catch (error) {
    console.error("Error al cargar pendientes:", error);
    mostrarMensaje("listadoPendientes", "Error al cargar datos", "error");
  }
}

/**
 * Carga y muestra la lista de personas atendidas
 */
async function cargarAtendidas() {
  try {
    listadoAtendidas.innerHTML = '<p class="loading">Cargando...</p>';

    const resultado = await window.electronAPI.getAttendedPeople();

    if (!resultado.success) {
      mostrarMensaje("listadoAtendidas", "Error: " + resultado.error, "error");
      return;
    }

    const personas = resultado.data;

    if (personas.length === 0) {
      listadoAtendidas.innerHTML =
        '<p class="vacio">No hay personas atendidas aún</p>';
      return;
    }

    // Construir tabla
    let html =
      '<table class="tabla-personas"><thead><tr><th>#</th><th>Apellido</th><th>Nombre</th><th>Pastor</th><th>Fecha Atención</th></tr></thead><tbody>';

    personas.forEach((persona) => {
      const fecha = new Date(persona.fecha_atencion).toLocaleString("es-ES");
      html += `
        <tr>
          <td>${persona.id}</td>
          <td>${escapeHtml(persona.apellido)}</td>
          <td>${escapeHtml(persona.nombre)}</td>
          <td>${escapeHtml(persona.pastor || "N/A")}</td>
          <td>${fecha}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    listadoAtendidas.innerHTML = html;
  } catch (error) {
    console.error("Error al cargar atendidas:", error);
    mostrarMensaje("listadoAtendidas", "Error al cargar datos", "error");
  }
}

/**
 * Abre el formulario de asignación de pastor
 * @param {number} id - ID de la persona
 * @param {string} apellido - Apellido
 * @param {string} nombre - Nombre
 */
function abrirAsignacion(id, apellido, nombre) {
  personaEnAsignacion = { id, apellido, nombre };
  formularioAsignacion.style.display = "block";
  selectorPastor.value = "";
  selectorPastor.focus();
}

/**
 * Cierra el formulario de asignación
 */
function cerrarAsignacion() {
  personaEnAsignacion = null;
  formularioAsignacion.style.display = "none";
  mensajeAsignacion.textContent = "";
  mensajeAsignacion.className = "mensaje";
}

/**
 * Escapa caracteres HTML para prevenir inyecciones
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Manejador del envío del formulario
 */
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apellido = inputApellido.value.trim();
  const nombre = inputNombre.value.trim();

  // Validación básica
  if (!apellido || !nombre) {
    mostrarMensaje(
      "mensajeEstado",
      "Por favor, completa todos los campos",
      "error",
    );
    return;
  }

  try {
    // Deshabilitar botón durante la operación
    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;

    // Llamar al API de Electron
    const resultado = await window.electronAPI.addPerson({ apellido, nombre });

    if (resultado.success) {
      mostrarMensaje(
        "mensajeEstado",
        `✓ ${apellido}, ${nombre} registrado(a) correctamente`,
        "exito",
      );

      // Limpiar formulario
      formulario.reset();
      inputApellido.focus();

      // Recargar listas
      await cargarPendientes();
    } else {
      mostrarMensaje(
        "mensajeEstado",
        "Error al registrar: " + resultado.error,
        "error",
      );
    }

    boton.disabled = false;
  } catch (error) {
    console.error("Error al registrar persona:", error);
    mostrarMensaje("mensajeEstado", "Error al registrar persona", "error");
  }
});

/**
 * Manejador de confirmación de asignación de pastor
 */
btnConfirmarAsignacion.addEventListener("click", async () => {
  if (!personaEnAsignacion) {
    mostrarMensaje(
      "mensajeAsignacion",
      "Error: No se seleccionó persona",
      "error",
    );
    return;
  }

  const pastor = selectorPastor.value.trim();
  if (!pastor) {
    mostrarMensaje(
      "mensajeAsignacion",
      "Por favor, selecciona un pastor",
      "error",
    );
    return;
  }

  try {
    btnConfirmarAsignacion.disabled = true;

    const resultado = await window.electronAPI.assignPastor(
      personaEnAsignacion.id,
      pastor,
    );

    if (resultado.success) {
      mostrarMensaje(
        "mensajeAsignacion",
        `✓ ${personaEnAsignacion.apellido}, ${personaEnAsignacion.nombre} asignado(a) a ${pastor}`,
        "exito",
      );

      // Cerrar formulario después de 2 segundos
      setTimeout(() => {
        cerrarAsignacion();
        cargarPendientes();
        cargarAtendidas();
      }, 2000);
    } else {
      mostrarMensaje("mensajeAsignacion", "Error: " + resultado.error, "error");
    }

    btnConfirmarAsignacion.disabled = false;
  } catch (error) {
    console.error("Error al asignar pastor:", error);
    mostrarMensaje("mensajeAsignacion", "Error al asignar pastor", "error");
    btnConfirmarAsignacion.disabled = false;
  }
});

/**
 * Manejador de cancelación de asignación
 */
btnCancelarAsignacion.addEventListener("click", cerrarAsignacion);

/**
 * Manejadores de botones de actualización
 */
btnRefrescarPendientes.addEventListener("click", cargarPendientes);
btnRefrescarAtendidas.addEventListener("click", cargarAtendidas);

/**
 * Cargar datos cuando se inicia la aplicación
 */
document.addEventListener("DOMContentLoaded", () => {
  cargarPendientes();
  cargarAtendidas();
});
