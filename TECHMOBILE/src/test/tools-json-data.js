/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

let tools = {
    member : [
        {
            itemid: 280,
            itemnum: "LATHE",
            tooltransid :22,
            description: "MACHINE TOOL LATHE",
            href: "oslc/os/mxapitoolitem/_TEFUSEUvU0VUMQ--",
            _rowstamp: "94496",
            item_itemnum: "LATHE",
            item_description: "MACHINE TOOL LATHE",
        },
        {
            itemid: 282,
            itemnum: "TORCH",
            tooltransid :45,
            description: "OXYGEN ACETYLENE CUTTING UNITS",
            href: "oslc/os/mxapitoolitem/_VE9SQ0gvU0VUMQ--",
            _rowstamp: "94666",
            item_itemnum: "TORCH",
            item_description: "OXYGEN ACETYLENE CUTTING UNITS",
        },
        {
            description: "HELIARC PURGE WELDING UNIT",
            href: "oslc/os/mxapitoolitem/_UFVSR0UvU0VUMQ--",
            itemid: 281,
            tooltransid :77,
            itemnum: "PURGE",
            _rowstamp: "94608",
            rotating: true,
            item_itemnum: "PURGE",
            item_description: "HELIARC PURGE WELDING UNIT"
        }
    ],
    state: [{
        selection: {
            selected: {
                "100194": {
                    "issuetype": "ISSUE",
                    "itemnum": "GREASE",
                    "itemqty": 8,
                    "wpitemid": -1,
                    "issuetype_description": "Issue item",
                    "storeloc": "CENTRAL",
                    "description": "GREASE GUN",
                    "matusetransid": 100194,
                    "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjAx/issuedtool/0-100194",
                    "issuetype_maxvalue": "ISSUE",
                    "_bulkid": "100194",
                    "computedItemNum": "GREASE GREASE GUN",
                    "_selected": true,
                    "hours": "2"
                },
                "100195": {
                    "issuetype": "ISSUE",
                    "itemnum": "GAUGE",
                    "itemqty": 8,
                    "wpitemid": -1,
                    "issuetype_description": "Issue item",
                    "storeloc": "GARAGE",
                    "description": "TIMING GAUGE",
                    "matusetransid": 100195,
                    "href": "oslc/os/mxapiwodetail/_QkVERk9SRC8xMjAx/issuedtool/1-100195",
                    "issuetype_maxvalue": "ISSUE",
                    "_bulkid": "100195",
                    "computedItemNum": "GAUGE TIMING GAUGE",
                    "_selected": true,
                    "hours": "2"
                }
            }
        }
    }]
}

export default tools;
