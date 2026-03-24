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
const unitspointLookupDs = {
  member: [
    {
      _rowstamp: "1184",
      valueid: "PLUSCDSENGUNIT|%",
      description: "Percent",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi8l",
      value: "%",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1185",
      valueid: "PLUSCDSENGUNIT|% IVP",
      description: "% IVP",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi8lIElWUA--",
      value: "% IVP",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1186",
      valueid: "PLUSCDSENGUNIT|Deg C",
      description: "Degrees C",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9EZWcgQw--",
      value: "Deg C",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1187",
      valueid: "PLUSCDSENGUNIT|Deg F",
      description: "Degrees F",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9EZWcgRg--",
      value: "Deg F",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1188",
      valueid: "PLUSCDSENGUNIT|GPM",
      description: "Gallons Per Minute",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9HUE0-",
      value: "GPM",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1189",
      valueid: "PLUSCDSENGUNIT|Inches",
      description: "Inches",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9JbmNoZXM-",
      value: "Inches",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1190",
      valueid: "PLUSCDSENGUNIT|Kg",
      description: "Kilogram",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9LZw--",
      value: "Kg",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1191",
      valueid: "PLUSCDSENGUNIT|RPM",
      description: "Rotations Per Minute",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9SUE0-",
      value: "RPM",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1192",
      valueid: "PLUSCDSENGUNIT|Volts",
      description: "Volts",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9Wb2x0cw--",
      value: "Volts",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1193",
      valueid: "PLUSCDSENGUNIT|btu",
      description: "British Thermal Units",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9idHU-",
      value: "btu",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1194",
      valueid: "PLUSCDSENGUNIT|lbs",
      description: "Pounds",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9sYnM-",
      value: "lbs",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1195",
      valueid: "PLUSCDSENGUNIT|mA",
      description: "Milli Amps",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9tQQ--",
      value: "mA",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1196",
      valueid: "PLUSCDSENGUNIT|mm",
      description: "Millimiter",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9tbQ--",
      value: "mm",
      domainid: "PLUSCDSENGUNIT",
    },
    {
      _rowstamp: "1197",
      valueid: "PLUSCDSENGUNIT|psi",
      description: "Pounds per Square Inch",
      href: "oslc/os/mxapialndomain/_UExVU0NEU0VOR1VOSVQvfk5VTEx_L35OVUxMfi9wc2k-",
      value: "psi",
      domainid: "PLUSCDSENGUNIT",
    },
  ],
  href: "oslc/os/mxapialndomain",
  responseInfo: {
    schema: {
      resource: "MXAPIALNDOMAIN",
      description: "Maximo API for Alndomain",
      pk: ["domainid", "value", "siteid", "orgid"],
      title: "ALNDOMAIN",
      type: "object",
      $ref: "oslc/jsonschemas/mxapialndomain",
      properties: {
        _rowstamp: {
          type: "string",
        },
        valueid: {
          searchType: "EXACT",
          subType: "ALN",
          title: "Value ID",
          persistent: true,
          type: "string",
          remarks:
            "System generated unique identifier of the value in a domain, internal and cannot be modified.",
          maxLength: 300,
        },
        localref: {
          type: "string",
        },
        _imagelibref: {
          type: "string",
        },
        description: {
          searchType: "WILDCARD",
          subType: "ALN",
          title: "Description",
          persistent: true,
          type: "string",
          remarks: "Value description",
          maxLength: 100,
        },
        siteid: {
          searchType: "WILDCARD",
          subType: "UPPER",
          title: "Site",
          persistent: true,
          type: "string",
          hasList: true,
          remarks: "Identifier of the site for which the value is specified",
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
          remarks: "Value of the domain",
          maxLength: 254,
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
            "Identifier of the organization for which the value is specified",
          maxLength: 8,
        },
      },
      required: ["domainid", "value", "valueid"],
    },
    totalPages: 1,
    href: "oslc/os/mxapialndomain?oslc.select=value%2Cvalueid%2Cdescription%2Cdomainid%2Csiteid%2Corgid&oslc.pageSize=100&oslc.where=domainid%3D%22PLUSCDSENGUNIT%22&searchAttributes=domainid&collectioncount=1&ignorecollectionref=1&relativeuri=1&addschema=1&lean=1&internalvalues=1&checkesig=1",
    totalCount: 14,
    pagenum: 1,
  },
};

export default unitspointLookupDs;
