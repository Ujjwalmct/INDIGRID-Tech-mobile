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

/** Utils */
import parseBool from "../parseBool.js";

describe("parseBool", () => {
  it("Should return true when value is Number(1)", async () => {
    const parsedValue = parseBool(1);
    expect(parsedValue).toEqual(true);
  });

  it("Should return false when value is Number(0)", async () => {
    const parsedValue = parseBool(0);
    expect(parsedValue).toEqual(false);
  });

  it("Should return true when value is String('true')", async () => {
    const parsedValue = parseBool("true");
    expect(parsedValue).toEqual(true);
  });

  it("Should return false when value is String('false')", async () => {
    const parsedValue = parseBool("false");
    expect(parsedValue).toEqual(false);
  });

  it("Should return true when value is String('a')", async () => {
    const parsedValue = parseBool("a");
    expect(parsedValue).toEqual(true);
  });

  it("Should return false when value is null", async () => {
    const parsedValue = parseBool(null);
    expect(parsedValue).toEqual(false);
  });

  it("Should return false when value is undefined", async () => {
    const parsedValue = parseBool(undefined);
    expect(parsedValue).toEqual(false);
  });

  it("Should return true when value is Object({})", async () => {
    const parsedValue = parseBool({});
    expect(parsedValue).toEqual(true);
  });
});
