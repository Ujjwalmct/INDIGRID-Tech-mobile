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

import limitToMaxFraction from "../limitToMaxFraction";

describe("limitToMaxFraction", () => {
  it("Should format number - fraction", () => {
    // Arrange
    const expected = "2.10";

    // Act
    const actual = limitToMaxFraction("2.10000001", 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - non fraction", () => {
    // Arrange
    const expected = "2";

    // Act
    const actual = limitToMaxFraction("2", 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return null for null value", () => {
    // Arrange
    const expected = null;

    // Act
    const actual = limitToMaxFraction(null, 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return null for empty value", () => {
    // Arrange
    const expected = null;

    // Act
    const actual = limitToMaxFraction("", 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - fractionSize < maxfraction)", () => {
    // Arrange
    const expected = "2.00";

    // Act
    const actual = limitToMaxFraction("2.10", 5);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - fraction[maxfraction] > 5", () => {
    // Arrange
    const expected = "2.179179";

    // Act
    const actual = limitToMaxFraction("2.179179", 2);

    // Assert
    expect(actual).toEqual(expected);
  });
});
