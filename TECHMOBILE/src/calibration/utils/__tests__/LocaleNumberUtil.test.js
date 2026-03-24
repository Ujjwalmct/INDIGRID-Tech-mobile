/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

/** Utils */
import LocaleNumberUtil from "../LocaleNumberUtil.js";

describe("getDefaultDecimalSeparator", () => {
  it("Should return dot(.) for en-US locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("en-US");
    expect(decimalSeparator).toEqual(".");
  });

  it("Should return comma(,) for fr-FR locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("fr-FR");
    expect(decimalSeparator).toEqual(",");
  });

  it("Should return comma(,) for es-ES locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("es-ES");
    expect(decimalSeparator).toEqual(",");
  });

  it("Should return comma(,) for it-IT locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("it-IT");
    expect(decimalSeparator).toEqual(",");
  });

  it("Should return comma(,) for da-DK locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("da-DK");
    expect(decimalSeparator).toEqual(",");
  });

  it("Should return dot(.) for ja-JP locale", async () => {
    const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("ja-JP");
    expect(decimalSeparator).toEqual(".");
  });

  describe("getDefaultThousandSeparator", () => {
    it("Should return comma(,) for en-US locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getDefaultThousandSeparator("en-US");
      expect(thousandSeparator).toEqual(",");
    });

    it("Should return comma(,) for es-ES locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getDefaultThousandSeparator("es-ES");
      expect(thousandSeparator).toEqual(".");
    });

    it("Should return comma(,) for it-IT locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getDefaultThousandSeparator("it-IT");
      expect(thousandSeparator).toEqual(".");
    });

    it("Should return dot(.) for ja-JP locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getDefaultThousandSeparator("ja-JP");
      expect(thousandSeparator).toEqual(",");
    });

  });

  describe("getDecimalSeparator", () => {
    it("Should return dot(.) for en-US locale", async () => {
      const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("en-US");
      expect(decimalSeparator).toEqual(".");
    });

    it("Should return comma(,) for fr-FR locale", async () => {
      const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("fr-FR");
      expect(decimalSeparator).toEqual(",");
    });

    it("Should return comma(,) for es-ES locale", async () => {
      const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("es-ES");
      expect(decimalSeparator).toEqual(",");
    });

    it("Should return comma(,) for it-IT locale", async () => {
      const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("it-IT");
      expect(decimalSeparator).toEqual(",");
    });

    it("Should return comma(,) for da-DK locale", async () => {
      const decimalSeparator = LocaleNumberUtil.getDefaultDecimalSeparator("da-DK");
      expect(decimalSeparator).toEqual(",");
    });

  });

  describe("getThousandSeparator", () => {
    it("Should return comma(,) for en-US locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("en-US");
      expect(thousandSeparator).toEqual(",");
    });

    it("Should return comma(,) for es-ES locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("es-ES");
      expect(thousandSeparator).toEqual(".");
    });

    it("Should return comma(,) for it-IT locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("it-IT");
      expect(thousandSeparator).toEqual(".");
    });

    it("Should return dot(.) for ja-JP locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("ja-JP");
      expect(thousandSeparator).toEqual(",");
    });

    it("Should return space for en-ZA locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("en-ZA");
      expect(thousandSeparator).toEqual(" ");
    });

    it("Should return space for fr-FR locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("fr-FR");
      expect(thousandSeparator).toEqual(" ");
    });

    it("Should return space for fr-CA locale", async () => {
      const thousandSeparator = LocaleNumberUtil.getThousandSeparator("fr-CA");
      expect(thousandSeparator).toEqual(" ");
    });
  });

  describe("isValidLocaleNumber locale en-US", () => {
    it("Should return true for 1.23 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1.23","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return true for -1.23 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("-1.23","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 123 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("123","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return true for -123 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("-123","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1,000.06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1,000.06","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1,000,000.06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1,000,000.06","en-US");
      expect(isValid).toEqual(true);
    });

    it("Should return false for 10,00,000.06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("10,00,000.06","en-US");
      expect(isValid).toEqual(false);
    });

    it("Should return false for 20,06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("20,06","en-US");
      expect(isValid).toEqual(false);
    });

    it("Should return false for 1.000.06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1.000.06","en-US");
      expect(isValid).toEqual(false);
    });

  });

  describe("isValidLocaleNumber locale fr-FR", () => {
    it("Should return true for 1,23 fr-FR locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1,23","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1000,06 fr-FR locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1000,06","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1 000,06 fr-FR locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1 000,06","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1 000 000,06 fr-FR locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1 000 000,06","fr-FR");
      expect(isValid).toEqual(true);
    });

  });

  describe("isValidLocaleNumber locale en-ZA", () => {
    it("Should return true for 1,23 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1,23","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1000,06 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1000,06","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1 000,06 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1 000,06","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1 000 000,06 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1 000 000,06","en-ZA");
      expect(isValid).toEqual(true);
    });

    it("Should return false for 1000 000,06 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidLocaleNumber("1000 000,06","en-ZA");
      expect(isValid).toEqual(false);
    });
  });

  describe("isValidNumber", () => {
    it("Should return true for 123 en-ZA locale", async () => {
      const isValid = LocaleNumberUtil.isValidNumber("123","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for 1000.06 en-US locale", async () => {
      const isValid = LocaleNumberUtil.isValidNumber("1000.06","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return true for -1.23 fr-FR locale", async () => {
      const isValid = LocaleNumberUtil.isValidNumber("-1.23","fr-FR");
      expect(isValid).toEqual(true);
    });

    it("Should return false for 10,00,0.06", async () => {
      const isValid = LocaleNumberUtil.isValidNumber("10,00,0.06","fr-CA");
      expect(isValid).toEqual(false);
    });
  });

  describe('isDecimalString', () => {
    test('returns true for valid decimal strings', () => {
      expect(LocaleNumberUtil.isDecimalString('123.45')).toBe(true);
      expect(LocaleNumberUtil.isDecimalString('0.45')).toBe(true);
      expect(LocaleNumberUtil.isDecimalString('500')).toBe(false);
      expect(LocaleNumberUtil.isDecimalString('5,000.0')).toBe(false);
    });
  });
  

});
