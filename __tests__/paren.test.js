/**
 * paren.test.js
 * Pruebas para expresiones con paréntesis.
 * Ejercicio 5 de la Práctica de Laboratorio #5.
 */
const parse = require("../src/parser.js").parse;

describe('Parenthesized expressions', () => {
  describe('Basic parentheses override precedence', () => {
    test('parentheses force addition before multiplication', () => {
      expect(parse("(2 + 3) * 4")).toBe(20);    // (2+3)*4 = 20  (sin paréntesis sería 14)
      expect(parse("2 * (3 + 4)")).toBe(14);    // 2*(3+4) = 14  (sin paréntesis sería 10)
    });

    test('parentheses force subtraction before division', () => {
      expect(parse("(10 - 4) / 2")).toBe(3);    // (10-4)/2 = 3
      expect(parse("10 / (5 - 3)")).toBe(5);    // 10/(5-3) = 5
    });

    test('parentheses force addition before exponentiation', () => {
      expect(parse("(2 + 1) ** 3")).toBe(27);   // (2+1)**3 = 27  (sin paréntesis sería 3)
      expect(parse("2 ** (1 + 2)")).toBe(8);    // 2**(1+2) = 8   (sin paréntesis sería 5)
    });
  });

  describe('Nested parentheses', () => {
    test('double nesting', () => {
      expect(parse("((2 + 3) * 2) + 1")).toBe(11);   // ((5)*2)+1 = 11
      expect(parse("(2 + (3 * 4))")).toBe(14);        // 2 + 12 = 14
    });

    test('triple nesting', () => {
      expect(parse("((2 + 3) * (4 - 1))")).toBe(15); // 5 * 3 = 15
      expect(parse("(((10)))")).toBe(10);              // triple wrap
    });
  });

  describe('Parentheses with exponentiation associativity', () => {
    test('explicit left associativity via parentheses', () => {
      expect(parse("(2 ** 3) ** 2")).toBe(64);  // (8)**2 = 64  (sin paren: 2**(3**2)=512)
    });

    test('explicit right grouping matches default', () => {
      expect(parse("2 ** (3 ** 2)")).toBe(512); // same as 2 ** 3 ** 2 = 512
    });
  });

  describe('Parentheses with floats', () => {
    test('parenthesized float expressions', () => {
      expect(parse("(1.5 + 2.5) * 2.0")).toBeCloseTo(8.0);   // 4.0 * 2.0 = 8.0
      expect(parse("2.0 * (3.5 - 1.5)")).toBeCloseTo(4.0);   // 2.0 * 2.0 = 4.0
      expect(parse("(0.1 + 0.2) * 10")).toBeCloseTo(3.0);     // 0.3 * 10 ≈ 3.0
    });

    test('parentheses with exponentiation and floats', () => {
      expect(parse("(2.0 + 2.0) ** 2.0")).toBeCloseTo(16.0); // 4 ** 2 = 16
      expect(parse("(1.5 * 2.0) ** 2.0")).toBeCloseTo(9.0);  // 3 ** 2 = 9
    });
  });

  describe('Complex parenthesized expressions', () => {
    test('compound expressions', () => {
      expect(parse("(2 + 3) * (4 + 5)")).toBe(45);             // 5 * 9 = 45
      expect(parse("(10 - 2) / (2 + 2)")).toBe(2);             // 8 / 4 = 2
      expect(parse("(3 ** 2) + (4 ** 2)")).toBe(25);            // 9 + 16 = 25 (Pitágoras)
    });

    test('mixed parentheses and natural precedence', () => {
      expect(parse("(1 + 2) * 3 + 4")).toBe(13);   // (3)*3 + 4 = 9 + 4 = 13
      expect(parse("1 + 2 * (3 + 4)")).toBe(15);   // 1 + (2 * 7) = 15
      expect(parse("2 ** (2 + 1) * 3")).toBe(24);  // (2**3)*3 = 8*3 = 24
    });

    test('parentheses with comments', () => {
      expect(parse("(2 + 3) * 4 // resultado: 20")).toBe(20);
      expect(parse("(10 / 2) + 1 // mitad mas uno")).toBe(6);
    });
  });

  describe('Edge cases with parentheses', () => {
    test('single number in parentheses', () => {
      expect(parse("(42)")).toBe(42);
      expect(parse("(3.14)")).toBeCloseTo(3.14);
    });

    test('expression is only parenthesized group', () => {
      expect(parse("(2 ** 10)")).toBe(1024);
    });
  });
});