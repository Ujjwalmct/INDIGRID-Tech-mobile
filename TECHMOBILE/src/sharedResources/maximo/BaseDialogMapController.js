// istanbul ignore next
const TAG = "BaseDialogMapController";

class BaseDialogMapController {

    FILTERDS = "MapFilterJSON";
    FILTERDS_PAGESIZE = 20;

    //Dialog Events
    dialogInitialized(dialog) {
        this.dialog = dialog;
        this.app = dialog.getApplication();
        if (!this.app.state.map) {
            this.app.state.map = {};
            this.resetStates();
        }
    }

    onCloseDialog(mapDSName) {
        this.resetStates();
        
        //Release memory
        let mapDS = this._getDatasource(mapDSName);
        mapDS.reset(mapDS.options.query, false,
        {
            resetSchema: true,
            resetDataAdapter: true,
            resetItems: true
        });

        //Release memory
        let filterJSONDS = this._getDatasource(this.FILTERDS);
        filterJSONDS.reset(undefined, false, {
            resetSchema: true,
            resetDataAdapter: true,
            resetItems: true
        });

    }

    //Map Events

    /**
     * Callback function for when the map is created.
     */
    onMapCreate() {
        this.app.state.map.isLoading = true;
    }

    /**
     * Handle item map click event.
     * @param {object} item - The clicked item on the map.
     */    
    handleItemMapClick(item) {
        const mapUtils = this._getMapUtils();
        this.app.state.map.isClusterSelected = false;
        this.app.state.map.pinSelected = null;
        
        //Cluster Pin
        if(mapUtils.isValidFeature(item) && mapUtils.isCluster(item)) {
            mapUtils.highlightItem(item);
            this.app.state.map.isClusterSelected = true;
            this.app.state.map.pinSelected = item;
            this.app.state.map.selectedItem = null;
        }
        //Single Pin 
        else if (mapUtils.isValidFeature(item) && mapUtils.isIndividualPin(item)) {
            this.app.state.map.pinSelected = item;
            this.app.state.map.selectedItem = mapUtils.getMaximoAttributesFromItem(item);
        }
        //No Pin Selected 
        else {
            this.app.state.map.selectedItem = null;
            this.app.state.map.pinSelected = null;
        }
        //Selected a pin
        if(this.app.state.map.pinSelected) {
            //If selected pin is not a cluster than select the record in list
            if(!this.app.state.map.isClusterSelected) {
                this.populateListByExtent();
            } else {
                let features = mapUtils.getFeaturesFromItem(item);
                this.populateListByFeatures(features);
            }
        }
        else {
            this.handleMapMove(mapUtils.getMapExtent());
        }
    }
    /**
     * Handle map move action.
     * @param {Object} mapInfo - Map information object.
     * @returns {void}
     */
    handleMapMove(mapInfo) {

        if(this.blockOnMapMove){
            this.blockOnMapMove = false;
        } else {
            const mapUtils = this._getMapUtils();
            mapUtils.getMapInstance().clearFeatureStyle();
            this.app.state.map.selectedItem = null;
        }
        if (!mapInfo || !mapInfo.extent) {
            this.app.log.e(TAG, "No map info or extent to handle map move action.");
            return;
        }
        this.populateListByExtent();
    }

    //Helper functions

    /**
     * Resets the state of look up map
     * @returns {void}
     */
    resetStates() {
        this.app.state.map.isClusterSelected = false;
        this.app.state.map.pinSelected = null;
        this.app.state.map.selectedItem = null;
        this.app.state.map.selectedDS = null;
        this.app.state.map.isLoading = false;
        this.blockOnMapMove = false;
    }
    /**
     * Populate the list with data from the provided loader function.
     * @param {function} loader - The function that loads the data for the list.
     * @returns {void}
     */
    _populateList(loader) {

        const filterJSONDS = this._getDatasource(this.FILTERDS); 

        if(loader && typeof loader === 'function') {
            /* istanbul ignore else */
            if(filterJSONDS) {
                filterJSONDS.reset({
                    src: loader,
                    pageSize: this.FILTERDS_PAGESIZE
                });
            }
        }

        if(filterJSONDS && this.app.state.map.selectedItem) {
            filterJSONDS.setSelectedItem(this.app.state.map.selectedItem, true);
        }
    }
    /**
    * Populate the list by features.
    * @param {Array} features - The features to populate the list with.
    * @returns {void}
    */
    populateListByFeatures(features) {
        /* istanbul ignore next */
        let loader = ()=> {
            let arr = [];
            const mapUtils = this._getMapUtils();
            for(let feature of features) {
                let attributes = mapUtils.getMaximoAttributesFromFeature(feature);
                arr.push(attributes);
            }
            return arr;
        };

        this._populateList(loader);
    }
    /**
     * Populate the list by the features in the extent.
     * @param {function} loader - The function to load data.
     * @returns {void}
     */
    populateListByExtent() {
        /* istanbul ignore next */
        let loader = ()=> {
            let arr = [];
            const mapUtils = this._getMapUtils();
            let features = mapUtils.getFeaturesFromCurrentExtent();
            for(let feature of features) {
                let attributes = mapUtils.getMaximoAttributesFromFeature(feature);
                arr.push(attributes);
            }
            return arr;
        };
        
        this._populateList(loader); 
    }

    /**
     * Returns an instance of MapUtils.
     * @returns {MapUtils} An instance of MapUtils.
     * @throws {Error} If MapUtils is not defined.
     */
    _getMapUtils() {
        if (!this.mapUtils) {
            throw new Error("MapUtils is not defined");
        }
        return this.mapUtils;
    }

    /**
     * Wraps find datasource framework api.
     * @param {function} dsName - datasource name.
     * @returns {Object} - datasource found
     * @throws {Error} - If the datasource is not found.
     */
    _getDatasource(dsName) {
        const datasource = this.app.findDatasource(dsName);
        if (!datasource) {
            throw new Error(`Unable to find ${dsName} datasource`);
        }
        return datasource;
    }

}

export default BaseDialogMapController;