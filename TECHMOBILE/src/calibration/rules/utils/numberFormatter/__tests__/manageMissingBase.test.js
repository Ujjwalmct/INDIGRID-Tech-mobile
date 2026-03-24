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

import manageMissingBase from "../manageMissingBase";

describe("manageMissingBase", () => {
  it("Should add 0 before '.' ", () => {
    // Arrange
    const expected = "0.2";

    // Act
    const actual = manageMissingBase(".2", ".");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should add 0 before '.' for negative number", () => {
    // Arrange
    const expected = "-0.2";

    // Act
    const actual = manageMissingBase("-.2", ".");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should not change number - no decimal", () => {
    // Arrange
    const expected = "02";

    // Act
    const actual = manageMissingBase("02", ".");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should add 0 before '.' - default separator ", () => {
    // Arrange
    const expected = "0.2";

    // Act
    const actual = manageMissingBase(".2");

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should add 0 before ',' - custom separator ", () => {
    // Arrange
    const expected = "0,2";

    // Act
    const actual = manageMissingBase(",2", ",");

    // Assert
    expect(actual).toEqual(expected);
  });
});
