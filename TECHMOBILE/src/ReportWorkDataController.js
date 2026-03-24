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

class ReportWorkDataController {

  onDatasourceInitialized(ds, owner, app) {
    this.app = app;
  }
  
  /**
   * Function to get the itemnum and description for materials
   */
  computedItem(item) {
    return this.computedItemDescription(item.itemnum, item.description);
  }

  /**
   * Function to get the itemnum and description for tools
   */
  computedToolItem(item) {
    return item ? (item.itemnum && item.toolitem.description ? item.itemnum + ' ' + item.toolitem.description : item.itemnum || item.toolitem.description || null) : null;
  }

  /**
   * Common function to get the combination of itemnum and description
   */
  computedItemDescription(itemnum, description) {
    let computedItem = null;
    //istanbul ignore next
    if (itemnum && description) {
      computedItem = itemnum + ' ' + description;
    } else if (itemnum) {
      computedItem = itemnum;
    } else {
      computedItem = description;
    }
    return computedItem;
  }

  /*
   * Format start date without timezone 
   */
  formattedLaborStartDate(item) {
    return item.startdate && this.app.dataFormatter.dateToString(item.startdate, "MMMM DD, YYYY");
  }

  /*
   * Format finish date without timezone 
   */
  formattedLaborFinishDate(item) {
    return item.finishdate && this.app.dataFormatter.dateToString(item.finishdate, "MMMM DD, YYYY");
  }

  // Assisted by WCA@IBM
  // Latest GenAI contribution: ibm/granite-8b-code-instruct
  /**
   * Returns the formatted due date for a given item.
   * @param {Object} item - The item object containing the due date information.
   * @returns {string} - The formatted due date string in the format "MMMM DD, YYYY".
   */
  computedPluscDueDate(item) {
    return item.pluscduedate_np && this.app.dataFormatter.dateToString(item.pluscduedate_np, "MMMM DD, YYYY");
  }
}

export default ReportWorkDataController;
