import { BaseDialogMapController, LocationMapUtils } from "@maximo/map-component";
import WorkOrderCreateController from "./WorkOrderCreateController.js"
import WorkOrderEditController from "./WorkOrderEditController.js";

class LocationDialogMapController extends BaseDialogMapController{
    MAPDS = "maxlib_location_map_layer_datasource";
    LOOKUPDS = "locationLookupDS";


    onCloseLocationDialog() {
        this.onCloseDialog(this.MAPDS)
    }

    dialogInitialized(dialog) {
        super.dialogInitialized(dialog);
        this.page = this.app.currentPage;
    }

    /**
     * Selects a location from the map and sets it as the location of the specified datasource.
     * @param {string} dsName - The name of the datasource to update.
     * @returns {void}
     */
    async selectLocationFromMap(dsName) {
        const datasource = this.app.findDatasource(dsName);
        let lookupItem = null;
        /* istanbul ignore else */
        if(datasource) {    
            datasource.item[this.app.state.map.selectedDSAttribute] = "" + this.app.state.map.selectedItem.location;
            const lookupDS = this.app.findDatasource(this.LOOKUPDS);
            /* istanbul ignore else */
            if(lookupDS) {
                lookupDS.setQBE("location", "=", this.app.state.map.selectedItem.location);
                lookupDS.setQBE("siteid", "=", this.app.state.map.selectedItem.siteid);
                await lookupDS.searchQBE();
                /* istanbul ignore else */
                if(lookupDS.items.length === 1) {
                    lookupItem = lookupDS.items[0];
                } else {
                    this.app.log.w(this.TAG, "Did not find a single lookup item for location " + this.app.state.map.selectedItem.location + ". Selected map location should also be within lookup DS.");
                }
            } else {
                this.app.log.e(this.TAG, "Did not find look up datasource.");
                return;
            }
            /* istanbul ignore else */
            if(this.page) {
                let controller;
                /* istanbul ignore else */
                if(this.page.name === 'createwo') {
                    controller = this.page.findController(
                        (c) =>  {
                            /* istanbul ignore else */
                            if (c instanceof WorkOrderCreateController) {
                                return true;
                            }
                        }
                    );
                } else if(this.page.name === 'woedit') {
                    controller = this.page.findController(
                        (c) =>  {
                            /* istanbul ignore else */
                            if (c instanceof WorkOrderEditController) {
                                return true;
                            }
                        }
                    );
                }
                /* istanbul ignore else */
                if(controller && lookupItem) {
                    controller.chooseLocation(lookupItem);
                }
            }
        } else {
            this.app.log.e(this.TAG, 'Did not find location based datasource.');
        }
        this.dialog.closeDialog();
    }

    //Datasource Events
    /**
    * Datasource Event handler for the loading event.
    * @param {boolean} isLoading - Indicates if the datasource is currently loading.
    * @param {object} datasource - The datasource.
    * @returns {void}
    */
    loading(isLoading, datasource) {
        /* istanbul ignore else */
        if(datasource.name === this.MAPDS && isLoading === false && this.mapUtils) {
            this.app.state.map.isLoading = false;
            const selectedDatasource = this.app.findDatasource(this.app.state.map.selectedDS);
             /* istanbul ignore else */
            if(selectedDatasource) {
                let locationVal = selectedDatasource.item[this.app.state.map.selectedDSAttribute];
                /* istanbul ignore else */
                if(locationVal) {
                    //Finds the individual location record
                    const mapDS = this.app.findDatasource(this.MAPDS);
                    /* istanbul ignore else */
                    if(mapDS) {
                        let foundLocationRecord = mapDS.items.find((item) => {
                            return item.location === locationVal && item.siteid === selectedDatasource.item.siteid;
                        });
                        /* istanbul ignore else */
                        if(foundLocationRecord) {
                            this.app.state.map.selectedItem = foundLocationRecord;
                            let centerCoordinates = this.mapUtils.getCoordinatesFromItem(foundLocationRecord);
                            this.blockOnMapMove = true; // Surpresses Map Move handler when centerMap is called
                            this.mapUtils.centerMap(centerCoordinates[0], centerCoordinates[1]); 
                        } else {
                            this.app.log.w(this.TAG, "Did not find location record in map layer data source.  This could either be that it does not exist in map layer data source or the filter is wrong.")
                        }
                    } else {
                        this.app.log.e(this.TAG, 'Did not find the map layer data source.');
                        return;
                    }
                } else if(locationVal === undefined) {
                    this.app.log.w(this.TAG, 'Location Val is undefined.  Most likely because selected attribute ' + this.app.state.map.selectedDSAttribute +  " is not a property defined on datasource " + selectedDatasource.name);
                }
            } else {
                this.app.log.e(this.TAG, 'Did not find location based datasource.');
                return;
            }
            this.populateListByExtent();
        } 
    }

    /**
     * This function is called when a datasource selection is changed.
     * @param {Object} datasource - The datasource that was selected.
     * @param {Object} item - The item that was selected.
     * @param {boolean} selected - Whether the item was selected or deselected.
     * @param {number} selectionCount - The number of items that are currently selected.
     * @param {function} clearSelection - A function that can be called to clear the selection.
     */
    onDatasourceSelectionChanged({datasource, item, selected, selectionCount, clearSelection}) {
        /* istanbul ignore else */
        if(datasource.name === this.FILTERDS && this.mapUtils && selected) {
            this.app.state.map.selectedItem = item;
            /* istanbul ignore else */
            if(item) {
                let features = this.mapUtils.getFeaturesFromCurrentExtent();
                let foundUniquePin = null;
                let foundFeature = features.find((feature) => {
                    let maximoAttributes = this.mapUtils.getMaximoAttributesFromFeature(feature);
                    return maximoAttributes.locationsid === item.locationsid;
                });
                /* istanbul ignore else */
                if(foundFeature) {
                    let uniquePins = this.mapUtils.getMapInstance().maximoMap.getLayerByName(this.mapUtils.getSpatialLayerReferenceName()).getSource().getFeatures();
                    foundUniquePin = uniquePins.find((uniquePin) => {
                        let pinFeatures = uniquePin.get("features");
                        let foundPinFeature = pinFeatures.find((feature) => {
                            return feature === foundFeature;
                        });
                        return foundPinFeature;
                    });
                }
        
                /* istanbul ignore else */
                if(foundUniquePin) {
                    let featureObj = {};
                    featureObj.hasFeature = true;
                    featureObj.featuresAndLayers = [];
                    featureObj.featuresAndLayers.push({
                        feature: foundUniquePin,
                        layer: this.mapUtils.getMapInstance().maximoMap.getLayerByName(this.mapUtils.getSpatialLayerReferenceName())
                    });
                    this.mapUtils.highlightItem(featureObj);
                }
            }
        }
    }

    //Map Events

    /**
     * Callback function for when the map is created.
     * @param {map} map - The map object that is created.
     */
    onLocationMapCreate(map) {
        this.mapUtils = new LocationMapUtils(map);
        this.onMapCreate(map);
    }

    /**
     * Retrieve location legends.
     * @returns {Promise<Legend[]>} - A promise that resolves to an array of Legend objects.
     */
    retrieveLocationLegends() {
        return this.mapUtils.retrieveLegends();
    }
    /**
     * Creates a location symbology based on the provided features and legends.
     * @param {Object} params - The parameters for creating the location symbology.
     */
    createLocationSymbology(params) {
        return this.mapUtils.createSymbology(params.features, params.legends);
    }
    
    /**
     * Handle location map click event.
     * @param {object} item - The clicked item on the map.
     */    
    handleLocationMapClick(item) {
        this.handleItemMapClick(item);
    }
    /**
     * Handle map move action.
     * @param {Object} mapInfo - Map information object.
     * @returns {void}
     */
    handleLocationMapMove(mapInfo) {
        this.handleMapMove(mapInfo);
    }
}

export default LocationDialogMapController;