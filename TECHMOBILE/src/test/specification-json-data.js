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

const specificationData = {
    member: [
        {"assetattrid":"ANOM TYP","classstructureid":"1333","assetattributeid":372,"classspecid":516},
        {"assetattrid":"B31G BP","classstructureid":"1333","assetattributeid":380,"classspecid":522},
        {"assetattrid":"B31G ERF","classstructureid":"1333","assetattributeid":382,"classspecid":523},
        {"assetattrid":"CLOCK","classstructureid":"1333","assetattributeid":376,"classspecid":518},
        {"assetattrid":"DEFECT","classstructureid":"1333","assetattributeid":386,"classspecid":525},
        {"assetattrid":"DESC","classstructureid":"1333","assetattributeid":388,"classspecid":526},
        {"assetattrid":"INTEXT","classstructureid":"1333","assetattributeid":374,"classspecid":517,"domainid":"INTEXT"},
        {"assetattrid":"LENGTH","measureunitid":"FEET","classstructureid":"1333","assetattributeid":76,"classspecid":520,"orgid":"EAGLENA"},
        {"assetattrid":"MAX DEP","classstructureid":"1333","assetattributeid":378,"classspecid":519},
        {"assetattrid":"WIDTH","measureunitid":"IN","classstructureid":"1333","assetattributeid":15,"classspecid":521,"orgid":"EAGLENA"}
    ],
    href: "oslc/os/workordrespec",
    responseInfo: {
      schema: {
        $schema: "http://json-schema.org/draft-04/schema#",
        resource: "MXAPIWODETAIL",
        description: "Maximo API for Work Orders with Plans and Reservations",
        pk: ["siteid", "wonum"],
        title: "WORKORDER",
        type: "object",
        $ref: "oslc/jsonschemas/mxapiwodetail",
        properties: {
          wonum: {
            default: "&AUTOKEY&",
            searchType: "WILDCARD",
            subType: "UPPER",
            title: "Work Order",
            persistent: true,
            type: "string",
            hasList: true,
            remarks: "Identifies the work order.",
            maxLength: 25,
          },
          remarkdesc: {
            hasList: true,
            id: "w4w33",
            maxLength: 30,
            name: "remarkdesc",
            remarks: "A comment about the reported failure.",
            searchType: "NONE",
            subType: "ALN",
            title: "Remarks",
            type: "string",
          },
          problem_code: {
            type: "string",
          },
          failure_class: {
            type: "string",
          },
          status: {
            type: "string",
          },
          date: {
            type: "string",
          },
          wpmaterial: {
            type: "array",
            items: {
              definition: {
                subSchema: {
                  $ref:
                    "http://localhost/maximo/oslc/jsonschemas/mxapiwodetail/wpmaterial",
                },
              },
              type: "object",
            },
            cardinality: "MULTIPLE",
            relation: "SHOWPLANMATERIAL",
          },
          wptool: {
            type: "array",
            items: {
              definition: {
                subSchema: {
                  $ref:
                    "http://localhost/maximo/oslc/jsonschemas/mxapiwodetail/wptool",
                },
              },
              type: "object",
            },
            cardinality: "MULTIPLE",
            relation: "SHOWPLANTOOL",
          },
          toolcount: {
            type: "number",
          },
          hidewostartbutton: {
            type: "bool",
          },
        },
      },
    },
  };
  
  export default specificationData;
