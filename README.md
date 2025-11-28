# Simulador de Máquina de Turing para Validación de Regex

## Integrantes
- **[COMPLETAR AQUÍ CON TU(S) NOMBRE(S)]**

---

## Fase 1: El Plano (Teoría y Diseño)

### 1. El Problema (Regex)

**Regex elegido:** `^(admin|guest|user)$`

**Justificación:** Este regex valida que la cadena sea exactamente una de tres palabras: "admin", "guest" o "user". Es un formato comúnmente usado en sistemas de autenticación y control de acceso para definir tipos de usuarios. Es un lenguaje regular (puede ser reconocido por un AFD), es práctico y comúnmente usado en formularios web, y el AFD resultante es manejable.

### 2. El Autómata Finito Determinista (AFD)

#### Estados (Q)
- `q0`: Estado inicial
- `q_a, q_ad, q_adm, q_admi`: Estados intermedios para reconocer "admin"
- `q_admin`: Estado de aceptación para "admin"
- `q_g, q_gu, q_gue, q_gues`: Estados intermedios para reconocer "guest"
- `q_guest`: Estado de aceptación para "guest"
- `q_u, q_us, q_use`: Estados intermedios para reconocer "user"
- `q_user_accept`: Estado de aceptación para "user"
- `q_dead`: Estado de rechazo (trampa)

#### Alfabeto (Σ)
`{a, d, m, i, n, g, u, e, s, t, r, _}` donde `_` representa el símbolo blanco (fin de cadena). Cualquier otro carácter también forma parte del alfabeto (pero lleva a rechazo).

#### Estado Inicial
`q0`

#### Estados Finales (F)
`{q_admin, q_guest, q_user_accept}`

#### Diagrama del AFD

[a]
     q0 ──────────────────> q_a
     │                      │
     │                      │ [d]
     │                      ▼
     │                     q_ad
     │                      │
     │                      │ [m]
     │                      ▼
     │                     q_adm
     │                      │
     │                      │ [i]
     │                      ▼
     │                     q_admi
     │                      │
     │                      │ [n]
     │                      ▼
     │              q_admin ──[_]──> [ACEPTADO/HALT]
     │
     │ [g]
     ├─────────────────────> q_g
     │                      │
     │                      │ [u]
     │                      ▼
     │                     q_gu
     │                      │
     │                      │ [e]
     │                      ▼
     │                     q_gue
     │                      │
     │                      │ [s]
     │                      ▼
     │                     q_gues
     │                      │
     │                      │ [t]
     │                      ▼
     │              q_guest ──[_]──> [ACEPTADO/HALT]
     │
     │ [u]
     └─────────────────────> q_u
                              │
                              │ [s]
                              ▼
                             q_us
                              │
                              │ [e]
                              ▼
                             q_use
                              │
                              │ [r]
                              ▼
                     q_user_accept ──[_]──> [ACEPTADO/HALT]
Cualquier otro símbolo o transición no definida → q_dead → [RECHAZADO]


### 3. La Máquina de Turing (MT)

#### Restricciones de la MT
- El cabezal **nunca se mueve a la izquierda** (solo derecha R o se mantiene S)
- La MT **nunca escribe un símbolo diferente** al que leyó (solo lee y mueve)

#### Tabla de Transición Completa de la MT

**Nota:** El movimiento `H` (Halt/Detener) se usa para formalizar la aceptación.

| Estado Actual | Símbolo Leído | Símbolo Escrito | Movimiento | Estado Siguiente |
|---------------|---------------|-----------------|------------|-------------------|
| q0            | a             | (mismo)         | R          | q_a               |
| q0            | g             | (mismo)         | R          | q_g               |
| q0            | u             | (mismo)         | R          | q_u               |
| q0            | otro          | (mismo)         | R          | q_dead            |
| q_a           | d             | (mismo)         | R          | q_ad              |
| q_a           | otro          | (mismo)         | R          | q_dead            |
| q_ad          | m             | (mismo)         | R          | q_adm             |
| q_ad          | otro          | (mismo)         | R          | q_dead            |
| q_adm         | i             | (mismo)         | R          | q_admi            |
| q_adm         | otro          | (mismo)         | R          | q_dead            |
| q_admi        | n             | (mismo)         | R          | q_admin           |
| q_admi        | otro          | (mismo)         | R          | q_dead            |
| q_admin       | **\_** | **\_** | **H** | **q\_admin (ACEPTA)** |
| q_admin       | otro          | (mismo)         | R          | q_dead            |
| q_g           | u             | (mismo)         | R          | q_gu              |
| q_g           | otro          | (mismo)         | R          | q_dead            |
| q_gu          | e             | (mismo)         | R          | q_gue             |
| q_gu          | otro          | (mismo)         | R          | q_dead            |
| q_gue         | s             | (mismo)         | R          | q_gues            |
| q_gue         | otro          | (mismo)         | R          | q_dead            |
| q_gues        | t             | (mismo)         | R          | q_guest           |
| q_gues        | otro          | (mismo)         | R          | q_dead            |
| q_guest       | **\_** | **\_** | **H** | **q\_guest (ACEPTA)** |
| q_guest       | otro          | (mismo)         | R          | q_dead            |
| q_u           | s             | (mismo)         | R          | q_us              |
| q_u           | otro          | (mismo)         | R          | q_dead            |
| q_us          | e             | (mismo)         | R          | q_use             |
| q_us          | otro          | (mismo)         | R          | q_dead            |
| q_use         | r             | (mismo)         | R          | q_user_accept     |
| q_use         | otro          | (mismo)         | R          | q_dead            |
| q_user_accept | **\_** | **\_** | **H** | **q\_user\_accept (ACEPTA)** |
| q_user_accept | otro          | (mismo)         | R          | q_dead            |
| q_dead        | \_            | \_              | S          | q_dead (RECHAZA)  |
| q_dead        | otro          | (mismo)         | R          | q_dead (RECHAZA)  |

**Manejo del símbolo blanco (_):**
- El símbolo blanco `_` se lee cuando `headPosition >= tape.length` (fin de cadena).
- La MT **acepta y se detiene** cuando está en un estado de aceptación (`q_admin`, `q_guest`, `q_user_accept`) y lee el símbolo blanco (`_`).
- La MT **rechaza** cuando entra al estado `q_dead`. Si un estado de aceptación lee un carácter no blanco, la regla de transición (`q_final` + `otro`) lo envía al estado `q_dead` en el siguiente paso.

**Leyenda:**
- `R`: Mover cabezal a la derecha
- `S`: No mover cabezal (permanecer en la misma posición)
- `H`: Detener la máquina (Halt). Usado para indicar aceptación.
- `otro`: Cualquier símbolo que no sea el `_` o el símbolo definido para esa regla.
- `(mismo)`: Escribir el mismo símbolo que se leyó

---

## Fase 2: El Repositorio

**URL del repositorio:** **[Añadir URL de GitHub]**

**URL de GitHub Pages:** **[Añadir URL de GitHub Pages]**

---

## Fase 4: Análisis del Código

### Pregunta 1: "¿Dónde está la Cinta de su MT?"
La cinta está representada por el array `tape` en JavaScript, que almacena los caracteres de la cadena de entrada.

### Pregunta 2: "¿Dónde está el Cabezal?"
El cabezal está representado por la variable `headPosition` que indica la posición actual en la cinta (índice del array).

### Pregunta 3: "¿Dónde está el Registro de Estado?"
El estado actual está almacenado en la variable `currentState` (string como "q0", "q_admin", "q_dead", etc.).

### Pregunta 4: "Muéstrenme la Tabla de Reglas / Función de Transición."
Está implementada como el objeto `TRANSITIONS` en `script.js`, que mapea `(estado, símbolo) → (nuevo_estado, movimiento)`. Cada estado tiene transiciones para símbolos específicos y una transición `DEFAULT` para símbolos no reconocidos.

### Pregunta 5: "¿Qué parte de su código es el 'motor' que ejecuta una regla?"
La función `step()` es el motor que: lee el símbolo actual bajo el cabezal, consulta la tabla de transición (`TRANSITIONS`), actualiza el estado, mueve el cabezal y determina si acepta o rechaza.

### Pregunta 6: "Su MT emula un AFD. ¿Qué tendrían que cambiar en su código (step() y TRANSITIONS) para que su máquina pudiera resolver un problema que un AFD no puede, como {a^n b^n}?"
Para resolver problemas que un AFD no puede resolver, se necesitarían los siguientes cambios:
- Permitir movimiento a la izquierda del cabezal (añadir `move: 'L'` en las transiciones).
- Permitir escribir símbolos diferentes a los leídos (añadir campo `writeSymbol` en las transiciones).
- Usar la cinta para memoria adicional, no solo lectura lineal.
- Con eso se podría implementar lenguajes no regulares, como `{a^n b^n | n ≥ 0}`.
