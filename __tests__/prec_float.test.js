/**
 * prec_float.test.js
 * Pruebas de precedencia y asociatividad con números en punto flotante.
 * Ejercicio 3 de la Práctica de Laboratorio #5.
 */
const parse = require("../src/parser.js").parse;

describe('Precedence and associativity with floats', () => {
  describe('Multiplicative before additive', () => {
    test('float multiplication has higher precedence than addition', () => {
      expect(parse("1.5 + 2.0 * 3.0")).toBeCloseTo(7.5);   // 1.5 + (2.0 * 3.0) = 7.5
      expect(parse("10.0 - 4.0 / 2.0")).toBeCloseTo(8.0);  // 10.0 - (4.0 / 2.0) = 8.0
      expect(parse("2.5 * 2.0 + 1.5")).toBeCloseTo(6.5);   // (2.5 * 2.0) + 1.5 = 6.5
      expect(parse("9.0 / 3.0 - 1.5")).toBeCloseTo(1.5);   // (9.0 / 3.0) - 1.5 = 1.5
    });

    test('float division has higher precedence than subtraction', () => {
      expect(parse("5.5 - 3.0 / 1.5")).toBeCloseTo(3.5);   // 5.5 - (3.0/1.5) = 5.5 - 2 = 3.5
      expect(parse("0.5 + 0.25 * 4.0")).toBeCloseTo(1.5);  // 0.5 + (0.25*4) = 0.5 + 1 = 1.5
    });
  });

  describe('Exponentiation has highest precedence with floats', () => {
    test('exponentiation before multiplication', () => {
      expect(parse("2.0 * 3.0 ** 2.0")).toBeCloseTo(18.0);  // 2.0 * (3.0 ** 2.0) = 18.0
      expect(parse("4.0 / 2.0 ** 2.0")).toBeCloseTo(1.0);   // 4.0 / (2.0 ** 2.0) = 1.0
    });

    test('exponentiation before addition', () => {
      expect(parse("1.5 + 2.0 ** 2.0")).toBeCloseTo(5.5);   // 1.5 + (2.0 ** 2.0) = 5.5
      expect(parse("10.0 - 2.0 ** 3.0")).toBeCloseTo(2.0);  // 10.0 - (2.0 ** 3.0) = 2.0
    });
  });

  describe('Left associativity for additive operators with floats', () => {
    test('subtraction is left associative', () => {
      expect(parse("4.0 - 2.0 - 1.0")).toBeCloseTo(1.0);    // (4.0 - 2.0) - 1.0 = 1.0
      expect(parse("10.5 - 3.5 - 2.0")).toBeCloseTo(5.0);   // (10.5 - 3.5) - 2.0 = 5.0
    });

    test('addition is left associative', () => {
      expect(parse("1.0 + 2.0 + 3.0")).toBeCloseTo(6.0);    // (1.0 + 2.0) + 3.0 = 6.0
      expect(parse("0.1 + 0.2 + 0.3")).toBeCloseTo(0.6);    // (0.1 + 0.2) + 0.3 ≈ 0.6
    });
  });

  describe('Left associativity for multiplicative operators with floats', () => {
    test('division is left associative', () => {
      expect(parse("8.0 / 2.0 / 2.0")).toBeCloseTo(2.0);    // (8.0 / 2.0) / 2.0 = 2.0
      expect(parse("12.0 / 3.0 / 2.0")).toBeCloseTo(2.0);   // (12.0 / 3.0) / 2.0 = 2.0
    });

    test('multiplication is left associative', () => {
      expect(parse("2.0 * 3.0 * 4.0")).toBeCloseTo(24.0);   // (2.0 * 3.0) * 4.0 = 24.0
    });
  });

  describe('Right associativity for exponentiation with floats', () => {
    test('exponentiation is right associative', () => {
      expect(parse("2.0 ** 3.0 ** 2.0")).toBeCloseTo(512.0); // 2.0 ** (3.0 ** 2.0) = 2 ** 9 = 512
      expect(parse("4.0 ** 0.5 ** 1.0")).toBeCloseTo(2.0);   // 4.0 ** (0.5 ** 1.0) = 4 ** 0.5 = 2
    });
  });

  describe('Mixed float operations with correct precedence', () => {
    test('complex mixed expressions', () => {
      expect(parse("1.5 + 2.5 * 2.0 - 0.5")).toBeCloseTo(6.0);  // 1.5 + (2.5*2.0) - 0.5 = 6.0
      expect(parse("3.0 ** 2.0 + 1.5 * 2.0")).toBeCloseTo(12.0); // (3**2) + (1.5*2) = 9 + 3 = 12
      expect(parse("2.5 * 4.0 / 2.0 + 1.0")).toBeCloseTo(6.0);  // ((2.5*4)/2) + 1 = 6.0
    });

    test('scientific notation with precedence', () => {
      expect(parse("1e1 + 2e0 * 3e0")).toBeCloseTo(16.0);  // 10 + (2*3) = 16
      expect(parse("1.5e1 - 2.0e0 ** 2.0")).toBeCloseTo(11.0); // 15 - 4 = 11
    });
  });
});