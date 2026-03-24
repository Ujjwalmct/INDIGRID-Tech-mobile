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
import printTable from "../printTable";

describe("parseBool", () => {
  it("Should return a table of correct length with or without a filter", async () => {
    let obj = {
      pluscwodspointid: 123,
      input: "3",
      output: "500",
    };
    let result = printTable(obj);
    expect(result).toBeDefined();
    expect(result.length).toEqual(204);
    const filter = ["id", "in"];
    obj = {
      id: 12,
      in: "3",
      out: "5",
    };
    result = printTable(obj, filter);
    expect(result).toBeDefined();
    expect(result.length).toEqual(133);
  });
});
