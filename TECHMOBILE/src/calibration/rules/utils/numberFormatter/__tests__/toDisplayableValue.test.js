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

import toDisplayableValue from "../toDisplayableValue";
import DatasheetConstants from "../../../constants/DatasheetConstants";

describe("toDisplayableValue", () => {
  /**
   * This test is associated to Case Number: TS016847585
   * Title: "Issue with DS Configuration in Maximo Mobile"
   */
  it("shouldKeepValueWhenSatisfiesMinimumResolutionField", async () => {
    // Arrange
    const minResolutionField = 0;

    const options = {
      places: minResolutionField,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // Act
    const actual = toDisplayableValue(55.00001, options);

    // Assert
    expect(actual).toEqual("55");
  });

  /**
   * This test is associated to Case Number: TS016847585
   * Title: "Issue with DS Configuration in Maximo Mobile"
   */
  it("shouldKeepValueWhenFractionDigitsIsTheSameAsMinimumResolutionField", async () => {
    // Arrange
    const minResolutionField = 5;

    const options = {
      places: minResolutionField,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // Act
    const actual = toDisplayableValue(55.00001, options);

    // Assert
    expect(actual).toEqual("55.00001");
  });

  /**
   * This test is associated to Case Number: TS016847585
   * Title: "Issue with DS Configuration in Maximo Mobile"
   */
  it("shouldExpandValueWhenNotSatisfiesMinimumResolutionField", async () => {
    // Arrange
    const minResolutionField = 10;

    const options = {
      places: minResolutionField,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // Act
    const actual = toDisplayableValue(55.00001, options);

    // Assert
    expect(actual).toEqual("55.0000100000");
  });

  /**
   * This test is associated to Case Number: TS016847585
   * Title: "Issue with DS Configuration in Maximo Mobile"
   */
  it("shouldRoundValueWhenExceedsMaxValueLength", () => {
    // Arrange
    const minResolutionField = 0;

    const options = {
      places: minResolutionField,
      round: DatasheetConstants.ROUND_VALUE,
    };

    const entries = [
      { input: 10000000000000.00000000000001, output: "10000000000000" },
      { input: 10000.99999999999999999, output: "10001" },
      { input: 9999.9999999999999999, output: "10000" },
      { input: 123.56789012345666666, output: "124" },
      { input: 55.1234512345123456, output: "55" },
      { input: 100, output: "100" },
      { input: 10, output: "10" },
      { input: 0, output: "0" },
      { input: -0.0000008000000008, output: "-0" },
      { input: -0.0000088888888, output: "-0" },
      { input: -0.9798102146848, output: "-1" },
      { input: -0.2254033307585, output: "-0" },
      { input: -10000000000000.00000000000001, output: "-10000000000000" },
    ];

    // Act
    entries.forEach((entry) => {
      const actual = toDisplayableValue(entry.input, options);
      expect(actual).toEqual(entry.output);
    });
  });

  /**
   * This test is associated to Case Number: TS016847585
   * Title: "Issue with DS Configuration in Maximo Mobile"
   */
  it("shouldLimitValueWhenMinimumExceedsMaxValueLength", () => {
    // Arrange
    const minResolutionField = DatasheetConstants.MAX_VALUE_LENGTH * 2;

    const options = {
      places: minResolutionField,
      round: DatasheetConstants.ROUND_VALUE,
    };

    const entries = [
      { input: 10000000000000.00000000000001, output: "10000000000000" },
      { input: 10000.99999999999999999, output: "10001.000000000" },
      { input: 9999.9999999999999999, output: "10000.000000000" },
      { input: 123.56789012345666666, output: "123.56789012346" },
      { input: 55.1234512345123456, output: "55.123451234512" },
      { input: 100, output: "100.00000000000" },
      { input: 10, output: "10.000000000000" },
      { input: 0, output: "0.0000000000000" },
      { input: -0.0000008000000008, output: "-0.000000800000" },
      { input: -0.0000088888888, output: "-0.000008888889" },
      { input: -0.9798102146848, output: "-0.979810214685" },
      { input: -0.2254033307585, output: "-0.225403330759" },
      { input: -10000000000000.00000000000001, output: "-10000000000000" },
    ];

    // Act
    entries.forEach((entry) => {
      const actual = toDisplayableValue(entry.input, options);
      expect(actual).toEqual(entry.output);
    });
  });

  it("Should display 0 on default", async () => {
    const expected = "0";

    // Act
    const actual = toDisplayableValue();

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should leave use default values when options are not provided", async () => {
    const expected = "123";

    // Act
    const actual = toDisplayableValue(123);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should truncate value when option.round is TRUNCATE", async () => {
    const expected = "123";
    const roundingOptions = {
      places: 0,
      round: DatasheetConstants.TRUNCATE_VALUE,
    };

    // Act
    const actual = toDisplayableValue(123.6, roundingOptions);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should round value to 2 places", async () => {
    // Arrange
    const roundingOptions = {
      places: 2,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // Act
    const entries = [
      { value: 6.135, expected: "6.14" },
      { value: 6.157, expected: "6.16" },
      { value: 6.154, expected: "6.15" },
      { value: 6.159, expected: "6.16" },
      { value: 1.411387969340000008187, expected: "1.41" },
    ];

    // Act
    entries.forEach(({ value, expected }) => {
      // Act
      const actual = toDisplayableValue(value, roundingOptions);

      // Assert
      expect(actual).toEqual(expected);
    });
  });

  it("Should round value to 5 places", async () => {
    // Arrange
    const roundingOptions = {
      places: 5,
      round: DatasheetConstants.ROUND_VALUE,
    };

    const entries = [
      { value: -0.04167500000000000004, expected: "-0.04168" },
      { value: -0.04167500000000000004, expected: "-0.04168" },
    ];

    // Act
    entries.forEach(({ value, expected }) => {
      // Act
      const actual = toDisplayableValue(value, roundingOptions);

      // Assert
      expect(actual).toEqual(expected);
    });
  });

  it("Should round value when `option.round` is ROUND and number is exponential", async () => {
    const expected = "0.01";
    const roundingOptions = {
      places: 2,
      round: DatasheetConstants.ROUND_VALUE,
      stripThousandSign: false,
    };

    // Act
    const actual = toDisplayableValue(1.0123e-2, roundingOptions);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should return NaN when value is not a valid number", async () => {
    const expected = "NaN";
    const roundingOptions = {
      places: 2,
      round: DatasheetConstants.ROUND_VALUE,
    };

    // Act
    const actual = toDisplayableValue("abc", roundingOptions);
    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format 0 for null value", async () => {
    let expected = "0";
    let roundingOptions = {
      places: 0,
      round: DatasheetConstants.ROUND_VALUE,
      locale: "en-US",
    };

    // Act
    let actual = toDisplayableValue(null, roundingOptions);

    // Assert
    expect(actual).toEqual(expected);

    roundingOptions = {
      places: 1,
      round: DatasheetConstants.ROUND_VALUE,
      locale: "en-US",
    };

    actual = toDisplayableValue(null, roundingOptions);

    expected = "0.0";

    expect(actual).toEqual(expected);

    roundingOptions = {
      places: 2,
      round: DatasheetConstants.ROUND_VALUE,
      locale: "en-US",
    };

    actual = toDisplayableValue(null, roundingOptions);

    expected = "0.00";

    expect(actual).toEqual(expected);
  });

  it("Should round value to exactly fraction digits when option.places is given", async () => {
    const expected = "124.0000";
    const roundingOptions = {
      places: 4,
    };

    // Act
    const actual = toDisplayableValue(124, roundingOptions);

    // Assert
    expect(actual).toEqual(expected);
  });

  it("Should format value based on locale", async () => {
    const expected = "123.6";
    const roundingOptions = {
      places: 1,
      round: DatasheetConstants.ROUND_VALUE,
      locale: "en-US",
    };

    // Act
    const actual = toDisplayableValue(123.6, roundingOptions);

    // Assert
    expect(actual).toEqual(expected);
  });
});
