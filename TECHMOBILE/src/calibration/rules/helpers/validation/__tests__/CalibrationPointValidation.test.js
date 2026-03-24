/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import CalibrationPointValidation from "../CalibrationPointValidation";

/** Constants */
import LocaleConstants from "../../../constants/LocaleConstants";
import CalibrationPointConstants from "../../../constants/CalibrationPointConstants";

/** Utils */

import defaults from "../../../utils/defaults.js";

describe("CalibrationPointValidation", () => {
  describe("localizeCondition", () => {
    it("Should return asfound or asleft correctly", async () => {
      const asFound = "asfoundsetpoint";
      const asLeft = "asleftcalpoint";
      expect(CalibrationPointValidation.localizeCondition(asFound)).toEqual(
        "As Found"
      );
      expect(CalibrationPointValidation.localizeCondition(asLeft)).toEqual(
        "As Left"
      );
    });
  });

  describe("validateForm", () => {
    const condition = "asfound";
    const locale = LocaleConstants.EN_US;

    it("Should return empty list when form values are all valid", async () => {
      const allowEmpty = true;
      const calpoints = [
        generatePoint({ asfoundinput: "10.003", asfoundoutput: "10.003" }),
        generatePoint({ asfoundinput: "10.5", asfoundoutput: "10.5" }),
      ];

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: true,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result).toEqual([]);
    });

    it("Should return errors when form is not valid", async () => {
      const allowEmpty = true;
      const calpoints = [
        generatePoint({ asfoundinput: "10.003", asfoundoutput: "11.100", asfounderror: true }),
        generatePoint({ asfoundinput: "11.500", asfoundoutput: "10.500" }),
        generatePoint({ asfoundinput: "abc", asfoundoutput: "10.500" }),
        generatePoint({
          asfoundinput: "10.01",
          asfoundoutput: "12321321312312321312312312312321321",
          asfounderror: true
        }),
        generatePoint({asfounderror: true}),
      ];

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: true,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result.length).toEqual(5);
    });
    it("Should return no errors when form for discrete planType", async () => {
      const allowEmpty = true;
      const calpoints = [
        generatePoint({ asfoundsetpoint: "10.003" }),
        generatePoint({ asfoundsetpoint: "11.300" }),
        generatePoint({ asfoundsetpoint: "10.100" }),
        generatePoint({ asfoundsetpoint: "10.500" }),
      ];

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.DISCRETE,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: true,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result.length).toEqual(0);
    });
    it("Should return errors when form is not valid and cliplimits is false", async () => {
      const allowEmpty = true;
      const calpoints = [
        generatePoint({ asfoundinput: "10.003", asfoundoutput: "11.1", asfounderror: true }),
        generatePoint({ asfoundinput: "11.5", asfoundoutput: "10.5" }),
        generatePoint({ asfoundinput: "abc", asfoundoutput: "10.5" }),
        generatePoint({
          asfoundinput: "10.01",
          asfoundoutput: "12321321312312321312312312312321321",
          asfounderror: true,
          ron1lower: "10.000",
          ron1upper: "11.000",
        }),
        generatePoint({}),
      ];

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: false,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result.length).toEqual(4);
    });
    it("Should return errors when isEmpty is false and empty point is passed", async () => {
      const calpoints = [generatePoint({ asfounderror: true })];
      const allowEmpty = false;

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: true,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result.length).toEqual(4);
    });
  });

  describe("isNonEmptyNumber", () => {
    it("Should return true when value is a number", async () => {
      const strValue = "10.00";
      const locale = LocaleConstants.EN_US;
      const result = CalibrationPointValidation.isNonEmptyNumber(
        strValue,
        locale
      );

      expect(result).toEqual(true);
    });
    it("Should return false when value is not a number", async () => {
      const strValue = "abc";
      const locale = LocaleConstants.EN_US;
      const result = CalibrationPointValidation.isNonEmptyNumber(
        strValue,
        locale
      );

      expect(result).toEqual(false);
    });
    it("Should return false when value is empty", async () => {
      const strValue = "";
      const locale = LocaleConstants.EN_US;
      const result = CalibrationPointValidation.isNonEmptyNumber(
        strValue,
        locale
      );

      expect(result).toEqual(false);
    });
  });

  describe("validateFormErrorsOnly", () => {
    it("Should filter out warnings when called", async () => {
      const condition = "asfound";
      const locale = LocaleConstants.EN_US;
      const calpoints = [
        generatePoint({ asfoundinput: "10.5", asfoundoutput: "12.5", asfounderror: true }),
        generatePoint({ asfoundinput: "12.5", asfoundoutput: "10.0", asfounderror: false }),
      ];
      const allowEmpty = false;

      const assetfunction = {
        plantype: CalibrationPointConstants.PLANTYPE.ANALOG,
        instrcalrangefrom: 10.0,
        instrcalrangeto: 11.0,
        instroutrangefrom: 10.0,
        instroutrangeto: 11.0,
        cliplimitsin: true,
      };

      const result = CalibrationPointValidation.validateForm(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(result.length).toEqual(2);
      const count = CalibrationPointValidation.countErrors(result);
      expect(count).toEqual(1);
      const filterdResult = CalibrationPointValidation.validateFormErrorsOnly(
        calpoints,
        condition,
        assetfunction,
        locale,
        allowEmpty
      );
      expect(filterdResult.length).toEqual(1);
      const isError = CalibrationPointValidation.filterErrorsOnly(
        filterdResult[0]
      );
      expect(isError).toEqual(true);
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                         Generators                                         */
/* -------------------------------------------------------------------------- */

const generatePoint = (overridingProps) => {
  const defaultProps = {
    asfinputstddev: null,
    asfoundinput: null,
    asfoundoutput: null,
    asfoundsetpoint: null,
    asfoundsetptstddev: null,
    asfoutputstddev: null,
    asleftinput: null,
    asleftoutput: null,
    aslinputstddev: null,
    asloutputstddev: null,
    inputvalue: null,
    outputvalue: null,
    plantype: null,
    setpointvalue: null,
  };

  return defaults(overridingProps, defaultProps);
};
