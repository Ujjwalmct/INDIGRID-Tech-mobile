/**
 * @module LaborJsonDsLoader
 * @description A utility module that provides functionality to load and filter labor data from a datasource.
 * This loader iterates through all labor items in the datasource, ensures they are loaded,
 * and filters them based on the presence of a laborcraftrate property.
 */

/**
 * Asynchronously loads and filters labor data from the specified datasource
 * 
 * @async
 * @function loader
 * @param {Object} query - The query object containing the datasource locator function
 * @param {Function} query.datasourceLocator - Function to locate a datasource by name
 * @returns {Promise<Array>} A promise that resolves to an array of labor items that have a laborcraftrate property
 * 
 * @example
 * // Example usage:
 * const laborItems = await loader({
 *   datasourceLocator: (name) => app.findDatasource(name)
 * });
 */
const loader = async (query) => {
    const laborDs = query.datasourceLocator("laborDs");
    let items = [];

    for (let i = 0; i < laborDs?.dataAdapter?.totalCount; i++) {
        if (!laborDs.isItemLoaded(i)) {
            await laborDs.load({ start: i });
        }
        if (laborDs.get(i).laborcraftrate) {
            items.push(laborDs.get(i));
        }
    }
    return items;
};

export default loader;

// Made with Bob
