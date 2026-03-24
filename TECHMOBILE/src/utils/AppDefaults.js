/* This class is used to store application level defaults.
 * Instead of putting them in application level state,
 * we should utilize this class to exclude them from application state
 * and its obervation logic that cause re-rendering of application
 *
 *  Here is how this can be customized in AppCustomizations.js file
 *  import AppDefaults from "./utils/AppDefaults";
 *  class AppCustomizations {
 *      applicationInitialized() {
 *          AppDefaults.set({
 *              workLogType: <CUSTOM_VALUE_HERE>
 *          });
 *      }
 *   }
 */


// List out all defaults here
const APP_DEFAULTS = {
  workLogType: "!CLIENTNOTE!"

};

class AppDefaults {
  static defaults = APP_DEFAULTS;

  static set(newDefaults) {
    if (typeof newDefaults === "object" && newDefaults !== null) {
      Object.assign(this.defaults, newDefaults);
    }
  }

  static get(attribute) {
    if (typeof attribute === "string" && attribute !== "") {
      return this.defaults[attribute];
    } else {
      return this.defaults;
    }
  }
}

export default AppDefaults;
