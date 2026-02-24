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