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
import LocaleConstants from "../../constants/LocaleConstants.js";
import formatCalpoint from "../formatCalpoint.js";

describe("formatCalpoint", () => {
  it("shouldReturnValueWithOutputPrecision", () => {
    // Arrange
    const calpoint = {
      asfoundinput: "1.2356789",
      asfoundoutput: "4.03",
    };

    const assetfunction = {
      inputprecision: 3,
      outputprecision: 5
    };

    // Act
    const value = formatCalpoint(
      calpoint,
      "asfoundoutput",
      assetfunction,
      LocaleConstants.EN_US
    );

    // Assert
    expect(value).toEqual("4.03000");
  });

  it("shouldReturnValueWithInputPrecision", () => {
    // Arrange
    const calpoint = {
      asfoundinput: "1.2356789",
      asfoundoutput: "4.03",
    };

    const assetfunction = {
      inputprecision: 3,
      outputprecision: 5
    };

    // Act
    const value = formatCalpoint(
      calpoint,
      "asfoundinput",
      assetfunction,
      LocaleConstants.EN_US
    );

    // Assert
    expect(value).toEqual("1.2356789")
  });

  it("shouldReturnValueWithDefaultPrecisionWhenAssetfunctionIsNull", () => {
    // Arrange
    const calpoint = {
      asfoundinput: "1.2356789",
      asfoundoutput: "4.03",
    };

    // Act
    const value = formatCalpoint(
      calpoint,
      "asfoundinput",
      null,
      LocaleConstants.EN_US
    );

    // Assert
    expect(value).toEqual("1.2356789")
  });
});
