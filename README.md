# Procesadores de Lenguajes — Práctica de Laboratorio #4
### Calculadora con SDD usando Jison

> **Asignatura:** Procesadores de Lenguajes · Grado en Ingeniería Informática  
> **Área:** Lenguajes y Sistemas Informáticos  
> **Autor:** Raúl González Acosta (alu0101543529)   
> **Curso:** 2025/2026

---

## Tabla de contenidos

1. [Conceptos teóricos previos](#1-conceptos-teóricos-previos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Instalación y ejecución paso a paso](#3-instalación-y-ejecución-paso-a-paso)

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
      ✓ should handle multiple operations of same precedence
    Edge cases
      ✓ should handle expressions with extra whitespace
      ✓ should handle zero in operations (1 ms)
      ✓ should handle division by zero (1 ms)
      ✓ should handle negative results
      ✓ should handle decimal results (1 ms)
      ✓ should handle large numbers
    Input validation and error cases
      ✓ should handle invalid input gracefully (23 ms)
      ✓ should handle incomplete expressions (7 ms)
    Regression tests
      ✓ should match examples from index.js
      
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        0.289 s, estimated 1 s
```

### Paso 4: Usar la calculadora desde la línea de comandos

```bash
# Evaluar una expresión simple
./src/index.js 3+4*2
# => 14

# Con potencia
./src/index.js 2**10
# => 1024
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