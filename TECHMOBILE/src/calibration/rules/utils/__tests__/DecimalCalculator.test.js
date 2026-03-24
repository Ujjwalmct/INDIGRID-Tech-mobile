/*
 * Licensed Materials - Property of IBM
 * "Restricted Materials of IBM"
 *
 * 5725-M39
 *
 * (C) COPYRIGHT IBM CORP. 2016 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 *
 */

/** Implementation */
import DecimalCalculaltor from "../DecimalCalculator.js";

describe("DecimalCalculator", () => {
  describe("plus", () => {
    it("Should return correct values on addition between 2 positive numbers", async () => {
      // Arrange
      const a = 1;
      const b = 2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.plus(a, b);

      // Assert
      expect(answer).toEqual(3);
    });

    it("Should return correct values on addition between 2 negative numbers", async () => {
      // Arrange
      const a = -1;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.plus(a, b);

      // Assert
      expect(answer).toEqual(-3);
    });

    it("Should return correct values on addition between a positive and negative number", async () => {
      // Arrange
      const a = 3;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.plus(a, b);

      // Assert
      expect(answer).toEqual(1);
    });

    it("Should return correct values on addition between decimal numbers", async () => {
      // Arrange
      const a = 3.012;
      const b = 1.1;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.plus(a, b);

      // Assert
      expect(answer).toEqual(4.112);
    });

    it("Should return 0 when null values are given", async () => {
      // Arrange
      const a = null;
      const b = null;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.plus(a, b);

      // Assert
      expect(answer).toEqual(0);
    });
  });

  describe("minus", () => {
    it("Should return correct values on subtraction between 2 positive numbers", async () => {
      // Arrange
      const a = 2;
      const b = 1;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.minus(a, b);

      // Assert
      expect(answer).toEqual(1);
    });

    it("Should return correct values on subtraction between 2 negative numbers", async () => {
      // Arrange
      const a = -2;
      const b = -1;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.minus(a, b);

      // Assert
      expect(answer).toEqual(-1);
    });

    it("Should return correct values on subtraction between a positive and negative number", async () => {
      // Arrange
      const a = 3;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.minus(a, b);

      // Assert
      expect(answer).toEqual(5);
    });

    it("Should return correct values on subtraction between decimal numbers", async () => {
      // Arrange
      const a = 3.112;
      const b = 1.1;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.minus(a, b);

      // Assert
      expect(answer).toEqual(2.012);
    });

    it("Should return 0 when null values are given", async () => {
      // Arrange
      const a = null;
      const b = null;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.minus(a, b);

      // Assert
      expect(answer).toEqual(0);
    });
  });

  describe("multiply", () => {
    it("Should return correct values on multiplication between 2 positive numbers", async () => {
      // Arrange
      const a = 3;
      const b = 2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.multiply(a, b);

      // Assert
      expect(answer).toEqual(6);
    });

    it("Should return correct values on multiplication between 2 negative numbers", async () => {
      // Arrange
      const a = -3;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.multiply(a, b);

      // Assert
      expect(answer).toEqual(6);
    });

    it("Should return correct values on multiplication between a positive and negative number", async () => {
      // Arrange
      const a = 3;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.multiply(a, b);

      // Assert
      expect(answer).toEqual(-6);
    });

    it("Should return correct values on multiplication between decimal numbers", async () => {
      // Arrange
      const a = 3.1;
      const b = 1.5;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.multiply(a, b);

      // Assert
      expect(answer).toEqual(4.65);
    });

    it("Should return 0 when null values are given", async () => {
      // Arrange
      const a = null;
      const b = null;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.multiply(a, b);

      // Assert
      expect(answer).toEqual(0);
    });
  });

  describe("divide", () => {
    it("Should return correct values on division between 2 positive numbers", async () => {
      // Arrange
      const a = 6;
      const b = 2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(3);
    });

    it("Should return correct values on division between 2 negative numbers", async () => {
      // Arrange
      const a = -6;
      const b = -3;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should return correct values on division between a positive and negative number", async () => {
      // Arrange
      const a = 10;
      const b = -2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(-5);
    });

    it("Should return correct values on division between a negative and positive number", async () => {
      // Arrange
      const a = -10;
      const b = 2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(-5);
    });

    it("Should return correct fractional values on division between 2 numbers", async () => {
      // Arrange
      const a = 5;
      const b = 2;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(2.5);
    });

    it("Should return correct fractional values on division between an integer and a decimal number", async () => {
      // Arrange
      const a = 3;
      const b = 1.5;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should return correct fractional values on division between decimal numbers", async () => {
      // Arrange
      const a = 5.1;
      const b = 1.5;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(3.4);
    });

    it("Should return infinity when trying to divide by 0", async () => {
      // Arrange
      const a = 2;
      const b = 0;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(Infinity);
    });

    it("Should return Nan when null values are given", async () => {
      // Arrange
      const a = null;
      const b = null;
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.divide(a, b);

      // Assert
      expect(answer).toEqual(NaN);
    });
  });

  describe("scaletoint", () => {
    it("Should scale positive numbers for 1 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.2;
      const places = 1;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(12);
    });

    it("Should scale positive numbers for 2 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.23;
      const places = 2;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(123);

      //TODO : GRAPHITE-73770 Find out why (1.12 * 100) results in 112.0000000001 instead of 112)
    });

    it("Should scale positive numbers for 3 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.234;
      const places = 3;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(1234);
    });

    it("Should scale positive numbers for 4 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.2345;
      const places = 4;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(12345);
    });

    it("Should scale positive numbers for 5 decimal place", async () => {
      //TODO : GRAPHITE-73770 Find out why (1.23456 * 10000) results in 123456.00000000001 instead of 123456)

      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.23456;
      const places = 5;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(123456);
    });

    it("Should scale positive numbers for 6 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.234567;
      const places = 6;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(1234567);
    });

    it("Should scale positive numbers for 7 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.2345678;
      const places = 7;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(12345678);
    });

    it("Should scale positive numbers for 8 decimal place", async () => {
      //TODO GRAPHITE-773770 FIND OUT WHY 1.23456789 * 100000000 = 123456788.99999999 instead of 123456789
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.23456789;
      const places = 8;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(123456789);
    });

    it("Should scale positive numbers for 11 decimal place", async () => {
      //TODO GRAPHITE-73770 FIND OUT WHY 1.23456789012 * 100000000000 = 123456789011.99998 instead of 123456789012
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = 1.23456789012;
      const places = 11;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(123456789012);
    });

    it("Should scale negative numbers for 1 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = -1.1;
      const places = 1;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(-11);
    });

    it("Should scale negative numbers for 2 decimal place", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const float = -1.12;
      const places = 2;

      // Act
      const answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(-112);
    });

    it("Should result in 0 if float is null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      let float = null;
      let places = null;

      // Act
      let answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(0);

      // Arrange
      places = 1;

      // Act
      answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(0);
    });

    it("Should return float if places is null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      let float = 1;
      let places = null;

      // Act
      let answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(1);

      // Arrange
      float = 12;

      // Act
      answer = calculator.scaleToInt(float, places);

      // Assert
      expect(answer).toEqual(12);
    });
  });

  describe("scaletofloat", () => {
    it("Should correct 1 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 12;
      const places = 1;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.2);
    });

    it("Should correct 2 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 123;
      const places = 2;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.23);
    });

    it("Should correct 3 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 1234;
      const places = 3;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.234);
    });

    it("Should correct 4 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 12345;
      const places = 4;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.2345);
    });

    it("Should correct 5 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 123456;
      const places = 5;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.23456);
    });

    it("Should correct 6 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 1234567;
      const places = 6;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.234567);
    });

    it("Should correct 7 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 12345678;
      const places = 7;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.2345678);
    });

    it("Should correct 8 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 123456789;
      const places = 8;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.23456789);
    });

    it("Should correct 11 decimal float for positive int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 123456789012;
      const places = 11;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.23456789012);
    });

    it("Should correct 1 decimal float for negative int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = -12;
      const places = 1;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(-1.2);
    });

    it("Should correct 2 decimal float for negative int", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = -123;
      const places = 2;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(-1.23);
    });

    it("Should correct 3 decimal negative float", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = -1234;
      const places = 3;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(-1.234);
    });

    it("Should return 20 for any recurring decimal float ", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 1111111111111111111111111111111111111111111111;
      const places = 45;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1.11111111111111111111);
    });

    it("Should return 20 for any number with e float ", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = 2.3e5;
      const places = 4;

      // Act
      const answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(23);
    });

    it("Should return 0 if int is null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const int = null;
      let places = null;

      // Act
      let answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(0);

      places = 2;
      answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(0);
    });

    it("Should return int if places is null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      let int = 1;
      const places = null;

      // Act
      let answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(1);

      int = 12;
      answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual(12);
    });

    it("shouldKeepScientificNotationWhenMentionedInValue", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      let int = "1e100";
      const places = 0;

      // Act
      let answer = calculator.scaleToFloat(int, places);

      // Assert
      expect(answer).toEqual("1e+100");
    });
  });

  describe("maxplaces", () => {
    it("Should correctly return max places for 2 positive numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 1.9;
      const b = 2.34;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly return max places for 2 negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -1.9;
      const b = -2.34;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly return max places for 1 positive and 1 negative number", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -1.9;
      const b = 2.34;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly return max places for 1 postive and 1 null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = null;
      const b = 2.34;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly return max places for 1 negative and 1 null", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = null;
      const b = -2.34;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly return 0 when null arguments are provided", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = null;
      const b = null;

      // Act
      const answer = calculator.maxPlaces(a, b);

      // Assert
      expect(answer).toEqual(0);
    });
  });

  describe("calculate", () => {
    it("Should correctly calculate plus for 2 positive numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 1.204;
      const b = 2.03;
      const operation = "+";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(3.234);
    });

    it("Should correctly calculate plus for 2 negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -1.1;
      const b = -2.02;
      const operation = "+";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(-3.12);
    });

    it("Should correctly calculate plus for  positive and negative numbers", async () => {
      // TODO GRAPHITE 73770, find out why 2.01 + -1 = 1.0099999999999998 instead of 1.01
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 2.01;
      const b = -1;
      const operation = "+";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(1.01);
    });

    it("Should correctly calculate plus for 1 null argument", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 2;
      const b = null;
      const operation = "+";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly calculate plus for 2 null arguments", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = null;
      const b = null;
      const operation = "+";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(0);
    });

    it("Should correctly calculate minus for 2 positive numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 2.123;
      const b = 1.003;
      const operation = "-";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(1.12);
    });

    it("Should correctly calculate minus for 2 negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -1.1;
      const b = -2;
      const operation = "-";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(0.9);
    });

    it("Should correctly calculate minus for  positive and negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 2.01;
      const b = -1.1;
      const operation = "-";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(3.11);
    });

    it("Should correctly calculate minus for 1 null argument", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 2;
      const b = null;
      const operation = "-";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly calculate minus for 2 null arguments", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = null;
      const b = null;
      const operation = "-";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(0);
    });

    it("Should correctly calculate multiply for 2 positive numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 3.1;
      const b = 2;
      const operation = "*";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(6.2);
    });

    it("Should correctly calculate multiply for 2 negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -3;
      const b = -2.1;
      const operation = "*";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(6.3);
    });

    it("Should correctly calculate multiply for positive and negative numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 4.1;
      const b = -3;
      const operation = "*";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(-12.3);
    });

    it("Should correctly calculate divide for 2 positive numbers", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = 4;
      const b = 2;
      const operation = "/";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly calculate divide for 2 negative arguments", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -4;
      const b = -2;
      const operation = "/";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(2);
    });

    it("Should correctly calculate divide for 1 positive and 1 negative argument", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -4;
      const b = 2;
      const operation = "/";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(-2);
    });

    it("Should return null if operation is invalid", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();
      const a = -4;
      const b = 2;
      const operation = "x";

      // Act
      const answer = calculator.calculate(a, b, operation);

      // Assert
      expect(answer).toEqual(null);
    });
  });

  describe("convertNegativeZero", () => {
    it("Should correctly convert negative zero -0.0", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("-0.0");

      // Assert
      expect(answer).toEqual("0.0");
    });

    it("Should correctly convert negative zero -0", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("-0");

      // Assert
      expect(answer).toEqual("0");
    });

    it("Should correctly convert negative zero -0.00000", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("-0.00000");

      // Assert
      expect(answer).toEqual("0.00000");
    });

    it("Should not convert other negative value -0.00001", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("-0.00001");

      // Assert
      expect(answer).toEqual("-0.00001");
    });

    it("Should not convert other negative value -10.00001", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("-10.00001");

      // Assert
      expect(answer).toEqual("-10.00001");
    });

    it("Should not convert other value 0.00001", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("0.00001");

      // Assert
      expect(answer).toEqual("0.00001");
    });

    it("Should not convert other value 10.00001", async () => {
      // Arrange
      const calculator = new DecimalCalculaltor();

      // Act
      const answer = calculator.convertNegativeZero("10.00001");

      // Assert
      expect(answer).toEqual("10.00001");
    });
  });

});
