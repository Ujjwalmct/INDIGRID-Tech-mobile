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

import CalibrationAverageRecord from "../CalibrationAverageRecord.js";

/** Implementation */
describe("CalibrationAverageRecord", () => {
  describe("getAvgCalpoint", () => {
    it("Should return average calibration point", () => {
      // Arrange
      const point = { pluscwodspointid: 1 };

      // Act
      const record = new CalibrationAverageRecord(point, []);
      const avgpoint = record.getAvgCalpoint();

      // Assert
      expect(avgpoint).toEqual(point);
    });
  });

  describe("getAssociatedCalpoints", () => {
    it("Should return associated calpoints", () => {
      // Arrange
      const points = [{ pluscwodspointid: 1 }, { pluscwodspointid: 2 }];

      // Act
      const record = new CalibrationAverageRecord(null, points);
      const assoc = record.getAssociatedCalpoints();

      // Assert
      expect(assoc).toEqual(points);
    });
  });

  describe("setAvgCalpoint", () => {
    it("Should set average calpoint", () => {
      // Arrange
      const point = { pluscwodspointid: 1 };

      // Act
      const record = new CalibrationAverageRecord(null, null);

      record.setAvgCalpoint(point);

      const avgpoint = record.getAvgCalpoint();

      // Assert
      expect(avgpoint).toEqual(point);
    });
  });

  describe("setAssociatedCalpoints", () => {
    it("Should set average calpoint", () => {
      // Arrange
      const points = [{ pluscwodspointid: 1 }, { pluscwodspointid: 2 }];

      // Act
      const record = new CalibrationAverageRecord(null, null);

      record.setAssociatedCalpoints(points);

      const assoc = record.getAssociatedCalpoints();

      // Assert
      expect(assoc).toEqual(points);
    });
  });
});
