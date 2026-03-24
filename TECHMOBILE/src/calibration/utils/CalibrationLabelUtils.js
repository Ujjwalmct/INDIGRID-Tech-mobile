/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2022,2025 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

class CalibrationLabelUtils {

  // Assisted by watsonx Code Assistant 
  /**
   * generateHtmlForWebClient - This function generates the HTML content for the web client.
   * @returns {void}
   */
  static generateHtmlForWebClient() {
    // Define the print-specific CSS
    const printCSS = `
        @media print {
            body * {
                visibility: hidden; /* Hide everything by default */
            }
            #ya388, #ya388 *,
            #x4mkb, #x4mkb * {
                visibility: visible; /* Show only the printable area */
            }
        }
    `;

    // Create a <style> element
    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = printCSS;

    // Append the <style> element to the <head>
    document.head.appendChild(style);
    // Trigger the print command
    window.print();

    // Clean up: Remove the <style> element after printing
    window.onafterprint = () => {
      document.head.removeChild(style);
    };
  }

  /**
   * 
   * @param {String} calibrationStatus 
   * @returns {String} - the icon HTML for calibration status
   */
  // istanbul ignore next
  static getCalibrationStatusIconHTML(calibrationStatus) {
    switch (calibrationStatus) {
      case 'BROKEN':
        return `
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" id="pvrdb" role="img"
              aria-label="Carbon:Warning--alt" description="Carbon:Warning--alt" width="32" height="32"
              viewBox="0 0 32 32" class=" mx--rotatable-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 23a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 23zM15 12H17V21H15z"></path>
              <path
                  d="M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.002-.0033L16.002,6.1714h-.004L4.6487,27.9967Z"></path>
          </svg>
        `;
      case 'FAIL':
        return `
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" id="vqepk[0]" role="img"
              aria-label="carbon:close--outline" description="carbon:close--outline" width="32" height="32"
              viewBox="0 0 32 32" class=" mx--rotatable-icon" xmlns="http://www.w3.org/2000/svg">
              <path
                  d="M16,2C8.2,2,2,8.2,2,16s6.2,14,14,14s14-6.2,14-14S23.8,2,16,2z M16,28C9.4,28,4,22.6,4,16S9.4,4,16,4s12,5.4,12,12 S22.6,28,16,28z"></path>
              <path
                  d="M21.4 23L16 17.6 10.6 23 9 21.4 14.4 16 9 10.6 10.6 9 16 14.4 21.4 9 23 10.6 17.6 16 23 21.4z"></path>
          </svg>
        `;
      case 'OLIM':
            return `
              <svg focusable="false" preserveAspectRatio="xMidYMid meet" id="vqepk[0]" role="img"
                  aria-label="carbon:close--outline" description="carbon:close--outline" width="32" height="32"
                  viewBox="0 0 32 32" class=" mx--rotatable-icon" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M16,2C8.2,2,2,8.2,2,16s6.2,14,14,14s14-6.2,14-14S23.8,2,16,2z M16,28C9.4,28,4,22.6,4,16S9.4,4,16,4s12,5.4,12,12 S22.6,28,16,28z"></path>
                  <path
                      d="M21.4 23L16 17.6 10.6 23 9 21.4 14.4 16 9 10.6 10.6 9 16 14.4 21.4 9 23 10.6 17.6 16 23 21.4z"></path>
              </svg>
            `;
      case 'PASS':
        return `
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" id="vqepk[0]" role="img"
              aria-label="carbon:checkmark--outline" description="carbon:checkmark--outline" width="32"
              height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 21.414L9 16.413 10.413 15 14 18.586 21.585 11 23 12.415 14 21.414z"></path>
              <path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z"></path>
          </svg>
        `;
      }
    }

  // Assisted by watsonx Code Assistant 
  /**
   * getHTMLTemplateForMobileToPrint - This function generates the HTML template for printing the calibration label.
   * @param {Object} templateData - The data to be used in the template.
   * @param {string} templateData.logoUrl - The URL of the logo to be displayed in the label.
   * @param {Array} templateData.fieldRows - An array of objects representing the field rows to be displayed in the label.
   * @param {string} templateData.fieldRows.label - The label for the field row.
   * @param {string} templateData.fieldRows.value - The value for the field row.
   * @returns {string} - The HTML content of the template.
   */
  static getHTMLTemplateForMobileToPrint(templateData, statusHeader) {
    const { logoUrl, fieldRows } = templateData;
    // first row of templateData contains the status, prepare SVG HTML accordingly
    const statusIconSVGHtml = CalibrationLabelUtils.getCalibrationStatusIconHTML(templateData.fieldRows[0].value);
    const htmlContent = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Calibration Label</title>
          <style>
            body {
              font-family: Arial;
              font-style: normal;
              font-weight: 700;
              margin: 0;
              padding: 0;
              height: 100vh;
              color: #000;
              background: #fff;
            }
      
            @media print {
              .print-content {
                height: 100%;
                width: 100%;
                font-size: 16px;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .card-container {
                max-width: 90%;
                min-width: 50%;
                padding: 10px;
                display: flex;
                flex-direction: column;
                border: 1px solid #dfe3e6;
              }
              .card-header {
                display: flex;
                align-items: center;
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid #dfe3e6;
                justify-content: space-between;
                flex-direction: row;
              }
              .card-content {
                display: flex;
                flex-direction: column;
              }
              .field-row {
                display: flex;
                margin-bottom: 10px;
                align-items: top;
                flex-direction: row;
              }
              .field-label {
                display: flex;
                font-size: 20px;
                flex-shrink: 0;
                flex-basis: 50%;
                word-break: break-all;
                align-content: top;
              }
              .field-value {
                display: flex;
                font-size: 20px;
                flex-shrink: 0;
                flex-basis: 50%;
                font-weight: 500;
                align-content: top;
                white-space: normal;
                word-break: keep-all;
                overflow-wrap: break-word;
              }
              .field-value::before {
                content:":";
                padding-right: 0.5rem;
                align-items: top;
              }
              hr {
                border: none;
                border-top: 1px dashed #dfe3e6;
                margin: 10px 0;
              }
            }
          </style>
        </head>
      
        <body>
          <div class="print-content">
            <div class="card-container">
              <div class="card-header">
                <h3 style="font-weight: bold;">
                  ${statusHeader}
                </h3>
                <!--<img
                  class="logo-box"
                  width="50"
                  height="50"
                  src=${logoUrl}
                  alt="logo"
                />-->
                ${statusIconSVGHtml}
              </div>
              <div class="card-content">
              ${fieldRows.map((row) => (
                `${row.label === 'Signature' ? '<hr/>' : ''}
                <div class="field-row">
                  <div class="field-label">${row.label}</div>
                  <div class="field-value">${row.value}</div>
                </div>`)).join('')}
              </div>
            </div>
          </div>
        </body>
      </html>
  `;
    return htmlContent;
  }
}

export default CalibrationLabelUtils;