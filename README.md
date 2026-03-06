# Procesadores de Lenguajes
### Calculadora con SDD usando Jison

> **Asignatura:** Procesadores de Lenguajes · Grado en Ingeniería Informática  
> **Área:** Lenguajes y Sistemas Informáticos  
> **Autor:** Raúl González Acosta (alu0101543529)   
> **Curso:** 2025/2026

---

## Tabla de contenidos

### Practica 4: Traducción Dirigida por la Sintaxis (SDD): Léxico con Jison
1. [Conceptos teóricos previos](#1-conceptos-teóricos-previos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Instalación y ejecución paso a paso](#3-instalación-y-ejecución-paso-a-paso)
4. [Respuestas a las preguntas del enunciado](#4-respuestas-a-las-preguntas-del-enunciado-sección-2)
5. [Modificaciones al analizador léxico](#5-modificaciones-al-analizador-léxico)
6. [Pruebas Jest](#6-pruebas-jest)
7. [Referencia de la gramática y la SDD](#7-referencia-de-la-gramática-y-la-sdd)

### Practica 5: Traducción Dirigida por la SIntaxis (SDD): Gramática con Jison
1. [Derivaciones para las frases de ejemplo](#1-derivaciones-para-las-frases-de-ejemplo)
2. [Árboles de análisis sintáctico (parse trees)](#2-árboles-de-análisis-sintáctico-parse-trees)
3. [Orden de evaluación de las acciones semánticas](#3-orden-de-evaluación-de-las-acciones-semánticas)
4. [Por qué los resultados no coinciden con los convenios matemáticos](#4-por-qué-los-resultados-no-coinciden-con-los-convenios-matemáticos)
5. [Modificación de la gramática: precedencia y asociatividad](#5-modificación-de-la-gramática-precedencia-y-asociatividad)
6. [Soporte de paréntesis](#6-soporte-de-paréntesis)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Ejecución de tests](#8-ejecución-de-tests)

---

## 1. Conceptos teóricos previos

### 1.1 Gramáticas independientes del contexto (GIC)

Una **gramática independiente del contexto** (Context-Free Grammar, CFG) es una cuádrupla `G = (V, Σ, P, S)` donde:

- **V** es el conjunto de *símbolos no terminales* (variables), e.g. `E`, `T`, `L`.
- **Σ** es el conjunto de *símbolos terminales* (tokens), e.g. `number`, `op`.
- **P** es el conjunto de *producciones* de la forma `A → α`, donde `A ∈ V` y `α ∈ (V ∪ Σ)*`.
- **S** es el *símbolo inicial* (axioma), en este caso `L`.

La gramática de la práctica describe expresiones aritméticas:

```
L → E
E → E op T  |  T
T → number
```

La producción `E → E op T | T` es **recursiva por la izquierda**, lo que define la **asociatividad por la izquierda** de los operadores: `3 - 2 - 1` se evalúa como `(3 - 2) - 1 = 0`, no como `3 - (2 - 1) = 2`.

### 1.2 Analizadores léxicos (Lexers) y tokens

El **analizador léxico** (lexer o scanner) es la primera fase de un compilador/intérprete. Su tarea es leer la cadena de caracteres de entrada y transformarla en una secuencia de **tokens**. Un token es un par `(tipo, valor)`, por ejemplo:

| Entrada | Tipo    | Valor  |
|---------|---------|--------|
| `123`   | NUMBER  | "123"  |
| `+`     | OP      | "+"    |
| `**`    | OP      | "**"   |
| (fin)   | EOF     | ""     |
| `@`     | INVALID | "@"    |

Las **definiciones regulares** especifican qué forma tienen los tokens usando expresiones regulares:

```
digit  → [0-9]
number → digit+
op     → + | - | * | / | **
```

### 1.3 Definiciones Dirigidas por la Sintaxis (SDD)

Una **SDD** (Syntax Directed Definition) extiende una gramática añadiendo *atributos* a los símbolos gramaticales y *reglas semánticas* a cada producción. Estas reglas definen cómo calcular los atributos a partir de los de los hijos (atributos *sintetizados*) o del padre y hermanos (atributos *heredados*).

En esta práctica, el atributo `value` es **sintetizado**: se calcula desde las hojas hacia la raíz.

| Producción         | Regla semántica                                  |
|--------------------|--------------------------------------------------|
| `L → E eof`        | `L.value = E.value`                              |
| `E → E₁ op T`      | `E.value = operate(op.lexvalue, E₁.value, T.value)` |
| `E → T`            | `E.value = T.value`                              |
| `T → number`       | `T.value = convert(number.lexvalue)`             |

**Ejemplo de árbol de derivación anotado** para `3 + 4`:

```
           L (value=7)
           |
           E (value=7)
          /|\
    E(3) OP(+) T(4)
     |          |
    T(3)      NUMBER("4")
     |
  NUMBER("3")
```

### 1.4 Jison: generador de parsers para JavaScript

**Jison** es el equivalente en JavaScript de la herramienta clásica **Yacc/Bison** (para C). A partir de un fichero `.jison` que describe el lexer y el parser mediante una notación BNF extendida, Jison genera automáticamente un fichero JavaScript con el analizador completo.

El fichero `.jison` tiene tres secciones separadas por `%%`:

```
%lex
  %%
  <reglas léxicas>
/lex

%start <símbolo_inicial>

%%

<reglas gramaticales con acciones semánticas>

%%

<código JavaScript auxiliar>
```

---

## 2. Estructura del proyecto

```
.
├── package.json          # Configuración del proyecto y dependencias
├── package-lock.json     # Versiones exactas de dependencias
├── README.md             # Esta documentación
├── src
│   ├── grammar.jison     # Especificación léxica + SDD (entrada para Jison)
│   ├── parser.js         # Parser generado por Jison (o implementación manual)
│   └── index.js          # Punto de entrada: lee stdin y evalúa
└── __tests__
    └── parser.test.js    # Suite de pruebas Jest
```

**Flujo de trabajo:**

```
grammar.jison  ──[jison]──►  parser.js  ◄──  index.js
                                              __tests__/parser.test.js
```

---

## 3. Instalación y ejecución paso a paso

### Paso 1: Clonar el repositorio e instalar dependencias

```bash
# Clonar el repositorio
git clone git@github.com:ULL-ESIT-PL-2526/04-traduccion-dirigida-sintaxis-raul-gonzalez-acosta-alu0101543529.git

# Situarse en el directorio del proyecto
cd 04-traduccion-dirigida-sintaxis-raul-gonzalez-acosta-alu0101543529

# Instalar dependencias (Jison + Jest)
npm install
```

`npm install` lee el fichero `package.json` y descarga los paquetes listados en `devDependencies` al directorio `node_modules/`. Los paquetes relevantes son:

- **jison** (`^0.4.18`): generador de parsers LALR(1) para JavaScript.
- **jest** (`^29.0.0`): framework de pruebas unitarias de Facebook/Meta.

### Paso 2: Generar el parser con Jison

```bash
npx jison src/grammar.jison -o src/parser.js
```
ó
```bash
npm run build
```

Este comando:
1. Lee `src/grammar.jison` con la especificación del lexer y la gramática.
2. Construye los autómatas internamente.
3. Genera `src/parser.js`, un módulo CommonJS que exporta el objeto `parser` con el método `parser.parse(input)`.

> **Nota:** Si el fichero `grammar.jison` contiene errores de sintaxis, Jison los reportará aquí. Si los hay en la gramática, Jison también los avisa aunque intenta resolverlos con heurísticas.

### Paso 3: Ejecutar las pruebas

```bash
npm test
```

Esto ejecuta el script `"test"` definido en `package.json`, que primero reconstruye el parser y luego lanza Jest. Jest descubre automáticamente todos los ficheros en `__tests__/` con extensión `.test.js`.

Resultado esperado:

```
 PASS  __tests__/parser.test.js
  Parser Tests
    Basic number parsing
      ✓ should parse single numbers (4 ms)
    Basic arithmetic operations
      ✓ should handle addition (1 ms)
      ✓ should handle subtraction (1 ms)
      ✓ should handle multiplication (1 ms)
      ✓ should handle division (1 ms)
      ✓ should handle exponentiation (1 ms)
    Operator precedence and associativity
      ✓ should handle left associativity for same precedence operations (1 ms)
    Complex expressions
      ✓ should handle multiple operations of same precedence (1 ms)
    Edge cases
      ✓ should handle expressions with extra whitespace (1 ms)
      ✓ should handle zero in operations (1 ms)
      ✓ should handle division by zero
      ✓ should handle negative results (1 ms)
      ✓ should handle decimal results (1 ms)
      ✓ should handle large numbers (1 ms)
    Input validation and error cases
      ✓ should handle invalid input gracefully (23 ms)
      ✓ should handle incomplete expressions (3 ms)
    Regression tests
      ✓ should match examples from index.js
    Float numbers
      ✓ should parse floating point numbers
      ✓ should parse scientific notation (1 ms)
      ✓ should handle arithmetic with floating point numbers (1 ms)
    Single-line comments
      ✓ should ignore single-line comments (1 ms)
      ✓ should handle comments after operations
      ✓ should handle comments with complex expressions

Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        0.439 s, estimated 1 s
```

### Paso 4: Usar la calculadora desde la línea de comandos

```bash
# Evaluar una expresión simple
./src/index.js 3+4*2
# => 14

# Con potencia
./src/index.js 2**10
# => 1024

# Con números flotantes
./src/index.js 3.5 * 2
# => 7
./src/index.js 1e3 + 2.5
# => 1002.5

# Con comentarios
./src/index.js "3 + 4 // esto es un comentario"
# => 7
```

---

## 4. Respuestas a las preguntas del enunciado

El enunciado presenta el siguiente bloque léxico del fichero `grammar.jison` original y plantea varias preguntas:

```jison
%lex
%%
\s+          { /* skip whitespace */; }
[0-9]+       { return 'NUMBER'; }
"**"         { return 'OP'; }
[-+*/]       { return 'OP'; }
<<EOF>>      { return 'EOF'; }
.            { return 'INVALID'; }
/lex
```

### Pregunta 3.1 — Diferencia entre `/* skip whitespace */` y devolver un token

Cuando el lexer encuentra una secuencia de caracteres que coincide con una regla, puede hacer dos cosas:

**a) No devolver nada (skip):**
```jison
\s+  { /* skip whitespace */; }
```
El lexer consume los caracteres de la entrada pero **no produce ningún token**. El parser nunca llega a ver esos caracteres; es como si no existieran. Esta técnica se usa para ignorar separadores que no tienen valor semántico: espacios, tabuladores, saltos de línea, y en nuestra modificación, comentarios.

**b) Devolver un token:**
```jison
[0-9]+  { return 'NUMBER'; }
```
El lexer consume los caracteres y **envía un token al parser**. El parser recibirá ese token en su siguiente llamada y lo procesará según las reglas gramaticales.

**Diferencia clave:** El *skip* descarta la información; el *return* la preserva y la hace visible para el análisis sintáctico.

---

### Pregunta 3.2 — Secuencia exacta de tokens para `123**45+@`

El lexer procesa la entrada de izquierda a derecha, aplicando la regla que coincida con el prefijo más largo (*longest match*):

| Posición | Caracteres | Regla aplicada | Token producido |
| -------- | ---------- | -------------- | --------------- |
| 0        | `123`      | `[0-9]+`       | `NUMBER("123")` |
| 3        | `**`       | `"**"`         | `OP("**")`      |
| 5        | `45`       | `[0-9]+`       | `NUMBER("45")`  |
| 7        | `+`        | `[-+*/]`       | `OP("+")`       |
| 8        | `@`        | `.`            | `INVALID("@")`  |
| 9        | (fin)      | `<<EOF>>`      | `EOF`           |

**Secuencia de tokens:**
```
NUMBER("123"), OP("**"), NUMBER("45"), OP("+"), INVALID("@"), EOF
```

---

### Pregunta 3.3 — Por qué `**` debe aparecer antes que `[-+*/]`

Los lexers aplican las reglas en **orden de declaración** cuando hay ambigüedad. Si la regla `[-+*/]` apareciera primero, al encontrar `**` el lexer haría lo siguiente:

1. Compara `*` con `[-+*/]` → coincide → devuelve `OP("*")`.
2. Compara el segundo `*` con `[-+*/]` → coincide → devuelve `OP("*")`.

El resultado sería **dos tokens `OP("*")`** en lugar de un único `OP("**")`. El parser esperaría una expresión entre ambos asteriscos y fallaría.

Al colocar `"**"` antes, el lexer tiene preferencia por la coincidencia más larga: al ver `**` usa esa regla y produce **un solo token** `OP("**")`.

Este principio se llama **regla del prefijo más largo** combinada con **prioridad por orden**: ante dos reglas que coinciden con el mismo prefijo, gana la que aparece primero en el fichero.

---

### Pregunta 3.4 — Cuándo se devuelve EOF

La regla especial `<<EOF>>` se activa cuando el lexer ha consumido **todos los caracteres de la entrada** y no quedan más por leer. Es el equivalente al fin de fichero en un flujo de entrada.

El token `EOF` sirve para indicarle al parser que la entrada ha terminado. Esto permite que la producción:
```
L → E EOF
```
verifique que la expresión se ha reconocido completamente, sin caracteres sobrantes al final.

> **Nota de implementación:** Si no existiera esta regla, el parser no sabría distinguir entre "la expresión es válida y ha terminado" y "hay caracteres pendientes por procesar".

---

### Pregunta 3.5 — Por qué existe la regla `.` que devuelve INVALID

El punto `.` en expresiones regulares coincide con **cualquier carácter** que no haya sido capturado por las reglas anteriores. Esta regla actúa como un **comodín de último recurso**.

Sin ella, si el usuario escribe un carácter no reconocido (como `@`, `#`, `$`, o letras), el lexer generaría un error no controlado y el programa se detendría abruptamente.

Con la regla `.` → `INVALID`:
- El lexer **no falla silenciosamente**: siempre produce un token.
- El parser recibe `INVALID` y puede generar un **mensaje de error descriptivo** indicando qué carácter es inválido y en qué posición.
- El proceso de recuperación de errores puede continuar si se desea.

En resumen, es una regla de robustez que garantiza que ningún carácter de entrada quede sin procesar.

---
## 5. Modificaciones al analizador léxico

### Modificación Comentarios de línea `//`

**Objetivo:** Ignorar todo texto que empiece por `//` hasta el final de la línea.

**Regla añadida** (debe ir antes que cualquier otra, para tener máxima prioridad):

```jison
"//".+   { /* skip single-line comments */; }
```

**Explicación de la expresión regular:**

| Fragmento | Significado                                      |
| --------- | ------------------------------------------------ |
| `//`    | Los dos caracteres literales `//`  |
| `.*`  | Cero o más caracteres que no sean salto de línea |

Al igual que `\s+`, esta regla no devuelve ningún token: el comentario se descarta completamente. El lexer avanza hasta el final del comentario y continúa procesando la siguiente línea.

**Ejemplo:**
```
3 + 4 // suma básica
```
Tokens producidos: `NUMBER("3")`, `OP("+")`, `NUMBER("4")`, `EOF`.

---

### Modificación Números en punto flotante

**Objetivo:** Reconocer formatos como `2.35e-3`, `2.35e+3`, `2.35E-3`, `2.35` y `23`.

**Regla modificada:**

```jison
/* Antes (solo enteros): */
[0-9]+

/* Después (enteros y flotantes): */
[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?
```

**Explicación detallada:**

| Fragmento            | Significado                                       | Opcional |
| -------------------- | ------------------------------------------------- | -------- |
| `[0-9]+`             | Parte entera: uno o más dígitos                   | No       |
| `(\.[0-9]+)?`        | Parte decimal: punto seguido de uno o más dígitos | Sí (`?`) |
| `([eE][+-]?[0-9]+)?` | Exponente: `e` o `E`, signo opcional, dígitos     | Sí (`?`) |

Esta expresión regular acepta:

| Cadena    | Parte entera | Parte decimal | Exponente |
| --------- | ------------ | ------------- | --------- |
| `23`      | `23`         | —             | —         |
| `2.35`    | `2`          | `.35`         | —         |
| `2.35e3`  | `2`          | `.35`         | `e3`      |
| `2.35e-3` | `2`          | `.35`         | `e-3`     |
| `2.35E+3` | `2`          | `.35`         | `E+3`     |

La función `convert` también se actualiza para usar `parseFloat` en lugar de `parseInt`, ya que `parseFloat` interpreta correctamente todos estos formatos.

---

### Resultado final del bloque léxico

```jison
%lex
%%

"//".*                                { /* skip single-line comments */; }
\s+                                   { /* skip whitespace */; }
[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?   { return 'NUMBER'; }
"**"                                  { return 'OP'; }
[-+*/]                                { return 'OP'; }
<<EOF>>                               { return 'EOF'; }
.                                     { return 'INVALID'; }
/lex
```

**Orden de las reglas y justificación:**

1. `"//".*` — Comentarios primero para que `//` no se interprete como dos operadores `/`.
2. `\s+` — Espacios antes que números para no perder tiempo.
3. `[0-9]+...` — Número antes que operadores (el dígito no es operador).
4. `"**"` — Doble asterisco **antes** que el simple `*` (prioridad de coincidencia).
5. `[-+*/]` — Operadores simples.
6. `<<EOF>>` — Fin de entrada.
7. `.` — Comodín de último recurso.

---

## 6. Pruebas Jest

### Configuración de Jest

Jest se configura en `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node"
  }
}
```

Jest descubre automáticamente los ficheros en `__tests__/` con extensión `.test.js`.

### Organización de las pruebas

Las pruebas están agrupadas con `describe()` (grupos) y `test()` (casos individuales), siguiendo el principio **AAA** (Arrange, Act, Assert):

```javascript
test('descripción del caso', () => {
  // Arrange: preparar datos
  const expr = '3 + 4';
  // Act: ejecutar
  const result = parser.parse(expr);
  // Assert: verificar
  expect(result).toBe(7);
});
```

### Grupos de pruebas

| Grupo                           | Qué verifica                                              |
| ------------------------------- | --------------------------------------------------------- |
| Operaciones básicas con enteros | `+`, `-`, `*`, `/`, número solo                           |
| Asociatividad izquierda         | `3-2-1=0`, `12/4/3=1` (no son asociativos por la derecha) |
| Espacios en blanco              | Múltiples espacios, tabuladores, saltos de línea          |
| Operador de potencia `**`       | `2**10=1024`, `5**0=1`, asociatividad izquierda           |
| Números en punto flotante       | `2.35`, `2.35e+3`, `2.35e-3`, `2.35E3`, `0.5`             |
| Comentarios de línea `//`       | Comentario al final, con operadores dentro, texto largo   |
| Entradas inválidas              | Token `@`, cadena vacía, operador sin operando derecho    |

### Matchers utilizados

- `toBe(value)`: igualdad estricta (`===`). Usado para enteros.
- `toBeCloseTo(value)`: comparación con tolerancia de error flotante. Usado para floats para evitar errores de redondeo binario (e.g. `0.1 + 0.2 ≠ 0.3` exactamente en IEEE 754).
- `toThrow()`: verifica que la función lanza una excepción.

### Ejemplo de prueba para comentarios (ejercicio 5)

```javascript
describe('Comentarios de línea //', () => {
  test('comentario al final de la expresión se ignora', () => {
    expect(calc('3 + 4 // esto es un comentario')).toBe(7);
  });

  test('comentario con operadores dentro se ignora', () => {
    expect(calc('5 + 5 // + 999')).toBe(10);
  });
});
```

### Ejemplo de prueba para floats (ejercicio 5)

```javascript
describe('Números en punto flotante', () => {
  test('notación científica negativa: 2.35e-3', () => {
    expect(calc('2.35e-3')).toBeCloseTo(0.00235);
  });

  test('notación científica positiva: 2.35e+3 = 2350', () => {
    expect(calc('2.35e+3')).toBeCloseTo(2350);
  });
});
```

---

## 7. Referencia de la gramática y la SDD

### Gramática completa

```
L  →  E EOF
E  →  E OP T   |   T
T  →  NUMBER
```

### Definiciones regulares de tokens

```
digit   →  [0-9]
number  →  digit+ (. digit+)? ([eE] [+-]? digit+)?
op      →  +  |  -  |  *  |  /  |  **
```

### Tabla de la SDD

| Producción    | Regla semántica                                     |
| ------------- | --------------------------------------------------- |
| `L → E EOF`   | `L.value = E.value`                                 |
| `E → E₁ OP T` | `E.value = operate(OP.lexvalue, E₁.value, T.value)` |
| `E → T`       | `E.value = T.value`                                 |
| `T → NUMBER`  | `T.value = convert(NUMBER.lexvalue)`                |

### Función `operate`

```javascript
function operate(op, left, right) {
  switch (op) {
    case '+':  return left + right;
    case '-':  return left - right;
    case '*':  return left * right;
    case '/':  return left / right;
    case '**': return Math.pow(left, right);
  }
}
```

### Función `convert`

```javascript
function convert(str) {
  return parseFloat(str);  // Cubre enteros, decimales y notación científica
}
```

> `parseFloat("42")` devuelve `42`, `parseFloat("2.35e-3")` devuelve `0.00235`.  
> Es preferible a `parseInt` cuando los números pueden ser flotantes.

---

## Notas sobre el entorno sin conexión a red

En este repositorio se incluye `src/parser.js` con una **implementación manual** del parser que reproduce fielmente el comportamiento del parser generado por Jison. Esto permite ejecutar las pruebas sin necesidad de conexión a internet para descargar Jison.

En un entorno con conexión, el fichero `src/parser.js` debe regenerarse con:

```bash
npm install
npm run build
npm test
```

La implementación manual usa las mismas técnicas que Jison internamente:
- Un **lexer** basado en expresiones regulares JavaScript.
- Un **parser descendente recursivo** que implementa la asociatividad izquierda mediante un bucle `while`.
---
---
---
# 1. Derivaciones para las frases de ejemplo

Se usa la gramática **original** (sin precedencia):

```
L → E eof
E → E op T  |  T
T → number
```

### 1.1 Frase: `4.0 - 2.0 * 3.0`

```
L ⇒ E eof
  ⇒ E op T eof
  ⇒ E op number eof                          [T → number, number = 3.0]
  ⇒ E op 3.0 eof
  ⇒ E op T op 3.0 eof
  ⇒ E op number op 3.0 eof                   [T → number, number = 2.0]
  ⇒ E op 2.0 op 3.0 eof
  ⇒ T op 2.0 op 3.0 eof                      [E → T]
  ⇒ number op 2.0 op 3.0 eof                 [T → number, number = 4.0]
  ⇒ 4.0 - 2.0 * 3.0 eof
```

> La gramática original no distingue entre `-` y `*`, ambos son el mismo token `op`.  
> La frase se parsea como **(4.0 - 2.0) * 3.0 = 6.0** en lugar del correcto **4.0 - (2.0 * 3.0) = -2.0**.

---

### 1.2 Frase: `2 ** 3 ** 2`

```
L ⇒ E eof
  ⇒ E op T eof
  ⇒ E op number eof                          [T → number, number = 2]
  ⇒ E op 2 eof
  ⇒ E op T op 2 eof
  ⇒ E op number op 2 eof                     [T → number, number = 3]
  ⇒ E op 3 op 2 eof
  ⇒ T op 3 op 2 eof                          [E → T]
  ⇒ number op 3 op 2 eof                     [T → number, number = 2]
  ⇒ 2 ** 3 ** 2 eof
```

> La gramática original evalúa de izquierda a derecha: **(2 ** 3) ** 2 = 64**  
> El resultado matemático correcto (asociatividad derecha) sería **2 ** (3 ** 2) = 512**.

---

### 1.3 Frase: `7 - 4 / 2`

```
L ⇒ E eof
  ⇒ E op T eof
  ⇒ E op number eof                          [T → number, number = 2]
  ⇒ E op 2 eof
  ⇒ E op T op 2 eof
  ⇒ E op number op 2 eof                     [T → number, number = 4]
  ⇒ E op 4 op 2 eof
  ⇒ T op 4 op 2 eof                          [E → T]
  ⇒ number op 4 op 2 eof                     [T → number, number = 7]
  ⇒ 7 - 4 / 2 eof
```

> La gramática original evalúa: **(7 - 4) / 2 = 1.5** en lugar del correcto **7 - (4 / 2) = 5**.

---

## 2. Árboles de análisis sintáctico (parse trees)

### 2.1 Árbol para `4.0 - 2.0 * 3.0` (gramática original)

```
              L
              │
         ─────┴─────
         E          eof
    ─────┼─────
    E   op    T
    │    │    │
    T   (*)  num
    │        │
   num      3.0
    │
   E   op   T
   │    │   │
   T   (-) num
   │       │
  num     2.0
   │
  4.0
```

La recursión izquierda de `E → E op T` hace que el árbol crezca hacia la izquierda. El nodo raíz de `E` aplica primero el operador más a la derecha en la cadena, que en este caso es `*`, con operandos `(4.0 - 2.0)` y `3.0`.

**Evaluación resultante:** `operate('*', operate('-', 4.0, 2.0), 3.0)` = `operate('*', 2.0, 3.0)` = **6.0**

---

### 2.2 Árbol para `2 ** 3 ** 2` (gramática original)

```
              L
              │
         ─────┴─────
         E          eof
    ─────┼──────
    E   op     T
    │   (**)   │
    │          num
    │           │
    │          2
  ──┼──────
  E   op     T
  │   (**)   │
  │          num
  │           │
  T          3
  │
 num
  │
  2
```

**Evaluación resultante:** `operate('**', operate('**', 2, 3), 2)` = `operate('**', 8, 2)` = **64**

El resultado matemáticamente correcto (asociatividad derecha) sería:  
`operate('**', 2, operate('**', 3, 2))` = `operate('**', 2, 9)` = **512**

---

### 2.3 Árbol para `7 - 4 / 2` (gramática original)

```
              L
              │
         ─────┴─────
         E          eof
    ─────┼─────
    E   op    T
    │   (/)   │
    │        num
    │         │
    │         2
  ──┼──
  E   op   T
  │   (-)  │
  T       num
  │        │
 num       4
  │
  7
```

**Evaluación resultante:** `operate('/', operate('-', 7, 4), 2)` = `operate('/', 3, 2)` = **1.5**

El resultado matemáticamente correcto sería:  
`operate('-', 7, operate('/', 4, 2))` = `operate('-', 7, 2)` = **5**

---

## 3. Orden de evaluación de las acciones semánticas

En una SDD con atributos **sintetizados** (como la de esta práctica), las acciones semánticas se evalúan en **orden post-orden** del árbol de derivación: primero los nodos hoja, luego los nodos interiores, de abajo hacia arriba.

### 3.1 Para `4.0 - 2.0 * 3.0`

El orden es:

1. `T → number(4.0)` → `T.value = convert("4.0") = 4.0`
2. `E → T` → `E.value = 4.0`
3. `T → number(2.0)` → `T.value = convert("2.0") = 2.0`
4. `E → E op T` con op=`-` → `E.value = operate('-', 4.0, 2.0) = 2.0`
5. `T → number(3.0)` → `T.value = convert("3.0") = 3.0`
6. `E → E op T` con op=`*` → `E.value = operate('*', 2.0, 3.0) = 6.0`
7. `L → E eof` → `L.value = 6.0`

**Resultado:** 6.0 (incorrecto matemáticamente; debería ser -2.0)

### 3.2 Para `2 ** 3 ** 2`

1. `T → number(2)` → `T.value = 2`
2. `E → T` → `E.value = 2`
3. `T → number(3)` → `T.value = 3`
4. `E → E op T` con op=`**` → `E.value = operate('**', 2, 3) = 8`
5. `T → number(2)` → `T.value = 2`
6. `E → E op T` con op=`**` → `E.value = operate('**', 8, 2) = 64`
7. `L → E eof` → `L.value = 64`

**Resultado:** 64 (incorrecto; debería ser 512 con asociatividad derecha)

### 3.3 Para `7 - 4 / 2`

1. `T → number(7)` → `T.value = 7`
2. `E → T` → `E.value = 7`
3. `T → number(4)` → `T.value = 4`
4. `E → E op T` con op=`-` → `E.value = operate('-', 7, 4) = 3`
5. `T → number(2)` → `T.value = 2`
6. `E → E op T` con op=`/` → `E.value = operate('/', 3, 2) = 1.5`
7. `L → E eof` → `L.value = 1.5`

**Resultado:** 1.5 (incorrecto; debería ser 5)

---

## 4. Por qué los resultados no coinciden con los convenios matemáticos

La gramática original tiene **dos problemas estructurales**:

### Problema 1: Ausencia de precedencia

La gramática original tiene un único nivel de expresión (`E`) con un único token `op` para todos los operadores. Al no haber distinción gramatical entre `+`, `-`, `*`, `/` y `**`, todos tienen la **misma precedencia**. El orden en que se aplican los operadores viene determinado únicamente por la estructura del árbol (de izquierda a derecha), sin respetar que `*` debe ejecutarse antes que `+`, o que `**` debe ejecutarse antes que `*`.

### Problema 2: Asociatividad incorrecta para `**`

La producción `E → E op T` es **recursiva por la izquierda**, lo que codifica asociatividad izquierda para todos los operadores. Matemáticamente, la potenciación es asociativa por la derecha: `a ** b ** c` debe interpretarse como `a ** (b ** c)`. Con la gramática original se evalúa como `(a ** b) ** c`, que produce resultados distintos (e.g., `2 ** 3 ** 2` da 64 en lugar de 512).

### Solución

Introducir tres niveles gramaticales distintos, uno por nivel de precedencia:

| Nivel | Operadores | Asociatividad | No terminal |
|-------|-----------|---------------|-------------|
| Bajo  | `+` `-`   | Izquierda     | `E`         |
| Medio | `*` `/`   | Izquierda     | `T`         |
| Alto  | `**`      | **Derecha**   | `R`         |

---

## 5. Modificación de la gramática: precedencia y asociatividad

### SDD modificada

| Producción | Regla semántica |
|---|---|
| `L → E eof` | `L.value = E.value` |
| `E → E₁ opad T` | `E.value = operate(opad.lexvalue, E₁.value, T.value)` |
| `E → T` | `E.value = T.value` |
| `T → T₁ opmu R` | `T.value = operate(opmu.lexvalue, T₁.value, R.value)` |
| `T → R` | `T.value = R.value` |
| `R → F opow R₁` | `R.value = operate(opow.lexvalue, F.value, R₁.value)` |
| `R → F` | `R.value = F.value` |
| `F → number` | `F.value = convert(number.lexvalue)` |

### Tokens diferenciados

```
opad  →  +  |  -
opmu  →  *  |  /
opow  →  **
```

### Cómo se codifica cada propiedad

**Precedencia** mediante jerarquía de no terminales: `E` llama a `T`, que llama a `R`, que llama a `F`. Los operadores de mayor precedencia están en los niveles más profundos del árbol, por lo que se evalúan antes.

**Asociatividad izquierda** para `+`, `-`, `*`, `/` mediante **recursión izquierda** en las producciones `E → E opad T` y `T → T opmu R`. En el parser descendente recursivo se implementa con un bucle `while`.

**Asociatividad derecha** para `**` mediante **recursión derecha** en `R → F opow R`. En el parser descendente recursivo se implementa con una llamada recursiva al propio `parsePower()` para el exponente.

### Verificación con los ejemplos originales

| Expresión | Gramática original | Gramática modificada | Resultado correcto |
|---|---|---|---|
| `4.0 - 2.0 * 3.0` | `(4.0 - 2.0) * 3.0 = 6.0` | `4.0 - (2.0 * 3.0) = -2.0` | **-2.0** ✓ |
| `2 ** 3 ** 2` | `(2 ** 3) ** 2 = 64` | `2 ** (3 ** 2) = 512` | **512** ✓ |
| `7 - 4 / 2` | `(7 - 4) / 2 = 1.5` | `7 - (4 / 2) = 5` | **5** ✓ |

---

## 6. Soporte de paréntesis

Se añade la producción en el nivel de mayor precedencia (`F`), de modo que una expresión entre paréntesis puede aparecer en cualquier lugar donde se espera un número:

| Producción | Regla semántica |
|---|---|
| `F → ( E )` | `F.value = E.value` |

Se añaden dos nuevos tokens al léxico: `(` y `)`.

Al colocar la producción en `F` (el nivel más bajo en el árbol, es decir, el de mayor precedencia), los paréntesis tienen la máxima prioridad: su contenido se evalúa completamente antes de participar en cualquier otra operación.

### Ejemplos

| Expresión | Sin paréntesis | Con paréntesis | Resultado |
|---|---|---|---|
| `(2 + 3) * 4` | `2 + (3*4) = 14` | `(2+3) * 4 = 20` | **20** ✓ |
| `(2 ** 3) ** 2` | `2 ** (3**2) = 512` | `(2**3) ** 2 = 64` | **64** ✓ |
| `10 / (5 - 3)` | `(10/5) - 3 = -1` | `10 / (5-3) = 5` | **5** ✓ |

---

## 7. Estructura del proyecto

```
.
├── package.json               # Configuración del proyecto
├── README.md                  # Esta documentación
├── src
│   ├── grammar.jison          # SDD modificada (precedencia + paréntesis)
│   ├── parser.js              # Parser generado por Jison (o manual equivalente)
│   └── index.js               # Punto de entrada CLI
└── __tests__
    ├── parser.test.js         # Tests originales de la PL#4
    ├── prec.test.js           # Tests de precedencia — ejercicio 1.4
    ├── prec_float.test.js     # Tests de precedencia con flotantes — ejercicio 3
    └── paren.test.js          # Tests de paréntesis — ejercicio 5
```

### Cambios respecto a la PL#4

| Fichero | Cambio |
|---|---|
| `src/grammar.jison` | Tres niveles de precedencia (`E`, `T`, `R`, `F`); tokens `OPAD`, `OPMU`, `OPOW`; regla `F → '(' E ')'` |
| `__tests__/prec.test.js` | Nuevo — tests de precedencia (fallan con la gramática original) |
| `__tests__/prec_float.test.js` | Nuevo — tests de precedencia y asociatividad con flotantes |
| `__tests__/paren.test.js` | Nuevo — tests de expresiones entre paréntesis |

---

## 8. Ejecución de tests

### Instalar dependencias

```bash
npm install
```

### Generar el parser con Jison

```bash
npm run build
# equivale a: jison src/grammar.jison -o src/parser.js
```

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar suites de tests individuales

```bash
# Tests de precedencia (ejercicio 1.4)
npx jest __tests__/prec.test.js

# Tests de flotantes con precedencia (ejercicio 3)
npx jest __tests__/prec_float.test.js

# Tests de paréntesis (ejercicio 5)
npx jest __tests__/paren.test.js
```

### Usar la calculadora desde la línea de comandos

```bash
# Precedencia correcta
node src/index.js "2 + 3 * 4"       # => 14
node src/index.js "2 ** 3 ** 2"     # => 512  (asociatividad derecha)
node src/index.js "7 - 4 / 2"       # => 5

# Con paréntesis
node src/index.js "(2 + 3) * 4"     # => 20
node src/index.js "(2 ** 3) ** 2"   # => 64   (fuerza asociatividad izquierda)

# Con flotantes
node src/index.js "1.5 + 2.0 * 3.0" # => 7.5
node src/index.js "2.35e-3 + 1"      # => 1.00235

# Con comentarios
node src/index.js "3 + 4 // suma"    # => 7
```

---

## Referencias

- Aho, Lam, Sethi, Ullman — *Compilers: Principles, Techniques, and Tools* (Dragon Book), 2ª ed.
- [Jison documentation](http://jison.org/)
- [Jest documentation](https://jestjs.io/)