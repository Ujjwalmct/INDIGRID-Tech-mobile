import appResolver from '../AppResolver'

// Assisted by watsonx Code Assistant 

/**
 * Loads json datasource based on the query & logic.
 *
 * @param {Object} query - An object containing the query parameters.
 * @param {string} query.datasourceLocator - The locator for locating datasource.
 * @param {string} query.schemaFrom.parent.params.href - The URL of the work order details page.
 *
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of multi-asset records.
 *
 **/
const loader = async (query) => {
    let ds = query.datasourceLocator("woMultiAssetLocationds");

    //istanbul ignore if
    if (!ds.items.length) {
        // Returns the app object, allowing access to app properties.
        const app = appResolver.getApplication();

        const woDetailResourceDS = app?.findPage('workOrderDetails')?.findDatasource('woDetailResource');
        await woDetailResourceDS?.load({ noCache: true, itemUrl: query.schemaFrom.parent.params.href });
        await app?.findDatasource("woMultiAssetLocationds").load();

        ds = query.datasourceLocator("woMultiAssetLocationds");
    }
    let items = [];

    //istanbul ignore next
    for (let i = 0; i < ds?.dataAdapter?.totalCount; i++) {
        if (!ds.isItemLoaded(i)) {
            await ds.load({ start: i });
        }
        items.push(ds.get(i));
    }
    return items;
};
export default loader;
