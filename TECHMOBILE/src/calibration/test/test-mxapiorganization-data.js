/* istanbul ignore file */

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

const mxapiorganization = {
  member: [
    {
      _rowstamp: "317710",
      itemsetid: "SET1",
      href: "oslc/os/mxapiorganization/_RUFHTEVOQQ--",
      orgid: "EAGLENA",
      mobilemaxvars: [
        {
          maxvarsid: 358,
          vartype: "SYSTEM",
          varvalue: "1",
          href: null,
          varname: "CONFIRMLABTRANS",
        },
        {
          maxvarsid: 2232,
          vartype: "ORG",
          varvalue: "XY",
          href: null,
          varname: "COORDINATE",
          orgid: "EAGLENA",
        },
        {
          maxvarsid: 554,
          vartype: "ORG",
          varvalue: "0",
          href: null,
          varname: "LABTRANSTOLERANCE",
          orgid: "EAGLENA",
        },
        {
          maxvarsid: 794,
          vartype: "ORG",
          varvalue: "1",
          href: null,
          varname: "PLUSCAUTOSTATUS",
          orgid: "EAGLENA",
        },
        {
          maxvarsid: 803,
          vartype: "ORG",
          varvalue: "0",
          href: null,
          varname: "PLUSCQUALTECH",
          orgid: "EAGLENA",
        },
        {
          maxvarsid: 809,
          vartype: "ORG",
          varvalue: "0",
          href: null,
          varname: "PLUSCVALTOOL",
          orgid: "EAGLENA",
        },
        {
          maxvarsid: 2252,
          vartype: "SYSTEM",
          varvalue: "0",
          href: null,
          varname: "STARTTIMERINPRG",
        },
      ],
    },
  ],
  href: "oslc/os/mxapiorganization",
  responseInfo: {
    schema: {
      resource: "MXAPIORGANIZATION",
      description: "Maximo API for Organization and Site Definition",
      pk: ["orgid"],
      title: "ORGANIZATION",
      type: "object",
      $ref: "oslc/jsonschemas/mxapiorganization",
      uniqueid: "organizationid",
      properties: {
        _rowstamp: { type: "string" },
        site: {
          objectName: "SITE",
          type: "array",
          items: {
            definition: {
              subSchema: { $ref: "oslc/jsonschemas/mxapiorganization/site" },
            },
            type: "object",
          },
          cardinality: "UNDEFINED",
          relation: "SITE",
        },
        address: {
          objectName: "ADDRESS",
          type: "array",
          items: {
            definition: {
              subSchema: { $ref: "oslc/jsonschemas/mxapiorganization/address" },
            },
            type: "object",
          },
          cardinality: "UNDEFINED",
          relation: "ADDRESS",
        },
        localref: { type: "string" },
        _imagelibref: { type: "string" },
        itemsetid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Item Set",
          persistent: true,
          type: "string",
          hasList: true,
          remarks:
            "Identifies the item set. Enter a value or click the Select Value button.",
          maxLength: 8,
        },
        href: { type: "string" },
        _id: { type: "string" },
        orgid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Organization",
          persistent: true,
          type: "string",
          remarks:
            "Identifies the organization by a short code value, for example, CANADA to represent a company's Canadian operations. This value must be unique for all organizations.",
          maxLength: 8,
        },
        mobilemaxvars: {
          objectName: "MAXVARS",
          type: "array",
          items: {
            type: "object",
            properties: {
              maxvarsid: {
                searchType: "EXACT",
                maximum: 2.147483647e9,
                subType: "BIGINT",
                title: "MAXVARSID",
                persistent: true,
                type: "integer",
                minimum: -2.147483648e9,
                uniqueid: true,
                remarks: "Unique Identifier",
                maxLength: 11,
              },
              vartype: {
                default: "SYSTEM",
                searchType: "WILDCARD",
                subType: "ALN",
                title: "Variable Type",
                persistent: true,
                type: "string",
                remarks: "Domain of the MaxVar - System, Organization, or Site",
                maxLength: 6,
              },
              varvalue: {
                searchType: "WILDCARD",
                subType: "ALN",
                title: "Value",
                persistent: true,
                type: "string",
                remarks: "System Variable Value",
                maxLength: 254,
              },
              siteid: {
                searchType: "WILDCARD",
                subType: "UPPER",
                title: "Site",
                persistent: true,
                type: "string",
                hasList: true,
                remarks: "Site Identifier",
                maxLength: 8,
              },
              varname: {
                searchType: "WILDCARD",
                subType: "ALN",
                title: "Variable",
                persistent: true,
                type: "string",
                remarks: "System Variable Name",
                maxLength: 30,
              },
              orgid: {
                searchType: "WILDCARD",
                subType: "UPPER",
                title: "Organization",
                persistent: true,
                type: "string",
                remarks: "Organization Identifier",
                maxLength: 8,
              },
            },
          },
          cardinality: "",
        },
      },
      required: ["itemsetid", "orgid"],
    },
    totalPages: 1,
    href: "oslc/os/mxapiorganization?oslc.select=itemsetid%2Corgid%2Crel.mobilemaxvars%7B*%7D&oslc.pageSize=100&savedQuery=MOBILEORG&searchAttributes=orgid&collectioncount=1&ignorecollectionref=1&relativeuri=1&addschema=1&lean=1&internalvalues=1&checkesig=1",
    totalCount: 1,
    pagenum: 1,
  },
};

export default mxapiorganization;
