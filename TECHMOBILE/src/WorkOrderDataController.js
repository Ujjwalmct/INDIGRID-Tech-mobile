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
import WOUtil from './utils/WOUtil';
import CommonUtil from './utils/CommonUtil'
import WOTimerUtil from './utils/WOTimerUtil'
class WorkOrderDataController {
  onDatasourceInitialized(ds, owner, app) {
    this.datasource = ds;
    this.owner = owner;
    this.app = app;
  }

  /**
   * Function to set the computedDisableButton state - used to show/hide the Materials button
   *  - The Work Order selected.
   */
  computedDisableButton(item) {
    if (item) {
      return (
        !(item.wpmaterial?.length) &&
        !(item.wptool?.length)
      );
    }
    return true;
  }

  computedItemNum(item) {
    let computedItemNum = null;
    //istanbul ignore next
    if (item) {
      if (item.itemnum && item.description) {
        computedItemNum = item.itemnum + ' ' + item.description;
      } else {
        computedItemNum = item.itemnum ? item.itemnum : item.description;
      }
    }
    return computedItemNum;
  }

  /**
   * show/hide the Gauge Meter button for Work Order selected. */
  computedMultiDisableMeter(item) {
    return (!item.multiassetmetercount && !item.multilocationmetercount);
  }

  computedWorkType(item) {
    let computedWorkType = null;

    //istanbul ignore if
    if (item.istask) {
      computedWorkType = item.wogroup + '-' + item.taskid;
    } else if (item.worktype) {
      computedWorkType = item.worktype + ' ' + (item?.wonum || '');
    } else {
      computedWorkType = item?.wonum || '';
    }
    return computedWorkType;
  }

  /**
   * Show/hide Start, Pause & Stop button on workorder list page. 
   * @param {item} item
   * @return {hideStartButton} bool value to hideStartButton 
   */
  computedWOTimerStatus(item) {
    return WOTimerUtil.computedTimerStatus(item, this.app.client?.userInfo?.labor?.laborcode);
  }

  /**
   * Function to display WO status and priority on work order details page.
   */
  computedWODtlStatusPriority(item) {
    let schedulePage;
    let woDtlPage;
    //istanbul ignore next

    // DT214200 Addign the initialze to Maximo Mobile to resolve :: Unable to change status for work orders created without ever visiting the work order list.

    if (this?.app?.pages) {
      const schPage = (this.app.findPage("schedule")) ? 'schedule' : 'approvals';
      schedulePage = this.app.pages.find((element) => {
        return (element.name === schPage) ? element : '';
      });
      if (!schedulePage.initialized) {
        schedulePage.initialize();
      }
      woDtlPage = this.app.findPage('workOrderDetails');
    }

    // DT214200 close.
    let valueDisable = this.app.checkSigOption(`${this.app.state.woOSName}.STATUS`) ? false : true;
    //istanbul ignore next
    let woStatus = {
      label: item.status_description || item.status,
      type: 'white',
      action: true,
      disabled: valueDisable,
      onClick: () => {
        if (schedulePage && woDtlPage && woDtlPage?.findDatasource('woDetailResource')) {
          schedulePage.callController('openChangeStatusDialog', {
            item: item,
            datasource: woDtlPage.findDatasource('woDetailResource').name,
            referencePage: 'workOrderDetails',
            selectedDatasource: woDtlPage.findDatasource('woDetailResource')
          });
        }
      }
    };
    const woDetailDs = this.app.findDatasource("woDetailds");
    const currentItem = woDetailDs.item
    const canInteract = CommonUtil.canInteractWorkOrder(currentItem, this.app);

    if (item.wopriority !== null && item.wopriority !== "" && item.wopriority >= 0) {
      if (canInteract) {
        return [woStatus,
          {
            label: this.app.getLocalizedLabel('priority_label', `Priority ${item.wopriority}`, [item.wopriority]),
            type: 'dark-gray',
            disabled: valueDisable,
          }
        ];
      } else return [
        {
          label: this.app.getLocalizedLabel('priority_label', `Priority ${item.wopriority}`, [item.wopriority]),
          type: 'dark-gray',
          disabled: valueDisable,
        }
      ]
    } else {
      return (canInteract) ? [woStatus] : [];
    }
  }

  /**
     *  value to decide whetehr to show or hide start work or start travel.
     */
  computedWorkTypeButton(item) {
    let isTravel = false;
    if (this.app && this.app.pages) {

      // istanbul ignore next
      let schedulePage = this.app.pages.find((element) => {
        if (element.name === 'schedule' || element.name === 'approvals') {
          return element;
        } else {
          return '';
        }
      });
      // istanbul ignore next
      if (schedulePage) {
        let scheduleDataController = schedulePage.findDatasource('todaywoassignedDS');
        if (scheduleDataController) {
          isTravel = scheduleDataController.callController("computedWorkTypeStatus", item);
        }
        return isTravel;
      }

    }
  }

  /**
   * @description This function checks if the task interact button is displayed or not.
   */
  allowTaskInteract() {
    const woDetailDS = this.app.findDatasource("woDetailds");
    const acceptLabel = this.app.getLocalizedLabel('accepted', 'Accepted').toUpperCase();
    const isAssignmentEnabled = this.app.checkSigOption(`${this.app.state.woOSName}.MANAGEASSIGNMENTSTATUS`);
    let result;
    if (!isAssignmentEnabled) {
      result = true;
    } else if (woDetailDS.item?.assignment?.[0]?.status.toUpperCase() === acceptLabel) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  /**
   * @param {Object} item - The work order object
   * @returns {boolean} - True if the assignment button should be shown, false otherwise
   */
  computedShowAssignment(item) {
    return !CommonUtil.canInteractWorkOrder(item, this.app);
  }

  computedEstTotalCost(item) {
    return WOUtil.computedEstTotalCost(item)
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Computes the number of incomplete multi-asset records in the work order details page.
   *
   * @param {Array<Object>} items - An array of multi-asset records.
   * @returns {number} - The number of incomplete multi-asset records.
   * 
   */
  computedMultiAssetProgressCount(items) {
    this.app.findPage("workOrderDetails").state.multiAssetCount = items.reduce((count, item) => {
      return item.progress === false ? count + 1 : count;
    }, 0);
  }

  accessWoCostData(item) {
    return this.computedEstTotalCost(item).totalcost;
  }

  /**
   * Function called after loading the data
   * @param {dataSource} dataSource 
   * @param {items} items 
   */
  //istanbul ignore next
  async onAfterLoadData(dataSource, items) {
    let incompleteItems = [];
    let page = this.app.findPage("tasks");
    page.state.itemToOpen = page.state.itemToOpen ? page.state.itemToOpen : '';
    if (dataSource.name === 'woPlanTaskDetailds' && items.length) {
      // Enrich task spec descriptions from assetAttributeDS
      // (same pattern as WOCreateEditUtils.updateSpecificationAttributes)
      await this._enrichTaskSpecDescriptions(items);

      items.forEach((item) => {
        let status = item.status_maxvalue;
        if (item.taskid && status !== 'CLOSE' && status !== 'CAN' && status !== 'WAPPR') {
          incompleteItems.push(item);
        }
        if (this.app.currentPage.name === 'tasks' && page.state.itemToOpen === '' && status !== 'CLOSE' && status !== 'CAN' && status !== 'COMP') {
          page.state.itemToOpen = item.workorderid;
        }
        item.allowTaskInteract = this.allowTaskInteract();
        item.computedSpecProgress = this.computedSpecProgress(item);
        item.computedSpecCount = this.computedSpecCount(item);
        item.computedAllSpecsFilled = this.computedAllSpecsFilled(item);
        //DT365530 :: incomplete task completion issue  
        //  item.computedTaskStatus = this.computedTaskStatus(item);

      });

      this.app.state.taskCount = incompleteItems.length;
      await dataSource.searchQBE();

      //Set assetToOpen attribute value
      let detailsPage = this.app.findPage("workOrderDetails");
      detailsPage.state.assetToOpen = detailsPage.state.assetToOpen ? detailsPage.state.assetToOpen : '';

      if (detailsPage.state.assetToOpen === '') {
        items.forEach((item) => {
          let progress = item.progress;
          if (!progress && this.app.currentPage.name === 'workOrderDetails' && detailsPage.state.assetToOpen === '') {
            detailsPage.state.assetToOpen = item.multiid;
          }
        });
      }
    }

    // condition to update the multiAsset count when WO doesn't have any multiassetlocci
    if (dataSource.name === 'woMultiAssetLocationds' && !items.length) {
      this.app.findPage("workOrderDetails").state.multiAssetCount = 0;
    }
  }

  /**
   * Return ASSET if assetnum found else LOCATION
   * @param {items} item
   */
  computedAssetLoc(item) {
    return item?.assetnum ? this.app?.getLocalizedLabel('asset_label', 'ASSET') : this.app?.getLocalizedLabel('location_label', 'LOCATION');
  }

  /**
   * Computes the label for the given item.
   * Returns 'Asset' if `assetnum` exists, otherwise returns 'Location'.
   * 
   * @param {Object} item - The item containing asset or location or ci details.
   * @returns {string} -  'Asset' if assetnum exists, otherwise 'Location'.
   */
  computedFieldLabel(item) {
    return item?.assetnum ? this.app?.getLocalizedLabel('assetField_label', 'Asset') : this.app?.getLocalizedLabel('locationField_label', 'Location');
  }

  /**
   * Computes the description for the given item.
   * Constructs a string using `assetnum` and `assetdescription` if available,
   * otherwise uses `location` and `locationdesc`.
   * 
   * @param {Object} item - The item containing asset or location details.
   * @returns {string} - The formatted description based on available properties.
   */
  computedInputDesc(item) {
    if (!item) return '';

    const { assetnum, assetdescription, location, locationdesc } = item || {};

    return assetnum ? `${assetnum} ${assetdescription || ''}`.trim() :
      location ? `${location} ${locationdesc || ''}`.trim() : ''; // Explicitly return an empty string
  }


  computedMeterCurDate() {
    return this.app.dataFormatter.currentUserDateTime();
  }

  computedMeterCurTime() {
    return this.app.dataFormatter.currentUserDateTime();
  }

  /* Return workroder status and priority on workorder list page.
   * @param {item} item
   * @return {status_description} string value
   * @return {wopriority} number value 
   */
  computedTaskStatus(item) {
    let tasksPage;
    let taskDS;
    //istanbul ignore next
    if (this.app) {
      tasksPage = this.app.findPage('tasks');
      taskDS = this.app.findDatasource('woPlanTaskDetailds');
    }

    //istanbul ignore next
    let woStatus = {
      label: item.status_description || item.status,
      type: 'warm-gray',
      action: true,
      onClick: () => {
        if (tasksPage && taskDS) {
          tasksPage.callController('openChangeStatusDialog', {
            item: item,
            datasource: taskDS.name,
            referencePage: 'tasks',
            selectedDatasource: taskDS
          });
        }
      }
    };
    return (this.allowTaskInteract()) ? [woStatus] : [];
  }

  /**
   * Return whether to show lock or complete button
   * @param {item} task item
   */
  hideLockIcon(item) {
    let workTypeDs = this.app.findDatasource("dsworktype");
    let woDetailds = this.app.findDatasource("woDetailResource");
    let taskDS = this.app.findDatasource('woPlanTaskDetailds');
    let woWorkType = woDetailds.item.worktype;
    let workType = [];
    const isFlowControlled = this.app.findDatasource('woDetailds')?.item?.flowcontrolled;
    //istanbul ignore else
    if (woWorkType) {
      workType = workTypeDs.items.filter(
        (item) => item.worktype === woWorkType
      );
    }
    //istanbul ignore else
    if (isFlowControlled) {
      let isCompletedPredecessor = this.app.callController('validatePredessor', taskDS.items, item);
      //istanbul ignore if
      if (!isCompletedPredecessor && item.predessorwos && item.status_maxvalue !== 'COMP') {
        return false;
      }
      //istanbul ignore else
      if (workType && workType?.length) {
        //istanbul ignore if
        if (workType[0].startstatus && workType[0].startstatus_maxvalue === 'COMP') {
          return false
        }
        if (workType[0].startstatus && workType[0].startstatus_maxvalue !== 'INPRG') {
          return true;
        }
      }
      //istanbul ignore else
      return woDetailds.item.status_maxvalue === 'INPRG';
    } else {
      return true
    }
  }

  /**
   * Return whether true and false when the task asset or location different from parentWO.
   * @param {item} task item
   */
  computedParentAssetLocation(item) {
    let woDetailds = this.app.findDatasource("woDetailResource");
    let workorder = woDetailds.item;

    //istanbul ignore else
    if (item && item.assetnum && item.location && workorder.assetnumber && workorder.locationnum) {
      let parent_asset = (item.assetnum && (item.assetnum !== workorder.assetnumber));
      let parent_location = (item.location && (item.location !== workorder.locationnum));
      //istanbul ignore else
      return !(parent_asset || parent_location);
    }
    else if (item && !item.assetnum && !item.location && !workorder.assetnumber && !workorder.locationnum) {
      return true;
    }
    else if (item && !item.assetnum && item.location && !workorder.assetnumber && workorder.locationnum) {
      return item.location === workorder.locationnum;
    }
    else if (item && item.assetnum && !item.location && workorder.assetnumber && !workorder.locationnum) {
      return item.assetnum === workorder.assetnumber;
    }
    else {
      return false;
    }
  }

  /**
   * Return predessorwos as a string
   * @param {item} task item
   */
  computedPredecessorString(item) {
    let str = '';
    if (item.status_maxvalue !== 'COMP' && item.predessorwos) {
      let taskids;
      //istanbul ignore if
      if (item.predessorwos.includes('(')) {
        taskids = this.app.callController('getPredssorWoTask', item);
      } else {
        taskids = item.predessorwos.split(',');
      }
      //istanbul ignore else
      if (taskids && taskids.length) {
        return taskids.toString();
      }
    } else {
      return str;
    }
  }

  /**
  * Return boolean value to show or hide border
  * @param {item} task item
  */
  computedBorderDisplay(item) {
    //istanbul ignore else
    return !((!item.computedParentAssetLocation && !item.description_longdescription) || (item.computedParentAssetLocation && item.description_longdescription) || (item.computedParentAssetLocation && !item.description_longdescription));
  }

  /**
   * Returns a checklist progress string like "3/4" showing
   * how many workorderspec items have alnvalue filled vs total.
   * @param {Object} item - task item
   * @returns {string} progress string e.g. "3/4" or empty if no specs
   */
  computedSpecProgress(item) {
    const specs = this._getUniqueSpecs(item);
    if (!specs.length) return '';
    const filled = specs.filter(s => s.alnvalue).length;
    return `${filled}/${specs.length}`;
  }

  /**
   * Returns the number of unique workorderspec items for display.
   * @param {Object} item - task item
   * @returns {number} unique spec count
   */
  computedSpecCount(item) {
    return this._getUniqueSpecs(item).length;
  }

  /**
   * Deduplicates workorderspec by workorderspecid to avoid double
   * counting from rel.workorderspec and rel.IGTWOACTIVITYSPECALN.
   */
  _getUniqueSpecs(item) {
    const specs = item.workorderspec || [];
    if (!specs.length) return [];
    const seen = new Set();
    return specs.filter(s => {
      if (s.workorderspecid && seen.has(s.workorderspecid)) return false;
      if (s.workorderspecid) seen.add(s.workorderspecid);
      return true;
    });
  }

  /**
   * Returns true if all workorderspec items have a filled alnvalue.
   * Used to show a green indicator on the task row.
   * @param {Object} item - task item
   * @returns {boolean}
   */
  computedAllSpecsFilled(item) {
    const specs = this._getUniqueSpecs(item);
    if (!specs.length) return false;
    return specs.every(s => s.alnvalue && s.alnvalue.trim() !== '');
  }

  /**
   * Enriches task specification items with descriptions from assetAttributeDS.
   * The schema alias assetattribute.description--assetattributedesc does not resolve
   * for nested child relationships (woactivity > workorderspec), so we look up
   * descriptions at runtime from the pre-loaded assetAttributeDS lookup table.
   * This follows the same pattern as WOCreateEditUtils.updateSpecificationAttributes.
   * @param {Array} taskItems - array of task items from woPlanTaskDetailds
   */
  async _enrichTaskSpecDescriptions(taskItems) {
    try {
      const assetAttributeDS = this.app.findDatasource('assetAttributeDS');
      if (!assetAttributeDS) return;

      // Collect all unique assetattrid values across all task specs
      const allAttrIds = new Set();
      taskItems.forEach(task => {
        const specs = task.workorderspec || [];
        specs.forEach(spec => {
          if (spec.assetattrid && !spec.assetattributedesc) {
            allAttrIds.add(spec.assetattrid);
          }
        });
      });

      if (allAttrIds.size === 0) return;

      // Query assetAttributeDS for all needed attribute IDs at once
      await assetAttributeDS.initializeQbe();
      assetAttributeDS.setQBE('assetattrid', 'in', Array.from(allAttrIds));
      await assetAttributeDS.searchQBE();

      // Build a lookup map: assetattrid -> description
      const descMap = {};
      assetAttributeDS.items.forEach(attr => {
        if (attr.description) {
          descMap[attr.assetattrid] = attr.description;
        }
      });

      // Inject descriptions into each spec item
      taskItems.forEach(task => {
        const specs = task.workorderspec || [];
        specs.forEach(spec => {
          if (spec.assetattrid && !spec.assetattributedesc && descMap[spec.assetattrid]) {
            spec.assetattributedesc = descMap[spec.assetattrid];
          }
        });
      });
    } catch (e) {
      // Non-critical: if enrichment fails, the UI falls back to assetattrid
    }
  }
}

export default WorkOrderDataController;
