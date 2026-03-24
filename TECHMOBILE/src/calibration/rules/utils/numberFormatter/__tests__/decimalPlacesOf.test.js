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

import decimalPlacesOf from "../decimalPlacesOf";

describe("decimalPlacesOf", () => {
  it("Should return 0 when number is undefined", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = decimalPlacesOf();

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 0 when number is null", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = decimalPlacesOf(null);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 0 when number is not a number", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = decimalPlacesOf("notANumber");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 0 when number is 10", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = decimalPlacesOf(10);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 0 when number is 100", () => {
    // Arrange
    const expected = 0;

    // Act
    const actual = decimalPlacesOf(100);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 1 when number is 0.1", () => {
    // Arrange
    const expected = 1;

    // Act
    const actual = decimalPlacesOf(0.1);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 2 when number is 0.99", () => {
    // Arrange
    const expected = 2;

    // Act
    const actual = decimalPlacesOf(0.99);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 3 when number is 100.111", () => {
    // Arrange
    const expected = 3;

    // Act
    const actual = decimalPlacesOf(100.111);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 3 when number is 10.001", () => {
    // Arrange
    const expected = 3;

    // Act
    const actual = decimalPlacesOf(10.001);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 4 when number is 10e-5", () => {
    // Arrange
    const expected = 4;

    // Act
    const actual = decimalPlacesOf(10e-5);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return 11 when number is 10e-12", () => {
    // Arrange
    const expected = 11;

    // Act
    const actual = decimalPlacesOf(10e-12);

    // Assert
    expect(actual).toEqual(expected);
  });
});
