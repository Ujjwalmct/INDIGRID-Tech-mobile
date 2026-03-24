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
const testPluscwodsRepeatableData = {
  member: [
    {
      pluscwodsinstr: [
        {
          outputprecision: 2,
          outputrange: false,
          localref:
            "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods/0-73/pluscwodsinstr/0-151",
          tol2status: "FAIL",
          caldynamic: false,
          cliplimits: false,
          description: "Pressure Gauge - REPEATABLE",
          instroutrangeeu_description: "Milli Amps",
          instrcalrangeto: "300.00",
          plantype: "ANALOG",
          tol1status_maxvalue: "ADJTOIMP",
          ron1type: "EU",
          instrcalrangefrom: "100.00",
          tol2status_maxvalue: "FAIL",
          _rowstamp: "12814744",
          pluscwodsinstrid: 151,
          instroutrangefrom: "4.00",
          calfunction: false,
          repeatable: true,
          instrcalrangeeu: "psi",
          inputrange: true,
          href: "http://childkey#V09SS09SREVSL1BMVVNDV09EUy9QTFVTQ1dPRFNJTlNUUi8xNTE-",
          ron1lowervalue: "-3.00",
          tol1status: "ADJTOIMP",
          cliplimitsin: false,
          instroutrangeeu: "mA",
          revisionnum: 0,
          ron1uppervalue: "3.00",
          instrcalrangeeu_description: "Pounds per Square Inch",
          tol1status_description: "Adjust to Improve",
          plantype_maxvalue: "ANALOG",
          tol2status_description: "Action Limit Exceeded",
          inputprecision: 2,
          calpoint: true,
          instroutrangeto: "20.00",
          dsplannum: "DS101",
          plantype_description: "Analog asset function",
          pluscwodspoint: [
            {
              asleftpass: false,
              pointdescription: "Low Range",
              localref:
                "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods/0-73/pluscwodsinstr/0-151/pluscwodsinstrallpoint/0-2103",
              asfoundfail: false,
              inputvalue: "100.00",
              outputvalue: "4.00",
              plantype: "ANALOG",
              pluscwodspointid: 2103,
              asfoundpass: false,
              point: 1,
              asleftfail: false,
              _rowstamp: "12039675",
              plantype_maxvalue: "ANALOG",
              wodsnum: 1072,
              href: "http://childkey#V09SS09SREVSL1BMVVNDV09EUy9QTFVTQ1dPRFNJTlNUUi9QTFVTQ1dPRFNQT0lOVC8yMTAz",
              plantype_description: "Analog asset function",
            },
            {
              asleftpass: false,
              pointdescription: "Mid Range",
              localref:
                "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods/0-73/pluscwodsinstr/0-151/pluscwodsinstrallpoint/1-2104",
              asfoundfail: false,
              inputvalue: "200.00",
              outputvalue: "12.00",
              plantype: "ANALOG",
              pluscwodspointid: 2104,
              asfoundpass: false,
              point: 2,
              asleftfail: false,
              _rowstamp: "12039676",
              plantype_maxvalue: "ANALOG",
              wodsnum: 1072,
              href: "http://childkey#V09SS09SREVSL1BMVVNDV09EUy9QTFVTQ1dPRFNJTlNUUi9QTFVTQ1dPRFNQT0lOVC8yMTA0",
              plantype_description: "Analog asset function",
            },
            {
              asleftpass: false,
              pointdescription: "High Range",
              localref:
                "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods/0-73/pluscwodsinstr/0-151/pluscwodsinstrallpoint/2-2105",
              asfoundfail: false,
              inputvalue: "300.00",
              outputvalue: "20.00",
              plantype: "ANALOG",
              pluscwodspointid: 2105,
              asfoundpass: false,
              point: 3,
              asleftfail: false,
              _rowstamp: "12039677",
              plantype_maxvalue: "ANALOG",
              wodsnum: 1072,
              href: "http://childkey#V09SS09SREVSL1BMVVNDV09EUy9QTFVTQ1dPRFNJTlNUUi9QTFVTQ1dPRFNQT0lOVC8yMTA1",
              plantype_description: "Analog asset function",
            },
          ],
        },
      ],
      _rowstamp: "12039673",
      localref: "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods/0-73",
      pluscwodsid: 73,
      description: "PG100300420EU",
      wodsnum: 1072,
      revisionnum: 0,
      href: "http://childkey#V09SS09SREVSL1BMVVNDV09EUy83Mw--",
      dsplannum: "DS101",
      required: true,
    },
  ],
  href: "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods",
  responseInfo: {
    totalPages: 1,
    href: "oslc/os/mxapiwodetail/_QkVERk9SRC8xMzE0/pluscwods?oslc.select=href%2Cwonum%2Cpluscwodsid%2Cwodsnum%2Cdsplannum%2Cdescription%2Ccertificatenum%2Casfoundcomments%2Casfoundcalstatus%2Casleftcalstatus%2Ctemperature%2Chumidity%2Cbaropressure%2Ctemperatureeu%2Chumidityeu%2Cbaropressureeu%2Crequired%2Crevisionnum%2Cpluscwodsinstr%7Bhref%2Crevisionnum%2Cdsplannum%2Cpluscwodsinstrid%2Cdescription%2C%20plantype%2C%20asfoundcalstatus%2C%20asleftcalstatus%2Cinstrcalrangefrom%2Cinstrcalrangeto%2Cinstroutrangefrom%2Cinstroutrangeto%2Cinputprecision%2Cron1lowervalue%2Cron1uppervalue%2Ccliplimitsin%2Coutputprecision%2Coutputrange%2Cinputrange%2Ccliplimits%2Ctol1lowervalue%2Ctol1uppervalue%2Ctol1type%2Ctol1status%2Ctol2lowervalue%2Ctol2uppervalue%2Ctol2type%2Ctol2status%2Ctol3lowervalue%2Ctol3uppervalue%2Ctol3type%2Ctol3status%2Ctol4lowervalue%2Ctol4uppervalue%2Ctol4type%2Ctol4status%2Cinstrcalrangeeu%2Cinstroutrangeeu%2Cron1type%2Ccaldynamic%2Ccalpoint%2Ccalfunction%2Crepeatable%2C%20pluscwodspoint%20%7B%20pluscwodspointid%2Cwodsnum%2Casfounderror1%2Casfounderror2%2Casfounderror3%2Casfounderror4%2Casfoundfail%2Casfoundinput%2Casfoundoutput%2Casfoundpass%2Casfoundsetpoint%2Casfoundtol1lower%2Casfoundtol1upper%2Casfoundtol2lower%2Casfoundtol2upper%2Casfoundtol3lower%2Casfoundtol3upper%2Casfoundtol4lower%2Casfoundtol4upper%2Casfoundunit%2Caslefterror1%2Caslefterror2%2Caslefterror3%2Caslefterror4%2Casleftfail%2Casleftinput%2Casleftoutput%2Casleftpass%2Casleftsetpoint%2Caslefttol1lower%2Caslefttol1upper%2Caslefttol2lower%2Caslefttol2upper%2Caslefttol3lower%2Caslefttol3upper%2Caslefttol4lower%2Caslefttol4upper%2Casleftunit%2Chref%2Cinputvalue%2Cinputvalue_np%2Cinstrumentdesc%2Cinstrumentfunction%2Coutputvalue%2Coutputvalue_np%2Cplantype%2Cpoint%2Cpointdescription%2Csetpointvalue%7D%7D&oslc.pageSize=100&collectioncount=1&ignorecollectionref=1&relativeuri=1&lean=1&internalvalues=1&checkesig=1",
    totalCount: 1,
    pagenum: 1,
  },
};

export default testPluscwodsRepeatableData;
