const STATUS_EMPTY = null;
const STATUS_ACTION = "ACTION";
const STATUS_ADJREQD = "ADJREQD";
const STATUS_ADJTOIMP = "ADJTOIMP";
const STATUS_BROKEN = "BROKEN";
const STATUS_FAIL = "FAIL";
const STATUS_INSPECT = "INSPECT";
const STATUS_LIMITEDUSE = "LIMITEDUSE";
const STATUS_MISSING = "MISSING";
const STATUS_OLIM = "OLIM";
const STATUS_PASS = "PASS";
const STATUS_WARNING = "WARNING";

const DatasheetConstants = {
  /**
   * Defines if datasheet should be updated manually or automatically
   * after calculations are perfomed in the calibration point page.
   *   If value is "0", then we turn the update off and allow user to
   * change it manually in datasheet page. If value is "1", disable
   * this feature on datasheet page and let it be updated in the
   * CalibrationPointHandler.
   */
  PLUSCAUTOSTATUS: "PLUSCAUTOSTATUS",

  /**
   * Specifies whether a warning message is displayed if As Found and As Left readings change in a work order data sheet. If you select this check box, a warning message is displayed. The check box is clear by default.
   */
  PLUSCEDITDATA: "PLUSCEDITDATA",
  SHOW_WARNING_ON_DATASHEET_CHANGES: "1",

  /**
   * Tolerance Warning for exceeding limits
   *  1. Validate once per save.
   *  2. Validate upon tabbing from output field.
   *  3. Never Validate.
   */
  PLUSCTOLWARN: "PLUSCTOLWARN",
  VALIDATE_TOLERANCE_ONCE_PER_SAVE: "0",
  VALIDATE_TOLERANCE_ON_TAB_OUT: "1",
  NEVER_VALIDATE_TOLERANCE: "2",

  /** ̰
   * *Heads up!*
   * Maxvar "PLUSCAUTOSTATUS" expected values are String("0") or
   * String("1") we need to compare with the literal value to avoid
   * booelan condition confusion.
   *   For example, if PLUSCAUTOSTATUS is "0", then a condition
   * like `const result = Boolean(maxvars[0].varvalue)` would return
   * `true` instead of expected `false`.
   */
  UPDATE_DATASHEET_STATUS_AUTOMATICALLY: "1",

  // Default status list
  STATUS_ACTION,
  STATUS_ADJREQD,
  STATUS_ADJTOIMP,
  STATUS_BROKEN,
  STATUS_EMPTY,
  STATUS_FAIL,
  STATUS_INSPECT,
  STATUS_LIMITEDUSE,
  STATUS_MISSING,
  STATUS_OLIM,
  STATUS_PASS,
  STATUS_WARNING,

  /**
   * These are the base status options provided by Maximo
   */
  STATUS_LIST: [
    STATUS_ACTION,
    STATUS_ADJREQD,
    STATUS_ADJTOIMP,
    STATUS_BROKEN,
    STATUS_FAIL,
    STATUS_INSPECT,
    STATUS_LIMITEDUSE,
    STATUS_MISSING,
    STATUS_OLIM,
    STATUS_PASS,
    STATUS_WARNING,
  ],

  // Round option
  DEFAULT_PRECISION: 3,
  TRUNCATE_VALUE: -1,
  ROUND_VALUE: 0,

  // tolerror attribute
  TOLERANCE: {
    USE_INSTR_OUTPUT: 1,
    USE_POINT_IO: 2,
  },

  // Minus zero make up
  FRACTION_DIGITS_MAX: 20,
  FRACTION_DIGITS_BASELINE: 10,

  //Deviation
  DEVIATION_N: 1,
  DEVIATION_N_MINUS_1: 2,

  // Check value length
  MAX_VALUE_LENGTH: 15,

  // DOMAIN ID
  DOMAINID: "PLUSCCALSTATUS",
};

export default DatasheetConstants;
