/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import { MapPreLoadAPI } from "@maximo/map-component";
import { Device, log } from "@maximo/maximo-js-api";
const TAG = 'MultiAssetLocCiController';

const highlightedNotReady = {
  url:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzBGNjJGRSIvPg0KPHBhdGggZD0iTTMyIDIzLjI1QzMwLjI2OTQgMjMuMjUgMjguNTc3NyAyMy43NjMyIDI3LjEzODggMjQuNzI0NkMyNS42OTk4IDI1LjY4NjEgMjQuNTc4MyAyNy4wNTI3IDIzLjkxNjEgMjguNjUxNUMyMy4yNTM4IDMwLjI1MDQgMjMuMDgwNSAzMi4wMDk3IDIzLjQxODEgMzMuNzA3QzIzLjc1NTggMzUuNDA0NCAyNC41ODkxIDM2Ljk2MzUgMjUuODEyOCAzOC4xODcyQzI3LjAzNjUgMzkuNDEwOSAyOC41OTU2IDQwLjI0NDMgMzAuMjkzIDQwLjU4MTlDMzEuOTkwMyA0MC45MTk1IDMzLjc0OTYgNDAuNzQ2MiAzNS4zNDg1IDQwLjA4MzlDMzYuOTQ3MyAzOS40MjE3IDM4LjMxMzkgMzguMzAwMiAzOS4yNzU0IDM2Ljg2MTJDNDAuMjM2OCAzNS40MjIzIDQwLjc1IDMzLjczMDYgNDAuNzUgMzJDNDAuNzQ3NCAyOS42ODAyIDM5LjgyNDcgMjcuNDU2MSAzOC4xODQzIDI1LjgxNTdDMzYuNTQzOSAyNC4xNzUzIDM0LjMxOTggMjMuMjUyNiAzMiAyMy4yNVpNMzIgMzkuNUMzMC4wMTA5IDM5LjUgMjguMTAzMiAzOC43MDk4IDI2LjY5NjcgMzcuMzAzM0MyNS4yOTAyIDM1Ljg5NjggMjQuNSAzMy45ODkxIDI0LjUgMzJDMjQuNSAzMC4wMTA5IDI1LjI5MDIgMjguMTAzMiAyNi42OTY3IDI2LjY5NjdDMjguMTAzMiAyNS4yOTAyIDMwLjAxMDkgMjQuNSAzMiAyNC41VjMyTDM3LjMwMDggMzcuMzAwOUMzNi42MDU2IDM3Ljk5ODUgMzUuNzc5NCAzOC41NTE5IDM0Ljg2OTggMzguOTI5M0MzMy45NjAxIDM5LjMwNjcgMzIuOTg0OCAzOS41MDA2IDMyIDM5LjVaIiBmaWxsPSJ3aGl0ZSIvPg0KPC9zdmc+DQo=",
  color: "",
  offsetx: 22,
  offsety: 50,
  width: 50,
  height: 60,
  scale: 1,
  zIndex: 9999
};

const highlightedOperating = {
  url:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzBGNjJGRSIvPg0KPHBhdGggZD0iTTMwLjExNzIgMzdMMjQuNDkyMiAzMS4zNzVMMjUuMzc1OSAzMC40OTEyTDMwLjExNzIgMzUuMjMxOEwzOC42MDg0IDI2Ljc0MTJMMzkuNDkyMiAyNy42MjVMMzAuMTE3MiAzN1oiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==",
  color: "",
  offsetx: 22,
  offsety: 50,
  width: 50,
  height: 60,
  scale: 1,
  zIndex: 9999
};

const highlightedDecommissioned = {
  url:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzBGNjJGRSIvPg0KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMy4yNSAzMkMyMy4yNSAyNy4xMjUgMjcuMTI1IDIzLjI1IDMyIDIzLjI1QzM2Ljg3NSAyMy4yNSA0MC43NSAyNy4xMjUgNDAuNzUgMzJDNDAuNzUgMzYuODc1IDM2Ljg3NSA0MC43NSAzMiA0MC43NUMyNy4xMjUgNDAuNzUgMjMuMjUgMzYuODc1IDIzLjI1IDMyWk0yNC41IDMyQzI0LjUgMzYuMTI1IDI3Ljg3NSAzOS41IDMyIDM5LjVDMzYuMTI1IDM5LjUgMzkuNSAzNi4xMjUgMzkuNSAzMkMzOS41IDI3Ljg3NSAzNi4xMjUgMjQuNSAzMiAyNC41QzI3Ljg3NSAyNC41IDI0LjUgMjcuODc1IDI0LjUgMzJaTTMyIDMzTDM1LjM3NSAzNi4zNzVMMzYuMzc1IDM1LjM3NUwzMyAzMkwzNi4zNzUgMjguNjI1TDM1LjM3NSAyNy42MjVMMzIgMzFMMjguNjI1IDI3LjYyNUwyNy42MjUgMjguNjI1TDMxIDMyTDI3LjYyNSAzNS4zNzVMMjguNjI1IDM2LjM3NUwzMiAzM1oiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==",
  color: "",
  offsetx: 22,
  offsety: 50,
  width: 50,
  height: 60,
  scale: 1,
  zIndex: 9999
};

//symbol for highlighting asset/location cluster on map
const highlightSymbolCluster = {
  url:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzBGNjJGRSIvPg0KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNiA0OEgyMEMxNy43OTA5IDQ4IDE2IDQ2LjIwOTEgMTYgNDRWMjBDMTYgMTcuNzkwOSAxNy43OTA5IDE2IDIwIDE2SDQ0QzQ2LjIwOTEgMTYgNDggMTcuNzkwOSA0OCAyMFY0NEM0OCA0Ni4yMDkxIDQ2LjIwOTEgNDggNDQgNDhIMzhMMzIgNTRMMjYgNDhaTTM4LjQxNDIgNDlINDRDNDYuNzYxNCA0OSA0OSA0Ni43NjE0IDQ5IDQ0VjIwQzQ5IDE3LjIzODYgNDYuNzYxNCAxNSA0NCAxNUgyMEMxNy4yMzg2IDE1IDE1IDE3LjIzODYgMTUgMjBWNDRDMTUgNDYuNzYxNCAxNy4yMzg2IDQ5IDIwIDQ5SDI1LjU4NThMMzIgNTUuNDE0MkwzOC40MTQyIDQ5WiIgZmlsbD0id2hpdGUiLz4NCjwvc3ZnPg0K",
  color: "",
  offsetx: 22,
  offsety: 50,
  width: 50,
  height: 60,
  scale: 1,
  zIndex: 9999
};
const POINT_PROPS = {
  color: '',
  offsetx: 22,
  offsety: 56,
  width: 50,
  height: 60
};
const LINE_PROPS = {
  color: 5,
  width: 5
};
const POLYGON_PROPS = {
  color: 5,
  width: 5,
  fillcolor: '#C0C0C0'
};
const SYMBOLOGY_PROPS = {
  point: POINT_PROPS,
  linestring: LINE_PROPS,
  polygon: POLYGON_PROPS,
  multilinestring: LINE_PROPS,
  multipolygon: POLYGON_PROPS
};

class MultiAssetLocCiController {

  // Assisted by watsonx Code Assistant 
  /**
   * Initializes the page and application objects.
   *
   * @param {Object} page - The initialized page object.
   * @param {Object} app - The initialized application object.
   *
   */
  pageInitialized(page, app) {
    this.app = app;
    this.page = page;
    try {
      this.mapPreloadAPI = new MapPreLoadAPI();
    } catch (error) {
      log.t(TAG, 'Error while initializing the MultiAsset page', error);
    }
    this.page.state.mapMultiAssetListHeight = "35%";
    this.page.state.mapMultiAssetCardHeight = "45%"
    const device = Device.get();
    if (device.isTablet || device.isIpad) {
      this.page.state.mapPaddingRight = "1rem";
      this.page.state.mapPaddingLeft = "0.5rem";
      this.page.state.mapMultiAssetListHeight = "25%";
      this.page.state.mapMultiAssetCardHeight = "35%";
    }
    this.page.state.mapPaddingBottom = "calc(100vh - 9rem)";
    if (device.isMaximoMobile) {
      this.page.state.mapPaddingBottom = "calc(100vh - 5rem)";
      this.page.state.mapMultiAssetCardHeight = "45%";
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Processes data after loading, triggering offline data load.
   * @param {Array} items - The data items to be processed.
   */
  onAfterLoadData(dataSource, items) {
    const validMap = this.app?.state?.isMapValid;
    if (validMap && items && Device.get().isMaximoMobile && this.page.state.selectedSwitch === 1) {
      this.mapPreloadAPI.loadOfflineData(items, 3, 16, items[0]?.asset?.length > 0 ? "assetautolocate" : "locationautolocate", "4326", this.app, false);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Resets the datasource based on current state and reloads the data.
   * @returns {Promise<void|Array>} - Returns a promise that resolves when the datasource is reset, with filtered state if applicable.
   */
  async resetDatasource() {
    const ds = this.page.findDatasource(this.page.state.multiAssetData);
    if (!ds) return;

    if (Object?.keys(ds?.state?.qbe).length !== 0) {
      ds?.clearQBE();
      await ds?.searchQBE();
    }
  };

  // Assisted by watsonx Code Assistant 
  /**
   * Initializes the map and assigns it to the app.
   * @param {Object} map - The map object to initialize.
   */
  onMapInitialized(map) {
    this.app.map = map;
    if (!!this.page.state.mapHighlightedAsset) {
      this.handleItemClick(this.page.state.mapHighlightedAsset);
      this.page.state.mapHighlightedAsset = "";
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Opens the map and triggers an item click handler if the map exists.
   * @param {Object} event - The event object containing item information.
   */
  openMap(event) {
    // istanbul ignore else
    if (this.app.map) {
      this.handleItemClick(event.item);
    }
  }

  // Assisted by watsonx Code Assistant 
  /**
   * 
   * Switches the page to the map page and opens the multi-asset card.
   * Triggers from the MultiAsset List page's map button.
   * @param {Object} event - The event object that triggers the map page opening.
   */
  openMapPage(event) {
    this.page.state.selectedSwitch = 1;
    this.page.state.cardOpenfromList = true;
    this.openMultiAssetCard(event);
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Hides the map overlay when showing the multi-asset card list.
   * @param {Object} event - The event object triggered when the multi-asset list is shown.
   */
  showMultiAssetCardList(event) {
    this.page.state.showMapOverlay = 0;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Resets the selected switch state to the default value (0).
   */
  setDefaults() {
    this.page.state.selectedSwitch = 0;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Hides the map overlay when showing the map list.
   */
  showMapList() {
    this.page.state.showMapOverlay = 0;
  }

  // Assisted by watsonx Code Assistant 
  /**
   * Handles the page resume event, updating the page title and loading data.
   *
   * @param {Object} page - The page object.
   *
   */
  pageResumed(page, app) {
    this.loadPageResumed(page, app);
  }

  // Assisted by watsonx Code Assistant 

  /**
   * Asynchronously loads data for a resumed page.
   *
   * @param {Object} page - The current page object.
   *
   * @returns {Promise<void>} - Resolves when the data has been loaded.
   *
   */
  async loadPageResumed(page, app) {
    this.app.state.pageLoading = true;
    page.state.inspectionAccess = this.app.checkSigOption(`${this.app.state.appnames.inspection}.READ`);

    const multiAssetJsonDS = this.page.findDatasource("multiAssetLocCiJsonDS");
    multiAssetJsonDS?.reset(multiAssetJsonDS.baseQuery, true, { resetItems: true, resetDataAdapter: true });
    await multiAssetJsonDS?.load();

    if (!multiAssetJsonDS?.items?.length) {
      this.page.state.showMapOverlay ^= 1;
    }
    this.page.state.multiAssetData = multiAssetJsonDS?.name;
    this.app.state.pageLoading = false;
  }


  // Assisted by watsonx Code Assistant 
  /**
   * Navigates to the asset details page from the multi-asset page.
   *
   * @param {Object} item - The item object containing asset details.
   *
   */
  async navigateMultiAssetToAssetDetails(item) {
    try {
      const context = {
        page: 'assetDetails',
        assetnum: item.assetnum,
        siteid: item.siteid,
        href: item.asset[0].href,
      };
      this.app.callController('loadApp', {
        appName: this.app.state?.appnames?.assetmobile,
        context,
      });
    } catch (error) {
      log.t(TAG, 'Error while navigating to Asset Details page', error);
    } finally {
    }
  }

  /*
   * Method to update the multi asset progress
   */
  async updateMultiAssetProgress(record) {
    let item = record.assetItem;
    this.page.state.assetComplete = true;
    // istanbul ignore else
    if (item) {
      this.page.state.currentAsset = item.multiid;
      this.page.state.assetToOpen = '';
      const woMultiAssetLocationds = this.app.findDatasource('woMultiAssetLocationds');
      const asset = {
        progress: !item.progress,
        href: item.href,
        isprimary: item.isprimary
      };
      const option = {
        responseProperties: 'progress',
        localPayload: {
          progress: !item.progress,
          href: item.href,
        },
      };
      await woMultiAssetLocationds.update(asset, option);
      await woMultiAssetLocationds.forceReload();
      this.page.state.progress = !item.progress;

      let incompAssetCount = [];
      // istanbul ignore else
      if (woMultiAssetLocationds?.items) {
        woMultiAssetLocationds.items.forEach((item) => {
          // istanbul ignore else
          if (item.progress === false) {
            incompAssetCount.push(item._rowstamp);
          }
        });
      }
      // istanbul ignore else
      if (incompAssetCount.length >= 1) {
        woMultiAssetLocationds.clearState();
        await woMultiAssetLocationds.load();
      }
      const multiAssetJsonDS = this.page.findDatasource("multiAssetLocCiJsonDS");
      await multiAssetJsonDS?.load({ src: woMultiAssetLocationds.items, noCache: true });
    }
    this.page.state.assetComplete = false;
  }


  // Assisted by watsonx Code Assistant 

  /**
   * Redirects to the MultiAsset Card on the Map view.
   * 
   * @param {Object} event - The event object containing item and optional multiid to trigger the redirection.
   * @param {Object} event.item - The clicked item from the list.
   * 
   * @returns {Promise<void>} - Resolves when the map is opened.
   */
  async openMultiAssetCard(event) {
    let loadMap = false;
    this.page.state.mapHighlightedAsset = event?.item;
    //istanbul ignore if
    if (event?.item?.multiid && !event?.item) {
      event = { item: event, prevPage: 'mapmultiAssetlist' }
      loadMap = true;
    }

    if (event.item) {
      const datasource = this.page.findDatasource(this.page.state.multiAssetData);
      // Handles discrepancy: Maximo DS triggers `updateMaximoMapReference` on load; JSON DS doesn't.
      // Workaround for cases where the map isn't initialized on mobile
      // Flag for future cleanup — potential edge case bug for Map team.
      if (this.page.state.cardOpenfromList && !this.app.map && Device.get().isMaximoMobile) {
        const woMultiAssetDS = this.app.findDatasource('woMultiAssetLocationds');
        await woMultiAssetDS.load({ noCache: true });
      }

      await datasource.initializeQbe();
      datasource.setQBE('multiid', '=', event.item.multiid);
      await datasource.searchQBE();

      this.page.state.showMapOverlay = 1;
      this.page.state.previousPage = event.prevPage;

      if (!this.app.map || loadMap) {
        const time = (loadMap && Device.get().isMaximoMobile) ? 400 : 2000;
        setTimeout(() => {
          this.openMap(event);
        }, time);
      } else {
        this.openMap(event);
      }
    }
  }

  // Assisted by watsonx Code Assistant 

  /**
   * Opens the previous page
   * If the previous page was "mapmultiAssetlist", it clears the map overlay, resets the datasource, and clears the feature style.
   * If the previous page was "multiAssetLocCi", it resets the datasource, hides the map overlay, and clears the map origin state.
   *
   * @returns {Promise<void>} - Resolves when the previous page actions are completed.
   */
  async openPrevPage() {
    //istanbul ignore else
    if (this.page.state.previousPage === "mapmultiAssetlist") {
      this.page.state.showMapOverlay = 0;
      this.app.map.clearFeatureStyle();
      await this.resetDatasource();
    } else if (this.page.state.previousPage === "multiAssetLocCi") {
      this.page.state.selectedSwitch = 0;
      await this.resetDatasource();
      this.page.state.showMapOverlay = 0;
      this.page.state.mapOriginPage = "";
    }
  }

  // Assisted by watsonx Code Assistant 

  /**
   * Handles item click by determining the item's status, updating map feature styles, and centering the map on the item.
   * @param {Object} item - The clicked item containing asset information.
   */
  handleItemClick(item) {
    const currentStatus = (!item.assetautolocate && item.locationautolocate)
      ? item.locationstatus_maxvalue
      : item.assetstatus_maxvalue;

    if (!item.assetautolocate && !item.locationautolocate) {
      this.app.map.clearFeatureStyle();
      return;
    }

    const itemGeometry = !item.assetautolocate && item.locationautolocate
      ? this.app.map.parseGeometry(item.locationautolocate)
      : this.app.map.parseGeometry(item.assetautolocate);

    const itemSpatialReference = (!item.assetautolocate && item.locationautolocate)
      ? this.app.map.getLayerSpatialReference("Multiple Locations")
      : this.app.map.getLayerSpatialReference("Multiple Assets");

    const basemapSpatialReference = this.app.map.getBasemapSpatialReference();
    if (!basemapSpatialReference || !itemSpatialReference) {
      return;
    }

    const center = this.app.map.getGeometryCenter(itemGeometry);
    let centerCoordinates = center?.getCoordinates();

    if (basemapSpatialReference && itemSpatialReference && itemSpatialReference !== basemapSpatialReference) {
      centerCoordinates = this.app.map.convertCoordinates(centerCoordinates, itemSpatialReference, this.app.map.getBasemapSpatialReference());
    }

    const feature = this.app.map.getFeatureByGeo({ type: 'Feature', geometry: { type: 'Point', coordinates: centerCoordinates } }, "geojson");

    let style;

    if (currentStatus) {
      const status = currentStatus.toUpperCase();
      if (status === 'NOT READY') {
        style = this.app.map.getNewStyle(highlightedNotReady);
      } else if (status === 'OPERATING' || status === 'ACTIVE') {
        style = this.app.map.getNewStyle(highlightedOperating);
      } else if (['DECOMMISSIONED', 'BROKEN', 'INACTIVE', 'MISSING', 'SEALED', 'LIMITEDUSE', 'IMPORTED'].includes(status)) {
        style = this.app.map.getNewStyle(highlightedDecommissioned);
      }
    }

    if (feature.featuresAndLayers.length > 0) {
      this.app.map.changeFeatureStyle(feature.featuresAndLayers[0].feature, style, { autoRestoreOnZoom: false });
      this.app.map.centerTo(centerCoordinates[0], centerCoordinates[1], false);
    }
  }


  // Assisted by watsonx Code Assistant 

  /**
   * 
   * Handles map click events, clusters features if applicable, updates feature styles based on asset status.
   * 
   * @param {Object} item - The clicked item containing feature and layer information.
   */
  // This function will only execute if the map is initialized, so it is excluded from coverage/unit testing.
  //istanbul ignore next
  async handleMapClick(item) {
    const datasource = this.page.findDatasource(this.page.state.multiAssetData);
    if (item?.hasFeature && item?.featuresAndLayers?.length > 0) {
      const layer = item.featuresAndLayers[0].layer;
      const feature = item.featuresAndLayers[0].feature;

      if (feature.values_?.features?.length > 1) {
        const featureCluster = feature;
        const styleCluster = this.app.map.getNewStyle(highlightSymbolCluster);
        this.app.map.changeFeatureStyle(featureCluster, styleCluster, { layer, autoHideOriginalStyle: false });

        const features = featureCluster.values_.features;
        const assetNums = features.map(f => f.get("maximoAttributes").assetnum);
        const locationNums = features.map(f => f.get("maximoAttributes").location);
        const maximoAttributes = features[0].get("maximoAttributes");

        if (layer.get('datasource')) {
          await datasource.initializeQbe();

          datasource.setQBE(assetNums.length > 0 ? "assetnum" : "location", "in", assetNums.length > 0 ? assetNums : locationNums);
          datasource.setQBE("siteid", "=", maximoAttributes.siteid);

          await datasource.searchQBE(undefined, true);
        } else {
          datasource.clearQBE();
          await datasource.searchQBE(undefined, true);
        }
      } else {
        const isMarkerLayer = layer.get('isMarkerLayer');
        const wasFeatureHighlighted = this.app.map.isFeatureHighlighed(feature);
        const singleFeature = isMarkerLayer ? feature : feature.get('features')[0];
        const maximoAttributes = singleFeature.get("maximoAttributes");

        const status = (!maximoAttributes.assetautolocate && maximoAttributes.locationautolocate)
          ? maximoAttributes.locationstatus_maxvalue
          : maximoAttributes.assetstatus_maxvalue;

        let style = this.app.map.getNewStyle(highlightSymbolCluster);
        const normalizedStatus = status?.toUpperCase();

        if (normalizedStatus === 'NOT READY') {
          style = this.app.map.getNewStyle(highlightedNotReady);
        } else if (['OPERATING', 'ACTIVE'].includes(normalizedStatus)) {
          style = this.app.map.getNewStyle(highlightedOperating);
        } else if (['DECOMMISSIONED', 'IMPORTED', 'LIMITEDUSE'].includes(normalizedStatus)) {
          style = this.app.map.getNewStyle(highlightedDecommissioned);
        }

        this.app.map.changeFeatureStyle(feature, style, { autoRestoreOnZoom: false, layer, autoHideOriginalStyle: false });
        if (feature.values_?.features?.length || isMarkerLayer) {
          if (wasFeatureHighlighted) {
            datasource.clearQBE();
            await datasource.searchQBE(undefined, true);
          } else if (this.page.state.showMapOverlay) {
            await datasource.load({ itemUrl: maximoAttributes.href });
          } else {
            datasource.setQBE(maximoAttributes.assetnum ? "assetnum" : "location", "=", maximoAttributes.assetnum || maximoAttributes.location);
            await datasource.searchQBE();
          }
        }
      }
    } else {
      this.page.state.showMapOverlay = 0;
      this.app?.map?.clearFeatureStyle();
      datasource.clearQBE();
      await datasource.searchQBE(undefined, true);
    }
  }


  // Assisted by watsonx Code Assistant 

  /**
   * Retrieves the multi-asset legends.
   * @returns {Object} An object containing the legends for different multi-asset statuses.
   * @returns {Object} The object has the following properties:
   * @returns {Object} - Cluster: The legend for the cluster status.
   * @returns {Object} - NOT_READY: The legend for the not ready status.
   * @returns {Object} - OPERATING: The legend for the operating status.
   * @returns {Object} - DECOMMISSIONED: The legend for the decommissioned status.
   */
  // This function will only execute if the map is initialized, so it is excluded from coverage/unit testing.
  //istanbul ignore next
  retrieveMultiAssetLegends() {
    return {
      Cluster: {
        label: this.app.getLocalizedLabel('cluster', 'Cluster'),
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzRDNEM0QyIvPg0KPC9zdmc+DQo=',
        scale: 1,
        offsetx: 12,
        offsety: 43,
        width: 33,
        height: 34,
        zIndex: 999
      },
      NOT_READY: {
        label: this.app.getLocalizedLabel('not_ready', 'Not Ready'),
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iI0YxQzIxQiIvPg0KPHBhdGggZD0iTTMyIDIzLjI1QzMwLjI2OTQgMjMuMjUgMjguNTc3NyAyMy43NjMyIDI3LjEzODggMjQuNzI0NkMyNS42OTk4IDI1LjY4NjEgMjQuNTc4MyAyNy4wNTI3IDIzLjkxNjEgMjguNjUxNUMyMy4yNTM4IDMwLjI1MDQgMjMuMDgwNSAzMi4wMDk3IDIzLjQxODEgMzMuNzA3QzIzLjc1NTggMzUuNDA0NCAyNC41ODkxIDM2Ljk2MzUgMjUuODEyOCAzOC4xODcyQzI3LjAzNjUgMzkuNDEwOSAyOC41OTU2IDQwLjI0NDMgMzAuMjkzIDQwLjU4MTlDMzEuOTkwMyA0MC45MTk1IDMzLjc0OTYgNDAuNzQ2MiAzNS4zNDg1IDQwLjA4MzlDMzYuOTQ3MyAzOS40MjE3IDM4LjMxMzkgMzguMzAwMiAzOS4yNzU0IDM2Ljg2MTJDNDAuMjM2OCAzNS40MjIzIDQwLjc1IDMzLjczMDYgNDAuNzUgMzJDNDAuNzQ3NCAyOS42ODAyIDM5LjgyNDcgMjcuNDU2MSAzOC4xODQzIDI1LjgxNTdDMzYuNTQzOSAyNC4xNzUzIDM0LjMxOTggMjMuMjUyNiAzMiAyMy4yNVpNMzIgMzkuNUMzMC4wMTA5IDM5LjUgMjguMTAzMiAzOC43MDk4IDI2LjY5NjcgMzcuMzAzM0MyNS4yOTAyIDM1Ljg5NjggMjQuNSAzMy45ODkxIDI0LjUgMzJDMjQuNSAzMC4wMTA5IDI1LjI5MDIgMjguMTAzMiAyNi42OTY3IDI2LjY5NjdDMjguMTAzMiAyNS4yOTAyIDMwLjAxMDkgMjQuNSAzMiAyNC41VjMyTDM3LjMwMDggMzcuMzAwOUMzNi42MDU2IDM3Ljk5ODUgMzUuNzc5NCAzOC41NTE5IDM0Ljg2OTggMzguOTI5M0MzMy45NjAxIDM5LjMwNjcgMzIuOTg0OCAzOS41MDA2IDMyIDM5LjVaIiBmaWxsPSJibGFjayIvPg0KPC9zdmc+DQo=',
        offsetx: 12,
        offsety: 43,
        width: 24,
        height: 50,
        scale: 1
      },
      OPERATING: {
        label: this.app.getLocalizedLabel('operating', 'Operating'),
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iIzE5ODAzOCIvPg0KPHBhdGggZD0iTTMwLjExNzIgMzdMMjQuNDkyMiAzMS4zNzVMMjUuMzc1OSAzMC40OTEyTDMwLjExNzIgMzUuMjMxOEwzOC42MDg0IDI2Ljc0MTJMMzkuNDkyMiAyNy42MjVMMzAuMTE3MiAzN1oiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==',
        offsetx: 12,
        offsety: 43,
        width: 24,
        height: 50,
        scale: 1
      },
      DECOMMISSIONED: {
        label: this.app.getLocalizedLabel('decommissioned', 'Decommissioned'),
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjAgMTZDMTcuNzkwOSAxNiAxNiAxNy43OTA5IDE2IDIwVjQ0QzE2IDQ2LjIwOTEgMTcuNzkwOSA0OCAyMCA0OEgyNkwzMiA1NEwzOCA0OEg0NEM0Ni4yMDkxIDQ4IDQ4IDQ2LjIwOTEgNDggNDRWMjBDNDggMTcuNzkwOSA0Ni4yMDkxIDE2IDQ0IDE2SDIwWiIgZmlsbD0iI0RBMUUyOCIvPg0KPHBhdGggZD0iTTMyIDIzLjI1QzI3LjEyNSAyMy4yNSAyMy4yNSAyNy4xMjUgMjMuMjUgMzJDMjMuMjUgMzYuODc1IDI3LjEyNSA0MC43NSAzMiA0MC43NUMzNi44NzUgNDAuNzUgNDAuNzUgMzYuODc1IDQwLjc1IDMyQzQwLjc1IDI3LjEyNSAzNi44NzUgMjMuMjUgMzIgMjMuMjVaTTMyIDM5LjVDMjcuODc1IDM5LjUgMjQuNSAzNi4xMjUgMjQuNSAzMkMyNC41IDI3Ljg3NSAyNy44NzUgMjQuNSAzMiAyNC41QzM2LjEyNSAyNC41IDM5LjUgMjcuODc1IDM5LjUgMzJDMzkuNSAzNi4xMjUgMzYuMTI1IDM5LjUgMzIgMzkuNVoiIGZpbGw9IndoaXRlIi8+DQo8cGF0aCBkPSJNMzUuMzc1IDM2LjM3NUwzMiAzM0wyOC42MjUgMzYuMzc1TDI3LjYyNSAzNS4zNzVMMzEgMzJMMjcuNjI1IDI4LjYyNUwyOC42MjUgMjcuNjI1TDMyIDMxTDM1LjM3NSAyNy42MjVMMzYuMzc1IDI4LjYyNUwzMyAzMkwzNi4zNzUgMzUuMzc1TDM1LjM3NSAzNi4zNzVaIiBmaWxsPSJ3aGl0ZSIvPg0KPC9zdmc+DQo=',
        offsetx: 12,
        offsety: 43,
        width: 24,
        height: 50,
        scale: 1
      },
    };
  }

  /**
   * Creates symbology for multi-asset features based on their status and geometry type.
   * @param {Object} params - Parameters including legends and features to generate symbology.
   * @returns {Object} The generated symbology for the given features.
   */
  // This function will only execute if the map is initialized, so it is excluded from coverage/unit testing.
  //istanbul ignore next
  createMultiAssetSymbology(params) {
    const { legends, features } = params;
    let legend = {};
    let geometryType;
    // Is a Cluster
    if (features.length > 1) {
      legend = legends['Cluster'];
      geometryType = 'point';
    } else {
      // Just a single feature
      const feature = features[0];
      const maximoAttributes = feature.get('maximoAttributes');
      const status = (!maximoAttributes.assetautolocate && maximoAttributes.locationautolocate)
        ? maximoAttributes.locationstatus_maxvalue
        : maximoAttributes.assetstatus_maxvalue;

      geometryType = feature.getGeometry().getType()?.toLowerCase();

      if (geometryType === 'point') {
        const normalizedStatus = status?.toUpperCase();
        if (normalizedStatus === 'NOT READY') {
          legend = legends['NOT_READY'];
        } else if (['OPERATING', 'ACTIVE'].includes(normalizedStatus)) {
          legend = legends['OPERATING'];
        } else if (['DECOMMISSIONED', 'IMPORTED', 'LIMITEDUSE'].includes(normalizedStatus)) {
          legend = legends['DECOMMISSIONED'];
        } else {
          legend = legends['Others'];
        }
      }
    }

    const symbologyProps = SYMBOLOGY_PROPS[geometryType];
    return symbologyProps ? { ...legend, ...symbologyProps, type: geometryType } : legend;
  }


}

export default MultiAssetLocCiController;
