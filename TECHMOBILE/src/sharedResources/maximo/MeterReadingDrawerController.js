// istanbul ignore next
const TAG = "MeterReadingDrawerController";
// istanbul ignore next
class MeterReadingDrawerController {
  /**
   * Called the first time a dialog is being initialized.
   * A Dialog is a any Modal view such as a Lookup, Drawer, etc.
   *
   * @param {import('@maximo/maximo-js-api').Dialog} dialog - Dialog instance.
   */
  dialogInitialized(dialog) {
    this.dialog = dialog;
    this.app = dialog.getApplication();
    this.assetMeterDS = this.app.findDatasource("maxlib_assetmeters");
    this.locationMeterDS = this.app.findDatasource("maxlib_locationmeters");
    // Dialogs
    this.updateMeterReadingDrawer = this.app.getDialog("maxlib_updateMeterReadingDrawer");
    this.updateMeterReadingController = this.updateMeterReadingDrawer.controllers[0];
  }

  /**
   * Called every time a dialog is opened.
   * A Dialog is any Modal view such as a Lookup, Drawer, etc.
   *
   * @param {object} event - Dialog opened event.
   * @param {import('@maximo/maximo-js-api').Dialog} event.dialog - Dialog instance.
   * @param {import('@maximo/maximo-js-api').Page|import('@maximo/maximo-js-api').Application} event.parent - Parent that owns the dialog.
   */
  dialogOpened({ dialog }) {
    this.app.log.d(TAG, `dialog ${dialog?.name} opened at ${this.app.currentPage.name} page`, "\nApp state meterReading : ", this.app.state.meterReading);

    this.enableAssetMeters = !!this.app.state.meterReading.assetnum;
    this.enableLocationMeters = !!this.app.state.meterReading.location;

    if (this.enableAssetMeters || this.enableLocationMeters) {
      this.setMeters();
    } else {
      this.app.log.e(TAG, `No assetnum or location available to load meters.`);
    }
    // Keeping header blank initially
    this.dialog.state.assetHeader = "";
    this.dialog.state.locationHeader = "";
  }

  // Assisted by watsonx Code Assistant
  /**
   * Sets meters for the asset and location.
   * @param {boolean} enableAssetMeters - A boolean flag to enable asset meters.
   * @param {boolean} enableLocationMeters - A boolean flag to enable location meters.
   * @param {string} assetNum - The asset number.
   * @param {string} location - The location.
   * @returns {Promise<void>} A promise that resolves when the meters are set.
   */
  async setMeters() {
    await Promise.allSettled([this.enableAssetMeters && this.loadMeters("asset", "assetnum"), this.enableLocationMeters && this.loadMeters("location", "location")]);
  }

  // Assisted by watsonx Code Assistant
  /**
   * Loads meters from the parent dataset based on the provided id attribute.
   * @param {string} dsPrefix - The prefix for the dataset.
   * @param {string} idAttribute - The attribute used to identify the meter.
   * @returns {Promise<void>} - A promise that resolves when the meters are loaded.
   */
  async loadMeters(dsPrefix, idAttribute) {
    const parentDS = this.app.findDatasource(`maxlib_${dsPrefix}meters_parent`);
    if (!parentDS) {
      this.app.log.e(TAG, `No parent datasource found for ${dsPrefix}meters_parent`);
      return;
    }
    this.app.state.meterReading['canLoad_'+dsPrefix] = true;
    await parentDS.initializeQbe();
    parentDS.setQBE(idAttribute, this.app.state.meterReading[idAttribute]);
    await parentDS.searchQBE(undefined, true, { mobileFullTableSearch: true });
    if (parentDS.state.itemCount) {
      this.dialog.state[dsPrefix + "Header"] = parentDS.item[idAttribute] + " " + (parentDS.item?.description || "");
      this.updateMeterReadingDrawer.state[dsPrefix + "Header"] = this.dialog.state[dsPrefix + "Header"];
    } else {
      this.dialog.state[dsPrefix + "Header"] = "";
      this.updateMeterReadingDrawer.state[dsPrefix + "Header"] = "";
      this.app.toast(this.app.getLocalizedLabel("record_not_available_device", "Record not available in the device"), "error");
      this[dsPrefix + "MeterDS"].forceReload();
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * @param {Event} event - The event object containing information about the reading type.
   * @returns {void}
   */
  openEnterReadingDrawer(event) {
    // this.updateMeterReadingController.clearReadingValues();
    this.updateMeterReadingDrawer.state.isOldReading = !!event?.isOldReading;
    this.app.showDialog("maxlib_updateMeterReadingDrawer");
  }

  // Assisted by watsonx Code Assistant
  /**
   * Refresh server readings.
   * @param {string} dsPrefix - The prefix of the datasource.
   * @param {string} idAttribute - The attribute used as the ID.
   * @returns {Promise<void>} A promise that resolves when the server readings are refreshed.
   */
  async refreshServerReadings(dsPrefix, idAttribute) {
    const parentSingleDS = this.app.findDatasource(`maxlib_${dsPrefix}meters_parent_single`);

    if (this[dsPrefix + "MeterDS"].state.loading || parentSingleDS.state.loading) {
      this.app.log.d(TAG, `Datasource ${dsPrefix} already being loaded`);
      return;
    }

    if (this.app.device.isMaximoMobile) {
      await parentSingleDS.initializeQbe();
      // Without this reset, it sending lastQuery and getting previous set QBE where clause
      parentSingleDS.reset(parentSingleDS.baseQuery, false);
      parentSingleDS.setQBE(idAttribute, this.app.state.meterReading[idAttribute]);
      await parentSingleDS.forceSync();
    }
    await this[dsPrefix + "MeterDS"].forceReload();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Get the latest readings from the asset and location meters.
   * @returns {Promise<void>} A promise that resolves when the latest readings have been retrieved.
   */
  async getLatestReadings() {
    await Promise.allSettled([this.enableAssetMeters && this.refreshServerReadings("asset", "assetnum"), this.enableLocationMeters && this.refreshServerReadings("location", "location")]);
  }
}

export default MeterReadingDrawerController;
