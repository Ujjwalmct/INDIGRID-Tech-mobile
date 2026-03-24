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

/* istanbul ignore file */
const domaincalstatusData = {
  member: [
    {
      _rowstamp: "356611",
      valueid: "PLUSCCALSTATUS|ACTION",
      maxvalue: "ACTION",
      defaults: true,
      description: "Action Required",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvQUNUSU9OL35OVUxMfi9_TlVMTH4vQUNUSU9O",
      value: "ACTION",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356612",
      valueid: "PLUSCCALSTATUS|ADJREQD",
      maxvalue: "ADJREQD",
      defaults: true,
      description: "Warning Limit Exceeded",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvQURKUkVRRC9_TlVMTH4vfk5VTEx_L0FESlJFUUQ-",
      value: "ADJREQD",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356613",
      valueid: "PLUSCCALSTATUS|ADJTOIMP",
      maxvalue: "ADJTOIMP",
      defaults: true,
      description: "Adjust to Improve",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvQURKVE9JTVAvfk5VTEx_L35OVUxMfi9BREpUT0lNUA--",
      value: "ADJTOIMP",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356614",
      valueid: "PLUSCCALSTATUS|BROKEN",
      maxvalue: "BROKEN",
      defaults: true,
      description: "Cannot Calibrate",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvQlJPS0VOL35OVUxMfi9_TlVMTH4vQlJPS0VO",
      value: "BROKEN",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356615",
      valueid: "PLUSCCALSTATUS|FAIL",
      maxvalue: "FAIL",
      defaults: true,
      description: "Action Limit Exceeded",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvRkFJTC9_TlVMTH4vfk5VTEx_L0ZBSUw-",
      value: "FAIL",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356616",
      valueid: "PLUSCCALSTATUS|INSPECT",
      maxvalue: "INSPECT",
      defaults: true,
      description: "Inspect",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvSU5TUEVDVC9_TlVMTH4vfk5VTEx_L0lOU1BFQ1Q-",
      value: "INSPECT",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356617",
      valueid: "PLUSCCALSTATUS|LIMITEDUSE",
      maxvalue: "LIMITEDUSE",
      defaults: true,
      description: "Limited Use",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvTElNSVRFRFVTRS9_TlVMTH4vfk5VTEx_L0xJTUlURURVU0U-",
      value: "LIMITEDUSE",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356618",
      valueid: "PLUSCCALSTATUS|MISSING",
      maxvalue: "MISSING",
      defaults: true,
      description: "Missing",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvTUlTU0lORy9_TlVMTH4vfk5VTEx_L01JU1NJTkc-",
      value: "MISSING",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356619",
      valueid: "PLUSCCALSTATUS|OLIM",
      maxvalue: "OLIM",
      defaults: true,
      description: "Out of Limit",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvT0xJTS9_TlVMTH4vfk5VTEx_L09MSU0-",
      value: "OLIM",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356620",
      valueid: "PLUSCCALSTATUS|PASS",
      maxvalue: "PASS",
      defaults: true,
      description: "Warning Limit not Exceeded",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvUEFTUy9_TlVMTH4vfk5VTEx_L1BBU1M-",
      value: "PASS",
      domainid: "PLUSCCALSTATUS",
    },
    {
      _rowstamp: "356621",
      valueid: "PLUSCCALSTATUS|WARNING",
      maxvalue: "WARNING",
      defaults: true,
      description: "Calibration Warning",
      href: "oslc/os/mxapisynonymdomain/_UExVU0NDQUxTVEFUVVMvV0FSTklORy9_TlVMTH4vfk5VTEx_L1dBUk5JTkc-",
      value: "WARNING",
      domainid: "PLUSCCALSTATUS",
    },
  ],
  href: "oslc/os/mxapisynonymdomain",
  responseInfo: {
    schema: {
      resource: "MXAPISYNONYMDOMAIN",
      description: "Maximo API for Synonymdomain",
      pk: ["domainid", "maxvalue", "value", "siteid", "orgid"],
      title: "SYNONYMDOMAIN",
      type: "object",
      $ref: "oslc/jsonschemas/mxapisynonymdomain",
      properties: {
        valueid: {
          searchType: "EXACT",
          subType: "ALN",
          title: "Value ID",
          persistent: true,
          type: "string",
          remarks:
            "System generated unique identifier of the value in a domain, internal and cannot be modified.",
          maxLength: 256,
        },
        maxvalue: {
          searchType: "WILDCARD",
          subType: "ALN",
          title: "Internal Value",
          persistent: true,
          type: "string",
          remarks: "Internal maximo value",
          maxLength: 50,
        },
        localref: {
          type: "string",
        },
        description: {
          searchType: "WILDCARD",
          subType: "ALN",
          title: "Description",
          persistent: true,
          type: "string",
          remarks: "Description of the value",
          maxLength: 256,
        },
        domainid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Domain",
          persistent: true,
          type: "string",
          remarks: "Identifier of the domain",
          maxLength: 18,
        },
        orgid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Organization",
          persistent: true,
          type: "string",
          hasList: true,
          remarks:
            "Identifier of the org for which the domain value is specified",
          maxLength: 8,
        },
        _rowstamp: {
          type: "string",
        },
        defaults: {
          default: false,
          searchType: "EXACT",
          subType: "YORN",
          title: "Default",
          persistent: true,
          type: "boolean",
          remarks: "Is This The Default Value? (Y or N)",
        },
        _imagelibref: {
          type: "string",
        },
        siteid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Site",
          persistent: true,
          type: "string",
          hasList: true,
          remarks:
            "Identifier of the site for which the domain value is specified",
          maxLength: 8,
        },
        href: {
          type: "string",
        },
        _id: {
          type: "string",
        },
        value: {
          searchType: "WILDCARD",
          subType: "ALN",
          title: "Value",
          persistent: true,
          type: "string",
          remarks: "Synonym value",
          maxLength: 50,
        },
      },
      required: ["domainid", "maxvalue", "value", "valueid"],
    },
    totalPages: 1,
    href: "oslc/os/mxapisynonymdomain?oslc.select=value%2Cmaxvalue%2Cdescription%2Cdomainid%2Cvalueid%2Csiteid%2Corgid%2Cdefaults&oslc.pageSize=100&oslc.where=domainid%3D%22PLUSCCALSTATUS%22&savedQuery=MOBILEDOMAIN&oslc.orderBy=%2Bvalue&searchAttributes=value%2Cmaxvalue%2Cdescription%2Cdomainid%2Cvalueid%2Csiteid%2Corgid&collectioncount=1&ignorecollectionref=1&relativeuri=1&addschema=1&lean=1&internalvalues=1&checkesig=1",
    totalCount: 11,
    pagenum: 1,
  },
};

export default domaincalstatusData;
