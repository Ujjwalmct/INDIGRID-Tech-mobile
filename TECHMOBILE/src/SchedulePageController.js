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

import { log, Device, ShellCommunicator } from "@maximo/maximo-js-api";
import WOTimerUtil from "./utils/WOTimerUtil";
import WOUtil from "./utils/WOUtil";
import "regenerator-runtime/runtime";
import MapPreLoadAPI from "@maximo/map-component/build/ejs/framework/loaders/MapPreLoadAPI";
import SynonymUtil from "./utils/SynonymUtil";
import CommonUtil from "./utils/CommonUtil";
const TAG = "SchedulePageController";

//symbol for highlighting wo pin on map
let highlightSymbol = {
  url:
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMzNweCIgaGVpZ2h0PSI2NXB4IiB2aWV3Qm94PSIwIDAgMzMgNjUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+cGluLXdvcmstb3JkZXJfYWN0aXZlX3NlbGVjdGVkPC90aXRsZT4KICAgIDxnIGlkPSJXb3JrLW9yZGVyLC1tYXAtdmlldy0odXBkYXRlZC1zMzMpIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iTWFwLWljb25zLS0tc29saWQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMjUuMDAwMDAwLCAtMjIwMS4wMDAwMDApIj4KICAgICAgICAgICAgPGcgaWQ9InBpbi13b3JrLW9yZGVyX2FjdGl2ZV9zZWxlY3RlZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTA5LjA1MDE4OSwgMjIwMS40OTk1MDApIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0zMiwwIEM0MC44MzY1NTYsMCA0OCw3LjE2MzQ0NCA0OCwxNiBMNDgsMzUgTDQ3Ljk4MTYxMzYsMzUuMDAwMjUzNSBDNDcuOTkxMTg3OSwzNS4xOTI0NDYxIDQ3Ljk5NzMzNjgsMzUuMzg1NTYxNyA0OCwzNS41Nzk1NDE1IEM0Ny45OTY0NzAxLDM4LjgyOTY4MDMgNDYuOTU5MjU0LDQxLjk5MDc3MjkgNDUuMDQzOTcyMiw0NC42MDc5ODMxIEw0NC44LDQ0LjkzMjI2ODggTDMyLDYzLjYzNzcyMzMgTDE5LjIsNDQuOTMyMjY4OCBDMTcuMTI4OTc1Myw0Mi4yNTQwNDI3IDE2LjAwMzY3NywzOC45NjUxMDI4IDE2LDM1LjU3OTU0MTUgQzE2LjAwMjY2MzIsMzUuMzg1NTYxNyAxNi4wMDg4MTIxLDM1LjE5MjQ0NjEgMTYuMDE4Mzg2NCwzNS4wMDAyNTM1IEwxNiwzNSBMMTYsMTYgQzE2LDcuMTYzNDQ0IDIzLjE2MzQ0NCwwIDMyLDAgWiIgaWQ9IlBhdGgiIGZpbGw9IiMwRjYyRkUiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDxnIGlkPSJyZWFkeSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYuMDAwMDAwLCAwLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNiwwIEMyNC44MzY1NTYsLTEuNjIzMjQ5ZS0xNSAzMiw3LjE2MzQ0NCAzMiwxNiBMMzIsMjIgTDMyLDIyIEwwLDIyIEwwLDE2IEMtMS4wODIxNjZlLTE1LDcuMTYzNDQ0IDcuMTYzNDQ0LDEuNjIzMjQ5ZS0xNSAxNiwwIFoiIGlkPSJSZWN0YW5nbGUtQ29weS0xOSIgZmlsbD0iIzBGNjJGRSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtQ29weS00IiBmaWxsPSIjRkZGRkZGIiBjeD0iMTYiIGN5PSIxMyIgcj0iNSI+PC9jaXJjbGU+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iR3JvdXAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE3LjAwMDAwMCwgMjIuMDAwMDAwKSIgZmlsbD0iI0ZGRkZGRiI+CiAgICAgICAgICAgICAgICAgICAgPGcgaWQ9Ikljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuMDAwMDAwLCA1LjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy41NjI1LDEuMjQ5OTY0NTIgQzYuMzYzODg3NTQsMS4yNDU5MjEwMSA1LjE5MDQxOTUsMS41OTM2MTUyNCA0LjE4NzUsMi4yNSBMOC4xODc1LDYuMjUgQzguNDU2NjI2MjUsNi40Nzk2MjIzMSA4LjYyMTY2MDI0LDYuODA4MTY0MzUgOC42NDUxOTI4Nyw3LjE2MTE1MzgxIEM4LjY2ODcyNTUsNy41MTQxNDMyNiA4LjU0ODc2Mzc2LDcuODYxNjg1MDMgOC4zMTI1LDguMTI1IEM4LjA0OTE4NTAzLDguMzYxMjYzNzYgNy43MDE2NDMyNiw4LjQ4MTIyNTUgNy4zNDg2NTM4MSw4LjQ1NzY5Mjg3IEM2Ljk5NTY2NDM1LDguNDM0MTYwMjQgNi42NjcxMjIzMSw4LjI2OTEyNjI1IDYuNDM3NSw4IEwyLjMxMjUsNCBDMS41OTkzMDgxNyw1LjA0OTQ1OTQgMS4yMjgxODEwMyw2LjI5MzgyNjg2IDEuMjUsNy41NjI1IEMxLjI2MzcwMzMzLDExLjA0MzEwNTYgNC4wODE4OTQ0MiwxMy44NjEyOTY3IDcuNTYyNSwxMy44NzUgQzguMTA5NzMxNDMsMTMuODc3OTk0IDguNjU1MzMwMjEsMTMuODE1MDQwMyA5LjE4NzUsMTMuNjg3NSBMMTMuMzc1LDE3Ljg3NSBDMTQuNjAwMzgxOCwxOS4xMDAzODE4IDE2LjU4NzExODIsMTkuMTAwMzgxNyAxNy44MTI1LDE3Ljg3NSBDMTkuMDM3ODgxNywxNi42NDk2MTgyIDE5LjAzNzg4MTgsMTQuNjYyODgxOCAxNy44MTI1LDEzLjQzNzUgTDEzLjYyNSw5LjI1IEMxMy43NTI1NDAzLDguNzE3ODMwMjEgMTMuODE1NDk0LDguMTcyMjMxNDMgMTMuODEyNSw3LjYyNSBDMTMuODQ2MDg5OCw1Ljk0NTg0NjE0IDEzLjIwMjQ2ODIsNC4zMjM4MzE2IDEyLjAyNjcwNTQsMy4xMjQ1NTM1NiBDMTAuODUwOTQyNiwxLjkyNTI3NTUxIDkuMjQxOTg5NzYsMS4yNDk2NjQwNyA3LjU2MjUsMS4yNDk5NjQ1MiBaIE0xMi41NjI1LDcuNTYyNSBDMTIuNTYxNTgzMSw4LjAwNjYwODE4IDEyLjQ5ODQ3LDguNDQ4Mzk5NCAxMi4zNzUsOC44NzUgTDEyLjE4NzUsOS41NjI1IEwxMi42ODc1LDEwLjA2MjUgTDE2Ljg3NSwxNC4yNSBDMTcuMjM1NDM5MywxNC41OTEyMzQyIDE3LjQzODk3ODIsMTUuMDY2MTU4MyAxNy40Mzc1LDE1LjU2MjUgQzE3LjQ1MTc0MTEsMTYuMDYxMzU2NiAxNy4yNDYwNjI1LDE2LjU0MTI3MzUgMTYuODc1LDE2Ljg3NSBDMTYuNTMyOTAzOCwxNy4yMzQyMDEgMTYuMDU4NTM5NCwxNy40Mzc1IDE1LjU2MjUsMTcuNDM3NSBDMTUuMDY2NDYwNiwxNy40Mzc1IDE0LjU5MjA5NjIsMTcuMjM0MjAxIDE0LjI1LDE2Ljg3NSBMMTAuMDYyNSwxMi42ODc1IEw5LjU2MjUsMTIuMTg3NSBMOC44NzUsMTIuMzc1IEM4LjQ0ODM5OTQsMTIuNDk4NDcgOC4wMDY2MDgxOCwxMi41NjE1ODMxIDcuNTYyNSwxMi41NjI1IEM2LjIzNDQyMDU2LDEyLjU1ODgxMTMgNC45NTg3MjA5OCwxMi4wNDQwNTUzIDQsMTEuMTI1IEMzLjAxOTU2MjY3LDEwLjIwMjQ2MDUgMi40NzQ3MzQzNyw4LjkwODQ5MzM0IDIuNSw3LjU2MjUgQzIuNTAwODYxOTUsNy4wOTc4NTMxOSAyLjU2MzkyMiw2LjYzNTQxMjggMi42ODc1LDYuMTg3NSBMNS40Mzc1LDguOTM3NSBDNS45MDY4OTQ1Nyw5LjQ0ODI5NDM4IDYuNTYxNzM4MzIsOS43NDkyMTIxMyA3LjI1NTA1NjI5LDkuNzcyNzE0NDMgQzcuOTQ4Mzc0MjYsOS43OTYyMTY3MyA4LjYyMjA5MjU3LDkuNTQwMzM0OTkgOS4xMjUsOS4wNjI1IEM5LjYwMjgzNDk5LDguNTU5NTkyNTcgOS44NTg3MTY3Myw3Ljg4NTg3NDI2IDkuODM1MjE0NDMsNy4xOTI1NTYyOSBDOS44MTE3MTIxMyw2LjQ5OTIzODMyIDkuNTEwNzk0MzgsNS44NDQzOTQ1NyA5LDUuMzc1IEw2LjI1LDIuNjI1IEM2LjY1NDIxNTI0LDIuNDk3MTYwMjYgNy4wNzYwNjYyLDIuNDMzODgyNjEgNy41LDIuNDM3MzUzMjQgQzguODI4MDc5NDQsMi40NDExODg3IDEwLjEwMzc3OSwyLjk1NTk0NDY3IDExLjA2MjUsMy44NzUgQzEyLjAyMjEwNDQsNC44NjI5MjI5NSAxMi41NTk5OTg5LDYuMTg1MjQ2OTEgMTIuNTYyNSw3LjU2MjUgTDEyLjU2MjUsNy41NjI1IFoiIGlkPSJGaWxsIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=",
  color: "",
  offsetx: 16,
  offsety: 56,
  width: 36,
  height: 70,
  scale: 1,
};

//symbol for highlighting wo cluster on map
let highlightSymbolCluster = {
  url:
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNDNweCIgaGVpZ2h0PSI0NXB4IiB2aWV3Qm94PSIwIDAgNDMgNDUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+cGluLWNsdXN0ZXJfc2VsZWN0ZWQ8L3RpdGxlPgogICAgPGcgaWQ9Ildvcmstb3JkZXIsLW1hcC12aWV3LSh1cGRhdGVkLXMzMykiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSI2Li1CYWRnZXMtKy1UYWdzL0xvY2F0aW9uLVBpbnMvMzJweC9kYXJrLUNvcHktNTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMC45NDk4MTEsIC05LjUwMDUwMCkiPgogICAgICAgICAgICA8cGF0aCBkPSJNMzUuMDU5NzEyNiwxMCBMMzcuMjc5NDE0NCwxMC4wMDIxNzg0IEM0NS44ODIyODg0LDEwLjEwNDk2NjggNTIuODgxMjIwNywxNy4wNTM5MTYgNTMsMjUuNzA5NTM5NCBDNTIuOTk2NDc5NiwyOC45NTI0NDg1IDUxLjk3Mjc4NzYsMzIuMTA3NDM0OSA1MC4wODA5MTAyLDM0LjczMDA3OTggTDQ5Ljc3NSwzNS4xMzk2OTI5IEwzNi44NzUsNTQgTDMzLjQ4NTAyNzcsNDkuMDQ0NTc1NCBMNDEuNjgzMjQ2NSwzNy4wNTgxNjEgTDQxLjk0MjIyOTMsMzYuNzE1MDgxMSBDNDQuMjY2MjQ3NSwzMy41MjI0ODIxIDQ1LjUyNDQ1MDYsMjkuNjcxODI1NCA0NS41Mjg3NDgxLDI1LjcxMzEwMiBDNDUuNDM4ODUxNywxOS4xNDYwNTI5IDQxLjk0MjIyOTMsMTIuNzIwNDg1NCAzNS4wNTk3MTI2LDEwIFogTTQzLjI1LDI1LjcwOTUzOTQgQzQzLjI0NjQ3OTYsMjguOTUyNDQ4NSA0Mi4yMjI3ODc2LDMyLjEwNzQzNDkgNDAuMzMwOTEwMiwzNC43MzAwNzk4IEw0MC4wMjUsMzUuMTM5NjkyOSBMMjcuMTI1LDU0IEwxNC4yMjUsMzUuMTM5NjkyOSBDMTIuMTM3Nzk1NCwzMi40MzkyOTUyIDExLjAwMzcwNTcsMjkuMTIzMTI3OSAxMSwyNS43MDk1Mzk0IEMxMS4xMTg3NzkzLDE3LjA1MzkxNiAxOC4xMTc3MTE2LDEwLjEwNDk2NjggMjYuNzIwNTg1NiwxMC4wMDIxNzg0IEwyNy4xMjUsMTAuMDAyMzk0MSBDMzUuOTExODkyLDkuODg4MjI4ODMgNDMuMTI5MzY0OCwxNi45MTg2NzE5IDQzLjI1LDI1LjcwOTUzOTQgWiIgaWQ9IlNoYXBlIiBmaWxsPSIjMEY2MkZFIj48L3BhdGg+CiAgICAgICAgICAgIDxnIGlkPSJOdW1iZXItb3ItaWNvbj8iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyLjAwMDAwMCwgMTAuMDAwMDAwKSI+PC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+",
  color: "",
  offsetx: 17,
  offsety: 53,
  width: 45,
  height: 70,
  scale: 1,
};

class SchedulePageController {
  pageInitialized(page, app) {
    log.t(TAG, "Page Initialized");
    this.app = app;
    this.page = page;
    this.page.state.editWo = false;

    this.app.state.selectedWoListDs = this.page.state.selectedDS;

    try {
      this.mapPreloadAPI = new MapPreLoadAPI();
    } catch(error) {
      log.t(TAG, error);
    }
  
    let device = Device.get();
    this.page.state.mapWOListHeight = "35%";
    this.page.state.mapWOCardHeight = "45%";
    //istanbul ignore else
    if (device.isTablet || device.isIpad) {
      this.page.state.mapPaddingRight = "1rem";
      this.page.state.mapPaddingLeft = "0.5rem";
      this.page.state.mapWOListHeight = "25%";
      this.page.state.mapWOCardHeight = "35%";
    }
    this.page.state.mapPaddingBottom = "calc(100vh - 9rem)";
    //istanbul ignore else
    if (device.isMaximoMobile) {
      this.page.state.mapPaddingBottom = "calc(100vh - 5rem)";
      this.page.state.mapWOCardHeight = "45%";
    }
    CommonUtil.getTravelSystemProperties(this.app);
  }

  /**
   * Method implemented in controller itself.
   */
  constructor() {
    this.onUpdateDataFailed = this.onUpdateDataFailed.bind(this);
    this.saveDataSuccessful = true;
    ShellCommunicator.get().on("TRANSACTION_UNDONE", this.handleDeleteTransaction.bind(this));
  }

  /**
   * Called when map is initialized
   */
  // istanbul ignore next
  // ignoring as for map openlayers cannot be emulated
  onMapInitialized(map) {
    this.app.map = map;
    if (!!this.page.state.mapHighlightedItem) {
      this.handleItemClick(this.page.state.mapHighlightedItem);
      this.page.state.mapHighlightedItem = "";
    }
  }

  /**
   * Redirects to details page
   * @param {Object} listItem - clicked item from list
   */
  showWODetail(item) {
    // istanbul ignore else
    if (item && (item.wonum || item.href) && !this.page.state.transactionProgress) {
      this.app.setCurrentPage({
        name: "workOrderDetails",
        resetScroll: true,
        params: {
          wonum: item.wonum,
          siteid: item.siteid,
          href: item.href,
          firstLogin: this.page.state.firstLogin,
        },
      });
    }
  }

  navigateToTask(item) {
    if (item?.wonum) {
      this.app.setCurrentPage({
        name: 'tasks',
        params: { wonum: item.wonum, href: item.href },
      });
      this.page.state.navigateToTaskPage = true;
    }
  }


  /**
   * Function to open a sliding-drawer dialog to show Materials and Tools for the Work Order
   * @param event should contain
   * item - The Work Order selected.
   * datasource - The Datasource to filter Materials and Tools listed in the Dialog.
   */
  async openDrawer(event) {
    await event.datasource.load({ itemUrl: event.item.href });
    const [labelId, fallback] = ['materialsAndToolsLabel', 'Materials and tools'];
    this.page.state.dialogLabel = this.app.getLocalizedLabel(labelId, fallback);
    this.page.showDialog("slidingwomaterials");
  }

  /**
   * Function to open a sliding-drawer dialog to show Work Log for the Work Order with Long Description in Expanded View
   * @param event - should contain
   * event - event containing information about current item.
   * datasource - The Synonymdata Datasource to filter logType
   * item - The Work ORder Selected
   */
  async openWorkLogDrawer(event) {
    this.page.state.editWo = !['CAN'].includes(event?.item?.status_maxvalue);
    await CommonUtil.openWorkLogDrawer(this.app, this.page, event, this.page.findDatasource("woWorklogDs"), "workLogDrawer");
  }

  /**
  * Validate before closing sliding drawer.
  * @param {validateEvent} validateEvent
  */
  workLogValidate(validateEvent) {
    if (this.page.state.isWorkLogEdit) {
      validateEvent.failed = true;
      this.page.showDialog('saveDiscardWorkLog');
    } else {
      validateEvent.failed = false;
    }
  }

  /**
  * This method calls when click save button on save discard prompt.
  */
  saveWorkLogSaveDiscard() {
    // Save Entered Data to chat Log
    //istanbul ignore else
    if (!this.page.state.workLogData?.sendDisable) {
      this.saveWorkLog(this.page.state.workLogData);
    }
  }

  /**
  * This method calls when click discard button on save discard prompt.
  */
  closeWorkLogSaveDiscard() {
    // Close Work Log Drawer
    this.page.state.isWorkLogEdit = false;
    this.page.state.workLogData = null;
    this.page.findDialog('workLogDrawer')?.closeDialog();
  }

  /**
  * This method is called when any changes done on work log screen and return value as Object with all field value.
  * @param {value} value
  */
  watchChatLogChanges(value) {
    // Clear Debounce Timeout
    clearTimeout(this.page.state.workLogChangeTimeout);
    // Set Debounce Timeout
    this.page.state.workLogChangeTimeout = setTimeout(() => {
      if (value?.summary || value?.longDescription || (this.page.state.initialDefaultLogType && value?.logType?.value !== this.page.state.initialDefaultLogType?.replace(/!/g, "")) || value?.visibility) {
        this.page.state.isWorkLogEdit = true;
        this.page.state.workLogData = value;
        // Clear Debounce Timeout
        clearTimeout(this.page.state.workLogChangeTimeout);
      } else {
        this.page.state.isWorkLogEdit = false;
        this.page.state.workLogData = null;
        // Clear Debounce Timeout
        clearTimeout(this.page.state.workLogChangeTimeout);
      }
    }, 500);
  }

  /**
   * Computes the user name based on the provided item.
   * @param {Object} item The item object containing displayname or personid.
   * @returns {string} The computed user name.
   */
  computedUserName(item) {
    return item?.displayname || item?.personid
  }

  /*
   * Method to add new work log
   */
  async saveWorkLog(value, directSave = false) {
    let longDescription = value.longDescription;
    let summary = value.summary;
    let woWorklogDs = this.page.findDatasource("woWorklogDs");
    await woWorklogDs.load();
    let longType = value.logType?.value || this.page.state.defaultLogType || woWorklogDs.getSchemaInfo("logtype")?.default;
    // istanbul ignore else
    let workLog = {
      createby: this.app.client.userInfo.personid,
      createdate: new Date(),
      logtype: longType,
      description: summary,
      anywhererefid: new Date().getTime(),
      description_longdescription: longDescription,
      clientviewable: value.visibility
    };
    let option = {
      responseProperties:
        "anywhererefid,createdate,description,description_longdescription,person.displayname--displayname,createby--personid,logtype",
      localPayload: {
        createby:
          this.app.client.userInfo.displayName ||
          this.app.client.userInfo.personid,
        personid: 
          this.app.client.userInfo.displayName ||
          this.app.client.userInfo.personid,  
        createdate: new Date(),
        description: summary,
        logtype: longType,
        anywhererefid: workLog.anywhererefid,
        description_longdescription: longDescription,
      }
    };
    let response;
    // Direct Save Flag used to save work log without using work log UX
    if (directSave) {
      woWorklogDs.on("update-data-failed", this.onUpdateDataFailed);
      response = await woWorklogDs.update(workLog, option);

      // istanbul ignore if
      if (response) {
        woWorklogDs.off("update-data-failed", this.onUpdateDataFailed);
      }

      return;
    }
    try {
      this.app.userInteractionManager.drawerBusy(true);
      this.page.state.chatLogLoading = true;
      this.saveDataSuccessful = true;

      woWorklogDs.on("update-data-failed", this.onUpdateDataFailed);
      response = await woWorklogDs.update(workLog, option);

      // istanbul ignore if
      if (response) {
        woWorklogDs.off("update-data-failed", this.onUpdateDataFailed);
      }

      this.page.state.chatLogGroupData = await this.page.findDatasource(
        "woWorklogDs"
      ).forceReload();
    } catch {
    } finally {
      this.app.userInteractionManager.drawerBusy(false);
      this.page.state.chatLogLoading = false;
      //Reset default Logtype
      let schemaLogType = this.page.findDatasource("woWorklogDs").getSchemaInfo(
        "logtype"
      );
      // istanbul ignore else
      if (schemaLogType) {
        this.page.state.defaultLogType = schemaLogType.default;
      }
    }
    //If no error happen then re-open the drawer
    // istanbul ignore else
    if (this.saveDataSuccessful) {
      this.page.state.isWorkLogEdit = false;
      this.page.state.workLogData = null;
      this.page.showDialog("workLogDrawer");
    }
  }

  /*
   * Method to open the Change Status slider-drawer. This is called from
   * multiple pages.
   *
   * @param event should contain
   * item - The Work Order selected.
   * datasource - The Datasource for synonymdomain.
   * referencePage - The Page which calls this controller.
   *
   */
  async openChangeStatusDialog(event) {
    this.page.state.statusMemo = "";
    let statusArr = [];
    let workType = [];
    const workTypeDs = this.app.findDatasource("dsworktype");
    const {longitudex, latitudey} = event.item.serviceaddress || {};
    const lastLabTransData = event.item.labtrans ? event.item.labtrans[event.item.labtrans.length - 1] : null;
    const maxVal = event.item.status_maxvalue;
    // istanbul ignore else
    if(event.item.worktype) {
      workType = workTypeDs.items.filter(
        (item) => item.worktype === event.item.worktype
      );
    }  

    statusArr = await CommonUtil.getOfflineAllowedStatusList(this.app, event, false);
    log.t(
      TAG,
      "openChangeStatusDialog : statusArr --> " + JSON.stringify(statusArr)
    );

    let statusLstDS = this.page.findDatasource("dsstatusDomainList");
    statusLstDS.clearSelections();

    // istanbul ignore else
    if(event.item.flowcontrolled) {
      let filterValues= []
      
      let workTypeStartMaxVal = workType?.length && workType[0].startstatus ? workType[0].startstatus_maxvalue : '';
      let workTypeEndMaxVal = workType?.length && workType[0].completestatus ? workType[0].completestatus_maxvalue : '';
      if(!event.item.worktype || !workTypeStartMaxVal) {
        // istanbul ignore if
        if(maxVal !== 'COMP') {
          filterValues = ['CLOSE', 'COMP']; 
        }
        
        if(maxVal === 'INPRG') {
          filterValues = ['CLOSE', 'COMP', 'WMATL', 'WAPPR']; 
        }
        
      } else if(event.item.worktype && event.item.flowcontrolled && workType?.length) {
        // istanbul ignore else
        if(workTypeEndMaxVal === 'COMP') {
          filterValues = ['CLOSE'];
        } else if(workTypeEndMaxVal === 'CLOSE') {
          filterValues = ['CLOSE'];
        } else if(workTypeEndMaxVal === 'INPRG') {
          filterValues = ['CLOSE','COMP', 'INPRG'];
        }
        // istanbul ignore next
        if(workTypeStartMaxVal) {
          if(workTypeStartMaxVal === 'APPR' || workTypeStartMaxVal === 'WMATL' || workTypeStartMaxVal === 'WSCH') {
            if (maxVal !== 'COMP') {
              filterValues = [...filterValues, 'WAPPR', 'COMP'];
            } else {
              filterValues = ['WAPPR'];
            }
          }
          // istanbul ignore if
          if(workTypeStartMaxVal === 'INPRG' &&  maxVal === 'INPRG') {
            filterValues = [...filterValues, 'WMATL', 'WAPPR', 'COMP'];
            // istanbul ignore next
            if (event?.item?.flowcontrolled && event?.item?.iscalibration && event?.item?.pluscwodscount) {
              const wods = this.app.findDatasource("woDetailds");
              await wods.load({
                noCache: true,
                itemUrl: event.item.href,
              });
              if (this.app.state.taskCount === 0) {
                filterValues = [...filterValues, 'WMATL', 'WAPPR'];
              }
            }
          }
        }
      }

      // istanbul ignore else
      if(maxVal === 'COMP' && longitudex && latitudey) {
        filterValues = ['WAPPR', 'CLOSE'];
      }

      // istanbul ignore else
      if(filterValues?.length) {
        statusArr = statusArr.filter(item => filterValues.indexOf(item.maxvalue) === -1);
      }
    } // istanbul ignore else
     else if(longitudex && latitudey && lastLabTransData?.timerstatus_maxvalue === 'ACTIVE') {
        statusArr = statusArr.filter(item => ['CLOSE'].indexOf(item.maxvalue) === -1);
    }

    await statusLstDS.load({ src: statusArr, noCache: true });

    // set maximum length of comment text-area in changestatus through checking datasource schema
    const selectedDS = event.selectedDatasource;
    //istanbul ignore else
    if (selectedDS) {
      const commentsMaxLength = event.selectedDatasource.getFieldSize(
        "np_statusmemo"
      );
      //istanbul ignore else
      if (commentsMaxLength !== -1) {
        this.page.state.memoMaxLength = commentsMaxLength;
      }
    }
    let signatureAttachment = this.app.findDatasource("signatureAttachment");
    this.page.state.disableDoneButton = true;
    this.page.state.enableSignatureButton = false;
    this.page.state.woItem = event.item;
    this.page.state.signatureDs = signatureAttachment;
    this.page.state.referenceDS = event.datasource;
    this.page.state.referencePage = event.referencePage;
    this.page.state.statusDialog = "woStatusChangeDialog";

    this.page.showDialog("woStatusChangeDialog");
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the reassignment drawer.
   * @param {Event} event The event that triggered the function.
   * @returns {Promise<void>} A promise that resolves when the drawer is opened.
   */
   async openReassignmentDrawer(event) {
    this.page.state.currentItem = event.item?.wonum;
    this.app.state.assignmentLoading = true;
    const wodetails = this.app.findDatasource("wodetails");

    //istanbul ignore else
    if (!event?.item?.href) {
      log.d(TAG, 'Event.item has no href to load');
      this.page.state.canLoadWoDetails = false;
    }
    await wodetails.load({
      noCache: true,
      itemUrl: event.item?.href,
    });
    this.page.state.canLoadWoDetails = true;
    await CommonUtil.showReturn(this.app, wodetails);
    this.page.showDialog("laborAssignmentLookup");
    this.app.state.assignmentLoading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the reassignment dialog.
   * @param {object} event - The event object.
   * @param {string} event.item.wonum - The work order number.
   * @param {string} event.item.href - The work order URL.
   * @returns {Promise<void>} A promise that resolves when the dialog is closed.
   */
  async openReassignmentDialog(event) {
    //istanbul ignore else
    if(event.item.computedTimerStatus) {
      this.app.toast(this.app.getLocalizedLabel('infoOnReassign',`Stop or pause the work to remove or transfer the assignment.`), 'info');
      return;
    }
    this.page.state.currentItem = event.item.wonum;
    this.app.state.assignmentLoading = true;
 
    if (!event?.item?.href) {
      log.d(TAG, 'Event.item has no href to load');
      this.page.state.canLoadWoDetails = false;
    }
    const woDetailDs = this.app.findDatasource("woDetailds");
    await woDetailDs.load({
      noCache: true,
      itemUrl: event.item.href,
    });
    this.page.state.canLoadWoDetails = true;
    CommonUtil.sharedData.allowReassignmentPage = {
      name: this.page.name,
      callController: this.page.callController.bind(this.page)
    }
    CommonUtil.sharedData.event = event;
    const dialogConfig = CommonUtil.sharedData?.reassignDialogConfig;
    CommonUtil.getConfirmDialogLabel(this.app, dialogConfig);
    await this.app.showDialog('confirmDialog');
    this.app.state.assignmentLoading = false;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Asynchronous function to handle unassignment.
   * @param {object} event - The event object.
   * @returns {Promise<void>} - A promise that resolves when the unassignment is complete.
   */
  async unassignment(event) {
    CommonUtil.sharedData.clickedUnassignment = true;
    this.app.state.assignmentLoading = true;
    await this.rejectWO(event);
    this.app.state.assignmentLoading = false;
    CommonUtil.clearSharedData(CommonUtil.sharedData?.allowReassignmentPage);
    CommonUtil.clearSharedData(CommonUtil.sharedData?.event);
  }

  /**
   * Change assignment of work order
   * @param {Object} app The GlideApplication object
   * @param {Object} page The current page object
   * @param {Object} ds The datasource object
   */
  changeAssignment = async (labor) => {
    //istanbul ignore else
    if (!labor) {
      return;
    }
    const isListPage = ['schedule', 'approvals'].includes(this.app.currentPage.name);
    this.app.state.assignmentLoading = true;
    const woDetailDs = this.app.findDatasource("woDetailds");
    const assignmentDS = this.app.findDatasource("assignmentdomainData");
    const assignedValue = assignmentDS?.items?.find(assignment => assignment.maxvalue === 'ASSIGNED' && assignment.defaults);
    const href = woDetailDs.item.href;
    const records = woDetailDs.item?.assignment ?? [];
    const assignmentLength = records?.length;
    const index = (assignmentLength) ? records?.findIndex(assignment => assignment?.laborcode === this.app.client?.userInfo?.labor?.laborcode) : 0;
    let remainHours = 0;

    try {
      //istanbul ignore else
      if (assignmentLength > 0 && index > -1) {
        // need to do for each and keep adding all the regularhrs in question with vinicius and pedro
        const woDs = this.app.findDatasource(isListPage? "wodetails":"woDetailResource");
        const completedLaborTimer = woDs?.item?.labtrans?.find((member) => (member.timerstatus_maxvalue === "COMPLETE" && member.laborcode === this.app.client.userInfo?.labor?.laborcode && member.transtype_maxvalue === "WORK"));

        let tempRecord = woDetailDs.item.assignment[index];
        remainHours = (completedLaborTimer?.regularhrs) ? this.calculateRemainingTime(tempRecord?.laborhrs, completedLaborTimer?.regularhrs) : tempRecord?.laborhrs || 0;

        const acceptLabel = this.app.getLocalizedLabel('accepted', 'Accepted').toUpperCase();
        const currentStatus = tempRecord?.status?.toUpperCase();
        const isAssignmentEnabled = this.app.checkSigOption(`${this.app.state.woOSName}.MANAGEASSIGNMENTSTATUS`);
        // if work order was accepted in that case reject instead of complete
        //istanbul ignore if
        if (isAssignmentEnabled && acceptLabel !== currentStatus) {
          await CommonUtil.removeAssigned(this.app, this.page, woDetailDs, false)
        } else {
          const status = await CommonUtil.completeAssigned(this.app, woDetailDs, tempRecord, assignmentDS);
          if (!status) {
            this.app.state.assignmentLoading = false;
            return;
          }
        }
      }
      // add new assignment below
      //istanbul ignore else
      if (assignmentLength > 0) {
        await this.addNewAssignment(woDetailDs, records?.[index], labor, remainHours, href, assignedValue);
      }
      // we don't want to add new in case assignment don't exists as in that case its failing
      // if child datasource is empty save or add new method of above if conditioin will not work so we are following same logic as 
      // create work order and here we are adding assignment laborcode in detailDS and saving it
      else if (!assignmentLength) { // when no assigment found it means update current one 
        woDetailDs.item.assignment = {
          laborcode: labor.laborcode,
          skilllevel: labor.skilllevel,
          craft: labor.craft,
          scheduledate: this.app.dataFormatter.currentUserDateTime(),
          status: assignedValue.status,
          status_maxvalue: assignedValue.status_maxvalue,
          status_description: assignedValue.status_description
        }
        woDetailDs.save();
      }
      // add new assignment above
      const message = `Assignment ${woDetailDs.item.wonum} was reassigned to ${labor.displayname}.`;
      this.app.toast(
        this.app.getLocalizedLabel(
          'reassigned_wo', //to do change this before raising PR
          message,
          [woDetailDs.item.wonum, labor.laborcode]
        ),
        'success');
    } catch (error) {
      log.t("Reassign", "Failed reassignment : work order --> " + woDetailDs.item?.wonum + "f--> " + error);
      this.app.state.assignmentLoading = false;
      return;
    }
    const wolistds = this.app.findDatasource(this.page.state.selectedDS);
    await wolistds.forceReload();

    //istanbul ignore else
    if (!isListPage) {
      //istanbul ignore else
      if (labor.laborcode !== this.app.client.userInfo.personid && this.app.name !== "supmobile") {
        this.app.navigateBack();
      } else if(this.app.lastPage.name === 'relatedWorkOrder') {
        this.app.navigateBack({keepCurrentParams: false});
      }
    }
    this.app.state.assignmentLoading = false;
    CommonUtil.clearSharedData(CommonUtil.sharedData?.allowReassignmentPage);
    CommonUtil.clearSharedData(CommonUtil.sharedData?.event);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Calculates the remaining time for a task based on labor time and actual time.
   *
   * @param {string} laborTime - The expected labor time in ISO format (e.g., "2022-01-01T09:00:00").
   * @param {string} actualTime - The actual time spent on the task in ISO format (e.g., "2022-01-01T08:30:00").
   * @returns {number} The remaining time in minutes.
   */
  calculateRemainingTime = (laborTime, actualTime) => {
    const todayDate = new Date();
    const prevDate = new Date();
    const dataFormatter = this.app.dataFormatter;
    //istanbul ignore else
    if (
      dataFormatter.convertISOtoDate(laborTime).getTime() <=
      dataFormatter
        .convertISOtoDate(actualTime)
        .getTime()
    ) {
      return 0;
    } else {
      const expectedTime = dataFormatter.convertISOtoDate(todayDate.setTime(todayDate.getTime() + (dataFormatter.timeToDecimal(laborTime) * 60 * 60 * 1000)));
      const realTime = dataFormatter.convertISOtoDate(prevDate.setTime(prevDate.getTime() + (dataFormatter.timeToDecimal(actualTime) * 60 * 60 * 1000)));
      const totalMinutesDiff = Math.abs((expectedTime - realTime) / 3600000);
      return totalMinutesDiff;
    }
  }

   // Assisted by watsonx Code Assistant 
  /**
   * Adds a new assignment to a work order.
   *
   * @async
   * @param {Object} woDetailDs - The work order detail data source.
   * @param {Object} records - The records object containing assignment details.
   * @param {Object} labor - The labor object containing labor code and other details.
   * @param {number} remainHours - The remaining hours for the assignment.
   * @param {string} href - The URL for loading work order details.
   * @throws {Error} Will throw an error if there is a problem adding the new assignment.
   */
  addNewAssignment = async (woDetailDs, records, labor, remainHours, href, assignedValue) => {
    const woDetails = this.app.findDatasource("woDetailds");
    this.app.state.canLoadWoDetailDS = false;
    await woDetails?.load({ noCache: true, itemUrl: href });
    this.app.state.canLoadWoDetailDS = true;
    let labordData;

    if (!records) {
      labordData = {
        skilllevel: '',
        craft: ''
      };
      labordData.scheduledate = this.app.dataFormatter.currentUserDateTime();
    } else {
      labordData = records
    }
    try {
      const assignmentListDs = this.app.findDatasource("assignmentDetailds");
      const newAssignment = await assignmentListDs.addNew();
      newAssignment.status = assignedValue.value;
      newAssignment.status_maxvalue = assignedValue.maxvalue;
      newAssignment.status_description = assignedValue.description;
      newAssignment.splanreviewdate = null;
      newAssignment.laborcode = labor.laborcode;
      newAssignment.appointment = false;
      newAssignment.skilllevel = labordData.skilllevel;
      newAssignment.craft = labordData.craft;
      newAssignment.labor = {
        personid: labor.laborcode
      };
      newAssignment.laborhrs = remainHours;
      newAssignment.scheduledate = labordData.scheduledate;
      await assignmentListDs.save();
      await woDetailDs.forceReload();
    } catch (error) {
      log.t("Reject", "Failed assignment rejection : work order --> f--> " + error);
    }
  }
 
  // Assisted by watsonx Code Assistant 
  /**
   * Close the dialogs for rejecting an assignment and looking up labor assignments.
   * @param {object} app - The application object.
   */
  dialogClosed() {
    this.app?.findPage("schedule")?.findDialog('rejectAssignment')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('laborAssignmentLookup')?.closeDialog();
    CommonUtil.clearSharedData(CommonUtil.sharedData?.allowReassignmentPage);
    CommonUtil.clearSharedData(CommonUtil.sharedData?.event);
  }

  /*
   * Load Work order list data on the basis of selection from dropdown.
   */
  async loadWOListData(evt) {
    this.app.state.selectedWoListDs = evt.selectedItem.id;

    let seldatasource = this.page.findDatasource(evt.selectedItem.id);
    //istanbul ignore else
    if (evt.selectedItem.id !== "Unspecified" && evt.selectedItem.id !== "serverSearch") {
      //istanbul ignore else
      if (seldatasource && !seldatasource.state.loading) {
        seldatasource.clearState();
        seldatasource.resetState();
        await seldatasource.load({ noCache: true, itemUrl: "" });
      }
    } else if (evt.selectedItem.id === "serverSearch") {
      seldatasource.clearState();
      seldatasource.resetState();
    }
  }

  /**
   * Approves a work order
   * @param {Event} event - The event that triggered the action
   */
  async approveWO(event) {
    this.page.state.workloading = true;
    const wolistds = this.page.findDatasource(this.page.state.selectedDS);

    //istanbul ignore else
    if (!event.item.href) return;

    this.page.state.currentItem = event.item.wonum;
    let wodetails = this.app.findDatasource("wodetails");

    //istanbul ignore if
    if (!event?.item?.href) {
      log.d(TAG, 'Event.item has no href to load');
      this.page.state.canLoadWoDetails = false;
    }
    
    await wodetails.load({
      noCache: true,
      itemUrl: event.item.href,
    });
    this.page.state.canLoadWoDetails = true;
    this.page.state.currentItem = event.item.wonum;
    
    await CommonUtil.markStatusAssigned(this.app, this.page, wodetails, wolistds);
    this.app.state.showLoaderOnAllWO = this.page.state.workloading = false;
  }

  /**
   * @function rejectWO
   * @description This function is used to reject a work order. It loads the work order details datasource and displays the reject dialog.
   * @param {Object} event An object containing the following properties:
   * @param {Object} event.item The work order item that was selected.
   * @param {string} event.datasource The name of the datasource that contains the work order item.
   * @param {string} event.referencePage The name of the page that triggered the action.
   * @returns {Promise<void>} A promise that resolves when the work order details datasource has been loaded and the reject dialog has been displayed.
   */
  async rejectWO(event) {
    this.page.state.woItem = event.item;
    this.page.state.workloading = true;
    this.page.state.disableDoneButton = false;
    this.page.state.appVar = this.app;
    this.page.state.referenceDS = event.datasource;
    this.page.state.referencePage = event.referencePage;
    this.page.state.currentItem = event.item.wonum;
    this.page.state.statusDialog = "rejectAssignment";

    let wodetails = this.app.findDatasource("wodetails");
    //istanbul ignore else
    if (!event?.item?.href) {
      this.page.state.canLoadWoDetails = false;
    }
    //istanbul ignore else
    if (!wodetails.items?.length || (wodetails?.items?.[0]?.wonum !== event.item.wonum)) {
      await wodetails?.load({ noCache: true, itemUrl: event.item.href });
    }
    this.page.state.canLoadWoDetails = true;
    let statusLstDS = this.page.findDatasource("rejectList");
    statusLstDS?.clearSelections();

    const rejectDS = this.page.findDatasource("rejectList");
    //istanbul ignore else
    if(!rejectDS?.items?.length) {
      let dnewreadingDS = this.app.findDatasource("alnDomainDS");
      await dnewreadingDS.initializeQbe();
      dnewreadingDS?.setQBE('domainid', '=', 'WOREJECT');
      await dnewreadingDS?.searchQBE();
      
      if(dnewreadingDS.items) {
        await statusLstDS.load({ src: [...dnewreadingDS.items], noCache: true });
      }
    }
    //istanbul ignore else
    if(CommonUtil.sharedData.clickedUnassignment) {
      this.page.state.assignmentHeader = this.app.getLocalizedLabel(
        "unassign_header",
        "Unassign Assignment"
      );
      this.page.state.assignmentSubHeader = this.app.getLocalizedLabel(
        "unassign_subheader",
        "Select the unassignment code"
      );
    } else {
      this.page.state.assignmentHeader = this.app.getLocalizedLabel(
        "reject_header",
        "Reject Assignment"
      );
      this.page.state.assignmentSubHeader = this.app.getLocalizedLabel(
        "reject_subheader",
        "Select the rejection code"
      );
    }
    CommonUtil.sharedData.clickedUnassignment = true;
    await this.app.showDialog("rejectAssignment");
    this.app.state.showLoaderOnAllWO = this.page.state.workloading = false;
  }


  /**
   * @function updateSignaturePrompt
   * @description This function updates the signature prompt based on the system property.
   */
  updateSignaturePrompt(selected_status_is_inprg) {
    let allowedSignatureSystemProp = this.app.state?.systemProp?.["maximo.mobile.statusforphysicalsignature"];
    if (allowedSignatureSystemProp) {
      const allowedSignature = allowedSignatureSystemProp
        .split(",")
        .map((status) => status.trim());
      this.page.state.enableSignatureButton =
        allowedSignature.length > 0 &&
        allowedSignature.indexOf(selected_status_is_inprg) > -1;
    }
  }

  /**
  * This method is called by clicking on start work or stop work button on work order detail page
  * and start/stop timer for specific work order accordingly.
  * @param {event} event
  */
  //istanbul ignore next
  async openSignatureDialog(event) {
    await this.updateSignaturePrompt(event.item.status);
    let workorder = event.item;
    this.page.state.sigUploaded = false;
    const wodetails = this.app.findDatasource("wodetails");
    if (!wodetails?.href) {
      this.page.state.canLoadWoDetails = false;
    }
    await wodetails.load({ noCache: true, itemUrl: workorder.href });
    this.page.state.canLoadWoDetails = true;
    this.page.state.compDomainStatus = event.item.status + new Date().getTime();
    await this.app.userInteractionManager.openSignature(
      async imageData => {
        log.t(TAG, "base64 image" + imageData);

      }
      ,
      {
        imageFormat: null,
        primaryIcon: null,
        secondaryIcon: null,
        heading: null,
        primaryButtonSaveText: null,
        secondaryButtonDiscardText: null,
        signatureLabel: null,
        filename: this.page.state.compDomainStatus,
        datasource: this.app.findDatasource("signatureAttachment"),
        onUpload: this.onUpload.bind(this),
      })
  }

  /**
* This method invokes complete work API once image is uploaded.
*/
  //istanbul ignore next
  async onUpload() {
    //During Start work it will not wait for the API response
    const wodetails = this.app.findDatasource("wodetails");
    this.page.state.sigUploaded = true;
    const workorder = {
      item: wodetails.item,
      datasource: wodetails,
      action: "start",
      worktype: "work"
    }
    await this.startStopTimer(workorder);
  }

  /**
   * This method is called by clicking on start work or stop work button on work order list page
   * and start/stop timer for specific work order accordingly.
   * @param {event} event
   */
  async startStopTimer(event) {
    CommonUtil.callGeoLocation(this.app, event.action);
    const wolistds = this.page.findDatasource(this.page.state.selectedDS);
    const woLaborDetailDS = this.page.findDatasource("woLaborDetaildsOnSchedule");
    if(!event.item.href) return;

    this.page.state.transactionProgress = true;
    this.page.state.currentItem = event.item.wonum;

    const hazardReviewedReq = this.app.state?.systemProp?.["maximo.mobile.safetyplan.review"];

    if (event.action !== 'start' || hazardReviewedReq === '1') {
      this.page.state.canLoadWoDetailsChilds = false;
      this.page.state.canLoadWoLaborDetaildsOnSchedule = true;
      
      if (!event?.item?.href) {
        log.d(TAG, 'Event.item has no href to load');
        this.page.state.canLoadWoDetails = false;
      }

      await this.page.findDatasource('wodetails').load({
        noCache: true,
        itemUrl: event.item.href,
      });
      this.page.state.canLoadWoDetails = true;
      this.page.state.canLoadWoDetailsChilds = true;
      this.page.state.canLoadWoLaborDetaildsOnSchedule = false;
    }
    await WOTimerUtil.clickStartStopTimer(
      this.app,
      this.page,
      event,
      event.worktype,
      wolistds,
      woLaborDetailDS,
      "woConfirmLabTimeOnSchedule"
    );
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
  /**
  * Deletes the timer entry from the database.
  */
  onDeleteEntry(){
    WOTimerUtil.deleteTimerEntry(this.app, this.page);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Resets the shared confirmation variable.
   * @param {object} app - The application object.
   */
  onResetSharedConfirmationVariable() {
    WOTimerUtil.resetSharedConfirmationVariable(this.app);
  }

  /**
   * This method is called by clicking edit labor button on confirm dialog.
   */
  async onClickEditLabor() {
    let wodetails = this.page.findDatasource("wodetails");
    const woLaborDetailDS = this.page.findDatasource("woLaborDetaildsOnSchedule");
    woLaborDetailDS.item.wonum = wodetails.item.wonum;
    await WOTimerUtil.clickEditLabor(
      this.app,
      wodetails.item.href,
      woLaborDetailDS.item
    );
  }

  /**
   * This method is called by clicking send button on confirm dialog.
   * @param {event} event
   */
  async onClickSendLabTrans(event) {
    const wodetails = this.page.findDatasource("wodetails");
    const wolistds = this.page.findDatasource(this.page.state.selectedDS);
    const woLaborDetailDS = this.page.findDatasource("woLaborDetaildsOnSchedule");
    await WOTimerUtil.clickSendLabTrans(
      this.app,
      this.page,
      event.action,
      wodetails,
      woLaborDetailDS,
      event.item
    );
    
    //set the updated wo list
    await wolistds.forceReload();
  }

  /*
   * Method to resume the page
   */
  async pageResumed(page) {
    let reportWork = this.app.findPage('report_work');
    reportWork.state.fieldChangedManually = false;
    page.state.enforceAssetScan = this.app.checkSigOption(`${this.app.state.woOSName}.ENFORCEASSETSCAN`);
    this.trackUserLogin(page, this?.app?.client?.userInfo?.loginID);

    if (this.app.currentPage?.name === 'schedule' && this.app.lastPage?.name === 'workOrderDetails') {
      CommonUtil.sharedData.navigatedFromWOPage = true;
    }
    //On firstLogin the wolist should get synced with server
    if (page.state.firstLogin && this.app.state.networkConnected && this.app.state.refreshOnSubsequentLogin !== false) {
      await this.page.findDatasource(page.state.selectedDS)?.forceSync();
    } else if (CommonUtil.sharedData.searchedText) {
      let datasource = this.page.findDatasource(page.state.selectedDS);

      datasource.baseQuery.searchText = CommonUtil.sharedData.searchedText;
      await datasource.load({ ...datasource.baseQuery, noCache: true });

      CommonUtil.sharedData.searchedText = "";
    } else {
      await this.page.findDatasource(page.state.selectedDS)?.forceReload();
    }

    let incomingContext = this.app.state.incomingContext;
    // istanbul ignore else
    if (incomingContext?.breadcrumb?.enableReturnBreadcrumb) {
      // istanbul ignore next
      this.page.state.breadcrumbWidth =
        this.app.state.screen.size === "sm" ? 68 : 50;
    }
    CommonUtil.setGeoLocationState(this.app);
    
    //Get system properties again.
    CommonUtil.getTravelSystemProperties(this.app);

    // istanbul ignore else
    if(CommonUtil.sharedData?.clickedWo) {
      this.filterListUsingPageParams(CommonUtil.sharedData?.clickedWo);
    }
  }


  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Filter the list of items using the page parameters.
   * @param {object} item - The item to be filtered.
   * @returns {Promise<void>} A promise that resolves when the filtering is complete.
   */
  async filterListUsingPageParams(item) {
    const datasource = this.page.findDatasource(this.page.state.selectedDS);
    // istanbul ignore else
    if (!datasource || this.page.state.selectedSwitch === 0) {
        return;
    }
    await datasource.initializeQbe();
    datasource.setQBE("wonum", "=", item);
    const filteredCompClose = await datasource.searchQBE(undefined, true);
    this.openWOCard(filteredCompClose[0]);
  }

  async pagePaused() {
    this.page.findDialog('workLogDrawer')?.closeDialog();
    this.page.findDialog('slidingwomaterials')?.closeDialog();
    this.page.findDialog('woStatusChangeDialog')?.closeDialog(); 
    this.page.findDialog('slidingwohazard')?.closeDialog(); 
    this.app?.findPage("schedule")?.findDialog('woStatusChangeDialog')?.closeDialog();
    this.app?.findPage("schedule")?.findDialog('laborAssignmentLookup')?.closeDialog();
  }

  /*
   * Method to store and load the user login detail
   */
  trackUserLogin(page, loginID) {
    const storageKey = 'logindata_' + loginID;
    const firstLoginData = localStorage.getItem(storageKey);
    const newDate = this.app.dataFormatter.convertISOtoDate(new Date());
    if (!firstLoginData || (Math.abs(newDate - this.app.dataFormatter.convertISOtoDate(firstLoginData)) / 3600000) > 24) {
      localStorage.setItem(storageKey, newDate);
      page.state.firstLogin = true;
    }  
  }

  /**
   * Redirects to Wo Card on Map view
   * @param {Object} item - clicked item from list
   */
   async openWOCard(event) {
    let loadMap = false;
    this.page.state.mapHighlightedItem = event?.item;
    // this code block will invoke in case we are highlighting map point by code
    // istanbul ignore else
    if(event?.wonum && !event?.item) {
      event = {
        item : event,
        prevPage: 'mapwolist'
      }
      loadMap = true;
    }

    // istanbul ignore else
    if (event?.item) {
      let datasource = this.page.findDatasource(this.page.state.selectedDS);
      CommonUtil.sharedData.isCardOpen = true;
      await datasource.load({ itemUrl: event.item.href });
      this.page.state.showMapOverlay = 1;
      this.page.state.previousPage = event.prevPage;
      // istanbul ignore next
      if (!this.app.map || loadMap) {
        // if map is already loaded and is in mobile openMap pointer has less time else it takes time in browser
        const time = (loadMap && Device.get().isMaximoMobile) ? 400 : 2000;
        setTimeout(() => {
          this.openMap(event);
        }, time);
      } else {
        this.openMap(event);
      }
    }
  }

  openMap(event) {
    // istanbul ignore else
    if (this.app.map) {
      this.handleItemClick(event.item);
    }
  }

  /**
   * Redirects to Wo List on Map view
   * @param {Object} item - clicked item from list
   */
  async openPrevPage(event) {
    // istanbul ignore else
    // istanbul ignore next
    // ignoring as for map openlayers cannot be emulated
    if (this.page.state.previousPage === "mapwolist") {
      this.page.state.showMapOverlay = 0;
      this.app.map.clearFeatureStyle();
      await this.resetDatasource();
    } else if (this.page.state.previousPage === "schedulecardlist") {
      this.page.state.selectedSwitch = 0;
      await this.resetDatasource();
      this.page.state.showMapOverlay = 0;
      this.page.state.mapOriginPage = "";
    } else if (this.page.state.previousPage === "wodetail") {
      let wodtlPage = this.app.findPage("workOrderDetails");
      if (wodtlPage) {
        this.app.setCurrentPage(wodtlPage);
        if (this.page.state.mapOriginPage === "wodetail") {
          this.page.state.previousPage = "schedulecardlist";
        }
      }
    }
  }

  /**
   * resets datasource
   */
  async resetDatasource() {
    let datasource = this.page.findDatasource(this.page.state.selectedDS);
    await datasource.reset(datasource.baseQuery);
  }

  /**
   * Function to load card view of a selected work order on map-overlay
   */
  openMapPage(event) {
    this.page.state.selectedSwitch = 1;
    this.openWOCard(event);
  }

  /**
   * Redirects to Wo Crd List from Map view
   */
  async showCardList(event) {
    this.page.state.showMapOverlay = 0;
  }

  /**
   * Sets default state
   */
  setDefaults() {
    this.page.state.selectedSwitch = 0;
  }

  /**
   * Filters datalist on the basis of pin/cluster being clicked
   * @param {*} item item record (wo record) for the pin/cluster being clicked
   */
  // istanbul ignore next
  // ignoring as for map openlayers cannot be emulated
  async handleMapClick(item) {
    let maximoAttributes;
    const datasource = this.page.findDatasource(this.page.state.selectedDS);
    if (
      item.hasFeature &&
      item.featuresAndLayers &&
      item.featuresAndLayers.length > 0
    ) {
        const layer = item.featuresAndLayers[0].layer;
      if (
        item.featuresAndLayers[0].feature.values_.features &&
        item.featuresAndLayers[0].feature.values_.features.length > 1
      ) {
        let featureCluster = item.featuresAndLayers[0].feature;
        let styleCluster = this.app.map.getNewStyle(highlightSymbolCluster);
        
        this.app.map.changeFeatureStyle(
          featureCluster, 
          styleCluster, {
            layer: item.featuresAndLayers[0].layer,
            autoHideOriginalStyle: false
          }
        );

        let wonums = [];
        let features = featureCluster.values_.features;
        maximoAttributes = features[0].get("maximoAttributes");
        let layerds = item.featuresAndLayers[0].layer.get('datasource');
        if (layerds) {
          for (let feature of features) {
            wonums.push(feature.get("maximoAttributes").wonum);
          }
          await datasource.initializeQbe();
          datasource.setQBE("wonum", "in", wonums);
          datasource.setQBE("siteid", "=", maximoAttributes.siteid);
          await datasource.searchQBE(undefined, true);
        } else {
          datasource.clearQBE();
          await datasource.searchQBE(undefined, true);
        }
      } else {
        const isMarkerLayer = layer.get('isMarkerLayer');
        const feature = item.featuresAndLayers[0].feature;
        const wasFeatureHighlighted = this.app.map.isFeatureHighlighed(feature);
        const style = this.app.map.getNewStyle(highlightSymbol);

        this.app.map.changeFeatureStyle(
          feature, 
          style, 
          {
            autoRestoreOnZoom: false,
            layer: item.featuresAndLayers[0].layer,
            autoHideOriginalStyle: false
          }
        );
        if ((feature?.values_?.features?.length) || isMarkerLayer) {
          const singleFeature = isMarkerLayer
          ? feature
          : feature.get('features')[0];
          if (wasFeatureHighlighted) {
            datasource.clearQBE();
            await datasource.searchQBE(undefined, true);
          } else {     
            maximoAttributes = singleFeature.get(
              "maximoAttributes"
            );
            if(this.page.state.showMapOverlay) {
              await datasource.load({ itemUrl: maximoAttributes.href });
            } else {
              datasource.setQBE('wonum', '=', maximoAttributes.wonum);
              datasource.searchQBE(); 
            }     
          }     
        }
      }
    } else {
      this.page.state.showMapOverlay = 0;
      this.app.map.clearFeatureStyle();
      datasource.clearQBE();
      await datasource.searchQBE(undefined, true);
      await this.resetDatasource();
    }
  }

  /**
   * Highlights the pin on map for the record which was clicked in datalist
   * @param {*} item record for the item which was clicked in datalist
   */
  // istanbul ignore next
  // ignoring as for map openlayers cannot be emulated
  handleItemClick(item) {
    if(!item.autolocate) {
      return;
    }
    let itemGeometry = this.app.map.parseGeometry(item.autolocate);
    let center = this.app.map.getGeometryCenter(itemGeometry);
    let centerCoordinates = center.getCoordinates();
    let itemSpatialReference = this.app.map.getLayerSpatialReference(
      "WORKORDER"
    );
    let basemapSpatialReference = this.app.map.getBasemapSpatialReference();
    if (!basemapSpatialReference || !itemSpatialReference) {
      return;
    }
    if (basemapSpatialReference && itemSpatialReference && itemSpatialReference !== basemapSpatialReference) {
      centerCoordinates = this.app.map.convertCoordinates(
        centerCoordinates,
        itemSpatialReference,
        basemapSpatialReference
      );
    }
    const feature = this.app.map.getFeatureByLayerNameAndDataSourceItem("WORKORDER", item)

    let style = this.app.map.getNewStyle(highlightSymbol);
    if (feature) {
      this.app.map.changeFeatureStyle(
        feature,
        style,
        { autoRestoreOnZoom: false }
      );
      this.app.map.centerTo(
        centerCoordinates[0],
        centerCoordinates[1],
        false
      );
    }
  }

  /**
   * loads offline map data
   */
  // istanbul ignore next
  // ignoring as for map openlayers cannot be emulated
  onAfterLoadData(dataSource, items) {
    log.i(TAG, "Loading offline tiles!");

    let validMap = this.app.state.isMapValid;
    if (
      validMap &&
      items &&
      Device.get().isMaximoMobile &&
      this.page.state.selectedSwitch === 1
    ) {
      this.mapPreloadAPI.loadOfflineData(
        items,
        3,
        16,
        "autolocate",
        "4326",
        this.app,
        false
      );
    }
  }

  /**
   * resets mapoverlay for map content
   */
  showMapList() {
    this.page.state.showMapOverlay = 0;
  }

  /**
   * Set the Log Type from the Lookup
   */
  async setLogType(event) {
    this.page.state.defaultLogType = event.value;
  }

  /**
   * Function to set flag for 'save-data-failed' event
   */
  onUpdateDataFailed() {
    this.saveDataSuccessful = false;
  }
  
  /**
   * Handle Delete transaction
   */
   async handleDeleteTransaction(event) { 
    // istanbul ignore else
    if (event && event.app === this.app.name &&
      (this.app.currentPage.name === this.page.name || this.app.lastPage.name === this.page.name)
    ) {
      await this.app.findDatasource(this.page.state.selectedDS).forceReload();
    }
  }

  /**
   * open safetyplan drawer
   */
  async openHazardDrawer(event) { 
    WOUtil.openWOHazardDrawer(this.app, this.page, event, "slidingwohazard");
  }
  
  /**
   * Review the safetyplan
   */
   async reviewSafetyPlan() {
    WOUtil.reviewSafetyPlan(this.app);
  }

  /**
   * Callback method from map when we do longpress
   * @param {data} map data 
   */
  async handleMapLongPress(data) {
    let createAccess = this.app.checkSigOption(`${this.app.state.woOSName}.CREATEWO`);
    // istanbul ignore if
    if(!createAccess) {
      return
    }
    
    
    const {coordinate, position} = data
    if (typeof data === 'object' && coordinate) {
      this.app.state.currentMapData = data;
    }

    let integrationData;
    // istanbul ignore else
    if (this.page.state.gisMaximoRelationshipConfig && coordinate && position) {
      integrationData = await this.app.map.getIntegrationGISData(position, coordinate, this.page.state.gisMaximoRelationshipConfig)
    }
    // istanbul ignore else
    if (integrationData) {
      const {mboValues, geometryCenter} = integrationData;
      this.app.state.currentMapData.gisIntegrationData = mboValues;
      // istanbul ignore else
      if (geometryCenter){
        this.app.state.currentMapData.coordinate = geometryCenter;
      }
    } 
  }

  /**
   * Set create workorder page
   */
  goToCreateWoPage() {
    // istanbul ignore else
    if (this.app.state.currentMapData) {
      this.app.setCurrentPage({
        name: 'createwo',
        resetScroll: false,
      });
    }
  }


  /**
   * Changes status of selected work order. This method is being used in approvals app
   * @param {Object} item 
   */
   async changeWorkorderStatus(inputData) {

    this.page.state.loading = true;
    this.page.state.currentItem = inputData.item.wonum;

    let dataFormatter = this.app.dataFormatter;
    let currDate = dataFormatter.convertDatetoISO(new Date());
    let approvalWOListDS = this.page.findDatasource('todaywoassignedDS');
    let approvedStatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'WOSTATUS', inputData.status);
    let action = 'changeStatus';
    let item = inputData.item;

    let option = {
      record: item,
      parameters: {
        status: approvedStatus.value,
        date: currDate,
      },
      headers: {
        'x-method-override': 'PATCH'
      },
      responseProperties: 'status',
      localPayload: {
        href: item.href,
        status: approvedStatus.value,
        status_maxvalue: approvedStatus.maxvalue,
        status_description: approvedStatus.description,
        workorderid: item.workorderid
      },
      query: {interactive: false},
      esigCheck: 0
    };
    //istanbul ignore else
    if (this.checkEsigRequired(approvedStatus.value)) {
      option.esigCheck = 1;
    }
    await approvalWOListDS.invokeAction(action, option);
    await approvalWOListDS.forceReload();
    this.page.state.loading = false;
  }

  /**
   * In system properties we would get list of flag on which we have to ask for eSigCheck
   * if current status matches in list we would pass esigCheck 1 and on based of it graphite component
   * will handle to show prompt of esig
   * @returns 1 or 0 (boolean numeric value)
   */
  checkEsigRequired(status) {
    const esigCheck = this.app.state?.systemProp?.["maximo.mobile.wostatusforesig"];
    const allowedSignature = esigCheck
      .split(',')
      .map((status) => status.trim());
      const addEsig = allowedSignature.length > 0 &&
      allowedSignature.indexOf(status) > -1;
    return (addEsig) ? 1 : 0;
  }

  /**
   * Opens the cost detail for the corresponding workorder record.
   * @param {Object} event workorder item
   */
  async openWoTotalCostDrawer(event) {
    let newTool = WOUtil.computedEstTotalCost(event.item);
    let jwoTotal = this.app.findDatasource('jsondsWoTotal');
    this.page.state.costDrawerOpen = true;
    jwoTotal.clearState();
    jwoTotal.resetState();
    await jwoTotal.load({ src: newTool });
    this.page.state.woCostDrawerTitle = this.app.getLocalizedLabel(
      "woCostDrawerTitle_lable",
      "Cost"
    );
    this.page.showDialog("woCostDrawer");
    this.page.state.costDrawerOpen = false;
  }
}

export default SchedulePageController;