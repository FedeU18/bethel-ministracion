/**
 * Script del Renderizador - Lógica de la interfaz de usuario
 * Maneja eventos del formulario y actualizaciones de la UI
 */

// Variables globales
let formulario, mensajeEstado;
let modalRegistro, btnAbrirModal, btnCerrarModal, btnCancelar;
let listadoPendientes, btnRefrescarPendientes;
let listadoAtendidas, btnRefrescarAtendidas;
let modalPastor,
  selectorPastor,
  btnConfirmarAsignacion,
  btnCancelarAsignacion,
  btnCerrarModalAsignacion,
  mensajeAsignacion;
let personaEnAsignacion = null;

// ==============================================
// FUNCIONES DEL MODAL DE REGISTRO
// ==============================================

/**
 * Abre el modal de registro de persona
 */
function abrirModal() {
  modalRegistro.classList.add("active");
  formulario.reset();
}

/**
 * Cierra el modal de registro
 */
function cerrarModal() {
  modalRegistro.classList.remove("active");
  formulario.reset();
}

// ==============================================
// FUNCIONES UTILITARIAS
// ==============================================

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

// ==============================================
// FUNCIONES DE CARGA DE DATOS
// ==============================================

/**
 * Carga y muestra la lista de personas pendientes
 */
async function cargarPendientes() {
  try {
    listadoPendientes.innerHTML = '<p class="loading">Cargando...</p>';

    const resultado = await window.electronAPI.getPendingPeople();

    console.log("Resultado de getPendingPeople:", resultado);

    if (!resultado.success) {
      mostrarMensaje("listadoPendientes", "Error: " + resultado.error, "error");
      return;
    }

    const personas = resultado.data;

    console.log("Personas pendientes obtenidas:", personas);

    if (personas.length === 0) {
      listadoPendientes.innerHTML =
        '<p class="vacio">No hay personas pendientes</p>';
      return;
    }

    // Construir tabla con botones de acción
    let html =
      '<table class="tabla-personas"><thead><tr><th>#</th><th>Nombre Completo</th><th>Líder</th><th>Edad</th><th>Acción</th></tr></thead><tbody>';

    personas.forEach((persona) => {
      const nombreCompleto = `${persona.apellido}, ${persona.nombre}`;
      const lider = persona.lider || "-";
      const edad = persona.edad || "-";
      html += `
        <tr>
          <td>${persona.id}</td>
          <td>${escapeHtml(nombreCompleto)}</td>
          <td>${escapeHtml(lider)}</td>
          <td>${edad}</td>
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
      '<table class="tabla-personas"><thead><tr><th>#</th><th>Nombre Completo</th><th>Pastor</th><th>Fecha Atención</th></tr></thead><tbody>';

    personas.forEach((persona) => {
      const nombreCompleto = `${persona.apellido}, ${persona.nombre}`;
      const fecha = new Date(persona.fecha_atencion).toLocaleString("es-ES");
      html += `
        <tr>
          <td>${persona.id}</td>
          <td>${escapeHtml(nombreCompleto)}</td>
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

// ==============================================
// FUNCIONES DE ASIGNACIÓN DE PASTOR
// ==============================================

/**
 * Abre el modal de asignación de pastor
 * @param {number} id - ID de la persona
 * @param {string} apellido - Apellido
 * @param {string} nombre - Nombre
 */
function abrirAsignacion(id, apellido, nombre) {
  personaEnAsignacion = { id, apellido, nombre };
  modalPastor.classList.add("active");
  selectorPastor.value = "";
  selectorPastor.focus();
}

/**
 * Cierra el modal de asignación
 */
function cerrarAsignacionPastor() {
  personaEnAsignacion = null;
  modalPastor.classList.remove("active");
  mensajeAsignacion.textContent = "";
  mensajeAsignacion.className = "mensaje";
}

// ==============================================
// UTILIDADES
// ==============================================

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

// ==============================================
// INICIALIZACIÓN
// ==============================================

/**
 * Cargar datos cuando se inicia la aplicación
 */
document.addEventListener("DOMContentLoaded", () => {
  // Obtener referencias a todos los elementos del DOM
  formulario = document.getElementById("registroForm");
  mensajeEstado = document.getElementById("mensajeEstado");

  modalRegistro = document.getElementById("modalRegistro");
  btnAbrirModal = document.getElementById("btnAbrirModal");
  btnCerrarModal = document.getElementById("btnCerrarModal");
  btnCancelar = document.getElementById("btnCancelar");

  listadoPendientes = document.getElementById("listadoPendientes");
  btnRefrescarPendientes = document.getElementById("btnRefrescarPendientes");

  listadoAtendidas = document.getElementById("listadoAtendidas");
  btnRefrescarAtendidas = document.getElementById("btnRefrescarAtendidas");

  modalPastor = document.getElementById("modalAsignacion");
  selectorPastor = document.getElementById("selectorPastor");
  btnConfirmarAsignacion = document.getElementById("btnConfirmarAsignacion");
  btnCancelarAsignacion = document.getElementById("btnCancelarAsignacion");
  btnCerrarModalAsignacion = document.getElementById(
    "btnCerrarModalAsignacion",
  );
  mensajeAsignacion = document.getElementById("mensajeAsignacion");

  // Configurar event listeners del modal de registro
  btnAbrirModal.addEventListener("click", abrirModal);
  btnCerrarModal.addEventListener("click", cerrarModal);
  btnCancelar.addEventListener("click", cerrarModal);

  // Cerrar modal al hacer clic fuera del contenido
  modalRegistro.addEventListener("click", (e) => {
    if (e.target === modalRegistro) {
      cerrarModal();
    }
  });

  // Event listeners del modal de pastor
  btnCerrarModalAsignacion.addEventListener("click", cerrarAsignacionPastor);
  btnCancelarAsignacion.addEventListener("click", cerrarAsignacionPastor);

  // Cerrar modal al hacer clic fuera del contenido
  modalPastor.addEventListener("click", (e) => {
    if (e.target === modalPastor) {
      cerrarAsignacionPastor();
    }
  });

  // Event listeners de botones de actualización
  btnRefrescarPendientes.addEventListener("click", cargarPendientes);
  btnRefrescarAtendidas.addEventListener("click", cargarAtendidas);

  // Event listener del formulario de registro
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener valores del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const edad = document.getElementById("edad").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const lider = document.getElementById("lider").value.trim();
    const coordinador = document.getElementById("coordinador").value.trim();

    // Validación básica
    if (!apellido || !nombre) {
      mostrarMensaje(
        "mensajeEstado",
        "Por favor, completa al menos Nombre y Apellido",
        "error",
      );
      return;
    }

    try {
      // Deshabilitar botón durante la operación
      const boton = formulario.querySelector('button[type="submit"]');
      boton.disabled = true;

      // Preparar datos para enviar
      const personData = {
        apellido,
        nombre,
      };

      // Agregar campos opcionales solo si tienen valor
      if (edad) personData.edad = parseInt(edad);
      if (telefono) personData.telefono = telefono;
      if (dni) personData.dni = dni;
      if (lider) personData.lider = lider;
      if (coordinador) personData.coordinador = coordinador;

      // Llamar al API de Electron
      const resultado = await window.electronAPI.addPerson(personData);

      console.log("Resultado de addPerson:", resultado);

      if (resultado.success) {
        mostrarMensaje(
          "mensajeEstado",
          `✓ ${apellido}, ${nombre} registrado(a) correctamente`,
          "exito",
        );

        // Limpiar formulario y cerrar modal
        formulario.reset();
        cerrarModal();

        // Recargar listas
        console.log("Recargando lista de pendientes...");
        await cargarPendientes();
        console.log("Lista de pendientes recargada");
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

  // Event listener del botón de confirmación de asignación
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

        // Cerrar modal después de 2 segundos y recargar datos
        setTimeout(() => {
          cerrarAsignacionPastor();
          cargarPendientes();
          cargarAtendidas();
        }, 2000);
      } else {
        mostrarMensaje(
          "mensajeAsignacion",
          "Error: " + resultado.error,
          "error",
        );
      }

      btnConfirmarAsignacion.disabled = false;
    } catch (error) {
      console.error("Error al asignar pastor:", error);
      mostrarMensaje("mensajeAsignacion", "Error al asignar pastor", "error");
      btnConfirmarAsignacion.disabled = false;
    }
  });

  // Cargar datos iniciales
  cargarPendientes();
  cargarAtendidas();
});
