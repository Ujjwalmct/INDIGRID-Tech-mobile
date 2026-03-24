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

import isEmpty from "../isEmpty";

describe("isEmpty", () => {
  it("Should return false for valid number", async () => {
    // Arrange
    const expected = false;

    // Act
    const actual = isEmpty(123);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should return false for valid string", async () => {
    // Arrange
    const expected = false;

    // Act
    const actual = isEmpty("abc");

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should return true for empty number", async () => {
    // Arrange
    const expected = true;

    // Act
    const actual = isEmpty();

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should return true for null input", async () => {
    // Arrange
    const expected = true;

    // Act
    const actual = isEmpty(null);

    // Assert
    expect(actual).toEqual(expected);
  });
  it("Should return true for undefined input", async () => {
    // Arrange
    const expected = true;

    // Act
    const actual = isEmpty(undefined);

    // Assert
    expect(actual).toEqual(expected);
  });
});
