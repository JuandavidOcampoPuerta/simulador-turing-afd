/******************************************************
 * Simulador de Máquina de Turing (MT) que emula un AFD
 * Regex que se valida:  ^(admin|guest|user)$
 *
 * Lenguaje:
 * L = { "admin", "guest", "user" }
 *
 * Restricciones de la MT:
 * - El cabezal NUNCA se mueve a la izquierda (solo R o S).
 * - La MT NUNCA escribe un símbolo diferente al que leyó
 * (en el código jamás modificamos la cinta).
 *
 * Conexión con la teoría:
 * - Cinta        -> arreglo 'tape'
 * - Cabezal      -> índice 'headPosition'
 * - Registro q   -> variable 'currentState'
 * - Función δ    -> objeto 'TRANSITIONS'
 * - Estados F    -> conjunto 'ACCEPT_STATES'
 ******************************************************/

/* ================================
   CONFIGURACIÓN TEÓRICA
   ================================ */

// Conjunto de estados (solo nombres; la lógica está en TRANSITIONS)
const START_STATE = "q0";
const ACCEPT_STATES = new Set(["q_admin", "q_guest", "q_user_accept"]);
const REJECT_STATE = "q_dead";
const BLANK = "_"; // símbolo blanco al final de la cinta

// Función de transición δ codificada como objeto de objetos.
// TRANSITIONS[estado][símbolo] = { nextState, move }
// move: "R" (derecha) o "S" (quedarse)
// IMPORTANTE: Nunca escribimos, solo leemos y movemos.
// AFD para: (admin | guest | user)
const TRANSITIONS = {
  // Estado inicial: según el primer carácter decidimos a qué rama ir
  q0: {
    "a": { nextState: "q_a", move: "R" },   // posible "admin"
    "g": { nextState: "q_g", move: "R" },   // posible "guest"
    "u": { nextState: "q_u", move: "R" },   // posible "user"
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  // Rama "admin"
  q_a: {
    "d": { nextState: "q_ad", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_ad: {
    "m": { nextState: "q_adm", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_adm: {
    "i": { nextState: "q_admi", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_admi: {
    "n": { nextState: "q_admin", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  // Estado donde ya leímos "admin"
  q_admin: {
    [BLANK]: { nextState: "q_admin", move: "S" }, // se queda, ya aceptamos
    DEFAULT: { nextState: REJECT_STATE, move: "R" } // cualquier extra => rechazo
  },
  // Rama "guest"
  q_g: {
    "u": { nextState: "q_gu", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_gu: {
    "e": { nextState: "q_gue", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_gue: {
    "s": { nextState: "q_gues", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_gues: {
    "t": { nextState: "q_guest", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_guest: {
    [BLANK]: { nextState: "q_guest", move: "S" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  // Rama "user"
  q_u: {
    "s": { nextState: "q_us", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_us: {
    "e": { nextState: "q_use", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_use: {
    "r": { nextState: "q_user_accept", move: "R" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  q_user_accept: {
    [BLANK]: { nextState: "q_user_accept", move: "S" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  },
  // Estado de rechazo / trampa
  [REJECT_STATE]: {
    [BLANK]: { nextState: REJECT_STATE, move: "S" },
    DEFAULT: { nextState: REJECT_STATE, move: "R" }
  }
};

/* ================================
   VARIABLES GLOBALES (MT)
   ================================ */

// La Cinta (array de caracteres)
let tape = [];

// Posición del cabezal (índice dentro de tape)
let headPosition = 0;

// Estado actual q
let currentState = START_STATE;

// Banderas de control
let halted = false;   // ¿La MT ya terminó?
let accepted = false; // ¿La cadena fue aceptada?

// Timer para modo "Run"
let runIntervalId = null;

/* ================================
   INICIALIZACIÓN
   ================================ */

// Referencias a los elementos del DOM
let inputString, btnLoad, btnStep, btnRun, btnReset;

document.addEventListener("DOMContentLoaded", () => {
  inputString = document.getElementById("inputString");
  btnLoad = document.getElementById("btnLoad");
  btnStep = document.getElementById("btnStep");
  btnRun = document.getElementById("btnRun");
  btnReset = document.getElementById("btnReset");

  // Proteger por si falta algo en el HTML
  if (!inputString || !btnLoad || !btnStep || !btnRun || !btnReset) {
    return;
  }

  btnLoad.addEventListener("click", () => {
    const value = inputString.value.trim();
    loadTape(value);
  });

  // Permitir cargar con Enter
  inputString.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const value = inputString.value.trim();
      loadTape(value);
    }
  });

  btnStep.addEventListener("click", () => {
    step();
  });

  btnRun.addEventListener("click", () => {
    toggleRun();
  });

  btnReset.addEventListener("click", () => {
    resetMachine();
  });

  // Estado inicial sin cinta
  resetMachine();
});

/* ================================
   FUNCIONES PRINCIPALES DE LA MT
   ================================ */

/**
 * Carga una nueva cadena en la cinta y deja la MT en estado inicial.
 */
function loadTape(input) {
  resetMachine(); // limpia todo
  tape = input.split(""); // la cinta es una lista de caracteres
  if (tape.length === 0) {
    // Si la cadena está vacía, igual renderizamos y dejamos que la MT rechace
    showMessage("Cinta vacía. Solo se aceptan: admin, guest, user.", "info");
  } else {
    showMessage(`Cinta cargada: "${input}"`, "info");
  }
  renderTape();
  renderState();
  renderResult();
  updateButtons();
}

/**
 * Reinicia la máquina a su estado inicial (sin cambiar la cinta).
 */
function resetMachine() {
  stopRun();
  headPosition = 0;
  currentState = START_STATE;
  halted = false;
  accepted = false;
  renderTape();
  renderState();
  renderResult();
  updateButtons();
}

/**
 * Ejecuta UN paso de la MT (función "motor").
 * Aquí es donde se aplica la función de transición δ.
 */
function step() {
  if (halted) {
    return;
  }

  // 1. Leer símbolo bajo el cabezal
  const symbol = headPosition < tape.length ? tape[headPosition] : BLANK;

  // 2. Buscar la regla δ(q, símbolo)
  const stateTransitions = TRANSITIONS[currentState] || {};
  let transition = stateTransitions[symbol];
  if (!transition) {
    // Si no hay regla específica para ese símbolo, usamos DEFAULT
    transition = stateTransitions.DEFAULT;
  }
  if (!transition) {
    // Si ni siquiera hay DEFAULT, nos vamos al estado de rechazo
    currentState = REJECT_STATE;
    halted = true;
    accepted = false;
    finalizeStep();
    return;
  }

  // 3. Aplicar transición: actualizar estado y mover cabezal
  currentState = transition.nextState;

  // Por construcción, NUNCA escribimos en la cinta, solo nos movemos
  if (transition.move === "R") {
    headPosition += 1; // solo derecha
  } else if (transition.move === "S") {
    // no mover (stay)
  }

  // 4. Verificar si debemos detener la máquina
  // CORRECCIÓN APLICADA AQUÍ: Se eliminó el 'else' para permitir
  // que la MT siga el flujo normal de las transiciones (DEFAULT a q_dead)
  // si un estado de aceptación lee un símbolo extra (no BLANK).
  if (ACCEPT_STATES.has(currentState)) {
    // Si estamos en un estado de aceptación, verificamos si realmente llegamos al fin de la cadena
    // El símbolo blanco solo se lee cuando headPosition >= tape.length (fin de cadena)
    const isAtEnd = headPosition >= tape.length;
    if (isAtEnd) {
      // Solo aceptamos si realmente llegamos al fin de la cadena
      halted = true;
      accepted = true;
    }
  }

  if (currentState === REJECT_STATE) {
    halted = true;
    accepted = false;
  }

  // 5. Actualizar interfaz
  finalizeStep();
}

/**
 * Llamada al final de cada step para actualizar la UI.
 */
function finalizeStep() {
  renderTape();
  renderState();
  renderResult();
  updateButtons();
}

/**
 * Actualiza el estado de los botones según el estado de la máquina.
 */
function updateButtons() {
  if (!btnStep || !btnRun || !btnReset) return;

  const hasTape = tape.length > 0;
  const isRunning = runIntervalId !== null;

  // Botón Paso: habilitado si hay cinta y no está detenida
  btnStep.disabled = !hasTape || halted;

  // Botón Ejecutar: habilitado si hay cinta y no está detenida
  btnRun.disabled = !hasTape || halted;
  btnRun.textContent = isRunning ? "Pausar" : "Ejecutar";

  // Botón Reiniciar: habilitado si hay cinta
  btnReset.disabled = !hasTape;
}

/**
 * Ejecuta la MT automáticamente hasta que se detenga.
 */
function toggleRun() {
  if (runIntervalId) {
    // Si ya está corriendo, la pausamos
    stopRun();
    updateButtons();
    return;
  }

  if (halted) {
    // Si ya está detenida, no tiene sentido correr
    return;
  }

  runIntervalId = setInterval(() => {
    if (halted) {
      stopRun();
      updateButtons();
      return;
    }
    step();
  }, 400); // velocidad de ejecución (ms por paso)
  
  updateButtons();
}

/**
 * Detiene el modo "Run".
 */
function stopRun() {
  if (runIntervalId) {
    clearInterval(runIntervalId);
    runIntervalId = null;
  }
  updateButtons();
}

/* ================================
   RENDERIZADO / INTERFAZ
   ================================ */

/**
 * Pintar la cinta y la posición del cabezal.
 * Visualmente, cada celda es un <span>.
 */
function renderTape() {
  const tapeContainer = document.getElementById("tapeContainer");
  if (!tapeContainer) return;

  tapeContainer.innerHTML = "";

  // Si la cinta está vacía, igual mostramos un BLANK
  const displayTape = tape.length > 0 ? tape : [];

  // Pintamos cada símbolo
  displayTape.forEach((symbol, index) => {
    const cell = document.createElement("span");
    cell.textContent = symbol;
    cell.classList.add("tape-cell");
    if (index === headPosition && !halted) {
      cell.classList.add("tape-head"); // aplica estilo para el cabezal
    }
    tapeContainer.appendChild(cell);
  });

  // Representar la celda BLANK al final (solo visual)
  const blankIndex = displayTape.length;
  const blankCell = document.createElement("span");
  blankCell.textContent = BLANK;
  blankCell.classList.add("tape-cell", "tape-blank");
  if (blankIndex === headPosition && !halted) {
    blankCell.classList.add("tape-head");
  }
  tapeContainer.appendChild(blankCell);
}

/**
 * Mostrar el estado actual de la MT.
 * CORRECCIÓN APLICADA AQUÍ: Se eliminó la posición del cabezal de este display.
 */
function renderState() {
  const stateDisplay = document.getElementById("stateDisplay");
  if (!stateDisplay) return;
  // Solo mostramos el estado actual, la posición es visible en la cinta.
  stateDisplay.textContent = `${currentState}`; 
}

/**
 * Mostrar el resultado (aceptado / rechazado / ejecutando).
 */
function renderResult() {
  const resultDisplay = document.getElementById("resultDisplay");
  if (!resultDisplay) return;

  if (!halted) {
    resultDisplay.textContent = "Estado: ejecutando...";
    resultDisplay.className = "result running";
    return;
  }

  if (accepted) {
    resultDisplay.textContent = 'Resultado: CADENA ACEPTADA ✅ (admin | guest | user)';
    resultDisplay.className = "result accepted";
  } else {
    resultDisplay.textContent = "Resultado: CADENA RECHAZADA ❌";
    resultDisplay.className = "result rejected";
  }
}

/**
 * Mostrar mensajes informativos (no es parte de la MT, solo ayuda visual).
 */
function showMessage(text, type = "info") {
  const resultDisplay = document.getElementById("resultDisplay");
  if (!resultDisplay) return;
  resultDisplay.textContent = text;
  resultDisplay.className = "result";
  resultDisplay.classList.add(type);
}

/* ================================
   RESPUESTAS A LAS PREGUNTAS TEÓRICAS (para tu sustentación)
   ================================

   Pregunta 1: "¿Dónde está la Cinta de su MT?"
   -> Es la variable global 'tape', un array de caracteres.

   Pregunta 2: "¿Dónde está el Cabezal?"
   -> Es 'headPosition', un índice que apunta a la celda actual de 'tape'.

   Pregunta 3: "¿Dónde está el Registro de Estado?"
   -> Es 'currentState', un string como "q0", "q_admin", "q_dead", etc.

   Pregunta 4: "Muéstrenme la Tabla de Reglas / Función de Transición."
   -> Es el objeto 'TRANSITIONS', donde cada clave es un estado y
      cada subclave es un símbolo, mapeando a (nextState, move).

   Pregunta 5: "¿Qué parte de su código es el 'motor' que ejecuta una regla?"
   -> La función 'step()' es el motor: lee el símbolo, busca δ(q, a),
      actualiza el estado y mueve el cabezal.

   Pregunta 6: "Su MT emula un AFD. ¿Qué tendrían que cambiar
                en su código (step() y TRANSITIONS) para resolver
                un problema que un AFD no puede?"
   -> Principalmente:
      - Permitir movimientos a la izquierda (move: 'L').
      - Permitir escribir símbolos diferentes a los leídos (añadir 'writeSymbol').
      - Usar la cinta para memoria adicional, no solo lectura lineal.
      Con eso se podría implementar lenguajes no regulares, como { a^n b^n }.
*/
