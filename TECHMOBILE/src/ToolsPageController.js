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

import { log } from "@maximo/maximo-js-api";
const TAG = "ToolsPageController";

class ToolsPageController {

  /**
   * Called once for the lifetime of the application.
   *
   * @param {import('@maximo/maximo-js-api').Page} page - Page instance.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  pageInitialized(page, app) {
    log.t(TAG, "Tools page Initialized");
    this.app = app;
    this.page = page;
  }

  /**
   * Called every time the page is resumed, including the first time the page is created.
   *
   * @param {import('@maximo/maximo-js-api').Page} page - Page instance.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  pageResumed() {
    this.loadPageData();
  }

  // Assisted by watsonx Code Assistant
  /**
 * Asynchronously loads the page data when resumed.
 *
 * @returns {Promise<void>} A promise that resolves when the page data is loaded.
 */

  async loadPageData() {
    // Set loading page state
    this.app.state.pageLoading = this.page.state.loading = true;
    this.page.state.pageTitle = this.page?.params?.isPlanned ? this.app.getLocalizedLabel('planned_tools_title', 'Select planned tools') : this.app.getLocalizedLabel('issued_tools_title', 'Select issued tools');

    // Handle missing href parameter
    //istanbul ignore else
    if (!this.page?.params?.href) {
      this.app.state.canLoadWoDetailDS = false;
    }
    await this.page.findDatasource('woToolsResource')?.load({ noCache: true, itemUrl: this.page.params.href });
    const woToolDS = this.page?.params?.isPlanned ? this.app.findPage('workOrderDetails')?.findDatasource('woDetailsToolds') : this.page.findDatasource('woIssuedToolDS');
    await woToolDS?.load({ noCache: true, itemUrl: this.page.params.href });
    this.app.state.canLoadWoDetailDS = true;

    // Separate tools into groups and load relevant datasources
    const woNonRotatingToolJsonDS = this.page.findDatasource('woNonRotatingToolJsonDS');
    const woRotatingToolJsonDS = this.page.findDatasource('woRotatingToolJsonDS');

    const [nonRotatingTools, rotatingTools] = await this.separateToolsIntoGroups(woToolDS?.items);

    //istanbul ignore else
    if (woToolDS?.items.length) {
      await Promise.all([
        woNonRotatingToolJsonDS?.load({ src: nonRotatingTools, noCache: true }),
        woRotatingToolJsonDS?.load({ src: rotatingTools, noCache: true })
      ]);
    }

    //update the actualqty for non-rotating tools
    await this.updateActualQty();

    // Reset loading state
    this.selectedDS = 'woNonRotatingToolJsonDS';
    this.app.state.pageLoading = this.page.state.loading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
 * Navigates back to the previous page.
 *
 * @returns {void}
 */
  handlePageExit() {
    const hasSelectedItems = ['woNonRotatingToolJsonDS', 'rotatingToolAssetJsonDS'].some(ds => this.app.findDatasource(ds)?.state?.selection?.count > 0 && !this.page.state.hasError);
    hasSelectedItems ? this.page.showDialog('saveDiscardToolsDialog') : this.app.navigateBack();
  }

  // Assisted by watsonx Code Assistant 
  /**
 * Handles the failure of saving data.
 *
 * @returns {void}
 */
  onSaveDataFailed() {
    this.saveDataSuccessful = false;
  }

  /**
   * Called every time the page is being paused or leaving.
   *
   * @param {import('@maximo/maximo-js-api').Page} page - Page instance.
   * @param {import('@maximo/maximo-js-api').Application} app - Application instance.
   */
  pagePaused() {
    this.page.state.rotatingAsset = "";
    this.selectedDS = '';
    this.resetJsonDatasources();
    this.resetToolSelections();
    this.app.findDatasource('woNonRotatingToolJsonDS').resetState();
    this.app.findDatasource('rotatingToolAssetJsonDS').resetState();
  }

  async resetJsonDatasources() {
    await Promise.all([
      this.app.findDatasource('woNonRotatingToolJsonDS')?.load({ src: [], noCache: true }),
      this.app.findDatasource('woRotatingToolJsonDS')?.load({ src: [], noCache: true }),
      this.app.findDatasource('rotatingToolAssetJsonDS')?.load({ src: [], noCache: true }),
    ]);
  }
  // Assisted by watsonx Code Assistant 
  /**
   * Asynchronously reports the selected tools' data.
   *
   * @returns {Promise<void>} A promise that resolves when the data is successfully saved.
   */
  async reportTools() {
    const isPlanned = this.page?.params?.isPlanned;
    const selectedDs = this.app.findDatasource(this.selectedDS);
    this.page.state.loading = true;
    this.app.state.pageLoading = true;

    // Exit early if datasource has warnings
    //istanbul ignore else
    if (['itemqty', 'hours'].some(field => selectedDs.hasWarnings(selectedDs.item, field))) {
      this.page.state.loading = false;
      this.app.state.pageLoading = false;
      return;
    }

    // Handle missing href parameter
    //istanbul ignore else
    if (!this.page?.params?.href) {
      this.app.state.canLoadWoDetailDS = false;
    }
    const toolDs = this.app.findPage('report_work')?.findDatasource('reportWorkActualToolsDetailDs');
    await toolDs?.load({ noCache: true, itemUrl: this.page.params.href });
    this.app.state.canLoadWoDetailDS = true;


    // Map the reported tools 
    const reportedTools = Object.values(selectedDs.state.selection.selected).map(tool => ({
      itemnum: tool.itemnum,
      description: tool.description,
      toolqty: tool.itemqty,
      toolhrs: tool.hours,
      rotassetnum: tool.assetnum,
      toolitem: { description: tool.description }
    }));

    const option = {
      responseProperties: 'tooltransid, anywhererefid',
      localpayload: reportedTools
    };
    const onDataFailedHandler = this.onSaveDataFailed.bind(this);
    try {
      toolDs?.on('put-data-failed', onDataFailedHandler);
      await toolDs?.bulkAdd(reportedTools, option);
      this.saveDataSuccessful = true;
    } catch (error) {
      log.t(TAG, 'Error on reporting tools : ' + error);
    } finally {
      const successMsgKey = isPlanned ? 'planned_tools_success' : 'issued_tools_success';
      const errorMsgKey = 'tools_error';
      const msgKey = this.saveDataSuccessful ? successMsgKey : errorMsgKey;
      const msg = this.app.getLocalizedLabel(msgKey, this.saveDataSuccessful
        ? (isPlanned ? "Planned tools added successfully" : "Issued tools added successfully")
        : "Failed to add tools");

      this.app.toast(msg, this.saveDataSuccessful ? "success" : "error");
      //istanbul ignore else
      if (this.saveDataSuccessful) {
        await this.app.findPage('report_work')?.findDatasource('reportWorkActualToolsDs').forceReload();
        await this.app.findPage('report_work')?.findDatasource('reportWorkActualToolsDetailDs').forceReload();
      }
    }

    //Reset the page state
    this.page.state.loading = false;
    this.app.state.pageLoading = false;
    this.goBackToReportPage();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Resets the tool selections for both issued and planned tools.
   *
   * @returns {void}
   */
  resetToolSelections() {
    this.app.findDatasource('woNonRotatingToolJsonDS').clearSelections();
    this.app.findDatasource('woRotatingToolJsonDS').clearSelections();
    this.app.findDatasource('rotatingToolAssetJsonDS').clearSelections();
  }

  // Assisted by watsonx Code Assistant 

  /**
   * Navigates back to the report page and resets tool selections.
   */
  goBackToReportPage() {
    this.resetToolSelections();
    this.app.navigateBack();
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Separates an array of tools into non-rotating and rotating groups based on the 'isrotating' property.
   * @param {Array<Object>} items - An array of tool objects.
   * @returns {Array<Array<Object>>} - An array containing two arrays: non-rotating tools and rotating tools.
   */
  separateToolsIntoGroups(items) {
    return ((Array.isArray(items) ? items : [])).reduce(
      ([nonRotating, rotating], item) => {
        // If item.hours is null or undefined, assign it a default value of 1
        item.hours = item.hours ?? 1;
        (item.isrotating ? rotating : nonRotating).push(item);
        return [nonRotating, rotating];
      },
      [[], []]
    );
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Retrieves the storeroom locations for the given tool based on whether it's planned or not.
   * @param {Object} item - The tool object containing 'itemnum' and 'location' properties.
   * @param {boolean} isPlanned - A flag indicating whether the tool is planned or not.
   * @returns {Array<string>} - An array of storeroom locations.
   */
  async getStoreroomForTools(item, isPlanned) {
    if (!isPlanned) return [item?.location, item?.storeloc];
    const inventoryToolDS = this.app.findPage('report_work')?.findDatasource('inventoryToolDS');
    await inventoryToolDS?.initializeQbe();
    inventoryToolDS?.setQBE('itemnum', '=', item?.itemnum);
    await inventoryToolDS?.searchQBE();
    return [...new Set(inventoryToolDS?.items.map((tool) => tool.location))]
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Retrieves rotating tools data for a given item and loads it into the 'rotatingToolAssetJsonDS' datasource.
   * @param {Object} item - The item object containing 'itemnum', 'storelocsite', and 'description' properties.
   */
  async getRotatingToolsData(item) {
    // show save/discard pop up if non-rotating tools have selections
    //istanbul ignore else
    if (this.app.findDatasource('woNonRotatingToolJsonDS')?.getSelectedItems().length > 0 && !this.page.state.hasError) {
      this.page.showDialog('saveDiscardToolsDialog');
      return;
    }
    // setting the page state
    this.page.state.pageTitle = this.app.getLocalizedLabel('rotating_tools_title', 'Select rotating tools')
    this.app.state.pageLoading = true;
    this.page.state.hasError = false;
    this.selectedDS = 'rotatingToolAssetJsonDS';
    this.page.state.rotatingAsset = item?.description || item.itemnum;

    const storeLocation = await this.getStoreroomForTools(item, this?.page?.params?.isPlanned);
    this.resetToolSelections();

    // filter the rotating assets datasource
    const rotatingToolAssetDS = this.page.findDatasource("rotatingToolAssetDS");
    await rotatingToolAssetDS?.initializeQbe();
    rotatingToolAssetDS?.setQBE("itemnum", "=", item?.itemnum);
    rotatingToolAssetDS?.setQBE("itemtype", "=", 'TOOL');
    rotatingToolAssetDS?.setQBE("siteid", "=", item?.storelocsite);
    rotatingToolAssetDS?.setQBE("location", "in", storeLocation);
    await rotatingToolAssetDS?.searchQBE();

    // load the rotatingToolAssetJsonDS datasource
    const rotatingTools = rotatingToolAssetDS?.items.map(tool => ({
      itemnum: tool.itemnum,
      assetdescription: tool.description,
      description : item?.description || item.itemnum,
      location: tool.location,
      itemqty: 1,
      hours: 1,
      assetnum: tool.assetnum,
      actualqty: item?.actualqty,
      toolitem: { description: tool.description }
    }));
    await this.app.findDatasource('rotatingToolAssetJsonDS')?.load({ src: rotatingTools, noCache: true })

    //reseting the loader
    this.app.state.pageLoading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Updates the actual quantity for a list of rotating tools.
   * @param {Array<Object>} rotatingTools - An array of rotating tool objects.
   * @returns {Promise<void>} - A promise that resolves when the actual quantities are updated.
   */
  async updateActualQty() {
    const woRotatingToolJsonDS = this.page.findDatasource('woRotatingToolJsonDS');
    const toolsActualDs = this.page.findDatasource('toolsActualDs');
    await toolsActualDs?.forceReload();
    //istanbul ignore else
    if (!toolsActualDs || !woRotatingToolJsonDS || !woRotatingToolJsonDS.items) {
      return;
    }
    // Use reduce to build the itemCountMap in a single pass
    const itemCountMap = toolsActualDs.items.reduce((map, item) => {
      map.set(item.itemnum, (map.get(item.itemnum) || 0) + 1);
      return map;
    }, new Map());
    // Set the count to actualqty for each item
    woRotatingToolJsonDS.items.forEach(item => {
      item.actualqty = itemCountMap.get(item.itemnum) || 0;
    });
  }
}

export default ToolsPageController;