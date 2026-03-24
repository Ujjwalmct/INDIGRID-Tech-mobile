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

import fromDisplayableValue from "../fromDisplayableValue";

describe("fromDisplayableValue", () => {
  it("Should format negative number", () => {
    // Arrange
    const expected = -123456.789;

    // Act
    const actual = fromDisplayableValue("-123,456.789");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return null when value is null", () => {
    // Arrange
    const expected = null;

    // Act
    const actual = fromDisplayableValue(null);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return null when value is not string", () => {
    // Arrange
    const expected = null;

    // Act
    const actual = fromDisplayableValue();

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format positive number", () => {
    // Arrange
    const expected = 123456.789;

    // Act
    const actual = fromDisplayableValue("123,456.789");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format zero", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = fromDisplayableValue("0.000");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number when argument is Number", () => {
    // Arrange
    const expected = 0.00781;

    // Act
    const actual = fromDisplayableValue(0.00781);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number for different locales (en-US, de-DE, ...)", () => {

    let enLocaleValue = "123,456.89";
    let enActualValue = fromDisplayableValue(enLocaleValue, "en-US");
    expect(enActualValue).toEqual(123456.89);

    let frlocaleValue = "123 456,89";
    let frActualValue = fromDisplayableValue(frlocaleValue, "fr-FR");
    expect(frActualValue).toEqual(123456.89);

    let zalocaleValue = "123 456,89";
    let zaActualValue = fromDisplayableValue(zalocaleValue, "en-ZA");
    expect(zaActualValue).toEqual(123456.89);

    let deLocaleValue = "123.456,89";
    let deActualValue = fromDisplayableValue(deLocaleValue, "de-DE");
    expect(deActualValue).toEqual(123456.89);

    let arLocaleValue = "123.456,89";
    let arActualValue = fromDisplayableValue(arLocaleValue, "es-AR");
    expect(arActualValue).toEqual(123456.89);

    let arNumberLocaleValue = "20.5";
    let arNumberActualValue = fromDisplayableValue(arNumberLocaleValue, "es-AR");
    expect(arNumberActualValue).toEqual(20.5);
    
  });
});
