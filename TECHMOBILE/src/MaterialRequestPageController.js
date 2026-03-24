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

import { Device, log } from '@maximo/maximo-js-api';
import SynonymUtil from './utils/SynonymUtil';
import CommonUtil from './utils/CommonUtil'
const TAG = "MaterialRequestPageController";
class MaterialRequestPageController {
	
	/**
	 * Function to set flag for 'put-data-failed' event
	 */
	//istanbul ignore next
	onSaveDataFailed() {
		this.saveDataSuccessful = false;
	}

	pageInitialized(page, app) {
		this.app = app;
		this.page = page;

		// Open material request page from material request sliding drawer and set default state
		this.app.on('page-changing', (nextPage, prevPage) => {
			// istanbul ignore next
			if (prevPage.name === 'materialRequest') {
				if(!prevPage.state.disableMrRequestAction) {
					prevPage.state.useConfirmDialog = true;
				} else {
					prevPage.state.useConfirmDialog = false;
				}
			}
		});
	}
	/**
	 * callback function on dialog event
	 * mrRequest function is being called on this callback.
	 */
	async onCustomSaveTransition() {
		let evt	 = {
		page: this.page
		}
		await this.mrRequest(evt);
		return {saveDataSuccessful: this.saveDataSuccessful, callDefaultSave: false};
	}

	/*
	 * Send back to the previous screen.
	 */
	//istanbul ignore next
	goBack() {
		this.app.navigateBack();
	}
	
	pageResumed() {
		this.page.state.multipleStore = false;
		this.LoadPageResumed(); 
	}

	pagePaused() {
		this.page.datasources.mrLineDS.item['requireddate'] = '';
	}

	async LoadPageResumed() {
		CommonUtil.sharedData.approvalRequest = false;
		await this.loadMrLineDs(undefined);
		const woMaterialRequestResource = this.page.findDatasource('woMaterialRequestResource');
		await woMaterialRequestResource.load({ noCache: true, itemUrl: this.page.params.href });
		// istanbul ignore else
		if(!this.page.params.mr) {
			await this.addNewRecord();
		}
		this.page.state.loading = true;
		await this.loadRecords();
		if (this.app.state.incomingContext && this.app.state.incomingContext.page === 'materialRequest'){
			this.app.state.incomingContext = null;
			return;
		}
		if (this.page.params.mr) {
			const mrLineDS = this.page.findDatasource("mrLineDS");
			if(Device.get().isMaximoMobile) {
				await mrLineDS.forceReload();
			}
			await mrLineDS.initializeQbe();
			mrLineDS.setQBE('mrnum', '=', this.page.params.mr.mrnum);
			let response= await mrLineDS.searchQBE(undefined, true);
			mrLineDS.item.droppoint = response[0].droppoint;
			mrLineDS.item.priority = response[0].priority;
			mrLineDS.item.requireddate = response[0].requireddate;
			await this.loadMrLineDs(response[0].mrline);
		}
		if(this.page.params.mr && (this.page.params.mr.status === 'REJECT' || this.page.params.mr.status === 'DRAFT')){
			this.validateMrRequest({ page: this.page, app: this.app});
		}
	}

	/**
	 * Function to load MR lines
	 * @param {items} mrLine items
	 */
	async loadMrLineDs(items) {
		let mrLineItems = [];
		let mrFilterLineItems = [];
		//istanbul ignore else
		if (items && items.length) {
			mrLineItems = items;
		}
		let mrLineList = this.page.findDatasource("mrLineDsJson");
		mrLineList.clearState();
		mrLineItems.forEach((item, i) => {
			//istanbul ignore if
			if (item.mrlineid && !item.refwo) {
				mrFilterLineItems?.push(item);
				mrFilterLineItems[i].computedItemDescription =
					mrFilterLineItems[i].itemnum + " " + mrFilterLineItems[i].description;
			}
		});
		let newMrLineItems = { mrLineItems: mrFilterLineItems };
		await mrLineList.load({ noCache: true, src: newMrLineItems });
	}
	/**
	 * Function to view MR lines
	 *  @param {evt} mr lines item as event
	 */
	viewMrline(evt) {
		this.page.showDialog('AddItemDrawer');
		this.page.state.isItemSelected = true;
		let mrLineListDS = this.page.findDatasource('mrLineListDS');
		mrLineListDS.item["itemnum"] = evt.item.itemnum;
		mrLineListDS.item["description"] = evt.item.description;
		mrLineListDS.item["storeloc_desc"] = evt.item.storeloc_desc;
		mrLineListDS.item["storeloc"] = evt.item.storeloc;
		mrLineListDS.item["qty"] = evt.item.qty;
		mrLineListDS.item["vendor"] = evt.item.vendor;
		mrLineListDS.item["manufacturer"] = evt.item.manufacturer;
		mrLineListDS.item["mrlineid"] = evt.item.mrlineid;
		mrLineListDS.item["conditioncode"] = evt.item.conditioncode;
		mrLineListDS.item["conditioncode_desc"] = evt.item.conditioncode_desc;
		mrLineListDS.item.issueunit = evt.item.issueunit || evt.item.inventory?.[0]?.issueunit;

		if (this.page.params.mr) {
			this.page.state.editLookup = false;
			this.page.state.mrlineid = '';
		} else {
			this.page.state.editLookup = true;
			this.page.state.mrlineid = evt.item.mrlineid;
		}
	}

	async loadRecords() {
		let materialRequestSynonymDS = this.page.findDatasource('materialRequestSynonymDS');
		await materialRequestSynonymDS.initializeQbe();
		materialRequestSynonymDS.setQBE('domainid', 'in', ['ITEMTYPE', 'ITEMSTATUS']);
		materialRequestSynonymDS.setQBE('maxvalue', 'in', ['ITEM', 'ACTIVE', 'PLANNING', 'PENDOBS']);
		await materialRequestSynonymDS.searchQBE();
		const synonymData = [];
		// istanbul ignore next
		if (materialRequestSynonymDS && materialRequestSynonymDS.items.length > 0) {
			materialRequestSynonymDS.items.forEach((item) => {
				synonymData.push(item.value);
			});
		}
		this.page.state.synonymData = synonymData;
		let setDS = this.app.findDatasource('defaultSetDs');
		let itemListDS = await this.page.findDatasource('itemListDS');
		await itemListDS.reset(itemListDS.baseQuery);
		await itemListDS.initializeQbe();
		itemListDS.setQBE('itemtype', 'in', this.page.state.synonymData);
		// istanbul ignore else
		if(setDS && setDS.item['itemsetid']) {
			itemListDS.setQBE('itemsetid', '=', setDS.item['itemsetid']);
		}
		itemListDS.setQBE('status', 'in', this.page.state.synonymData);
		await itemListDS.searchQBE();
		await this.page.findDatasource('inventoryListDS')?.load();

		this.page.state.disableMrRequestAction = true;
		this.page.state.storeLocation = '';
		this.page.state.description = '';
		this.page.state.mrLineList = "";
		this.page.state.isMrLineAdded = false;
		this.page.state.useConfirmDialog = false;
		this.page.state.mrLineLists= [];
		// istanbul ignore next
		if (this.app.state.incomingContext && this.app.state.incomingContext.itemnum && this.app.state.incomingContext.itemsetid && this.app.state.incomingContext.page === 'materialRequest' ) {
			await this.setIncomingContext();
		}
		this.page.state.loading = false;
	}

	/**
	 * Function to open the material list drawer
	 */
	async openMaterialListDrawer(evt) {
		let mrLineListDS = this.page.findDatasource('mrLineListDS');
		mrLineListDS.item['description'] = '';
		mrLineListDS.item['itemnum'] = '';
		mrLineListDS.item['storeloc'] = '';
		mrLineListDS.item['storeloc_desc'] = '';
		mrLineListDS.item['transtype'] = '';
		mrLineListDS.item['qty'] = 1;
		mrLineListDS.item['vendor'] = '';
		mrLineListDS.item['conditioncode'] = '';
		mrLineListDS.item["conditioncode_desc"] = "";
		mrLineListDS.item["mrlineid"] = new Date().getTime();
		this.page.state.hasConditionCode = false;
		this.page.state.saveAction = false;
		this.page.state.disableAction = false;
		this.page.state.isItemSelected = false;
		this.page.showDialog('AddItemDrawer');
		this.page.state.editLookup = false;
	}

	/**
	 * Function to open the item lookup
	 */
	async openItemListLookup(evt) {
		let itemsDS = await evt.page.findDatasource('itemListDS');
		let selectedItem;
		// istanbul ignore next
		itemsDS.items.forEach((item) => {
			// istanbul ignore else
			if(item.itemnum === evt.page.datasources.mrLineListDS.item.itemnum) {
				selectedItem = item;
			}
		});
		// istanbul ignore next
		if (selectedItem) {
			itemsDS.setSelectedItem(selectedItem, true);
		} else {
			itemsDS.clearSelections();
		}
		evt.page.showDialog('itemsListLookup');
	}

	/**
	 * Function to open the store location lookup.
	 */
	async openStoreRoomListLookup(evt) {
		let itemsDS = await evt.page.findDatasource('locationListDS');
		let selectedItem;
		// istanbul ignore next
		itemsDS.items.forEach((item) => {
			// istanbul ignore else
			if(item.location === evt.page.datasources.mrLineListDS.item.storeloc) {
				selectedItem = item;
			}
		});
		// istanbul ignore next
		if (selectedItem) {
			itemsDS.setSelectedItem(selectedItem, true);
		} else {
			itemsDS.clearSelections();
		}
		evt.page.showDialog('storeRoomListLookup');
	}

	/**
	 * Function to set the location when item selected
	 */
	async setStoreRoom() {
		let inventoryDS = await this.page.findDatasource('inventoryListDS');
		await inventoryDS.initializeQbe();
		inventoryDS.setQBE('itemnum', '=', this.page.state.itemnum);
		inventoryDS.setQBE('status', 'in', this.page.state.synonymData);
		await inventoryDS.searchQBE();
		const inventoryList = [];

		inventoryDS.items.forEach((item) => {
			inventoryList.push(item.location);
		});
		this.page.datasources.mrLineListDS.item['storeloc_desc'] = '';
		this.page.datasources.mrLineListDS.item['storeloc'] = '';
		// istanbul ignore next
		if (inventoryList.length > 0) {
			let locationDS = await this.page.findDatasource('locationListDS');
			await locationDS.initializeQbe();
			locationDS.setQBE('location', 'in', inventoryList);
			let storeRoom = await locationDS.searchQBE();
			this.storeLocation(storeRoom);
		} else {
			this.page.datasources.mrLineListDS.item['storeloc'] = this.app.client.userInfo.defaultStoreroom;
		}
	}
	/**
	 * Function to set storeroom when it has single record;
	 * OR open store room lookup when it has multiple record;
	 */
	// istanbul ignore next
	async storeLocation(storeRoom) {
		if (storeRoom?.length === 1) {
			this.chooseStoreRoom(storeRoom[0]);
			this.page.state.multipleStore = false;
		} else {
			this.openStoreRoomListLookup(this);
			this.page.state.multipleStore = true;
		}
	}
	/**
	 * Function to choose the item from lookup
	 */
	async chooseItem(evt) {
		// istanbul ignore else
		if (evt) {
			// istanbul ignore else
			if (!this.page.state.mrLineList) {
				this.page.state.mrLineList = {};
			}
			this.page.datasources.mrLineListDS.item['itemnum'] = evt.itemnum;
			this.page.datasources.mrLineListDS.item['description'] = evt.description;
			this.page.datasources.mrLineListDS.item['manufacturer'] = evt.asset.manufacturer;
			this.page.datasources.mrLineListDS.item['vendor'] = evt.asset.vendor;
			this.page.state.mrLineList['issueunit'] = evt.issueunit;
			this.page.state.itemnum = evt.itemnum;
			this.page.state.itemsetid = evt.itemsetid;
			// istanbul ignore if
			if(!this.page.state.mrLineList){
				this.page.state.mrLineList={}
			}
			this.page.state.mrLineList['description'] = evt.description;
			this.page.state.mrLineList['issueunit'] = evt.issueunit;
			this.page.state.mrLineList['manufacturer'] = evt.asset.manufacturer;
			this.page.state.mrLineList['vendor'] = evt.asset.vendor;
			this.page.datasources.mrLineListDS.item['mrlineid'] = evt.mrlineid || new Date().getTime();
			this.page.state.isItemSelected = true;
			await this.setStoreRoom();
			this.validateMrLines(this);
			await this.loadConditionCodeDS(evt.itemcondition);
		}
	}

	/**
	 * Function to load MR lines
	 * @param {items} condition code items
	 */
	async loadConditionCodeDS(items) {
		let conditionCodeItems = [];
		this.page.state.hasConditionCode = false;
		this.page.state.mrLineList["conditioncode"] ='';
		this.page.state.mrLineList["conditioncode_desc"] = '';
		/* istanbul ignore else */
		if (items && items.length) {
			this.page.state.hasConditionCode = true;
			this.page.state.disableAction = false;
			conditionCodeItems = items;
		}
		let itemConditionDS = this.page.findDatasource("itemConditionDS");
		itemConditionDS.clearState();
		let conditionCode = { conditionCodeItems: conditionCodeItems };
		await itemConditionDS.load({ noCache: false, src: conditionCode });   
	}
	/**
	 * Function to open condition code from lookup
	 */
	openConditionCodeLookup(evt){
		evt.page.showDialog('conditionCodeLookup');
	}

	/**
	 * Function to select the condition code from lookup
	 */
	selectConditionCode(evt){
		/* istanbul ignore else */
		if (evt) {
			this.page.state.disableAction = true;
			this.page.datasources.mrLineListDS.item['conditioncode'] = evt.conditioncode;
			this.page.datasources.mrLineListDS.item["conditioncode_desc"] = evt.description;
			this.page.state.mrLineList["conditioncode"] = evt.conditioncode;
			this.page.state.mrLineList["conditioncode_desc"] = evt.description;
		}
	}
	/**
	 * Function to choose the store room from lookup
	 */
	async chooseStoreRoom(evt) {
		// istanbul ignore else
		if (evt) {
			this.page.datasources.mrLineListDS.item['storeloc_desc'] = evt.description;
			this.page.datasources.mrLineListDS.item['storeloc'] = evt.location;
			this.page.state.storeloc = evt.location;
			this.page.state.mrLineList['storeLocation'] = evt.location;
			this.page.state.mrLineList['storeloc_desc'] = evt.description;
			this.setOrderUnit();
			// istanbul ignore next
			this.validateMrLines(this);
		}
	}

	/**
	 * Function to choose the store room from lookup
	 */
	async setOrderUnit() {
		let inventoryDS = await this.page.findDatasource('inventoryListDS');
		await inventoryDS.initializeQbe();
		inventoryDS.setQBE('itemnum', '=', this.page.state.itemnum);
		inventoryDS.setQBE('location', '=', this.page.state.storeloc);
		inventoryDS.setQBE('itemsetid', '=', this.page.state.itemsetid);
		inventoryDS.setQBE('siteid', '=', this.app.client.userInfo.defaultSite);
		let inventoryData = await inventoryDS.searchQBE();
		// istanbul ignore next
		if (inventoryData.length > 0) {
			let issueunit = inventoryData[0].issueunit;
			this.page.datasources.mrLineListDS.item['issueunit'] = issueunit;
			this.page.state.mrLineList['issueunit'] = issueunit;
		}
	}

	/**
	 * Function to to validate the form
	 * @param {evt} mr line ds as event
	 */
	async validateMrLines(evt) {
		let itemnum = evt.page.datasources.mrLineListDS.item['itemnum'];
		let storeloc = evt.page.datasources.mrLineListDS.item['storeloc'];
		let quantity = evt.page.datasources.mrLineListDS.item['qty'];
		// istanbul ignore else
		if(this.page.state.mrLineList) {
			this.page.state.mrLineList['quantity'] = quantity;
		}
		
		// istanbul ignore next
		if (itemnum && storeloc && quantity > 0) {
			evt.page.state.disableAction = true;
		} else {
			evt.page.state.disableAction = false;
		}
	}

	/**
	 * Handles the request for a material line and updates the page state accordingly.
	 * @param {Object} evt - The event object containing page information
	 * @returns {Promise<void>}
	 */
	async requestMaterialLine(evt) {
		const mrLineListDS = this.page.findDatasource('mrLineListDS');
		const isEditMode = this.page.state.editLookup && this.page.state.mrlineid;
		const hasDataSourceItem = mrLineListDS?.item && Object.keys(mrLineListDS.item).length > 0;
		const useDataSourceItem = isEditMode && hasDataSourceItem;
		this.page.state.loadingMaterialRequest = false;
		// Apply the mapped values to state
		this.page.state.description = useDataSourceItem
			? `${mrLineListDS.item.itemnum} ${mrLineListDS.item.description}`
			: `${this.page.state.itemnum} ${this.page.state.mrLineList.description}`;
		this.page.state.storeloc_desc = useDataSourceItem
			? mrLineListDS.item.storeloc_desc
			: this.page.state.mrLineList.storeloc_desc;
		this.page.state.storeLocation = useDataSourceItem
			? mrLineListDS.item.storeloc
			: this.page.state.mrLineList.storeLocation;
		this.page.state.mrLineList.quantity = mrLineListDS.item.qty;

		// Remove existing line item if in edit mode
		if (this.page.state.editLookup && this.page.state.mrLineLists.length) {
			const index = this.page.state.mrLineLists.findIndex(item => item.mrlineid === this.page.state.mrlineid);
			if (index !== -1) {
				this.page.state.mrLineLists.splice(index, 1);
			}
		}

		// Define source objects
		const dsSource = mrLineListDS.item;
		const stateSource = {
			...this.page.state.mrLineList,
			itemnum: this.page.state.itemnum,
			// Map any properties with different names
			qty: this.page.state.mrLineList.quantity,
			storeloc: this.page.state.mrLineList.storeLocation,
		};

		// Create the newLineItem by selecting the appropriate source and adding the common property
		const newLineItem = {
			...(useDataSourceItem ? dsSource : stateSource),
			mrlineid: new Date().getTime(),
		};

		// Add the new line item
		this.page.state.mrLineLists.push(newLineItem);

		// Close dialog and update state
		evt.page.findDialog('AddItemDrawer').closeDialog();
		await this.loadMrLineDs(this.page.state.mrLineLists);
		this.page.state.isMrLineAdded = true;
		this.validateMrRequest(this);
	}

	/**
	 * function on value changed event
	 */
	// istanbul ignore next
	onValueChanged(changeObj) {
		let field = changeObj.field;
		if (field === 'requireddate' || field === 'priority' || field === 'qty') {
			this.validateMrRequest(this);
			this.validateMrLines(this);
		}
	}
	/**
	 * Function to to validate the form
	 */
	async validateMrRequest(evt) {
		let requireDate = evt.page.datasources.mrLineDS.item['requireddate'];
		let priority = evt.page.datasources.mrLineDS.item["priority"];
		let hasMRLine = this.page.state.isMrLineAdded;

		if((evt.page.datasources.mrLineDS?.item["status"] === 'DRAFT' || evt.page.datasources.mrLineDS?.item["status"] === 'REJECT') &&
		evt.page.datasources.mrLineDS?.item["mrline"]?.length > 0){
			hasMRLine = true;
		}
		// istanbul ignore next
		if (requireDate && hasMRLine && priority > 0) {
			evt.page.state.disableMrRequestAction = false;
		} else {
			evt.page.state.disableMrRequestAction = true;
		}
		// istanbul ignore next
		if(!this.page.state.disableMrRequestAction && (evt.page.datasources.mrLineDS.item["status"] !== 'DRAFT' || evt.page.datasources.mrLineDS.item["status"] !== 'REJECT')) {
			this.page.state.useConfirmDialog = true;
		} else {
			this.page.state.useConfirmDialog = false;
		}
	}
	/**
	 * Apply schema to child related datasource.
	 * 
	 * @param {*} childDatasource - Child Datasource referenced via a relationship.
	 */
	/* istanbul ignore next */
	updateSchema(childDatasource) {
		if (childDatasource && childDatasource.dependsOn && childDatasource.options && childDatasource.options.query && childDatasource.options.query.relationship) {
		childDatasource.schema = childDatasource.dependsOn.schema.properties[Object.entries(childDatasource.dependsOn.schema.properties)
			.filter(
			item =>
				item[1].relation &&
				item[1].relation.toUpperCase() ===
				childDatasource.options.query.relationship.toUpperCase()
			)
			.map(obj => obj[0])[0]].items;
		}
	}

	/**
	 * Function to add new record
	 */
	// istanbul ignore next
	async addNewRecord() {
		let mrRequestDS = this.page.findDatasource('mrLineDS');
		let mrStatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'MRSTATUS', 'MRSTATUS|DRAFT');
		let newMaterialReq = await mrRequestDS.addNew();
		let device = Device.get();
		if (device.isMaximoMobile) {
			this.updateSchema(mrRequestDS);
		}
		mrRequestDS.item['mrnum'] = newMaterialReq.mrnum;
		mrRequestDS.item['shipto'] = newMaterialReq.shipto;
		mrRequestDS.item['priority'] = newMaterialReq.priority || this.page.state.mrPriority;
		mrRequestDS.item['droppoint'] = newMaterialReq.droppoint;
		mrRequestDS.item['requireddate'] = newMaterialReq.requireddate ?? '';
		mrRequestDS.item['status'] = newMaterialReq.status || mrStatus.value;
		mrRequestDS.item['status_description'] = newMaterialReq.status_description || mrStatus.description;
		mrRequestDS.item['statusdate'] = newMaterialReq.statusdate || this.app.dataFormatter.convertDatetoISO(new Date());
		mrRequestDS.item['orgid'] = newMaterialReq.orgid || this.app.client.userInfo.insertOrg;
	}

    /**
    * Opens the dialog that allows the user to reject the material request.
	*/
	async openRequestRejectDialog(){
		this.page.showDialog("rejectRequestConfrmDialog");
	}

    /**
    * Close the dialog.
    */
	async cancelMaterialRequest(){
		this.page.findDialog("rejectRequestConfrmDialog").closeDialog();
	}

	/**
	 * Function to create MR request
	 */
	async mrRequest(evt) {
		this.page.state.loadDraft = evt.action === 'DRAFT';
		let mrRequestDS = this.page.findDatasource('mrLineDS');
		let woMaterialRequestResource = this.page.findDatasource('woMaterialRequestResource');
		// istanbul ignore else
		if (Device.get().isMaximoMobile) {
			await woMaterialRequestResource?.load();
		}
		this.page.state.useConfirmDialog = false;
		let mrLineLists = [];
		// istanbul ignore else
		if(this.page.state.mrLineLists.length) {
			this.page.state.mrLineLists.forEach((item) => {
				mrLineLists.push(
					{
						mrnum: mrRequestDS.item['mrnum'],
						itemnum: item.itemnum,
						qty: item.qty,
						issueunit : item.issueunit,
						manufacturer: item.manufacturer,
						vendor: item.vendor,
						description: item.description,
						mrlineid : item.mrlineid,
						storeloc_desc : item.storeloc_desc,
						conditioncode : item.conditioncode
					}
				);
			});
		}
		
		let actionstatus;
		//istanbul ignore else
		if(evt.action === 'WAPPR' || evt.action === 'APPR'){
			actionstatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'MRSTATUS', 'MRSTATUS|WAPPR');
		}
		else if(evt.action === 'REJECT'){
			actionstatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'MRSTATUS', 'MRSTATUS|REJECT');
		}
		else{
			actionstatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'MRSTATUS', 'MRSTATUS|DRAFT');
		}

		const mr = {
			mrnum: mrRequestDS.item['mrnum'],
			shipto: mrRequestDS.item['shipto'],
			priority: mrRequestDS.item['priority'],
			droppoint: mrRequestDS.item['droppoint'],
			requireddate: mrRequestDS.item['requireddate'],
			mrdate: mrRequestDS.item['mrdate'] || this.app.dataFormatter.currentUserDateTime(),
			mrline: mrLineLists,
			wonum: woMaterialRequestResource.item.wonum,
			anywhererefid: mrRequestDS.item['anywhererefid']
		};
		//istanbul ignore if
		if (evt.action !== 'APPR') {
			mr.status = actionstatus.value;
			mr.status_description = actionstatus.description
		}
		//istanbul ignore next
		if (evt.action === 'APPR') {
			CommonUtil.sharedData.approvalRequest = true;
		}
		let option = {
			responseProperties: 'mrnum, anywhererefid, status, mrline, requireddate, shipto, priority, droppoint, status_description',
		};
		const onDataFailedHandler = this.onSaveDataFailed.bind(this);
		let response;
		try {
			evt.page.state.loadingMaterialRequest = true;
			evt.page.state.disableMrRequestAction = true;
			this.saveDataSuccessful = true;
			mrRequestDS.on('put-data-failed', onDataFailedHandler);
			response = await mrRequestDS.put(mr, option);
			await mrRequestDS.forceReload();
			//istanbul ignore next
			if(this.saveDataSuccessful && evt.action === 'REJECT'){
				this.app.toast(this.app.getLocalizedLabel(
					'request_reject_success',
					`Material request rejected successfully.`
				  ), 'success');
			}
			}
			catch(error){
				//istanbul ignore next
				if(evt.action === 'REJECT'){
				this.app.toast(
					this.app.getLocalizedLabel(
					'request_reject_error',
					`Unable to reject material request`
					),
					'error'
				);
				}  
			}
		finally {
			// istanbul ignore if
			if (evt.action === 'APPR' && this.saveDataSuccessful && this.app.state.networkConnected) {
				const references = Device.get().isMaximoMobile ? { anywhererefid: response.anywhererefid } : { href: response.href, localref: response.localref };
				this.approveMaterialRequest(evt, mr, references);
			}
			else{
				this.page.state.useConfirmDialog = false;
				evt.page.state.loadingMaterialRequest = false;
				let wodtlPage = this.app.findPage('workOrderDetails');
				// istanbul ignore else
				if (wodtlPage) {
					this.app.setCurrentPage({
						name: 'workOrderDetails',
						resetScroll: true,
						params: {
							wonum: woMaterialRequestResource.item.wonum,
							siteid: woMaterialRequestResource.item.siteid,
							href: woMaterialRequestResource.item.href,
						},
					});
				}
				// istanbul ignore next
				if (this.saveDataSuccessful) {
					wodtlPage.showDialog('slidingwodetailsmaterials');
				}
				mrRequestDS.off('put-data-failed', onDataFailedHandler);
			}
		}
	}
	/**
	 * Approves a Material Request.
	 * @param {Event} event - The event object.
	 * @param {Object} materialRequest - The Material Request object.
	 * @returns {Promise<void>} A promise that resolves when the Material Request is approved.
	 */
	async approveMaterialRequest(event, materialRequest, references = {}) {
		const { anywhererefid, href, localref } = references;
		this.page.state.loadDraft = event.action === 'DRAFT';
		this.page.state.useConfirmDialog = false;

		const mrRequestDS = this.page.datasources['mrLineDS'];
		const materialRequestResource = this.page.findDatasource('woMaterialRequestResource');

		// Using forceSync to ensure href and localref are retrieved from the previous transaction
		// This is necessary for making the changeStatus call via invokeAction.
		// forceSync will only be triggered under the condition where sharedData.approvalRequest is present
		//istanbul ignore next
		if (CommonUtil.sharedData.approvalRequest) {
			await materialRequestResource.forceSync();
		}
		if (Device.get().isMaximoMobile && !href && !localref) {
			const targetItemIndex = materialRequestResource?.items[0]?.mr?.findIndex(
				item => item.mrnum === materialRequest.mrnum
			);
			references.href = materialRequestResource?.items[0]?.mr?.[targetItemIndex]?.href;
			references.localref = materialRequestResource?.items[0]?.mr?.[targetItemIndex]?.localref;
		}

		const approvalStatus = await SynonymUtil.getSynonym(this.app.findDatasource('synonymdomainData'), 'MRSTATUS', 'MRSTATUS|APPR');
		const onDataFailedHandler = this.onSaveDataFailed.bind(this);
		let mrLineLists = [];
		try {
			// Build the approval options payload
			const approvalOptions = {
				parameters: {
					mrnum: materialRequest.mrnum,
					anywhererefid: anywhererefid,
					wonum: materialRequestResource.item.wonum,
					lean: 1,
					status_description: approvalStatus.description,
					status: approvalStatus.value,
					mrline: mrLineLists,
					shipto: materialRequest.shipto,
					requireddate: materialRequest.requireddate,
					mrdate: materialRequest.mrdate,
					href: references.href,
					localref: references.localref
				},
				headers: {
					'x-method-override': 'PATCH',
				},
				responseProperties: 'mrnum, anywhererefid, status',
				localPayload: {
					href: materialRequestResource.item.href,
					mr: {
						anywhererefid: anywhererefid,
						href: references.href,
						localref: references.localref,
						mrnum: materialRequest.mrnum,
						status_description: approvalStatus.description,
						status: approvalStatus.value,
						mrline: mrLineLists,
						wonum: materialRequestResource.item.wonum,
						shipto: materialRequest.shipto,
					},
				},
				query: { interactive: false, ignorecollectionref: 1 },
				esigCheck: 1,
				objectStructure: 'mxapiwodetail',
				itemUrl: references.localref,
				selectedRecordHref: references.localref
			};
			event.page.state.loadingMaterialRequest = true;
			event.page.state.disableMrRequestAction = true;
			this.saveDataSuccessful = true;
			mrRequestDS.on('put-data-failed', onDataFailedHandler);
			await mrRequestDS.invokeAction('changeStatus', approvalOptions);
			await mrRequestDS.forceReload();
		} catch (error) {
			log.t(TAG, error);
		} finally {
			event.page.state.loadingMaterialRequest = false;
			let wodtlPage = this.app.findPage('workOrderDetails');
			//istanbul ignore else
			if (wodtlPage) {
				this.app.setCurrentPage({
					name: 'workOrderDetails',
					resetScroll: true,
					params: {
						wonum: materialRequestResource?.item.wonum,
						siteid: materialRequestResource?.item.siteid,
						href: materialRequestResource?.item.href,
					},
				});
			}
			//istanbul ignore else
			if (this.saveDataSuccessful) {
				wodtlPage.showDialog('slidingwodetailsmaterials');
			}
			mrRequestDS.off('put-data-failed', onDataFailedHandler);
		}
	}

	/**
	 *  function to search itemListDS with incoming context of itemId
	 */
	async setIncomingContext() {
		let itemListDS;
		try {
			const mrLineDSItem=JSON.parse(sessionStorage.getItem(
				"mrLineDS_item"
			));
			Object.entries(mrLineDSItem).forEach(
				([key, value]) => {
					if(["droppoint","priority","requireddate"].includes(key)){
						this.page.datasources.mrLineDS.item[key] = value;
					}
				}
			);
			sessionStorage.removeItem("mrLineDS_item");
			const mrLineDsJsonItems=JSON.parse(sessionStorage.getItem(
				"mrLineDsJson_items"
			));
			await this.loadMrLineDs(mrLineDsJsonItems);
			sessionStorage.removeItem("mrLineDsJson_items");
			this.page.state.mrLineLists=JSON.parse(sessionStorage.getItem(
				"mrLineLists"
			));
			sessionStorage.removeItem("mrLineLists");

			const context = this.app.state.incomingContext
			itemListDS = this.page.findDatasource('itemListDS');
			await itemListDS.initializeQbe();
			itemListDS.setQBE('itemsetid', context.itemsetid);
			itemListDS.setQBE('itemnum', context.itemnum);
			const itemData = await itemListDS.searchQBE();

			await this.openMaterialListDrawer();

			// istanbul ignore next 
			if (itemData && itemData.length > 0) {
				await this.chooseItem(itemData[0]);
				this.page.state.disableAction = true;
			}

			const mrLineListDSItem=JSON.parse(sessionStorage.getItem(
				"mrLineListDS_item"
			));
			Object.entries(mrLineListDSItem).forEach(
				([key, value]) => {
					if(["qty"].includes(key)){
						this.page.datasources.mrLineListDS.item[key] = value;
					}
				}
			);
			sessionStorage.removeItem("mrLineListDS_item");
		} finally {
			// istanbul ignore next 
			if(itemListDS && itemListDS.lastQuery.qbe && JSON.stringify(itemListDS.lastQuery.qbe) !== "{}") {
				itemListDS.clearQBE();
				await itemListDS.searchQBE(undefined, true);
			}
		}
	}

	/**
	*  function to delete requested MR.
	*/
	async deleteMrRequest(){
		let woDetailsPage = this.app.findPage("workOrderDetails");
		const mrDS = woDetailsPage.findDatasource("mrDS");
		let mrStatus = await SynonymUtil.getDefaultExternalSynonymValue(this.app.findDatasource("synonymdomainData"), "MRSTATUS", "CAN");
		let mr = {
			mrnum: this.page.params.mr.mrnum,
			status: mrStatus
		};
		let option = {
			responseProperties: 'mrnum, status, anywhererefid',
			localPayload: {
				mrnum: this.page.params.mr.mrnum,
				status: mrStatus,
				anywhererefid : mrDS.item.anywhererefid
			}
		}
		try {
			this.page.state.loadingDel = true;
			await mrDS.update(mr, option);
			await mrDS.forceReload();
			
			// istanbul ignore else
			if (woDetailsPage){
				this.app.navigateBack();
				woDetailsPage.showDialog("slidingwodetailsmaterials");
			}
		} finally {
			this.page.state.loadingDel = false;
		}
	}

	/**
	 * Function to delete MR lines
	 * @param {evt} page and app as event
	 */
	async deleteMaterialLine(evt) {
		// istanbul ignore else 
		if(this.page.state.mrLineLists.length) {
			let id = this.page.state.mrlineid;
			for(let i = 0; i < this.page.state.mrLineLists.length; i++) {
				// istanbul ignore else
				if(this.page.state.mrLineLists[i].mrlineid === id) {
						this.page.state.mrLineLists.splice(i, 1);
						break;
				}
			}
		}
		// istanbul ignore else
		if(!this.page.state.mrLineLists.length) {
			this.page.state.isMrLineAdded = false;
		}

		evt.page.findDialog('AddItemDrawer').closeDialog();
		await this.loadMrLineDs(this.page.state.mrLineLists);
		this.validateMrRequest(this);
	}

	// Assisted by watsonx Code Assistant 
	/**
	 * Close the drawer and handle any necessary actions.
	 * @param {boolean} disableAction - A flag indicating whether dialog should be shown or not
	 * @returns {void}
	 */
	async onCloseDrawer() {
		if (this.page.state.disableAction) {
			const materialsDialogConfig = {
				title: {
					label: 'messages_header_save_changes',
					value: this.app.getLocalizedLabel("messages_header_save_changes", "Save or discard changes?")
				},
				confirmDialogLabel1: {
					label: 'dialogcontroller_itemsChangedNotSaved',
					value: this.app.getLocalizedLabel("dialogcontroller_itemsChangedNotSaved", "To leave this page, you must first discard or save your changes.")
				},
				confirmDialogAcceptButton: {
					label: 'messages_save_button',
					value: this.app.getLocalizedLabel("messages_save_button", "Save"),
				},
				confirmDialogRejectButton: {
					label: 'messages_discard_button',
					value: this.app.getLocalizedLabel("messages_discard_button", "Discard"),
				},
				confirmDialogAcceptKind: 'primary',
				// save button is primary button here
				onPrimaryClick: async () => {
					this.requestMaterialLine();
				},
			}
			CommonUtil.getConfirmDialogLabel(this.app, materialsDialogConfig);
			await this.app.showDialog('confirmDialog');
		}
	}

}

export default MaterialRequestPageController;
