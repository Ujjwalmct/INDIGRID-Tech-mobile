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

import decimalPlacesOf from "./numberFormatter/decimalPlacesOf";

/**
 * Singleton helper to normalize and concentrate calculations
 * involving decimal and floating points.
 */
class DecimalCalculator {
  plus(a, b) {
    return this.calculate(a, b, "+");
  }

  minus(a, b) {
    return this.calculate(a, b, "-");
  }

  multiply(a, b) {
    return this.calculate(a, b, "*");
  }

  divide(a, b) {
    return this.calculate(a, b, "/");
  }

  scaleToInt(float, places) {
    const intValue = float * Math.pow(10, places);
    return parseInt(intValue.toFixed(0));
  }

  scaleToFloat(int, places) {
    const floatValue = int / Math.pow(10, places);

    if ((floatValue + "").indexOf("e") > -1) {
      return floatValue.toFixed(20);
    } else {
      return floatValue;
    }
  }

  maxPlaces(a, b) {
    return Math.max(decimalPlacesOf(a), decimalPlacesOf(b));
  }

  calculate(a, b, operation) {
    let places = this.maxPlaces(a, b);
    let aInt = this.scaleToInt(a, places);
    let bInt = this.scaleToInt(b, places);
    switch (operation) {
      case "+":
        return this.scaleToFloat(aInt + bInt, places);
      case "-":
        return this.scaleToFloat(aInt - bInt, places);
      case "*":
        return this.scaleToFloat(aInt * bInt, places * 2);
      case "/":
        return aInt / bInt;
      default:
        return null;
    }
  }

  convertNegativeZero(stringValue) {
    if (/^-0(\.0*)?$/.test(stringValue)) {
      return stringValue.slice(1); 
    }
    return stringValue;
  }

}
export default DecimalCalculator;
