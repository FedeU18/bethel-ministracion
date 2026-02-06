/**
 * Script del Renderizador - Lógica de la interfaz de usuario
 * Maneja eventos del formulario y actualizaciones de la UI
 */

// Variables globales
const formulario = document.getElementById("registroForm");
const inputApellido = document.getElementById("apellido");
const inputNombre = document.getElementById("nombre");
const mensajeEstado = document.getElementById("mensajeEstado");
const listadoPersonas = document.getElementById("listadoPersonas");
const btnRefrescar = document.getElementById("btnRefrescar");

/**
 * Muestra un mensaje en la UI
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo: 'exito', 'error', 'info'
 */
function mostrarMensaje(mensaje, tipo = "info") {
  mensajeEstado.textContent = mensaje;
  mensajeEstado.className = `mensaje mensaje-${tipo}`;

  // Limpiar mensaje después de 4 segundos
  if (tipo === "exito") {
    setTimeout(() => {
      mensajeEstado.textContent = "";
      mensajeEstado.className = "mensaje";
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
      mostrarMensaje("Error al cargar personas: " + resultado.error, "error");
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
    mostrarMensaje("Error al cargar personas", "error");
  }
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
    mostrarMensaje("Por favor, completa todos los campos", "error");
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
        `✓ ${apellido}, ${nombre} registrado(a) correctamente`,
        "exito",
      );

      // Limpiar formulario
      formulario.reset();
      inputApellido.focus();

      // Recargar lista
      await cargarPersonas();
    } else {
      mostrarMensaje("Error al registrar: " + resultado.error, "error");
    }

    boton.disabled = false;
  } catch (error) {
    console.error("Error al registrar persona:", error);
    mostrarMensaje("Error al registrar persona", "error");
  }
});

/**
 * Manejador del botón refrescar
 */
btnRefrescar.addEventListener("click", cargarPersonas);

/**
 * Cargar personas cuando se inicia la aplicación
 */
document.addEventListener("DOMContentLoaded", () => {
  cargarPersonas();
});
