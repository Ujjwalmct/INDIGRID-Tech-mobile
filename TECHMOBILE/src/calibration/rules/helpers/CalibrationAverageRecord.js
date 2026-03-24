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

/**
 * Object that holds the calibration point marked as "average" point and
 * a list of points associated to it.
 *
 * The "average" point has the property `isaverage=true` and is used
 * to store the results of average and standard deviation calculation.
 */
class CalibrationAverageRecord {
  /**
   * Calibration point with attribute "isaverage=True".
   * @type {ProxyObject}
   * @private
   */
  averageCalpoint = null;

  /**
   * Calibration points associated to the "average" calibration point.
   * @type {Array}
   * @private
   */
  associatedCalpoints = [];

  /**
   * Constructor.
   * @param {ProxyObject} averageCalpoint
   * @param {Array} associatedCalpoints
   */
  constructor(averageCalpoint, associatedCalpoints) {
    this.setAvgCalpoint(averageCalpoint);
    this.setAssociatedCalpoints(associatedCalpoints);
  }

  /**
   * Get Avg calpoint.
   * @returns {ProxyObject}
   */
  getAvgCalpoint() {
    return this.averageCalpoint;
  }

  /**
   * Get Associated calpoints.
   * @returns {Array}
   */
  getAssociatedCalpoints() {
    return this.associatedCalpoints;
  }

  /**
   * Set Avg calpoint.
   * @returns {ProxyObject}
   */
  setAvgCalpoint(averageCalpoint) {
    this.averageCalpoint = averageCalpoint;
  }

  /**
   * Set Associated calpoints.
   * @returns {Array}
   */
  setAssociatedCalpoints(associatedCalpoints) {
    this.associatedCalpoints = associatedCalpoints;
  }
}

export default CalibrationAverageRecord;
