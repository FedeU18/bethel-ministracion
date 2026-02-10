/**
 * Script del Renderizador - Lógica de la interfaz de usuario
 * Maneja eventos del formulario y actualizaciones de la UI
 */

// Variables globales
let listadoPendientes, btnRefrescarPendientes;
let listadoAtendidas, btnRefrescarAtendidas;
let inputBusqueda;
let modalPastor,
  selectorPastor,
  btnConfirmarAsignacion,
  btnCancelarAsignacion,
  btnCerrarModalAsignacion,
  mensajeAsignacion;
let modalEdicion,
  formEdicion,
  contenidoEdicion,
  mensajeEdicion,
  btnCerrarModalEdicion;
let personaEnAsignacion = null;
let personaEnEdicion = null;
let filtroActivo = "todos";
let datosPendientes = [];
let datosAtendidas = [];

// ==============================================
// FUNCIONES DE DEBUGGING (expuestas en window)
// ==============================================

/**
 * Inspecciona el estado actual del DOM y modales
 * Uso: window.inspeccionarUI()
 */
window.inspeccionarUI = function () {
  const modalesActivos = document.querySelectorAll(".modal.active");
  const overlaysVisibles = Array.from(
    document.querySelectorAll(".modal-overlay"),
  ).filter((o) => window.getComputedStyle(o.parentElement).display !== "none");

  // Inspeccionar TODOS los inputs en TODOS los modales
  const todosLosInputs = document.querySelectorAll(
    ".modal input, .modal select, .modal textarea",
  );
  let inputsConProblemas = [];

  todosLosInputs.forEach((input, i) => {
    const estado = {
      index: i,
      id: input.id || `sin-id-${i}`,
      modalPadre: input.closest(".modal")?.id || "desconocido",
      modalActivo: input.closest(".modal")?.classList.contains("active"),
      disabled: input.disabled,
      readOnly: input.readOnly,
      hasDisabledAttr: input.hasAttribute("disabled"),
      hasReadonlyAttr: input.hasAttribute("readonly"),
      tabIndex: input.tabIndex,
      pointerEvents: window.getComputedStyle(input).pointerEvents,
      display: window.getComputedStyle(input).display,
      visibility: window.getComputedStyle(input).visibility,
    };

    if (
      estado.disabled ||
      estado.readOnly ||
      estado.hasDisabledAttr ||
      estado.hasReadonlyAttr
    ) {
      inputsConProblemas.push(estado);
    }
  });

  const resumen = {
    modalesActivos: modalesActivos.length,
    overlaysVisibles: overlaysVisibles.length,
    activeElement:
      document.activeElement.tagName +
      (document.activeElement.id ? `#${document.activeElement.id}` : ""),
    personaEnEdicion: personaEnEdicion?.id || null,
    personaEnAsignacion: personaEnAsignacion?.id || null,
    totalInputs: todosLosInputs.length,
    inputsConProblemas: inputsConProblemas.length,
  };

  console.table(resumen);

  if (modalesActivos.length > 0) {
    console.warn(
      "⚠️ Modales activos:",
      Array.from(modalesActivos).map((m) => m.id),
    );
  }
  if (overlaysVisibles.length > 1) {
    console.error(
      "⚠️ PROBLEMA: Múltiples overlays visibles:",
      overlaysVisibles.length,
    );
  }
  if (inputsConProblemas.length > 0) {
    console.error("⚠️ INPUTS CON PROBLEMAS:");
    console.table(inputsConProblemas);
  }

  return { resumen, inputsConProblemas };
};

// ==============================================
// FUNCIONES DE MODALES
// ==============================================

/**
 * Abre un modal específico
 */
function abrirModal(modalId) {
  console.log(`[MODAL] Abriendo: ${modalId}`);
  personaEnEdicion = null;

  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    const form = modal.querySelector("form");
    if (form) {
      form.reset();

      // Verificar estado de los inputs
      const inputs = form.querySelectorAll("input, select, textarea");
      console.log(`[MODAL] Total inputs en formulario: ${inputs.length}`);

      inputs.forEach((input, i) => {
        const estado = {
          index: i,
          id: input.id,
          disabled: input.disabled,
          readOnly: input.readOnly,
          hasDisabledAttr: input.hasAttribute("disabled"),
          hasReadonlyAttr: input.hasAttribute("readonly"),
          tabIndex: input.tabIndex,
          computedPointerEvents: window.getComputedStyle(input).pointerEvents,
          computedDisplay: window.getComputedStyle(input).display,
        };

        if (
          estado.disabled ||
          estado.readOnly ||
          estado.hasDisabledAttr ||
          estado.hasReadonlyAttr
        ) {
          console.error(
            `[MODAL] ⚠️ Input ${i} (${input.id}) tiene problemas:`,
            estado,
          );
        }

        // Forzar habilitación
        input.disabled = false;
        input.readOnly = false;
        input.removeAttribute("disabled");
        input.removeAttribute("readonly");
      });

      // Configurar focus trapping
      setupFocusTrap(modal);

      // Focus en primer input
      const firstInput = form.querySelector(
        "input:not([type='hidden']), select, textarea",
      );
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
          console.log(
            `[MODAL] Focus puesto en: ${firstInput.id || "unnamed"}, activo: ${document.activeElement.id}`,
          );
        }, 100);
      }
    }
  }
}

/**
 * Cierra un modal específico
 */
function cerrarModal(modalId) {
  console.log(`[MODAL] Cerrando: ${modalId}`);
  const modal = document.getElementById(modalId);
  if (modal) {
    // Remover focus trap
    removeFocusTrap(modal);

    modal.classList.remove("active");
    const form = modal.querySelector("form");
    if (form) {
      form.reset();

      // Verificar si quedan inputs con problemas
      const inputs = form.querySelectorAll("input, select, textarea");
      let problemasDetectados = 0;
      inputs.forEach((input) => {
        if (input.disabled || input.readOnly) {
          console.warn(
            `[MODAL] Al cerrar, input ${input.id} está: disabled=${input.disabled}, readOnly=${input.readOnly}`,
          );
          problemasDetectados++;
        }
      });

      if (problemasDetectados > 0) {
        console.error(
          `[MODAL] ⚠️ ${problemasDetectados} inputs con problemas al cerrar ${modalId}`,
        );
      }
    }

    // Restaurar foco al input de búsqueda si está disponible
    setTimeout(() => {
      if (inputBusqueda && document.activeElement === document.body) {
        inputBusqueda.focus();
        console.log("[MODAL] Foco restaurado al input de búsqueda");
      }
    }, 50);
  }
}

// ==============================================
// FUNCIONES UTILITARIAS
// ==============================================

/**
 * Configura el focus trap para un modal
 * Hace que Tab solo cicle entre elementos del modal
 */
function setupFocusTrap(modal) {
  if (!modal) return;

  // Remover listener previo si existe
  removeFocusTrap(modal);

  const focusableElements = modal.querySelectorAll(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  // Si no hay elementos focusables, no configurar el trap
  if (focusableElements.length === 0) {
    console.warn(`[FOCUS-TRAP] No hay elementos focusables en ${modal.id}`);
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  // Guardar referencia al handler para poder removerlo después
  modal._focusTrapHandler = handleTabKey;
  modal.addEventListener("keydown", handleTabKey);

  console.log(
    `[FOCUS-TRAP] Configurado para ${modal.id} con ${focusableElements.length} elementos`,
  );
}

/**
 * Remueve el focus trap de un modal
 */
function removeFocusTrap(modal) {
  if (!modal) return;

  if (modal._focusTrapHandler) {
    modal.removeEventListener("keydown", modal._focusTrapHandler);
    delete modal._focusTrapHandler;
    console.log(`[FOCUS-TRAP] Removido de ${modal.id}`);
  }
}

/**
 * Muestra un mensaje en la UI
 */
function mostrarMensaje(elementoId, mensaje, tipo = "info") {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  elemento.textContent = mensaje;
  elemento.className = `mensaje mensaje-${tipo}`;

  if (tipo === "exito") {
    setTimeout(() => {
      elemento.textContent = "";
      elemento.className = "mensaje";
    }, 4000);
  }
}

/**
 * Escapa caracteres HTML para prevenir inyecciones
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==============================================
// FUNCIONES DE CARGA DE DATOS
// ==============================================

/**
 * Carga datos desde la BD
 */
/**
 * Recarga todos los datos desde la base de datos
 * SIEMPRE consulta la BD, no usa datos en memoria
 */
async function reloadData() {
  try {
    const [resPendientes, resAtendidas] = await Promise.all([
      window.electronAPI.getPendingPeople(),
      window.electronAPI.getAttendedPeople(),
    ]);

    if (resPendientes.success) {
      datosPendientes = resPendientes.data;
    }
    if (resAtendidas.success) {
      datosAtendidas = resAtendidas.data;
    }

    inputBusqueda.value = "";
    aplicarBusqueda();
  } catch (error) {
    console.error("Error al recargar datos:", error);
  }
}

/**
 * Carga datos iniciales (alias de reloadData para compatibilidad)
 */
async function cargarDatos() {
  await reloadData();
}

/**
 * Aplica filtros y muestra datos
 */
function aplicarFiltros() {
  let pendientesFiltrados = datosPendientes;
  let atendidosFiltrados = datosAtendidas;

  if (filtroActivo !== "todos") {
    pendientesFiltrados = datosPendientes.filter(
      (p) => p.tipo === filtroActivo,
    );
    atendidosFiltrados = datosAtendidas.filter((p) => p.tipo === filtroActivo);
  }

  mostrarPendientes(pendientesFiltrados);
  mostrarAtendidas(atendidosFiltrados);
}

/**
 * Muestra lista de personas pendientes
 */
function mostrarPendientes(personas) {
  if (personas.length === 0) {
    listadoPendientes.innerHTML =
      '<p class="vacio">No hay personas pendientes</p>';
    return;
  }

  let html =
    '<table class="tabla-personas"><thead><tr><th>#</th><th>Tipo</th><th>Datos</th><th>Acciones</th></tr></thead><tbody>';

  personas.forEach((persona) => {
    const datosPersona = formatearDatosPersona(persona);
    html += `
      <tr>
        <td>${persona.id}</td>
        <td>${formatearTipo(persona.tipo)}</td>
        <td>${datosPersona}</td>
        <td>
          <button class="btn btn-editar" onclick="abrirEdicion(${persona.id})">
            Editar
          </button>
          <button class="btn btn-asignar" onclick="abrirAsignacion(${persona.id}, '${escapeHtml(datosPersona)}')">
            Asignar Pastor
          </button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  listadoPendientes.innerHTML = html;
}

/**
 * Muestra lista de personas atendidas
 */
function mostrarAtendidas(personas) {
  if (personas.length === 0) {
    listadoAtendidas.innerHTML =
      '<p class="vacio">No hay personas atendidas aún</p>';
    return;
  }

  let html =
    '<table class="tabla-personas"><thead><tr><th>#</th><th>Tipo</th><th>Datos</th><th>Pastor</th><th>Fecha</th></tr></thead><tbody>';

  personas.forEach((persona) => {
    const datosPersona = formatearDatosPersona(persona);
    const fecha = new Date(persona.fecha_atencion).toLocaleString("es-ES");
    html += `
      <tr>
        <td>${persona.id}</td>
        <td>${formatearTipo(persona.tipo)}</td>
        <td>${datosPersona}</td>
        <td>${escapeHtml(persona.pastor || "N/A")}</td>
        <td>${fecha}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  listadoAtendidas.innerHTML = html;
}

/**
 * Formatea los datos de una persona según su tipo
 */
function formatearDatosPersona(persona) {
  const tipo = persona.tipo || "hombre";

  if (tipo === "matrimonio") {
    const apellidoEsposo = persona.apellido_esposo
      ? ` ${persona.apellido_esposo}`
      : "";
    const apellidoEsposa = persona.apellido_esposa
      ? ` ${persona.apellido_esposa}`
      : "";
    const esposo = `${persona.nombre_esposo || "?"}${apellidoEsposo}`;
    const esposa = `${persona.nombre_esposa || "?"}${apellidoEsposa}`;
    const coordinador = persona.coordinador || "-";
    return `${esposo} y ${esposa} | Coord: ${coordinador}`;
  } else {
    const nombreCompleto = `${persona.apellido || "?"}, ${persona.nombre || "?"}`;
    const edad = persona.edad ? `${persona.edad} años` : "-";
    const lider = persona.lider || "-";
    return `${nombreCompleto} | Edad: ${edad} | Líder: ${lider}`;
  }
}

/**
 * Formatea el tipo para mostrar
 */
function formatearTipo(tipo) {
  const tipos = {
    hombre: "👨 Hombre",
    mujer: "👩 Mujer",
    matrimonio: "💑 Matrimonio",
  };
  return tipos[tipo] || tipo;
}

// ==============================================
// FUNCIONES DE ASIGNACIÓN DE PASTOR
// ==============================================

/**
 * Abre el modal de asignación de pastor
 */
function abrirAsignacion(id, descripcion) {
  personaEnAsignacion = { id, descripcion };
  modalPastor.classList.add("active");
  selectorPastor.value = "";

  // Configurar focus trap
  setupFocusTrap(modalPastor);

  // Focus en selector
  setTimeout(() => {
    selectorPastor.focus();
  }, 100);
}

/**
 * Cierra el modal de asignación
 */
/**
 * Cierra el modal de asignación
 */
function cerrarAsignacionPastor() {
  console.log("[MODAL] Cerrando asignación");

  // Remover focus trap
  removeFocusTrap(modalPastor);

  personaEnAsignacion = null;
  modalPastor.classList.remove("active");
  if (selectorPastor) selectorPastor.value = "";
  mensajeAsignacion.textContent = "";
  mensajeAsignacion.className = "mensaje";

  // Restaurar foco
  setTimeout(() => {
    if (inputBusqueda && document.activeElement === document.body) {
      inputBusqueda.focus();
    }
  }, 50);
}

/**
 * Abre el modal de edición con los datos de una persona
 */
async function abrirEdicion(id) {
  const persona = datosPendientes.find((p) => p.id === id);
  if (!persona) {
    mostrarMensaje("mensajeEdicion", "Error: Persona no encontrada", "error");
    return;
  }

  personaEnEdicion = persona;
  const tipo = persona.tipo;

  // Construir formulario según tipo
  let html = "";

  if (tipo === "matrimonio") {
    html = `
      <h3>Datos del Esposo</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="editNombreEsposo">Nombre Esposo *</label>
          <input type="text" id="editNombreEsposo" name="nombre_esposo" value="${escapeHtml(persona.nombre_esposo || "")}" required />
        </div>
        <div class="form-group">
          <label for="editApellidoEsposo">Apellido Esposo</label>
          <input type="text" id="editApellidoEsposo" name="apellido_esposo" value="${escapeHtml(persona.apellido_esposo || "")}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="editEdadEsposo">Edad Esposo</label>
          <input type="number" id="editEdadEsposo" name="edad_esposo" value="${persona.edad_esposo || ""}" min="1" max="120" />
        </div>
        <div class="form-group">
          <label for="editLiderEsposo">Líder Esposo</label>
          <input type="text" id="editLiderEsposo" name="lider_esposo" value="${escapeHtml(persona.lider_esposo || "")}" />
        </div>
      </div>

      <h3>Datos de la Esposa</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="editNombreEsposa">Nombre Esposa *</label>
          <input type="text" id="editNombreEsposa" name="nombre_esposa" value="${escapeHtml(persona.nombre_esposa || "")}" required />
        </div>
        <div class="form-group">
          <label for="editApellidoEsposa">Apellido Esposa</label>
          <input type="text" id="editApellidoEsposa" name="apellido_esposa" value="${escapeHtml(persona.apellido_esposa || "")}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="editEdadEsposa">Edad Esposa</label>
          <input type="number" id="editEdadEsposa" name="edad_esposa" value="${persona.edad_esposa || ""}" min="1" max="120" />
        </div>
        <div class="form-group">
          <label for="editLiderEsposa">Líder Esposa</label>
          <input type="text" id="editLiderEsposa" name="lider_esposa" value="${escapeHtml(persona.lider_esposa || "")}" />
        </div>
      </div>

      <h3>Datos Comunes</h3>
      <div class="form-group">
        <label for="editCoordinadorMatrimonio">Coordinador</label>
        <input type="text" id="editCoordinadorMatrimonio" name="coordinador" value="${escapeHtml(persona.coordinador || "")}" />
      </div>
    `;
  } else {
    // Hombre o Mujer
    html = `
      <div class="form-row">
        <div class="form-group">
          <label for="editNombre">Nombre *</label>
          <input type="text" id="editNombre" name="nombre" value="${escapeHtml(persona.nombre || "")}" required />
        </div>
        <div class="form-group">
          <label for="editApellido">Apellido *</label>
          <input type="text" id="editApellido" name="apellido" value="${escapeHtml(persona.apellido || "")}" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="editEdad">Edad</label>
          <input type="number" id="editEdad" name="edad" value="${persona.edad || ""}" min="1" max="120" />
        </div>
        <div class="form-group">
          <label for="editLider">Líder</label>
          <input type="text" id="editLider" name="lider" value="${escapeHtml(persona.lider || "")}" />
        </div>
      </div>
      <div class="form-group">
        <label for="editCoordinador">Coordinador</label>
        <input type="text" id="editCoordinador" name="coordinador" value="${escapeHtml(persona.coordinador || "")}" />
      </div>
    `;
  }

  contenidoEdicion.innerHTML = html;
  modalEdicion.classList.add("active");

  // Configurar focus trap
  setupFocusTrap(modalEdicion);

  // Focus en primer input
  setTimeout(() => {
    const firstInput = modalEdicion.querySelector("input:not([type='hidden'])");
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
}

/**
 * Cierra el modal de edición
 */
/**
 * Cierra el modal de edición
 */
function cerrarEdicion() {
  console.log("[MODAL] Cerrando edición");

  // Remover focus trap
  removeFocusTrap(modalEdicion);

  personaEnEdicion = null;
  modalEdicion.classList.remove("active");
  contenidoEdicion.innerHTML = "";
  mensajeEdicion.textContent = "";
  mensajeEdicion.className = "mensaje";
  if (formEdicion) formEdicion.reset();

  // Restaurar foco
  setTimeout(() => {
    if (inputBusqueda && document.activeElement === document.body) {
      inputBusqueda.focus();
    }
  }, 50);
}

/**
 * Guarda los cambios editados de una persona
 */
async function guardarEdicion(e) {
  e.preventDefault();

  if (!personaEnEdicion) {
    mostrarMensaje(
      "mensajeEdicion",
      "Error: No hay persona en edición",
      "error",
    );
    return;
  }

  try {
    const boton = formEdicion.querySelector('button[type="submit"]');
    boton.disabled = true;

    const datos = obtenerDatosFormulario(formEdicion);
    datos.tipo = personaEnEdicion.tipo;

    const resultado = await window.electronAPI.updatePerson(
      personaEnEdicion.id,
      datos,
    );

    if (resultado.success) {
      mostrarMensaje(
        "mensajeEdicion",
        "✓ Cambios guardados correctamente",
        "exito",
      );
      setTimeout(() => {
        cerrarEdicion();
        cargarDatos();
      }, 1500);
    } else {
      mostrarMensaje("mensajeEdicion", "Error: " + resultado.error, "error");
    }

    boton.disabled = false;
  } catch (error) {
    console.error("Error al guardar edición:", error);
    mostrarMensaje("mensajeEdicion", "Error al guardar los cambios", "error");
  }
}

/**
 * Filtra y muestra registros según búsqueda y filtro activo
 */
function aplicarBusqueda() {
  const termino = inputBusqueda.value.trim().toLowerCase();

  let pendientesFiltrados = datosPendientes;
  let atendidosFiltrados = datosAtendidas;

  // Aplicar filtro por tipo si no es "todos"
  if (filtroActivo !== "todos") {
    pendientesFiltrados = pendientesFiltrados.filter(
      (p) => p.tipo === filtroActivo,
    );
    atendidosFiltrados = atendidosFiltrados.filter(
      (p) => p.tipo === filtroActivo,
    );
  }

  // Aplicar búsqueda por nombre/apellido
  if (termino) {
    pendientesFiltrados = pendientesFiltrados.filter((persona) =>
      personaCoincideConBusqueda(persona, termino),
    );
    atendidosFiltrados = atendidosFiltrados.filter((persona) =>
      personaCoincideConBusqueda(persona, termino),
    );
  }

  mostrarPendientes(pendientesFiltrados);
  mostrarAtendidas(atendidosFiltrados);
}

/**
 * Verifica si una persona coincide con el término de búsqueda
 */
function personaCoincideConBusqueda(persona, termino) {
  const tipo = persona.tipo || "hombre";

  if (tipo === "matrimonio") {
    // Búsqueda en datos de matrimonio
    const nombreEsposo = (persona.nombre_esposo || "").toLowerCase();
    const apellidoEsposo = (persona.apellido_esposo || "").toLowerCase();
    const nombreEsposa = (persona.nombre_esposa || "").toLowerCase();
    const apellidoEsposa = (persona.apellido_esposa || "").toLowerCase();

    return (
      nombreEsposo.includes(termino) ||
      apellidoEsposo.includes(termino) ||
      nombreEsposa.includes(termino) ||
      apellidoEsposa.includes(termino)
    );
  } else {
    // Búsqueda en nombre y apellido
    const nombre = (persona.nombre || "").toLowerCase();
    const apellido = (persona.apellido || "").toLowerCase();

    return nombre.includes(termino) || apellido.includes(termino);
  }
}

// ==============================================
// FUNCIONES DE REGISTRO
// ==============================================

/**
 * Envía datos de registro al backend
 */
async function registrarPersona(tipo, datosFormulario, mensajeId, modalId) {
  console.log(`[REGISTRO] Iniciando registro de tipo: ${tipo}`);

  try {
    const boton = document.querySelector(`#${modalId} button[type="submit"]`);
    console.log(`[REGISTRO] Botón encontrado: ${boton ? "SÍ" : "NO"}`);

    if (boton) {
      boton.disabled = true;
      console.log(`[REGISTRO] Botón deshabilitado`);
    }

    // Preparar datos según tipo
    const personData = { tipo };

    if (tipo === "matrimonio") {
      personData.nombre_esposo = datosFormulario.nombre_esposo;
      personData.edad_esposo = datosFormulario.edad_esposo
        ? parseInt(datosFormulario.edad_esposo)
        : null;
      personData.lider_esposo = datosFormulario.lider_esposo;
      personData.nombre_esposa = datosFormulario.nombre_esposa;
      personData.edad_esposa = datosFormulario.edad_esposa
        ? parseInt(datosFormulario.edad_esposa)
        : null;
      personData.lider_esposa = datosFormulario.lider_esposa;
      personData.coordinador = datosFormulario.coordinador;

      if (!personData.nombre_esposo || !personData.nombre_esposa) {
        mostrarMensaje(
          mensajeId,
          "Los nombres de esposo y esposa son requeridos",
          "error",
        );
        if (boton) {
          boton.disabled = false;
          console.log(`[REGISTRO] Botón RE-habilitado (error validación)`);
        }
        return;
      }
    } else {
      personData.apellido = datosFormulario.apellido;
      personData.nombre = datosFormulario.nombre;
      personData.edad = datosFormulario.edad
        ? parseInt(datosFormulario.edad)
        : null;
      personData.lider = datosFormulario.lider;
      personData.coordinador = datosFormulario.coordinador;

      if (!personData.apellido || !personData.nombre) {
        mostrarMensaje(mensajeId, "Nombre y apellido son requeridos", "error");
        if (boton) {
          boton.disabled = false;
          console.log(`[REGISTRO] Botón RE-habilitado (error validación)`);
        }
        return;
      }
    }

    const resultado = await window.electronAPI.addPerson(personData);

    if (resultado.success) {
      console.log(`[REGISTRO] ✓ Registro exitoso`);
      mostrarMensaje(mensajeId, `✓ Registro exitoso`, "exito");

      setTimeout(() => {
        console.log(`[REGISTRO] Cerrando modal y recargando datos...`);
        cerrarModal(modalId);
        cargarDatos();

        if (boton) {
          boton.disabled = false;
          console.log(`[REGISTRO] Botón RE-habilitado (post-cierre)`);
        }
      }, 1500);
    } else {
      console.error(`[REGISTRO] Error en BD:`, resultado.error);
      mostrarMensaje(
        mensajeId,
        "Error al registrar: " + resultado.error,
        "error",
      );
      if (boton) {
        boton.disabled = false;
        console.log(`[REGISTRO] Botón RE-habilitado (error BD)`);
      }
    }
  } catch (error) {
    console.error("[REGISTRO] Error al registrar:", error);
    mostrarMensaje(mensajeId, "Error al registrar persona", "error");

    const boton = document.querySelector(`#${modalId} button[type="submit"]`);
    if (boton) {
      boton.disabled = false;
      console.log(`[REGISTRO] Botón RE-habilitado (catch)`);
    }
  }
}

/**
 * Obtiene datos de un formulario
 */
function obtenerDatosFormulario(form) {
  const formData = new FormData(form);
  const datos = {};
  for (let [key, value] of formData.entries()) {
    datos[key] = value.trim();
  }
  return datos;
}

// ==============================================
// INICIALIZACIÓN
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  listadoPendientes = document.getElementById("listadoPendientes");
  btnRefrescarPendientes = document.getElementById("btnRefrescarPendientes");
  listadoAtendidas = document.getElementById("listadoAtendidas");
  btnRefrescarAtendidas = document.getElementById("btnRefrescarAtendidas");
  inputBusqueda = document.getElementById("inputBusqueda");

  modalPastor = document.getElementById("modalAsignacion");
  selectorPastor = document.getElementById("selectorPastor");
  btnConfirmarAsignacion = document.getElementById("btnConfirmarAsignacion");
  btnCancelarAsignacion = document.getElementById("btnCancelarAsignacion");
  btnCerrarModalAsignacion = document.getElementById(
    "btnCerrarModalAsignacion",
  );
  mensajeAsignacion = document.getElementById("mensajeAsignacion");

  modalEdicion = document.getElementById("modalEdicion");
  formEdicion = document.getElementById("formEdicion");
  contenidoEdicion = document.getElementById("contenidoEdicion");
  mensajeEdicion = document.getElementById("mensajeEdicion");
  btnCerrarModalEdicion = document.getElementById("btnCerrarModalEdicion");

  // ==============================================
  // BOTONES DE REGISTRO
  // ==============================================

  document
    .getElementById("btnRegistrarHombre")
    .addEventListener("click", () => {
      abrirModal("modalHombre");
    });

  document.getElementById("btnRegistrarMujer").addEventListener("click", () => {
    abrirModal("modalMujer");
  });

  document
    .getElementById("btnRegistrarMatrimonio")
    .addEventListener("click", () => {
      abrirModal("modalMatrimonio");
    });

  // ==============================================
  // FORMULARIOS DE REGISTRO
  // ==============================================

  // Formulario Hombre
  const formHombre = document.getElementById("formHombre");
  formHombre.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = obtenerDatosFormulario(formHombre);
    await registrarPersona("hombre", datos, "mensajeHombre", "modalHombre");
  });

  // Formulario Mujer
  const formMujer = document.getElementById("formMujer");
  formMujer.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = obtenerDatosFormulario(formMujer);
    await registrarPersona("mujer", datos, "mensajeMujer", "modalMujer");
  });

  // Formulario Matrimonio
  const formMatrimonio = document.getElementById("formMatrimonio");
  formMatrimonio.addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = obtenerDatosFormulario(formMatrimonio);
    await registrarPersona(
      "matrimonio",
      datos,
      "mensajeMatrimonio",
      "modalMatrimonio",
    );
  });

  // ==============================================
  // CERRAR MODALES
  // ==============================================

  document
    .querySelector(".btn-close-hombre")
    .addEventListener("click", () => cerrarModal("modalHombre"));
  document
    .querySelector(".btn-cancelar-hombre")
    .addEventListener("click", () => cerrarModal("modalHombre"));
  document.getElementById("modalHombre").addEventListener("click", (e) => {
    if (e.target.id === "modalHombre") cerrarModal("modalHombre");
  });

  document
    .querySelector(".btn-close-mujer")
    .addEventListener("click", () => cerrarModal("modalMujer"));
  document
    .querySelector(".btn-cancelar-mujer")
    .addEventListener("click", () => cerrarModal("modalMujer"));
  document.getElementById("modalMujer").addEventListener("click", (e) => {
    if (e.target.id === "modalMujer") cerrarModal("modalMujer");
  });

  document
    .querySelector(".btn-close-matrimonio")
    .addEventListener("click", () => cerrarModal("modalMatrimonio"));
  document
    .querySelector(".btn-cancelar-matrimonio")
    .addEventListener("click", () => cerrarModal("modalMatrimonio"));
  document.getElementById("modalMatrimonio").addEventListener("click", (e) => {
    if (e.target.id === "modalMatrimonio") cerrarModal("modalMatrimonio");
  });

  // Event listeners para modal de edición
  btnCerrarModalEdicion.addEventListener("click", cerrarEdicion);
  modalEdicion.addEventListener("click", (e) => {
    if (e.target.id === "modalEdicion") cerrarEdicion();
  });
  formEdicion.addEventListener("submit", guardarEdicion);

  // ==============================================
  // FILTROS
  // ==============================================

  const botonesFiltro = document.querySelectorAll(".btn-filtro");
  botonesFiltro.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Actualizar estado visual
      botonesFiltro.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Aplicar filtro
      filtroActivo = btn.dataset.filtro;
      inputBusqueda.value = "";
      aplicarBusqueda();
    });
  });

  // Event listener para búsqueda
  inputBusqueda.addEventListener("input", aplicarBusqueda);

  // ==============================================
  // BOTONES DE ACTUALIZAR
  // ==============================================

  btnRefrescarPendientes.addEventListener("click", cargarDatos);
  btnRefrescarAtendidas.addEventListener("click", cargarDatos);

  // ==============================================
  // MODAL DE ASIGNACIÓN DE PASTOR
  // ==============================================

  btnCerrarModalAsignacion.addEventListener("click", cerrarAsignacionPastor);
  btnCancelarAsignacion.addEventListener("click", cerrarAsignacionPastor);

  modalPastor.addEventListener("click", (e) => {
    if (e.target === modalPastor) {
      cerrarAsignacionPastor();
    }
  });

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
          `✓ Asignado correctamente a ${pastor}`,
          "exito",
        );

        setTimeout(() => {
          cerrarAsignacionPastor();
          cargarDatos();
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

  // ==============================================
  // EXPONER FUNCIONES GLOBALMENTE PARA ONCLICK
  // ==============================================

  // Estas funciones deben estar en el scope global porque son llamadas
  // desde atributos onclick en HTML generado dinámicamente
  window.abrirEdicion = abrirEdicion;
  window.abrirAsignacion = abrirAsignacion;
  window.cerrarEdicion = cerrarEdicion;

  // ==============================================
  // CARGA INICIAL
  // ==============================================

  cargarDatos();
});
