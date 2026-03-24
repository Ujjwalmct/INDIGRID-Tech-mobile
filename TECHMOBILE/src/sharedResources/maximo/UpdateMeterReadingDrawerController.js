const TAG = "UpdateReadingDrawerController";
const NEGATIVE_READING_VALUE_DEFAULT = "Meter readings cannot be less than zero.";

class UpdateReadingDrawerController {
  /**
   * Called the first time a dialog is being initialized.
   * A Dialog is a any Modal view such as a Lookup, Drawer, etc.
   *
   * @param {import('@maximo/maximo-js-api').Dialog} dialog - Dialog instance.
   */
  dialogInitialized(dialog) {
    this.dialog = dialog;
    this.app = dialog.getApplication();

    // Datasources
    this.assetMeterParentDS = this.app.findDatasource("maxlib_assetmeters_parent");
    this.assetMeterDS = this.app.findDatasource("maxlib_assetmeters");
    this.locationMeterParentDS = this.app.findDatasource("maxlib_locationmeters_parent");
    this.locationMeterDS = this.app.findDatasource("maxlib_locationmeters");
    this.characteristicsLookupDS = this.app.findDatasource("maxlib_aln_domain_lookupDS");
    this.readingDateDS = this.app.findDatasource("maxlib_reading_dates");

    // App controller bindings
    const AppController = this.app.controllers[0];
    ["onCharactersticSelection", "saveUpdateMeterDialog", "discardUpdateMeterDialog", "saveRollOverReadings"].forEach((funcName) => {
      AppController[funcName + "App"] = this[funcName].bind(this);
    }, this);
    if (this.assetMeterParentDS) {
      this.assetMeterParentDS.on("update-data-failed", this.onUpdateDataFailed);
    }
    if (this.locationMeterParentDS) {
      this.locationMeterParentDS.on("update-data-failed", this.onUpdateDataFailed);
    }
  }

  /**
   * Called every time a dialog is opened.
   * A Dialog is any Modal view such as a Lookup, Drawer, etc.
   *
   * @param {object} event - Dialog opened event.
   * @param {import('@maximo/maximo-js-api').Dialog} event.dialog - Dialog instance.
   * @param {import('@maximo/maximo-js-api').Page|import('@maximo/maximo-js-api').Application} event.parent - Parent that owns the dialog.
   */
  async dialogOpened({ dialog }) {
    this.app.log.d(TAG, `dialog ${dialog?.name} opened at ${this.app.currentPage.name} page and isOldReading= ${dialog.state.isOldReading}`);
    dialog.state.readingDrawerTitle = dialog.state.isOldReading
      ? this.app.getLocalizedLabel("old_meter_drawer_title", "Enter old readings")
      : this.app.getLocalizedLabel("new_meter_drawer_title", "Enter readings");

    dialog.state.errors = new Set();

    this.lastMeterId = false;
    this.hasErrorMsgArr = [];
    this.rollOverData = [];
    this.saveDataSuccessful = true;
    this.isRollover = false;
    this.dialog.state.disableSave = true;
    this.meterNewReadingExist = false;

    if (dialog.state.isOldReading) {
      this.loadDates();
    }

    this.clearReadingValues();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Load dates for the current reading.
   */
  async loadDates() {
    // await this.readingDateDS.load({});
    await this.readingDateDS.load({
      src: [
        {
          readingdate: this.getCurrentDateTime(),
          readingtime: this.getCurrentDateTime(),
        },
      ],
    });
    this.readingDateDS.clearChanges(true);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Returns the current date and time in the format specified by the user's locale.
   * @returns {string} The current date and time in the format specified by the user's locale.
   */
  getCurrentDateTime() {
    return this.app.dataFormatter.currentUserDateTime();
  }

  /**
   * Return only date part where hours and minute set to 0
   * @param  {dateISO} date want to convert
   */
  getOnlyDatePart(dateISO) {
    const dataFormatter = this.app.dataFormatter;
    let date = dataFormatter.convertISOtoDate(dateISO);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    date = dataFormatter.dateWithoutTimeZone(dataFormatter.convertDatetoISO(date));
    return date;
  }

  /**
   * Validate date in drawer.
   */
  validateMeterDate() {
    const todayDate = this.app.dataFormatter.convertISOtoDate(this.getCurrentDateTime());
    const item = this.readingDateDS.item;

    if (!item.readingdate) {
      const errorMessage = this.app.getLocalizedLabel("blank_meterdatetime_msg", "Date or time cannot be blank");
      this.readingDateDS.setWarning(item, "readingdate", errorMessage);
      this.dialog.state.errors.add("date");
    } else {
      this.readingDateDS.clearWarnings(item, "readingdate");
      this.dialog.state.errors.delete("date");
      const meterDateTime = this.getISODate(item.readingdate);
      const time = this.getISODate(item.newreadingtime);
      meterDateTime.setHours(time ? time.getHours() : 0);
      meterDateTime.setMinutes(time ? time.getMinutes() : 0);
      // PS:TODO: check this is not required // Keeping this Intentional comment.
      // todayDate.setSeconds(0);
      // todayDate.setMilliseconds(0);
      if (this.getOnlyDatePart(meterDateTime) > this.getOnlyDatePart(todayDate)) {
        this.readingDateDS.setWarning(item, "readingdate", this.app.getLocalizedLabel("future_meterdatetime_msg", "Date or time of reading cannot be in the future"));
        this.dialog.state.errors.add("date");
        this.readingDateDS.clearWarnings(item, "newreadingtime");
        // Removing time error, as we have shown error for date
        this.dialog.state.errors.delete("time");
        this.readingDateDS.clearWarnings(item, "readingtime");
      } else {
        this.validateMeterTime();
        this.dialog.state.errors.delete("date");
        this.readingDateDS.clearWarnings(item, "readingdate");
      }
    }
  }

  validateMeterTime() {
    const todayDate = this.app.dataFormatter.convertISOtoDate(this.getCurrentDateTime());
    const item = this.readingDateDS.item;
    if (!item.readingtime) {
      this.readingDateDS.setWarning(item, "readingtime", this.app.getLocalizedLabel("blank_meterdatetime_msg", "Date or time cannot be blank"));
      this.dialog.state.errors.add("time");
    } else {
      this.readingDateDS.clearWarnings(item, "readingtime");
      this.dialog.state.errors.delete("time");
      const meterDateTime = this.getISODate(item.readingdate);
      const time = this.getISODate(item.readingtime);
      meterDateTime.setHours(time ? time.getHours() : 0);
      meterDateTime.setMinutes(time ? time.getMinutes() : 0);
      // PS:TODO: Check why this was setting 0 seconds
      // todayDate.setSeconds(0);
      // todayDate.setMilliseconds(0);
      if (this.getOnlyDatePart(meterDateTime) === this.getOnlyDatePart(todayDate) && meterDateTime > todayDate) {
        // Add error for time
        this.readingDateDS.setWarning(item, "readingtime", this.app.getLocalizedLabel("future_meterdatetime_msg", "Date or time of reading cannot be in the future"));
        this.dialog.state.errors.add("time");
        // Remove error for Date if exist
        this.dialog.state.errors.delete("date");
        this.readingDateDS.clearWarnings(item, "readingdate");
      } else {
        this.dialog.state.errors.delete("time");
        this.readingDateDS.clearWarnings(item, "readingtime");
      }
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Returns an ISO date string without the time zone.
   * @param {Date} date - The date to be formatted.
   * @returns {string} - The ISO date string without the time zone.
   */
  getISODate(date) {
    if (date) {
      return this.app.dataFormatter.dateWithoutTimeZone(this.app.dataFormatter.convertISOtoDate(date), true);
    }
    return "";
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Save or update meter dialog function.
   */
  async saveUpdateMeterDialog() {
    if (!this.isRollover) {
      if (this.dialog.state.isOldReading) {
        this.validateMeterDate();
        this.validateMeterTime();
      }

      if (this.dialog.state.errors.size) {
        this.app.toast(this.app.getLocalizedLabel("unable_to_save", `Unable to save due to errors on the dialog`), "error");
        this.app.log.d(TAG, "Erros exist in dialog. Returning without Save");
      } else {
        await this.saveMeterReadings();
      }
    } else if (this.isRollover) {
      this.app.showDialog("maxlib_rollOverDialog");
      return;
    }
  }

  /**
   * Counts the number of decimal digits in a numeric string
   *
   * This helper function determines how many digits appear after the decimal point
   * in a numeric string. It handles both period (.) and comma (,) as decimal separators.
   *
   * @param {string} numStr - The numeric string to analyze
   * @returns {number} - The count of digits after the decimal separator, or 0 if no decimal
   */
  getDecimalDigitCount(numStr) {
    let decimalIndex = numStr.indexOf(".");
    if (decimalIndex === -1) {
      decimalIndex = numStr.indexOf(",");
      if (decimalIndex === -1) {
        return 0;
      }
    }
    return numStr.length - (decimalIndex + 1);
  }

  /**
   * Formats a meter reading number according to the user's locale settings.
   *
   * This function determines whether the reading is an integer or decimal value
   * and formats it appropriately using the application's data formatter. It handles
   * both period (.) and comma (,) as decimal separators to support different locales.
   *
   * @param {Object} updatedItem - The meter item object containing the reading to format.
   * @param {number|string} updatedItem.newreading - The new meter reading value to be formatted.
   * @param {string} [updatedItem.assetmeterid] - The asset meter ID (if this is an asset meter).
   * @param {string} [updatedItem.locationmeterid] - The location meter ID (if this is a location meter).
   *
   * @returns {string} The formatted number string according to the user's locale settings.
   *
   * @example
   * // For an integer reading
   * formatNumberLocale({ newreading: 1234, assetmeterid: 'AM001' })
   * // Returns: "1,234" (in en-US locale) or "1.234" (in de-DE locale)
   *
   * @example
   * // For a decimal reading
   * formatNumberLocale({ newreading: 1234.56, locationmeterid: 'LM001' })
   * // Returns: "1,234.56" (in en-US locale) or "1.234,56" (in de-DE locale)
   */
  formatNumberLocale(updatedItem) {
    const numString = updatedItem.newreading.toString();
    let formatOptions = {
      type: "INTEGER",
    };

    if (numString.indexOf(".") > 0 || numString.indexOf(",") > 0) {
      formatOptions.type = "DECIMAL";
      formatOptions.scale = this.getDecimalDigitCount(numString);
    }

    return this.app.dataFormatter.format(updatedItem.newreading, "newreading", formatOptions, this.getDS(updatedItem));
  }

  /**
   * save new meter readings.
   */
  async saveMeterReadings() {
    try {
      this.app.userInteractionManager.drawerBusy(true);

      // Here we will save both asset and location meters simalteneously.
      await Promise.allSettled([this.assetMeterDS?.items?.length && performSave.call(this, this.assetMeterDS), this.locationMeterDS?.items?.length && performSave.call(this, this.locationMeterDS)]);

      // function to save one datasource.
      async function performSave(DS) {
        if (!DS.state.itemsChanged) {
          // Nothing to save in this datasource.
          this.app.log.d(TAG, `There is no changes in DS to Save. DS Name: ${DS.name}`);
          return;
        }

        let updatedItems = [];
        const isOldReading = this.dialog.state.isOldReading;
        const idAttribute = DS.item.assetmeterid ? "assetmeterid" : "locationmeterid";
        for (const updatedMeterObj of DS.items) {
          const changedItems = updatedMeterObj[idAttribute] && DS.__itemChanges[updatedMeterObj[idAttribute]];
          const hasReadingChanged = !!(DS.isModified(updatedItems, "newreading") && (updatedMeterObj.newreading === 0 || updatedMeterObj.newreading));

          // If no changes or no reading change then skip this item.
          if (!!!changedItems || !hasReadingChanged) {
            this.app.log.d(TAG, `There is no changes in DS to Save. Will check next DS. DS Name: ${DS.name}`);
            continue;
          } else {
            // If atleast one item is selected to save
            this.meterNewReadingExist = true;
          }

          this.app.log.d("changes are ", changedItems && JSON.parse(JSON.stringify(changedItems)));

          let itemToUpdate = {
            inspector: this.app.client.userInfo.personid,
            href: updatedMeterObj.href,
            localref: updatedMeterObj.localref,
          };

          itemToUpdate[idAttribute] = updatedMeterObj[idAttribute];
          const newreadingdate = this.getISODate(isOldReading ? this.readingDateDS.item.readingdate : updatedMeterObj.newReadingAddedDate);
          const time = this.getISODate(isOldReading ? this.readingDateDS.item.readingtime : updatedMeterObj.newReadingAddedDate);
          newreadingdate.setHours(time ? time.getHours() : 0);
          newreadingdate.setMinutes(time ? time.getMinutes() : 0);
          // Setting seconds and Milliseconds based on existing behaviour.
          newreadingdate.setSeconds(0);
          newreadingdate.setMilliseconds(0);

          itemToUpdate.newreading = updatedMeterObj.meter.metertype_maxvalue === "CHARACTERISTIC" ? updatedMeterObj.newreading : this.formatNumberLocale(updatedMeterObj);
          itemToUpdate.newreadingdate = newreadingdate;

          const lastreadingdate = this.getISODate(itemToUpdate.deltareadingdate || updatedMeterObj.lastreadingdate);
          const latestreadingdate = lastreadingdate && newreadingdate > lastreadingdate ? newreadingdate : lastreadingdate || newreadingdate;

          // For CONTINUOUS Meter
          if (updatedMeterObj.meter.metertype_maxvalue === "CONTINUOUS") {
            itemToUpdate.isdelta = updatedMeterObj.isdelta;

            if (this.rollOverData && updatedMeterObj.rollover) {
              this.rollOverData.forEach((element) => {
                if (element[idAttribute] === updatedMeterObj[idAttribute]) {
                  itemToUpdate.dorollover = element.dorollover;
                  if (!element.dorollover) {
                    itemToUpdate.newreading = element.isdelta ? updatedMeterObj.newreading : updatedMeterObj.lastreading;
                    // PS:TODO: check why this is required: this is intentional comment
                    updatedMeterObj.newreading = element.isdelta ? updatedMeterObj.newreading : updatedMeterObj.lastreading;
                  }
                }
              });
            }

            // Continuous and Delta
            if (updatedMeterObj.isdelta) {
              itemToUpdate.deltareading =
                this.app.dataFormatter.parseNumber(updatedMeterObj.newreading) + this.app.dataFormatter.parseNumber(updatedMeterObj.deltareading || updatedMeterObj.lastreading);
              if (itemToUpdate.dorollover && updatedMeterObj.rollover && itemToUpdate.deltareading > this.app.dataFormatter.parseNumber(updatedMeterObj.rollover)) {
                itemToUpdate.deltareading = itemToUpdate.deltareading - this.app.dataFormatter.parseNumber(updatedMeterObj.rollover);
              }
            } else if (!isOldReading) {
              // Continuous and non-Delta and not-backdated (not old)
              itemToUpdate.deltareading = updatedMeterObj.newreading;
            }
          } else if (!isOldReading) {
            // For NON-CONTINUOUS meters and not-backdated (not old)
            itemToUpdate.deltareading = itemToUpdate.newreading;
          }
          // We show only latest reading in meter list page
          itemToUpdate.deltareadingdate = latestreadingdate;

          // Attach remarks only if modified.
          if (DS.isModified(updatedMeterObj, "remarks")) {
            itemToUpdate.remarks = updatedMeterObj.remarks;
          }

          updatedItems.push(itemToUpdate);
        }

        if (!updatedItems.length) {
          // No Items to save
          this.app.log.d(TAG, `There is no items with newreadings changed to save. DS Name: ${DS.name}`);
          return;
        }

        this.app.log.d(TAG, `All set to Save. Saving : ${DS.name}`);

        let parentItemToUpdate;
        let updateOptions = {
          responseProperties: "",
        };

        if (DS.item.assetmeterid) {
          // Asset Meters save
          parentItemToUpdate = {
            assetnum: this.assetMeterParentDS.item.assetnum,
            assetuid: this.assetMeterParentDS.item.assetuid,
            href: this.assetMeterParentDS.item.href,
            assetmeter: updatedItems,
          };
          updateOptions.responseProperties = "assetuid, href, assetnum, assetmeter{assetmeterid, href, lastreading, lastreadingdate, remarks}";
        } else if (DS.item.locationmeterid) {
          // Location Meters save
          parentItemToUpdate = {
            location: this.locationMeterParentDS.item.location,
            locationsid: this.locationMeterParentDS.item.locationsid,
            href: this.locationMeterParentDS.item.href,
            locationmeter: updatedItems,
          };
          updateOptions.responseProperties = "locationsid, href, location, locationmeter{locationmeterid, href, lastreading, lastreadingdate, remarks}";
        } else {
          // Nothing to save here.
          this.app.log.d(TAG, "Nothing to save here. Returning.");
          return;
        }

        updateOptions.localPayload = parentItemToUpdate;

        this.app.log.d(TAG, `Item being sent to save: ${DS.name}`, parentItemToUpdate);

        await this.getParentDS(DS)
          .update(parentItemToUpdate, updateOptions)
          .then((resp) => {
            this.app.log.d(TAG, `Update Promise was fulfilled with: ${DS.name}`);
            if (resp && Object.keys(resp).length) {
              this.meterSaveSuccessToastMsg(DS.item);
            } else {
              this.meterSaveErrorToastMsg(DS.item);
            }
          })
          .catch((error) => {
            this.app.log.d(TAG, `Update Promise was rejected with: ${error.message}`);
          })
          .finally(() => {
            this.app.log.d(TAG, `Updatae Promise execution is complete for: ${DS.name}`);
          });
        await DS.forceReload();
        this.discardUpdateMeterDialog(true);
      }
    } finally {
      this.validateMeter = false;
      this.app.userInteractionManager.drawerBusy(false);
      if (!this.meterNewReadingExist) {
        this.requiredInfoMissingToastMsg();
      }
    }
  }

  requiredInfoMissingToastMsg() {
    this.app.toast(this.app.getLocalizedLabel("information_missing", `Required information is missing.`), "error");
    this.meterNewReadingExist = false;
  }

  meterSaveSuccessToastMsg(dsItem) {
    if (dsItem.assetmeterid) {
      this.app.toast(this.app.getLocalizedLabel("asset_meter_save_success", `Asset meter readings were saved.`), "success");
    } else {
      this.app.toast(this.app.getLocalizedLabel("location_meter_save_success", `Location meter readings were saved.`), "success");
    }
  }

  meterSaveErrorToastMsg(dsItem) {
    if (dsItem.assetmeterid) {
      this.app.toast(this.app.getLocalizedLabel("asset_meter_save_failed", `Asset meter readings weren't saved.`), "error");
    } else {
      this.app.toast(this.app.getLocalizedLabel("location_meter_save_failed", `Location meter readings weren't saved.`), "error");
    }
  }

  // Assisted by watsonx Code Assistant
  /**
   * Callback function for when data update fails.
   * @param {Object} failedObject - The object that failed to update.
   * @returns {void}
   */
  onUpdateDataFailed(failedObject) {
    this.saveDataSuccessful = false;
  }

  // Assisted by watsonx Code Assistant
  /**
   * Toggles the delta value for a given item.
   * @param {Object} evt - The event object.
   * @param {Object} item - The item object.
   * @param {Object} changedItem - The changed item object.
   */
  toggleDelta({ evt, item }, changedItem) {
    changedItem.isdelta = evt.target.checked;
    changedItem.readingtype = changedItem.isdelta ? "DELTA" : changedItem.readingtype_maxvalue;
    // when user has entered value in text box and change the delta, we need to validate
    if (item.newreading || item.newreading === 0) {
      this.validateMeterReadings(item);
    } else {
      this.deleteError(item);
    }
  }

  // Assisted by watsonx Code Assistant
  /**
   * Returns the appropriate datasource based on the input item's assetmeterid property.
   * @param {Object} item - The input item to check for assetmeterid property.
   * @returns {Object} - The appropriate data source.
   */
  getDS(item) {
    return item.assetmeterid ? this.assetMeterDS : this.locationMeterDS;
  }

  // Assisted by watsonx Code Assistant
  /**
   * Returns the parent datasource for a given datasource.
   * @param {Object} DS - The datasource to get the parent of.
   * @returns {Object} - The parent datasource.
   */
  getParentDS(DS) {
    return DS.name === "maxlib_assetmeters" ? this.assetMeterParentDS : this.locationMeterParentDS;
  }

  /**
   * Validate reading data before submission.
   * @param  {Object} changeObj changed meter object
   */
  async validateMeterReadings(changeObj) {
    const dataFormatter = this.app.dataFormatter;
    if (changeObj.meter.metertype_maxvalue !== "GAUGE" && dataFormatter.parseNumber(changeObj.newreading) < 0) {
      const localizedErrorMessage = this.app.getLocalizedLabel("negative_reading_value", NEGATIVE_READING_VALUE_DEFAULT);
      this.addError(changeObj.item, localizedErrorMessage);
      return;
    }
    try {
      if (changeObj) {
        this.dialog.state.disableSave = false;
        let newreadingdate;
        let time;
        if (changeObj) {
          if (this.dialog.state.isOldReading) {
            newreadingdate = this.getISODate(this.readingDateDS.item.readingdate);
            time = this.getISODate(this.readingDateDS.item.readingtime);
          } else {
            newreadingdate = time = this.getISODate(this.getCurrentDateTime());
            changeObj.newReadingAddedDate = this.getCurrentDateTime();
          }
          if (newreadingdate) {
            newreadingdate.setHours(time ? time.getHours() : 0);
            newreadingdate.setMinutes(time ? time.getMinutes() : 0);
          }
        }

        changeObj.newreadingdate = newreadingdate;
        // Creating `newReading` as a number to ensure consistent numerical comparison.
        // Input is a string and may use locale-specific decimal separators (e.g., "," instead of ".").
        const newReading = dataFormatter.parseNumber(changeObj.newreading);
        let errorMessage = "";
        const newDate = changeObj.newreadingdate ? dataFormatter.dateTimeToString(this.getISODate(changeObj.newreadingdate)) : "";
        const lastReadingDate = changeObj.lastreadingdate ? dataFormatter.dateTimeToString(this.getISODate(changeObj.lastreadingdate)) : "";
        const lastReading = dataFormatter.parseNumber(changeObj.deltareading || changeObj.lastreading);

        if (changeObj.meter && changeObj.meter.metertype_maxvalue === "CONTINUOUS") {
          if (!changeObj.rollover && !this.dialog.state.isOldReading) {
            if (newReading < lastReading && !changeObj.isdelta) {
              const newValue = changeObj.newreading;
              errorMessage = `The new reading (${newValue}) entered on ${newDate} should be greater
            than the previous reading (${lastReading}) entered on (${lastReadingDate}).`;
              errorMessage = this.app.getLocalizedLabel("meter_cont_error", errorMessage, [newValue, newDate, lastReading, lastReadingDate]);
              this.addError(changeObj, errorMessage);
              return;
            } else {
              this.deleteError(changeObj);
            }
          }
          if (
            !changeObj.dorollover &&
            this.dialog.state.isOldReading &&
            lastReadingDate &&
            this.getISODate(changeObj.newreadingdate) < this.getISODate(changeObj.lastreadingdate) &&
            !changeObj.isdelta
          ) {
            if (newReading > lastReading) {
              const newValue = changeObj.newreading;
              errorMessage = `The new reading (${newValue}) entered on ${newDate} should be lesser
          than the previous reading (${lastReading}) entered on (${lastReadingDate}).`;
              errorMessage = this.app.getLocalizedLabel("meter_cont_lesser_error", errorMessage, [newValue, newDate, lastReading, lastReadingDate]);
              this.addError(changeObj, errorMessage);
              return;
            } else {
              this.deleteError(changeObj);
            }
          }
          if (
            !changeObj.rollover &&
            this.dialog.state.isOldReading &&
            lastReadingDate &&
            this.getISODate(changeObj.newreadingdate) > this.getISODate(changeObj.lastreadingdate) &&
            !changeObj.isdelta
          ) {
            if (newReading < lastReading) {
              const newValue = changeObj.newreading;
              errorMessage = `The new reading (${newValue}) entered on ${newDate} should be greater
            than the previous reading (${lastReading}) entered on (${lastReadingDate}).`;
              errorMessage = this.app.getLocalizedLabel("meter_cont_error", errorMessage, [newValue, newDate, lastReading, lastReadingDate]);
              this.addError(changeObj, errorMessage);
              return;
            } else {
              this.deleteError(changeObj);
            }
          }

          if (changeObj.rollover) {
            if (newReading > changeObj.rollover) {
              errorMessage = `Readings cannot exceed rollover values. The reading ${changeObj.newreading} is greater than the rollover point ${changeObj.rollover}.`;
              errorMessage = this.app.getLocalizedLabel("rollover_error", errorMessage, [changeObj.newreading, changeObj.rollover]);
              this.addError(changeObj, errorMessage);
              return;
            } else {
              this.deleteError(changeObj);
            }

            if (!changeObj.isdelta && newReading < lastReading && lastReadingDate && this.getISODate(changeObj.newreadingdate) > this.getISODate(changeObj.lastreadingdate)) {
              this.rollOverData.push(changeObj);
              this.lastMeterId = changeObj.assetmeterid || changeObj.locationmeterid;
              this.app.state.meterReading.rollover = {
                newReading: changeObj.newreading,
                lastReading: lastReading,
                meterName: changeObj.metername,
              };
              //setting Flag for rollover Diaolog
              this.isRollover = true;
              this.app.showDialog("maxlib_rollOverDialog");
              return;
            } else {
              this.deleteError(changeObj);
            }

            const deltaReading = dataFormatter.parseNumber(changeObj.newreading) + dataFormatter.parseNumber(changeObj.deltareading || changeObj.lastreading);
            if (changeObj.isdelta && deltaReading > changeObj.rollover) {
              errorMessage = `Readings cannot exceed rollover values. The reading ${deltaReading} is greater than the rollover point ${changeObj.rollover}.`;
              errorMessage = this.app.getLocalizedLabel("rollover_error", errorMessage, [deltaReading, changeObj.rollover]);
              this.addError(changeObj, errorMessage);
              return;
            } else {
              this.isRollover = false;
              this.deleteError(changeObj);
            }
          }
        }
      }
    } finally {
      // setting flag to false when meters are saved
      this.validateMeter = false;
    }
  }

  /**
   * onValueChanged function is called when a value in the datasource field is changed.
   * @param {Object} changeObj - Object containing information about the change.
   * @param {string} changeObj.field - Name of the field that was changed.
   * @param {string} changeObj.newValue - New value of the field.
   * @param {Object} changeObj.item - Item that was changed.
   */
  onValueChanged(changeObj) {
    if (changeObj.field === "newreading") {
      // Ensure newReading is a valid string and check for non-zero values.
      if (changeObj.newValue || changeObj.newValue === 0) {
        const metertype = changeObj.item.meter.metertype_maxvalue;
        if (metertype !== "GAUGE" && this.app.dataFormatter.parseNumber(changeObj.newValue) < 0) {
          const localizedErrorMessage = this.app.getLocalizedLabel("negative_reading_value", NEGATIVE_READING_VALUE_DEFAULT);
          this.addError(changeObj.item, localizedErrorMessage);
          return;
        }
      } else {
        // If no new reading, clear errors
        this.deleteError(changeObj.item);
      }
    }
  }

  checkDatasourcesCanNotSave() {
    if (!this.assetMeterDS.state.itemsChanged && !this.locationMeterDS.state.itemsChanged) {
      return true;
    } else if (this.assetMeterDS.state.itemsChanged && !this.assetMeterDS.state.canSave) {
      return true;
    } else if (this.locationMeterDS.state.itemsChanged && !this.locationMeterDS.state.canSave) {
      return true;
    } else {
      return false;
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Validate new reading
   * @param {object} event - The event object containing the new reading information
   * @param {number} event.newreading - The new reading value
   * @param {string} event.href - The URL of the resource being read
   * @param {string} event.assetnum - The asset number associated with the reading
   * @param {string} event.location - The location of the asset
   * @param {string} event.assetmeterid - The ID of the asset meter
   * @param {string} event.locationmeterid - The ID of the location meter
   * @param {boolean} event.dorollover - A flag indicating whether a rollover should be performed
   * @returns {void}
   */
  validateNewReading(event) {
    this.dialog.state.disableSave = this.checkDatasourcesCanNotSave();
    if (this.dialog.state.disableSave) {
      return;
    }

    if (event.newreading === 0 || event.newreading) {
      //setting flag to true before save
      this.validateMeter = true;
      //setting default rollover flag to false
      this.isRollover = false;
      this.validateMeterReadings(event);
    } else {
      this.deleteError(event);
      // We save remarks only if reading changed. When reading become blank that means we have nothing to save now
      // so we undoItemChanges to revert original value of remarks field.
      if (this.getDS(event).__itemChanges[event.assetmeterid || event.locationmeterid]) {
        this.getDS(event).undoItemChanges(event);
      }
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Add an error to the dialog state for a given meter.
   * @param {Object} meter - The meter object containing the assetmeterid or locationmeterid.
   */
  addError(meter, msg) {
    this.dialog.state.errors.add(meter.assetmeterid || meter.locationmeterid);
    this.getDS(meter).setWarning(meter, "newreading", msg);
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Delete an error from the dialog state.
   * @param {Object} meter - The meter object containing the assetmeterid or locationmeterid.
   */
  deleteError(meter) {
    this.dialog.state.errors.delete(meter?.assetmeterid || meter?.locationmeterid);
    this.getDS(meter).clearWarnings(meter, "newreading");
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * This function is called when saving data fails.
   * @returns {void}
   */
  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  /**
   * Validates the meter reading form.
   * @param {Object} validateEvent - The validate event object.
   */
  validateRecordDialog(validateEvent) {
    validateEvent.failed = this.assetMeterDS.state.itemsChanged || this.locationMeterDS.state.itemsChanged;
    if (validateEvent.failed) {
      this.app.showDialog("maxlib_saveDiscardMeterReadingList");
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Close the update meter reading dialog.
   */
  async discardUpdateMeterDialog(refreshMeters) {
    await this.app.findDialog(refreshMeters)?.closeDialog();
    this.dialog?.closeDialog();
    this.clearReadingValues();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Clears the new reading values for a given datasource.
   * @param {Object} datasource - The datasource object to clear the new reading values for.
   * @returns {void}
   */
  clearReadingValues() {
    // Keep this comment. Was added to fix a bug, that turned to be Graphite.
    // this.readingDateDS && this.readingDateDS.reset(this.readingDateDS.baseQuery);
    [this.assetMeterDS, this.locationMeterDS].forEach((DS) => {
      DS?.items?.forEach((meter) => {
        if (meter.newreading || meter.newreading === 0) {
          meter.newreading = "";
          meter.newreadingdate = "";
        }
      });
      DS.clearChanges();
      DS.clearAllWarnings();
    });
    this.readingDateDS.clearChanges();
    this.readingDateDS.clearAllWarnings();
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Save roll over readings.
   * @param {boolean} userConfirmation - User confirmation flag.
   */
  saveRollOverReadings(userConfirmation) {
    this.isRollover = false;
    if (this.rollOverData && this.rollOverData.length > 0) {
      this.rollOverData.forEach((element, index) => {
        if (element.assetmeterid === this.lastMeterId || element.locationmeterid === this.lastMeterId) {
          element.dorollover = userConfirmation;
          if (!userConfirmation) {
            let errorMessage = "";
            const dataFormatter = this.app.dataFormatter;
            const newValue = dataFormatter.parseNumber(element.newreading);
            const newDate = element.newreadingdate ? dataFormatter.dateTimeToString(this.getISODate(element.newreadingdate)) : "";
            const lastReadingDate = element.lastreadingdate ? dataFormatter.dateTimeToString(this.getISODate(element.lastreadingdate)) : "";
            const lastReading = dataFormatter.parseNumber(element.deltareading || element.lastreading);
            if (!element.isdelta) {
              errorMessage = `The new reading (${newValue}) entered on ${newDate} should be greater than the previous reading (${lastReading}) entered on (${lastReadingDate}).`;
              errorMessage = this.app.getLocalizedLabel("meter_cont_error", errorMessage, [newValue, newDate, lastReading, lastReadingDate]);
              this.addError(element, errorMessage);
            } else {
              this.deleteError(element);
            }
          }
          return;
        }
      }, this);
      this.lastMeterId = undefined;
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Selects a characteristic meter reading item from a list of options.
   * @param {object} item - The item to be selected.
   * @returns {Promise<void>}
   */
  async selectCharacteristic(item) {
    const alnDomainDS = this.app.findDatasource("maxlib_aln_domain_lookupDS");

    await alnDomainDS.initializeQbe();
    alnDomainDS.setQBE("domainid", "=", item.meter.domainid);
    const response = await alnDomainDS.searchQBE();

    if (response) {
      if (item.assetmeterid) {
        alnDomainDS.currentMeterid = item.assetmeterid;
        alnDomainDS.currentAssetLocNum = item.assetnum;
        alnDomainDS.isAssetMeter = true;
      } else {
        alnDomainDS.currentMeterid = item.locationmeterid;
        alnDomainDS.currentAssetLocNum = item.location;
        alnDomainDS.isAssetMeter = false;
      }
      alnDomainDS.CurrentMeterName = item.metername;
      alnDomainDS.CurrentMeterhref = item.href;
      alnDomainDS.siteid = item.siteid;

      this.dialog.state.updateCharecteristicMeterReadingItem = item;
      this.app.state.meterReading.meterHeadername = item.metername;

      //Higlight the selected lookup item
      let selectedItem;
      alnDomainDS.items.forEach((item) => {
        const meterObj = this.dialog.state.updateCharecteristicMeterReadingItem;
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

      this.app.showDialog("maxlib_characteristicMeterLookup");
    }
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * @param {Event} event - The event object containing the selected value.
   * @returns {void}
   */
  onCharactersticSelection(event) {
    if (event && this.dialog.state.updateCharecteristicMeterReadingItem) {
      this.dialog.state.updateCharecteristicMeterReadingItem.newreading = event.value;
      this.dialog.state.updateCharecteristicMeterReadingItem.newReadingAddedDate = this.getISODate(this.getCurrentDateTime());
    }
    this.dialog.state.disableSave = false;
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Clears the character meter reading for a given item.
   * @param {object} item - The item object containing the meter reading.
   * @returns {void}
   */
  clearCharacterMeterReading(item) {
    item.newreading = "";
  }
}

export default UpdateReadingDrawerController;
