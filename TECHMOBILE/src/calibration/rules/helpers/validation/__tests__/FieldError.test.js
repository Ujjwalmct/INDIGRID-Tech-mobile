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

import FieldError from "../FieldError";
import { Message } from "../../../../../utils";

// import FieldError from "../FieldError";
describe("FieldError", () => {
  const errorType = "FIELD_WARNING";
  const fieldName = "asfoundoutput";
  const item = {
    asfoundinput: "10.003",
    asfoundoutput: "11.1",
    asfinputstddev: null,
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
  const message = {
    group: null,
    id: "number_is_out_of_range",
    value:
      "One or more As Found tolerance limits were exceeded on this calibration point.",
    params: ["As Found"],
  };
  describe("getErrorType", () => {
    it("Should return errorType", async () => {
      const error = new FieldError(errorType, item, fieldName, message);
      expect(error.getErrorType()).toEqual("FIELD_WARNING");
    });
  });

  describe("getFieldName", () => {
    it("Should return fieldName", async () => {
      const error = new FieldError(errorType, item, fieldName, message);
      expect(error.getFieldName()).toEqual("asfoundoutput");
    });
  });

  describe("getItem", () => {
    it("Should return item", async () => {
      const error = new FieldError(errorType, item, fieldName, message);
      const getitem = error.getItem();
      expect(getitem["asfoundinput"]).toEqual("10.003");
      expect(getitem["setpointvalue"]).toEqual(null);
    });
  });

  describe("getMessageObject", () => {
    it("Should return message", async () => {
      const error = new FieldError(errorType, item, fieldName, message);
      const getMsg = error.getMessageObject();
      expect(getMsg["value"]).toEqual(
        "One or more As Found tolerance limits were exceeded on this calibration point."
      );
      const id = "1";
      const value = "This is a test message";
      const params = [];
      const msg = new Message(id, value, params);
      error.setMessageObject(msg);
      const newMsg = error.getMessageObject();
      expect(newMsg["value"]).toEqual("This is a test message");
      const local = error.getLocalizedLabel();
      expect(local).toEqual("This is a test message");
    });
  });
});
