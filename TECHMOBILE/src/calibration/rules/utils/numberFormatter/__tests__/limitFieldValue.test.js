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

import limitFieldValue from "../limitFieldValue";

describe("limitFieldValue", () => {
  it("Should format number - fraction", () => {
    // Arrange
    const expected = "2.10";

    // Act
    const actual = limitFieldValue("2.1000001", 9, 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - non-fraction", () => {
    // Arrange
    const expected = "20000000";

    // Act
    const actual = limitFieldValue("20000000", 20, 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - decimal separator is the last digit after formatting", () => {
    // Arrange
    const expected = "20";

    // Act
    const actual = limitFieldValue("20.1", 3, 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number - ", () => {
    // Arrange
    const expected = "20.14";

    // Act
    const actual = limitFieldValue("20.141", 5, 2);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number -  reducedFraction greater than maxfraction", () => {
    // Arrange
    const expected = "20";

    // Act
    const actual = limitFieldValue("20.1412", 4, 0);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number -  no integer", () => {
    // Arrange
    const expected = "0";

    // Act
    const actual = limitFieldValue(".20", 4, 0);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format number -  no fraction", () => {
    // Arrange
    const expected = "20";

    // Act
    const actual = limitFieldValue("20.", 4, 0);

    // Assert
    expect(actual).toEqual(expected);
  });
});
