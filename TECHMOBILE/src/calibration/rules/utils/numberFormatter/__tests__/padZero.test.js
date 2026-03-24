/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import padZero from "../padZero";

describe("padZero", () => {
  const precision = 5;
  describe("nullable is true", () => {
    const nullable = true;
    it("Should return empty string for empty input", async () => {
      // Arrange
      const expected = "";
      const input = "";

      // Act
      const actual = padZero(input, precision, nullable);

      // Assert
      expect(actual).toEqual(expected);
    });
    it("Should return null for null input", async () => {
      // Arrange
      const expected = null;
      const input = null;

      // Act
      const actual = padZero(input, precision, nullable);

      // Assert
      expect(actual).toEqual(expected);
    });
    it("Should properly return undefined for undefined input", async () => {
      // Arrange
      const expected = undefined;
      const input = undefined;

      // Act
      const actual = padZero(input, precision, nullable);

      // Assert
      expect(actual).toEqual(expected);
    });
  });
  it("Should return 0.00000 for empty input when nullable is false", async () => {
    // Arrange
    const expected = "0.00000";
    const input = 0;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should return  0.00000 for null input when nullable is false", async () => {
    // Arrange
    const expected = "0.00000";
    const input = null;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should properly return  0.00000 for undefined input when nullable is false", async () => {
    // Arrange
    const expected = "0.00000";
    const input = undefined;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should properly pad for integer", async () => {
    // Arrange
    const expected = "5000.00000";
    const input = 5000;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should properly pad for decimal number", async () => {
    // Arrange
    const expected = "5000.10000";
    const input = 5000.1;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should propelry remove zeros for more precise input", async () => {
    // Arrange
    const expected = "5000.00000";
    const input = 5000.0;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should propelry pad zeros for high precision decimal", async () => {
    // Arrange
    const expected = "5000.00010";
    const input = 5000.0001;

    // Act
    const actual = padZero(input, precision);

    // Assert
    expect(actual).toEqual(expected);
  });
});
