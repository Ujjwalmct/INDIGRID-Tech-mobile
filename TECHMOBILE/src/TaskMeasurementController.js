class TaskMeasurementController {
  // Assisted by watsonx Code Assistant
  /**
   * Initializes the dialog.
   * @param {Dialog} dialog The dialog instance.
   */
  dialogInitialized(dialog) {
    this.dialog = dialog;
    this.page = this.dialog.parent;
    this.app = dialog.getApplication();
  }

  /**
   * Default method which is called every time when dialog is opened
   * in this we get click item and set it's measurement values and if measurement value previously submitted
   * then make it's input read only
   */
  async dialogOpened() {
    this.page.state.measurementSaveDisabled = true;
    const woPlanTaskDetailds = this.app.findDatasource("woPlanTaskDetailds");
    let selectedItem = woPlanTaskDetailds.items[0]?._selected;
    woPlanTaskDetailds.items.forEach((item) => {
      // istanbul ignore else
      if (item.workorderid === selectedItem) {
        selectedItem = item;
      }
    });
    if (selectedItem?.measurementvalue || selectedItem?.observation) {
      selectedItem.newreading = selectedItem.measurementvalue || selectedItem.observation;
      selectedItem.measuredate = selectedItem.measuredate || this.app.dataFormatter.currentUserDateTime();
      woPlanTaskDetailds.item.measuredate = selectedItem.measuredate;
    } else {
      selectedItem.newreading = "";
      selectedItem.measuredate = this.app.dataFormatter.currentUserDateTime();
    }
    const selectedTaskList = this.dialog.findDatasource("woPlanTaskDetaildsSelected");
    await selectedTaskList?.load({ noCache: true, src: selectedItem });
  }

  /**
   * empty measurement reading value for character type reading on click of close button
   * @param {*} event - clicked event and it's item
   */
  async clearCharacterMeterReaing(event) {
    //istanbul ignore else
    if (event && event.item) {
      event.item.newreading = "";
      this.page.state.measurementSaveDisabled = true;
    }
  }

  // Assisted by watsonx Code Assistant
  /**
   * Validates the measure date of a work order plan task detail.
   * @param {Object} woPlanTaskDetailDS - The work order plan task detail data source.
   * @param {Date} currentDateTime - The current date and time.
   * @returns {void}
   */
  validateMeasureDate() {
    this.page.state.measurementSaveDisabled = false;
    const woPlanTaskDetailDS = this.app.findDatasource("woPlanTaskDetaildsSelected");
    const currentDateTime = this.app.dataFormatter.convertISOtoDate(this.app.dataFormatter.currentUserDateTime());

    if (!woPlanTaskDetailDS.item.measuredate) {
      woPlanTaskDetailDS.setWarning(woPlanTaskDetailDS.item, "measuredate", this.app.getLocalizedLabel("blank_meterdatetime_msg", "Date or time cannot be blank"));
    } else {
      woPlanTaskDetailDS.clearWarnings(woPlanTaskDetailDS.item, "measuredate");
      const measuredateTime = this.app.dataFormatter.convertISOtoDate(woPlanTaskDetailDS.item.measuredate);
      measuredateTime.setSeconds(0);
      measuredateTime.setMilliseconds(0);

      // istanbul ignore else
      if (measuredateTime > currentDateTime) {
        woPlanTaskDetailDS.setWarning(woPlanTaskDetailDS.item, "measuredate", this.app.getLocalizedLabel("future_meterdatetime_msg", "Date or time of reading cannot be in the future"));
      } else if (measuredateTime < currentDateTime) {
        woPlanTaskDetailDS.clearWarnings(woPlanTaskDetailDS.item, "measuredate");
      }
    }
  }

  // Assisted by watsonx Code Assistant
  /**
   * onNewMeasurementReading
   * @param {Object} item - The item object containing the new measurement reading.
   * @returns {void}
   */
  onNewMeasurementReading(item) {
    this.page.state.measurementSaveDisabled = !(item.newreading || item.newreading === 0);
  }

  /**
   * On click of right chevron open look up character meter reading
   * @param {*} event - click event and it's item
   */
  async openMeterLookup(event) {
    const alnDomainDS = this.app.findDatasource("alnDomainDS");
    const item = event.item;

    await alnDomainDS.initializeQbe();

    alnDomainDS.setQBE("domainid", "=", event.item.measurepoint?.meter?.domainid);
    const response = await alnDomainDS.searchQBE();
    // istanbul ignore next
    if (response) {
      alnDomainDS.currentMeterid = item.assetmeterid || item.locationmeterid;

      this.dialog.state.meterHeadername = item.metername;

      //Higlight the selected lookup item
      let selectedItem;
      alnDomainDS.items.forEach((item) => {
        const meterObj = event.item;
        const newreading = meterObj.newreading;
        const meterId = meterObj.assetmeterid || meterObj.locationmeterid;
        if (newreading && item.value === newreading && meterId === alnDomainDS.currentMeterid) {
          selectedItem = item;
        }
      });

      alnDomainDS.clearSelections();
      if (selectedItem) {
        alnDomainDS.setSelectedItem(selectedItem, true);
      }

      this.dialog.parent.showDialog("characteristicLookup");
    }
  }
}

export default TaskMeasurementController;
