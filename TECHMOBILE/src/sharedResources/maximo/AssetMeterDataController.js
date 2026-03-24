class AssetMeterDataController {
  onDatasourceInitialized(ds, owner, app) {
    this.datasource = ds;
    this.owner = owner;
    this.app = app;
    this.meterReadingDrawer = this.app.getDialog("maxlib_meterReadingDrawer");
  }

  /**
   * Called after the data is loaded, giving an opportunity to change the data before it is added to the datasource.
   *
   * @param {import('@maximo/maximo-js-api').Datasource} datasource - Datasource instance.
   * @param {Array<object>} items - Datasource items to be added to the datasourtce.
   * @param {import('@maximo/maximo-js-api/build/data/Datasource').Query} query - Query instance.
   */
  onAfterLoadData(datasource, items) {
    if (datasource.name === "maxlib_assetmeters") {
      items.forEach((item) => {
        item.isdelta = item.readingtype_maxvalue === "DELTA";
        if (item.isdelta) {
          item.deltareading = this.app.dataFormatter.parseNumber(item.deltareading || item.lastreading);
          item.deltareadingdate = item.lastreadingdate;
        }
      });
      datasource.state.itemsChanged = false;
    }
  }

  // Assisted by watsonx Code Assistant
  /**
   * Computes the meter reading and its date based on the given item.
   * @param {Object} item - The item to compute the meter reading for.
   * @param {string} item.lastreadingdate - The last reading date of the item.
   * @param {number} item.deltareading - The delta reading of the item.
   * @param {string} item.deltareadingdate - The delta reading date of the item.
   * @returns {Object} - An object containing the computed meter reading and its date.
   */
  computedReading(item) {
    const lastreadingdate = item.lastreadingdate ? this.app.dataFormatter.dateWithoutTimeZone(this.app.dataFormatter.convertISOtoDate(item.lastreadingdate)) : "";
    let computedMeterReading;
    let computedMeterReadingDate;
    if (item) {
      if (item.deltareading) {
        computedMeterReading = item.deltareading;
        computedMeterReadingDate = item.deltareadingdate;
      } else {
        computedMeterReading = item.lastreading;
        computedMeterReadingDate = lastreadingdate;
      }
      if (item.meter.metertype_maxvalue !== "CHARACTERISTIC") {
        computedMeterReading = this.app.dataFormatter.format(computedMeterReading, null, {
          type: 'DECIMAL',
          scale: 2
        })
      }
    }
    return { computedMeterReading, computedMeterReadingDate };
  }

  // Assisted by watsonx Code Assistant
  /**
   * Computes the helper text for a given item.
   * @param {Object} item - The item for which the helper text is to be computed.
   * @param {String} item.meter.description - The description of the meter.
   * @param {String} [item.unitdescription] - The description of the unit.
   * @param {String} [item.measureunitid] - The ID of the measure unit.
   * @returns {String} - The computed helper text.
   */
  computeHelperText(item) {
    let helperText = item?.meter?.description;
    if (helperText && (item.unitdescription || item.measureunitid)) {
      helperText += ` (${item.unitdescription ? item.unitdescription : item.measureunitid})`;
    }
    return helperText;
  }
}

export default AssetMeterDataController;
