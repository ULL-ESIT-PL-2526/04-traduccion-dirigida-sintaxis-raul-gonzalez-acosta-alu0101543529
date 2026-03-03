/* ---------- Lexer ---------- */
%lex
%%
\s+                                        { /* skip whitespace */; }
"//"[^\n]*                                 { /* skip line comments */; }
[0-9]+((\.[0-9]+)?([eE][+-]?[0-9]+)?)?     { return 'NUMBER';  }
"**"                                       { return 'OPOW';    }
[+\-]                                      { return 'OPAD';    }
[*/]                                       { return 'OPMU';    }
"("                                        { return '(';       }
")"                                        { return ')';       }
<<EOF>>                                    { return 'EOF';     }
.                                          { return 'INVALID'; }
/lex

/* ---------- Parser ---------- */
// Precedencia (de menor a mayor)
%left  OPAD
%left  OPMU
%right OPOW
%start expressions

%%
/* L → E eof */
expressions
    : expression EOF
        { return $expression; }
    ;

/* E → E opad T  |  T
   Asociatividad izquierda: + y -  */
expression
    : expression OPAD term
        { $$ = operate($OPAD, $expression, $term); }
    | term
        { $$ = $term; }
    ;

/* T → T opmu R  |  R
   Asociatividad izquierda: * y /  */
term
    : term OPMU power
        { $$ = operate($OPMU, $term, $power); }
    | power
        { $$ = $power; }
    ;

/* R → F opow R  |  F
   Asociatividad derecha: **  */
power
    : factor OPOW power
        { $$ = operate($OPOW, $factor, $power); }
    | factor
        { $$ = $factor; }
    ;

/* F → number  |  ( E )
   Producción base: número o expresión entre paréntesis */
factor
    : NUMBER
        { $$ = convert(yytext); }
    | '(' expression ')'
        { $$ = $expression; }
    ;
%%
/* ---------- Funciones auxiliares ---------- */
function operate(op, left, right) {
  switch (op) {
    case '+':  return left + right;
    case '-':  return left - right;
    case '*':  return left * right;
    case '/':  return left / right;
    case '**': return Math.pow(left, right);
    default:   throw new Error('Operador desconocido: ' + op);
  }
}

function convert(str) {
  return parseFloat(str);   // cubre enteros, decimales y notación científica
}