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
import { log, Device } from '@maximo/maximo-js-api';
import SynonymUtil from './utils/SynonymUtil';
import commonUtil from "./utils/CommonUtil";
const TAG = "TaskController";

// IGT Geofencing: The allowed distance threshold is read at runtime from the
// Maximo system property 'igtmobile.towerdistance'. The constant below is NOT
// used; it is kept only as a documentation reference for the default value (200 m).
// See _checkGeofence() for the actual lookup.

class TaskController {
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    this.page.state.inspectionAccess = this.app.checkSigOption(`${this.app.state.appnames.inspection}.READ`);
    
    // Ensure system properties (like igtmobile.towerdistance) are fetched if this page is loaded directly
    if (commonUtil && commonUtil.getTravelSystemProperties) {
      commonUtil.getTravelSystemProperties(this.app);
    }
  }

  /*
   * Method to open the task long desc dialog.
   */
  openTaskLongDesc(item) {
    if (item) {
      this.page.state.taskLongDesc = item.description_longdescription;
      this.page.showDialog('planTaskLongDesc');
      this.page.state.dialogOpend = true;
    }
  }

  /**
   * Function to inject time part into dateISO and return dateTime object.
   * For ex: dt = 2020-12-15T00:00:00.000+05:30, time = 2020-12-14T03:00:00.000+05:30
   * And it will return as 2020-12-15T03:00:00.000+05:30
   */
  combineDateTime(dateISO, timeISO, app) {
    let dataFormatter = (app) ? app.dataFormatter : this.app.dataFormatter;
    let date = dataFormatter.convertISOtoDate(dateISO);
    let time = dataFormatter.convertISOtoDate(timeISO);
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    return date;
  }

  /**
   * Function to check if all tasks are complete
   *
   * @param {object} taskItem - The current task item
   * @param {object} workTypeDs - The work type datasource
   * @param {object} taskds - The task datasource
   * @param {string} woWorktype - The current work type
   * @returns {boolean} - True if all tasks are complete and Next status of work order to be COMP, false otherwise
   */
  async woCompleteHook(taskItem, taskds) {
    const tasksLeft = [];
    // istanbul ignore else
    if (taskds?.items) {
      taskds.items.forEach((item) => {
        let status = item.status_maxvalue;
        // istanbul ignore else
        if (item.taskid && item.taskid !== taskItem.taskid && !['COMP', 'CLOSE', 'CAN'].includes(status)) {
          tasksLeft.push(item._rowstamp);
        }
      });
    }
    // istanbul ignore else
    return !tasksLeft.length;
  }

  /*
   * Method to complete the task.
   */
  //istanbul ignore next
  async completeWoTask(record) {
    if (!this.page.state.taskDisabled) {
      this.page.state.taskDisabled = true;
    } else {
      return;
    }
    const isFlowControlled = this.app.findDatasource('woDetailds')?.item?.flowcontrolled;
    const workOrderData = this.app.findDatasource('woDetailResource')?.item;
    let item = record.taskItem;
    // istanbul ignore else
    if (item) {
      item.disabled = true;
      this.page.state.disableButton = true;
      this.page.state.taskLoadingstatus = true;
      this.page.state.currentTask = item.taskid;
      localStorage.setItem('scrollpos', window.scrollY);

      let statusData;
      if (record.directlyCompleteWoTask) {
        statusData = await SynonymUtil.getSynonymDomain(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', record.status);
      } else { //DT254965 : Adding a synonym function to get a synonym for a specific maxvalue and value.
        statusData = await SynonymUtil.getSynonymValue(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', record.internalValue, record.value);
      }
      if (statusData) {
        let taskds = this.app.findDatasource('woPlanTaskDetailds');
        let workTypeDs = this.app.findDatasource("dsworktype");
        let woDetailds = this.app.findDatasource("woDetailds");

        let task = {
          parameters: {
            status: statusData.value,
            date: this.app.dataFormatter.currentUserDateTime()
          },
          record: { href: item.localref },
          responseProperties: 'status,status_maxvalue,workorderid',
          localPayload: {
            woactivity: [{
              href: item.href,
              status: statusData.value,
              date: this.app.dataFormatter.currentUserDateTime(),
              status_maxvalue: statusData.maxvalue,
              status_description: statusData.description || statusData.value,
              workorderid: item.workorderid
            }],
            href: taskds.dependsOn.currentItem.href
          },
        };

        let incompTaskCount = [];
        let isMobile = Device.get().isMaximoMobile;
        // istanbul ignore else
        if (isFlowControlled && isMobile) {
          let woTasklist = await this.getWoTask(taskds.items, item, statusData);

          if (woTasklist?.length) {
            task.localPayload["woactivity"] = woTasklist;
            let lastTask = woTasklist.filter(item => item.taskid && item.status_maxvalue !== 'CLOSE' && item.status_maxvalue !== 'CAN' && item.status_maxvalue !== 'COMP');
            let workType = workTypeDs.items.filter(
              (item) => item.worktype === woDetailds.item.worktype
            );

            let defaultComp = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', 'WOSTATUS|COMP');
            if (!lastTask.length) {
              task.localPayload.status = workType.length && workType[0].completestatus ? workType[0].completestatus : defaultComp.value;
              task.localPayload.status_maxvalue = workType.length && workType[0].completestatus ? workType[0].completestatus_maxvalue : defaultComp.maxvalue;
              task.localPayload.status_description = workType.length && workType[0].completestatus ? workType[0].completestatus_description : defaultComp.description;
            }
          }

        }

        if (isFlowControlled) {
          const hookResponse = await this.woCompleteHook(record.taskItem, taskds);
          let disableScanCheck = false;
          // Validate Datasheet Completed
          // istanbul ignore next
          if (hookResponse && workOrderData?.iscalibration && workOrderData?.pluscwodscount > 0 && this.app.name !== "supmobile" && !this.app.state.disableScan) {
            const datasheetResult = await commonUtil.validateDataSheet(this.app, this.page, workOrderData, {}, false);
            // istanbul ignore next
            if (!datasheetResult) {
              disableScanCheck = true;
            } else {
              // Validate Tools Added
              const workOrder = { ...workOrderData, actualtoolcount: this.app?.findDatasource('reportWorkActualToolsDs')?.items.length };
              const validateActualTool = await commonUtil.validateActualTools(this.app, this.page, workOrder, {}, false);
              // istanbul ignore next
              if (!validateActualTool) {
                disableScanCheck = true;
              }
            }
          }

          // istanbul ignore else
          if (!disableScanCheck && hookResponse && this.page.state.enforceAssetScan === 1 && !this.app.state.disableScan && woDetailds.item.assetnum) {
            const isScanRequired = await commonUtil.checkScanRequired("COMP");
            // istanbul ignore else
            if (isScanRequired) {
              this.page.state.disableButton = false;
              this.page.state.completeLoading = false;
              this.page.state.taskDisabled = false;
              const scanResParam = { scanValue: null, assetnum: woDetailds.item.assetnum, locationnum: woDetailds.item.locationnum, status: "COMP" };
              this.app.state.scanParameter = { app: this.app, page: this.page, record: record, method: "completeWoTask", scanResParam: scanResParam };
              this.app.showDialog("appAssetScanDialog");
              return;
            }
          }
          this.app.state.disableScan = false;

          // istanbul ignore else
          if (!disableScanCheck && hookResponse && this.app.state.skipScan) {
            this.app.state.skipScan = false;
            const workOrderDetails = this.app.findPage("workOrderDetails");
            // istanbul ignore else
            if (workOrderDetails) {
              const message = this.app.getLocalizedLabel('worklog_woCompleted_without_scan', 'The work order was completed without scanning an asset.');
              await workOrderDetails.callController('saveWorkLog', {
                longDescription: "",
                summary: message,
                visibility: true
              }, true);
            }
          }
        }

        try {
          let response = await taskds.invokeAction('changeStatus', task);
          // For flow-controlled work orders, reload to get updated task statuses
          // as completing one task may trigger status changes in dependent tasks
          if (isFlowControlled) {
            await taskds.forceReload();
          }

          if (isMobile) {
            //Since mobile's response doesn't come from the server, just use localPayload
            response = task.localPayload.woactivity[0];
          }

          if (response) {
            item.status = isMobile ? statusData.value : response.status;
            item.status_maxvalue = isMobile ? statusData.maxvalue : response.status_maxvalue;
            item.status_description = (isMobile ? statusData.description : response.status_description) || statusData.value;

            if (taskds?.items) {
              taskds.items.forEach((item) => {
                let status = item.status_maxvalue;
                if (item.taskid && status !== 'CLOSE' && status !== 'CAN' && status !== 'COMP' && status !== 'DRAFT' && status !== 'WAPPR') {
                  incompTaskCount.push(item._rowstamp);
                }
              });
              // Show total items
              this.app.state.taskCount = incompTaskCount.length;
            }
            this.page.state.itemToOpens = [];
            this.page.state.itemToOpen = '';
            // istanbul ignore else
            if (incompTaskCount.length >= 1) {
              const itemToOpen_workorderid = taskds.items.find(item => item.taskid && item._rowstamp === incompTaskCount[0]);
              if (itemToOpen_workorderid) {
                this.page.state.itemToOpen = itemToOpen_workorderid.workorderid;
              }
            }
            // istanbul ignore else
            if (!incompTaskCount.length) {
              this.page.state.itemToOpen = '';
              this.page.state.doneButtonDisabled = false;
            }
            setTimeout(() => {
              this.page.state.taskDisabled = false;
              item.disabled = false;
            })
            const schPage = this.app.findPage("schedule") || this.app.findPage('approvals');
            let SchedulePageDS = this.app.findDatasource(schPage.state.selectedDS);
            if (SchedulePageDS) {
              await SchedulePageDS.forceReload();
            }

          }
        } catch (err) {
          item.disabled = false;
          this.page.state.taskDisabled = false;
          //handle error
        }
      } else {
        this.app.toast(
          this.app.getLocalizedLabel(
            'fail_get_synonym',
            `Can not get the synonym data for WOSTATUS`,
            ['WOSTATUS']
          ),
          'error'
        );
      }
      this.page.state.disableButton = false;
      this.page.state.taskLoadingstatus = false;
      item.disabled = false;
    }
    else if (this.page.state.taskDisabled) {
      this.page.state.taskDisabled = false;
    }
  }

  /**
   * Method to navigate to asset details of asset app
   */
  async redirectToAssetDetails(item) {
    this.page.state.loadAssetData = true;
    try {
      this.page.state.loadAssetData = false;
      //istanbul ignore if
      if (item?.item?.href) {
        const context = {
          page: 'assetDetails',
          assetnum: item.item?.assetnum,
          siteid: this.page.state.currentAssetSite,
          href: item.item?.href,
        };
        this.app.callController('loadApp', {
          appName: this.app.state.appnames.assetmobile,
          context,
        });
      }
    } catch {
    } finally {
      this.page.state.loadAssetData = false;
    }
  }

  /**
   * Rediret user to report page or WODetails page base on
   * system property value of maximo.mobile.gotoreportwork
   */
  async redirectToWODetailsOrReport() {
    const woDetail = await this.app.findDatasource('woDetailResource');
    const redirctToReportAllowed = this.app.state.systemProp && parseInt(this.app.state.systemProp['maximo.mobile.gotoreportwork']);
    if (redirctToReportAllowed) {
      this.redirectToReportPage(woDetail.item);
    } else {
      this.app.setCurrentPage({ name: 'workOrderDetails' });
    }
  }

  /**
   *
   * @param {item} item of selected work order in detail page
   */
  async redirectToReportPage(item) {
    this.app.setCurrentPage({
      name: 'report_work',
      params: {
        wonum: item.wonum,
        itemhref: item.href,
        worktype: item.worktype,
        istask: item.istask,
        wogroup: item.wogroup,
        taskid: item.taskid
      }
    });
    // istanbul ignore else
    if (this.app?.currentPage) {
      this.page.state.navigateToReportWork = true;
    }
  }
  /**
   * function return tasks from workorder.
   * @param {taskLIst} is tasklist ds.
   * @param {selectedItem} is selected task object.
   * @param {selectedStatus} is changed item object.
   */
  async getWoTask(taskList, selectedItem, selectedStatus) {
    const isFlowControlled = this.app.findDatasource('woDetailds')?.item?.flowcontrolled;
    let workTypeDs = this.app.findDatasource("dsworktype");
    let woDetailds = this.app.findDatasource("woDetailds");
    let woWorkType = woDetailds.item.worktype;
    let workType = [];
    let woTaskList = [];
    let initialStatus = 'INPRG';
    /* istanbul ignore else */
    if (woWorkType) {
      workType = workTypeDs.items.filter(
        (item) => item.worktype === woDetailds.item.worktype
      );
    }
    let workTypeStartMaxVal = workType?.length && workType[0].startstatus ? workType[0].startstatus_maxvalue : /* istanbul ignore next */'';
    /* istanbul ignore next */
    if (workTypeStartMaxVal === 'APPR' || workTypeStartMaxVal === 'WSCH' || workTypeStartMaxVal === 'WMATL' || workTypeStartMaxVal === 'INPRG') {
      initialStatus = workType[0].startstatus;
    }

    let INPRGStatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', `WOSTATUS|${initialStatus}`);
    /* istanbul ignore else */
    if (taskList.length) {
      const tempTaskList = taskList.map((item) => {
        /* istanbul ignore else */
        if (item.taskid) {
          /* istanbul ignore else */
          if (item.taskid === selectedItem.taskid) {
            return {
              ...item,
              status: selectedStatus.value,
              status_maxvalue: selectedStatus.maxvalue,
              status_description: selectedStatus.description
            };
          } else {
            return {
              ...item,
              status: item.status,
              status_maxvalue: item.status_maxvalue,
              status_description: item.status_description
            };
          }
        }
        return item
      });

      woTaskList = tempTaskList.map((item) => {
        /* istanbul ignore else */
        if (item.taskid) {
          /* istanbul ignore next */
          if (isFlowControlled && item.predessorwos && item.taskid && item.taskid !== selectedItem.taskid) {
            let isComplitedPredessor = this.app.callController('validatePredessor', tempTaskList, item);
            let setStatus = isComplitedPredessor && (workTypeStartMaxVal !== 'CAN' && workTypeStartMaxVal !== 'WAPPR');
            return {
              ...item,
              status: setStatus ? INPRGStatus.value : item.status,
              status_maxvalue: setStatus ? INPRGStatus.maxvalue : item.status_maxvalue,
              status_description: setStatus ? INPRGStatus.description : item.status_description
            };
          } else {
            return {
              ...item,
              status: item.status,
              status_maxvalue: item.status_maxvalue,
              status_description: item.status_description
            };
          }
        }
        return item
      });
    }
    return woTaskList;
  }

  /**
   * Method invoked whenever page is visited. Check if maximoMobile will filter datasource with QBE approach.
   * @param {Object} page
   * @param {Object} app
   */
  async pageResumed(page, app) {
    page.state.taskDisabled = true;
    page.state.measurementDialog = false;
    let pageTitle = app.callController('updatePageTitle', { page: page, label: 'tasks_title', labelValue: 'Tasks' });
    //istanbul ignore next
    if (!pageTitle) { // If title return null or empty then retrying to fetch title again because app load takes time in appController
      window.setTimeout(() => {
        pageTitle = app.callController('updatePageTitle', { page: page, label: 'tasks_title', labelValue: 'Tasks' });
        page.state.pageTitle = pageTitle;
      }, 1);
    } else { // If title return value then set to state
      page.state.pageTitle = pageTitle;
    }
    page.state.inspectionAccess = app.checkSigOption(`${app.state.appnames.inspection}.READ`);
    page.state.enforceAssetScan = app.checkSigOption(`${app.state.woOSName}.ENFORCEASSETSCAN`);
    page.state.assetSwicthAccess = app.checkSigOption(`${app.state.appnames.assetswitch}.READ`) ? true : false;
    let device = Device.get();
    page.state.openTaskId = null;
    page.state.itemToOpen = '';
    let woDetailds = app.findDatasource('woDetailds');

    //istanbul ignore next
    if (woDetailds.items.length === 0) {
      //istanbul ignore else
      if (!page?.params?.href) {
        this.app.state.canLoadWoDetailDS = false;
      }
      await woDetailds.load({ noCache: true, itemUrl: page.params.href });
      this.app.state.canLoadWoDetailDS = true;
    }

    this.page.state.doneButtonDisabled = true;
    /* istanbul ignore else */
    if (!app.state.taskCount) {
      this.page.state.doneButtonDisabled = false;
    }
    page.state.workorder = woDetailds.item;

    let taskDataSource = app.findDatasource('woPlanTaskDetailds');

    if (device.isMaximoMobile) {
      let externalStatusList = await SynonymUtil.getExternalStatusList(app, ['INPRG', 'WMATL', 'APPR', 'WSCH', 'WPCOND', 'COMP']);
      await taskDataSource.initializeQbe();
      taskDataSource.setQBE('status', 'in', externalStatusList);
      await taskDataSource.searchQBE(undefined, true);
    }
    else {
      await taskDataSource.forceReload();
    }

    //istanbul ignore next
    if (app.state.incomingContext && taskDataSource.items.length === 0) {
      woDetailds = app.findDatasource('woDetailds');
      // istanbul ignore else
      if (this.app.state.refreshOnSubsequentLogin !== false) {
        await woDetailds.forceSync();
      }
      await taskDataSource.forceReload();
      // istanbul ignore else
      if (taskDataSource.items.length === 0) {
        let errorMessage = 'This record is not on your device. Try again or wait until you are online.';
        page.error(
          this.app.getLocalizedLabel("record_not_on_device", errorMessage)
        );
      }
    }

    // istanbul ignore else
    if (this.app.checkSigOption(`${this.app.state.appnames.assetmobile}.READ`) && woDetailds?.item?.assetnum !== taskDataSource?.item?.assetnum) {
      await this.getTaskAssetsHref(page.state.itemToOpen, taskDataSource, woDetailds);
    }

    this.page.state.taskDisabled = false;
  }

  /*
   * Method to open task status lookup from task page:
   */
  async openChangeStatusDialog(event) {
    let statusArr = [];
    this.page.state.disableDoneButton = true;
    this.page.state.selectedTaskItem = event.item;
    let statusLstDS = this.page.findDatasource("taskstatusDomainList");
    statusLstDS.clearSelections();

    // Fetch ALL WOSTATUS synonyms directly (bypass cached offlineStatusList)
    const synonymDS = this.app.findDatasource('synonymdomainData');
    await synonymDS.initializeQbe();
    synonymDS.setQBE('domainid', 'WOSTATUS');
    synonymDS.setQBE('orgid', event.item.orgid);
    synonymDS.setQBE('siteid', event.item.siteid);
    let domainValues = await synonymDS.searchQBE();

    // Fallback: org-level (no site)
    if (!domainValues || domainValues.length < 1) {
      synonymDS.setQBE('domainid', 'WOSTATUS');
      synonymDS.setQBE('orgid', '=', event.item.orgid);
      synonymDS.setQBE('siteid', '=', 'null');
      domainValues = await synonymDS.searchQBE();
    }

    // Fallback: system-level (no org, no site)
    if (!domainValues || domainValues.length < 1) {
      synonymDS.setQBE('domainid', 'WOSTATUS');
      synonymDS.setQBE('orgid', '=', 'null');
      synonymDS.setQBE('siteid', '=', 'null');
      domainValues = await synonymDS.searchQBE();
    }

    synonymDS.clearQBE();

    // Build status list — include ALL entries except the current status
    (domainValues || []).forEach((element) => {
      if (element.value && element.value !== event.item.status) {
        statusArr.push({
          id: element.value,
          value: element.value,
          description: element.description,
          defaults: element.defaults,
          maxvalue: element.maxvalue,
          _bulkid: element.value
        });
      }
    });

    await statusLstDS.load({ src: statusArr, noCache: true });
    this.page.showDialog("taskStatusChangeDialog", { parent: this.page });
  }

  /*
   * Method to change the task status:
   */
  async changeWoTaskStatus() {
    let record = {
      taskItem: this.page.state.selectedTaskItem,
      status: `WOSTATUS|${this.page.state.selectedTaskStatus?.value}`,
      date: this.app.dataFormatter.currentUserDateTime(),
      internalValue: this.page.state.selectedTaskStatus?.maxvalue,
      value: this.page.state.selectedTaskStatus?.value,
      directlyCompleteWoTask: false
    }
    try {
      await this.completeWoTask(record);
    } catch (error) {

    } finally {
      this.page.findDialog("taskStatusChangeDialog")?.closeDialog();
    }
  }


  /**
  * function to find and set asset href for selected workorder task.
  * @param {itemOpen} is selected work order.
  * @param {taskDs} is selected workorder task DS.
  * @param {woDetailsDs} is selected workorder DS.
  */
  async getTaskAssetsHref(itemOpen, taskDs, woDetailsDs) {
    for (const task of taskDs.items) {
      // istanbul ignore else
      if (task.assetnum !== woDetailsDs?.item?.assetnum) {
        this.page.state.currentAssetNum = task.assetnum;
        this.page.state.currentAssetSite = task?.siteid;
        const assetListDS = this.app.findDatasource("assetLookupDS");

        await assetListDS?.initializeQbe();
        assetListDS?.setQBE("assetnum", this.page.state.currentAssetNum);
        assetListDS?.setQBE("siteid", this.page.state.currentAssetSite);
        const filteredAsset = await assetListDS?.searchQBE();
        // istanbul ignore if
        if (filteredAsset?.[0]?.href) {
          task.hasHref = true;
          if (task.asset && task.asset[0]) {
            task.asset[0].href = filteredAsset[0].href;
          } else {
            log.t(TAG, "Error: Task does not contain any associated assets");
          }
          this.page.state.currentTaskId = task?.taskid;
          this.page.state.assetAccess = filteredAsset[0]?.href;
        } else {
          task.hasHref = false;
        }
      }
    }
  }

  /*********** Measurement Point Save ************/

  /**
   * on click of meter reading drawer item open slider and set necessary value of variour items
   * and show slider in case meter type if not assigned show error message
   * @param {*} event
   */
  openMeasurementDrawer(event) {
    if (event.item) {
      const woPlanTaskDetailDS = this.app.findDatasource("woPlanTaskDetaildsSelected");
      woPlanTaskDetailDS?.clearWarnings(woPlanTaskDetailDS.item, "measuredate");
      this.page.state.assetMeterHeader = `${event?.item?.measurepoint?.assetnum || ""} ${event.item?.measurepoint?.asset?.description || ""}`;
      this.page.state.measurementSaveDisabled = true;
      event.datasource.items[0]._selected = event.item.workorderid;
      this.page.showDialog("taskMeasurementDialog", { parent: this.page }, event.item);
    }
  }

  /**
   * saveMeasurement is async method which primary is used to submit task measurement value
   * in case value doesn't exists it will update measurement value and reload task api else it will
   * close meter reading slide drawer only
   */
  async saveMeasurement() {
    const woPlanTaskDetailds = await this.app.findDatasource("woPlanTaskDetailds");
    const item = await this.app.findDatasource("woPlanTaskDetaildsSelected").item;
    if (!item.measurementvalue && !item?.observation) {
      item.measurementvalue = item.newreading;
      item.inspector = this.app.client.userInfo.personid;

      let meterType;
      if (item.measurepoint.meter.metertype_maxvalue === "CHARACTERISTIC") {
        meterType = { observation: item.newreading };
      } else {
        meterType = { measurementvalue: item.newreading };
      }

      const meterReading = {
        taskid: item.taskid,
        measuredate: item.measuredate,
        inspector: item.inspector,
        href: item.href,
        workorderid: item.workorderid,
        ...meterType,
      };
      const option = {
        responseProperties: "status",
      };
      await woPlanTaskDetailds.put(meterReading, option);
      await woPlanTaskDetailds.forceReload();
    }
    this.page.findDialog("taskMeasurementDialog").closeDialog();
  }

  /**
   * Validate before closing sliding drawer.
   * @param {validateEvent} validateEvent
   */
  taskMeterChangeValidate(validateEvent) {
    if (!this.page.state.measurementSaveDisabled) {
      validateEvent.failed = true;
      this.page.showDialog("saveDiscardTaskMeasurement");
    } else {
      validateEvent.failed = false;
    }
  }

  /**
   * Call on click of discard prompt.
   */
  async closeTaskMeasurementDialog() {
    this.page.findDialog("taskMeasurementDialog").closeDialog();
  }

  // Assisted by watsonx Code Assistant
  /**
   * Selects a characteristic from the list and updates the state.
   * @param {Event} event The event object containing the selected characteristic.
   */
  selectCharacteristic(event) {
    //istanbul ignore else
    if (event) {
      const woPlanTaskDetaildsSelectedJsonDS = this.page.findDialog("taskMeasurementDialog").findDatasource("woPlanTaskDetaildsSelected");
      woPlanTaskDetaildsSelectedJsonDS.item.newreading = event.value;
      this.page.state.measurementSaveDisabled = false;
    }
  }

  /**
   * Handles task item click on the task list.
   * Toggles the inline detail section for the clicked row using itemToOpen state.
   * Clicking anywhere on a row opens/closes its detail — no chevron needed.
   */
  async onTaskItemClick(event) {
    // Maximo data-list passes the clicked datasource item directly as the event
    const taskid = event?.taskid ?? event?.item?.taskid;
    const workorderid = event?.workorderid ?? event?.item?.workorderid;
    if (!taskid || workorderid === undefined || workorderid === null) return;

    // Toggle: if already open collapse it, otherwise open this item
    if (`${this.page.state.itemToOpen}` === `${workorderid}`) {
      this.page.state.itemToOpen = '';
      this.page.state.openTaskId = null;
    } else {
      // --- IGT Geofencing check ---
      // Apply geofencing check using the parent work order's service address.
      // We skip the check if the work order lacks an asset.
      const parentWo = this.page.state.workorder;
      if (parentWo) {
        const allowed = await this._checkGeofence(parentWo);
        if (!allowed) return;
      }
      // --- End geofencing ---

      this.page.state.itemToOpen = workorderid;
      this.page.state.openTaskId = taskid;
    }
  }

  /**
   * Opens the task specification sliding drawer.
   * Loads all workorderspec entries from the clicked task into the taskSpecDS
   * JSON datasource so they can be edited via smart-input fields.
   *
   * @param {object} event - Click event with {item, datasource}
   */
  async openTaskSpecification(event) {
    const item = event?.item;
    if (!item) return;

    try {
      // Store reference to the parent task for saving later
      this.page.state.currentSpecTask = item;

      // Open the drawer first so the DS inside it gets rendered
      this.page.showDialog('taskSpecificationDrawer');

      // Find the datasource (inside the drawer, use app-level lookup)
      const taskSpecDS = this.app.findDatasource('taskSpecDS');
      if (!taskSpecDS) {
        log.e(TAG, 'taskSpecDS not found');
        return;
      }

      // Enrich spec descriptions from assetAttributeDS before loading
      const specs = item.workorderspec || [];
      await this._enrichSpecDescriptions(specs);
      await taskSpecDS.load({ src: specs, noCache: true });
    } catch (error) {
      log.e(TAG, 'Error opening task specifications', error);
    }
  }

  /**
   * Enriches an array of spec items with descriptions from assetAttributeDS.
   * Follows the same pattern as WOCreateEditUtils.updateSpecificationAttributes.
   * @param {Array} specs - workorderspec items
   */
  async _enrichSpecDescriptions(specs) {
    try {
      if (!specs || !specs.length) return;
      const assetAttributeDS = this.app.findDatasource('assetAttributeDS');
      if (!assetAttributeDS) return;

      const attrIds = [];
      specs.forEach(spec => {
        if (spec.assetattrid && !spec.assetattributedesc) {
          attrIds.push(spec.assetattrid);
        }
      });
      if (!attrIds.length) return;

      await assetAttributeDS.initializeQbe();
      assetAttributeDS.setQBE('assetattrid', 'in', attrIds);
      await assetAttributeDS.searchQBE();

      const descMap = {};
      assetAttributeDS.items.forEach(attr => {
        if (attr.description) {
          descMap[attr.assetattrid] = attr.description;
        }
      });

      specs.forEach(spec => {
        if (spec.assetattrid && !spec.assetattributedesc && descMap[spec.assetattrid]) {
          spec.assetattributedesc = descMap[spec.assetattrid];
        }
      });
    } catch (e) {
      log.t(TAG, 'Non-critical: spec description enrichment failed', e);
    }
  }

  /**
   * Saves all modified specification values from the taskSpecDS back to the
   * parent task's workorderspec array and persists via the task datasource.
   * If all specs are filled after saving, changes task status to INSPCOMP
   * using the same SynonymUtil + completeWoTask pattern as changeWoTaskStatus.
   */
  async saveTaskSpecification(event) {
    try {
      const taskDS = this.app.findDatasource('woPlanTaskDetailds');
      const parentTask = event?.item;

      if (!taskDS || !parentTask) {
        log.e(TAG, 'Cannot save: missing datasource or parent task reference');
        return;
      }

      const specs = parentTask.workorderspec || [];

      if (specs.length > 0) {
        // Update the workorderspec on the parent task item directly,
        // mirroring the pattern used in WorkOrderDetailsController.saveSpecification()
        parentTask.workorderspec = specs.map(spec => ({
          ...spec
        }));

        let interactive = { interactive: !Device.get().isMaximoMobile };
        interactive.localPayload = {
          ...parentTask,
          workorderspec: parentTask.workorderspec
        };

        await taskDS.save(interactive);

        // Check if all specs are filled — if so change task status to INSPCOMP
        const allFilled = specs.every(s => s.alnvalue && s.alnvalue.trim() !== '');

        if (allFilled) {
          try {
            // Look up the INSPCOMP synonym by external value
            const synonymDS = this.app.findDatasource('synonymdomainData');
            await synonymDS.initializeQbe();
            synonymDS.setQBE('domainid', '=', 'WOSTATUS');
            synonymDS.setQBE('value', '=', 'INSPCOMP');
            const synonymResults = await synonymDS.searchQBE();
            const inspcompStatus = synonymResults?.[0];

            if (inspcompStatus) {
              // Directly invoke changeStatus on the task datasource
              const statusAction = {
                parameters: {
                  status: inspcompStatus.value,
                  date: this.app.dataFormatter.currentUserDateTime()
                },
                record: { href: parentTask.localref },
                responseProperties: 'status,status_maxvalue,workorderid',
                localPayload: {
                  woactivity: [{
                    href: parentTask.href,
                    status: inspcompStatus.value,
                    date: this.app.dataFormatter.currentUserDateTime(),
                    status_maxvalue: inspcompStatus.maxvalue,
                    status_description: inspcompStatus.description || inspcompStatus.value,
                    workorderid: parentTask.workorderid
                  }],
                  href: taskDS.dependsOn.currentItem.href
                },
              };

              await taskDS.invokeAction('changeStatus', statusAction);

              // Update the task item locally
              parentTask.status = inspcompStatus.value;
              parentTask.status_maxvalue = inspcompStatus.maxvalue;
              parentTask.status_description = inspcompStatus.description || inspcompStatus.value;

              log.t(TAG, 'Task status changed to INSPCOMP');
            } else {
              log.e(TAG, 'INSPCOMP synonym not found in WOSTATUS domain');
            }
          } catch (statusError) {
            log.e(TAG, 'Could not change status to INSPCOMP', statusError);
          }
        }

        // Reload and recompute spec progress
        await taskDS.forceReload();
        const dataController = taskDS.dataController;
        if (dataController && taskDS.items) {
          taskDS.items.forEach(task => {
            task.computedSpecProgress = dataController.computedSpecProgress(task);
            task.computedAllSpecsFilled = dataController.computedAllSpecsFilled(task);
          });
        }
      }

      log.t(TAG, 'Task specifications saved successfully');
    }
    catch (error) {
      log.e(TAG, 'Error saving task specifications', error);
      this.app.toast('Failed to save specifications', 'error');
    }
  }

  /**
   * Opens the ALN domain lookup for a task specification field.
   * Looks up the domainid from assetAttributeDS using the spec's assetattrid,
   * then filters alnDomainDS and opens the lookup dialog.
   *
   * @param {Object} event - {page, item} where item is the spec row
   */
  async openTaskSpecLookup(event) {
    const specItem = event?.item;
    if (!specItem) return;

    this.page.state.taskSpecLookupLoader = true;
    // Store current spec item so chooseTaskSpecDomain can update it
    this.currentTaskSpecField = specItem;

    try {
      // Get domainid from assetAttributeDS using assetattrid
      const assetAttrDS = this.app.findDatasource('assetAttributeDS');
      let domainId = null;

      if (assetAttrDS) {
        await assetAttrDS.initializeQbe();
        assetAttrDS.setQBE('assetattrid', '=', specItem.assetattrid);
        const results = await assetAttrDS.searchQBE();
        if (results && results.length > 0) {
          domainId = results[0].domainid;
        }
      }

      if (!domainId) {
        this.app.toast('No domain found for this attribute', 'warning');
        this.page.state.taskSpecLookupLoader = false;
        return;
      }

      // Filter alnDomainDS by the domainid
      const alnDS = this.app.findDatasource('alnDomainDS');
      if (alnDS) {
        await alnDS.clearState();
        await alnDS.initializeQbe();
        alnDS.setQBE('domainid', '=', domainId);
        await alnDS.searchQBE();
      }

      this.page.state.taskSpecLookupLoader = false;
      this.page.showDialog('taskSpecAlnDomainLookup');
    } catch (error) {
      log.e(TAG, 'Error opening task spec lookup', error);
      this.page.state.taskSpecLookupLoader = false;
    }
  }

  /**
   * Handles selection from the task specification ALN domain lookup.
   * Sets the selected domain value onto the current spec item's alnvalue.
   *
   * @param {Object} itemSelected - The selected domain item with {value, description}
   */
  chooseTaskSpecDomain(itemSelected) {
    if (this.currentTaskSpecField && itemSelected) {
      this.currentTaskSpecField.alnvalue = itemSelected.value;
      this.currentTaskSpecField.igtentered = this.app.dataFormatter.convertDatetoISO(new Date());
      this.currentTaskSpecField.igtenteredby = this.app?.client?.userInfo?.personid || this.app?.userInfo?.personid;
      log.t(TAG, `Task spec domain selected: ${itemSelected.value} for ${this.currentTaskSpecField.assetattrid}`);
    }
  }

  // =========================================================================
  // IGT Geofencing helpers
  // =========================================================================

  /**
   * IGT Geofencing: Checks if the user is within GEOFENCE_DISTANCE_METERS
   * of the parent work order's service address. If the WO has no asset the
   * check is skipped (matching old Anywhere behaviour).
   *
   * @param  {Object}  item  Parent work order item
   * @return {boolean} true  → navigation expands task
   *                   false → navigation is blocked (toast already shown)
   */
  async _checkGeofence(item) {
    // If WO has no asset, skip geofencing (same as old code)
    if (!item.assetnumber && !item.assetnum) {
      return true;
    }

    // Helper to detect missing or 0,0 coordinates
    const isInvalidCoord = (lat, lon) => {
      const pLat = parseFloat(lat);
      const pLon = parseFloat(lon);
      return isNaN(pLat) || isNaN(pLon) || (pLat === 0 && pLon === 0);
    };

    // Check explicitly loaded WOSERVICEADDRESS datasource first
    const woSaDs = this.app.findDatasource('woServiceAddress') || this.page.findDatasource('woServiceAddress');
    let saItem = woSaDs?.item || (woSaDs && woSaDs[0]) || null;
    if (Array.isArray(saItem)) saItem = saItem[0]; // just in case

    let lat1 = saItem?.latitudey;
    let lon1 = saItem?.longitudex;
    let geocodeEnabled = saItem?.geocode;

    // Get WO service address coordinates and toggle, falling back to direct WO fields
    if (isInvalidCoord(lat1, lon1)) {
      lat1 = item.serviceaddress?.latitudey ?? item.latitudey;
      lon1 = item.serviceaddress?.longitudex ?? item.longitudex;
      geocodeEnabled = item.serviceaddress?.geocode ?? geocodeEnabled;
    }

    // Finally, fallback to the Asset's service address using the loaded woAssetLocationds
    if (isInvalidCoord(lat1, lon1)) {
      // The datasource could be at the app level or the page level
      const woAssetDs = this.app.findDatasource('woAssetLocationds') || this.page.findDatasource('woAssetLocationds');
      if (woAssetDs?.item?.serviceaddress) {
        // rel. queries in OSLC return an array even for 1:1 relationships
        const sa = Array.isArray(woAssetDs.item.serviceaddress) ? woAssetDs.item.serviceaddress[0] : woAssetDs.item.serviceaddress;
        if (sa && !isInvalidCoord(sa.latitudey, sa.longitudex)) {
          lat1 = sa.latitudey;
          lon1 = sa.longitudex;
          geocodeEnabled = sa.geocode ?? geocodeEnabled;
        }
      }
    }

    // Check the global system property toggle first
    let isGeofenceEnabledProp = this.app?.state?.systemProp?.['igtmobile.geofencing'];

    // Convert the global property to a boolean (default to true if missing/unparseable)
    let isGlobalGeofenceEnabled = typeof isGeofenceEnabledProp === 'string'
      ? ['true', '1', 'y'].includes(isGeofenceEnabledProp.toLowerCase())
      : (isGeofenceEnabledProp !== false && isGeofenceEnabledProp !== 0);

    // 1. Master Kill-Switch: If system property is false, do not even check the Service Address
    if (!isGlobalGeofenceEnabled) {
      log.t(TAG, 'Geofence: system property igtmobile.geofencing is false — completely skipping geofencing check.');
      return true;
    }

    // 2. Local Override: Global is true, now we check WOSERVICEADDRESS.GEOCODE
    let isLocalGeofenceEnabled = true;
    if (geocodeEnabled !== undefined && geocodeEnabled !== null) {
      if (typeof geocodeEnabled === 'string' && geocodeEnabled.trim() !== '') {
        isLocalGeofenceEnabled = !['false', '0', 'n'].includes(geocodeEnabled.toLowerCase());
      } else if (typeof geocodeEnabled === 'boolean' || typeof geocodeEnabled === 'number') {
        isLocalGeofenceEnabled = !!geocodeEnabled;
      }
    }

    if (!isLocalGeofenceEnabled) {
      log.t(TAG, 'Geofence: global is true, but WO geocode flag is false — skipping distance check for this specific task.');
      return true;
    }

    if (isInvalidCoord(lat1, lon1)) {
      const assetId = item.assetnumber || item.assetnum || '';
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_coords',
          `Equipment ${assetId} latitude and longitude are not defined. Contact System Administrator.`,
          [assetId]
        )
      );
      return false;
    }

    // Obtain current GPS position
    try {
      if (this.app.geolocation) {
        // Quick check to see if we already have valid coordinates cached
        let initialLat = this.app.geolocation?.state?.latitude;
        let initialLon = this.app.geolocation?.state?.longitude;
        let alreadyValid = initialLat != null && initialLon != null && (initialLat !== 0 || initialLon !== 0);

        // Only force a high-accuracy update if we don't have valid coordinates yet
        if (!alreadyValid) {
          this.app.geolocation.updateGeolocation({ enableHighAccuracy: true });
        }

        let retries = alreadyValid ? 1 : 8; // Iterate once if valid, else wait up to 4s
        let gpsAcquired = false;
        while (retries > 0 && !gpsAcquired) {
          const tempLat = this.app.geolocation?.state?.latitude;
          const tempLon = this.app.geolocation?.state?.longitude;

          if (tempLat != null && tempLon != null && (tempLat !== 0 || tempLon !== 0)) {
            gpsAcquired = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          retries--;
        }
      }
    } catch (e) {
      log.t(TAG, 'Geofence: GPS update failed — ' + e);
    }
    const lat2 = this.app.geolocation?.state?.latitude;
    const lon2 = this.app.geolocation?.state?.longitude;

    if (lat2 == null || lon2 == null || (lat2 === 0 && lon2 === 0)) {
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_gps',
          'Unable to acquire GPS position. Please enable location services.'
        )
      );
      return false;
    }

    // Haversine distance
    const distanceMeters = this._haversineDistance(lat1, lon1, lat2, lon2);

    // Read the allowed tower distance strictly from the Maximo system property
    // 'igtmobile.towerdistance'. If the property is not configured or cannot
    // be parsed, skip the distance check and allow access.
    const rawProp = this.app?.state?.systemProp?.['igtmobile.towerdistance'];
    const allowedTowerDistance = parseFloat(rawProp);

    if (isNaN(allowedTowerDistance)) {
      log.t(TAG, 'Geofence: igtmobile.towerdistance not configured.');
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_no_distance',
          `Allowed tower distance is not configured correctly in System Properties (Received: "${rawProp}"). Contact System Administrator.`
        )
      );
      return false;
    }

    if (distanceMeters > allowedTowerDistance) {
      const eqLatLong = `${lat1},${lon1}`;
      const gpsLatLong = `${lat2},${lon2}`;
      this.page.error(
        this.app.getLocalizedLabel(
          'geofence_too_far',
          `Distance between Equipment location ${eqLatLong} and current GPS location ${gpsLatLong} is more than ${allowedTowerDistance} Meters.`,
          [eqLatLong, gpsLatLong, allowedTowerDistance]
        )
      );
      return false;
    }

    return true;
  }

  /**
   * Haversine formula — returns the great-circle distance in **meters**
   * between two lat/lon points.
   */
  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // convert km → meters
  }
}

export default TaskController;
