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
class QuickReportController {

    pageInitialized(page, app) {
        this.app = app;
    }

    pageResumed() {
        setTimeout(() => {
            localStorage.setItem('quickReport', 'true')
            this.app.setCurrentPage({name: 'createwo', resetScroll: true, params: {quickReport: true}});

        }, 100);
    }
}

export default QuickReportController;