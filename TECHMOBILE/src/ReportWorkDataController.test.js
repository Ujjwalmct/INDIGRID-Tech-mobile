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

import ReportWorkDataController from './ReportWorkDataController';
import { Application } from '@maximo/maximo-js-api';

it('computedItem should return correct value', async () => {
  const controller = new ReportWorkDataController();

  let title = controller.computedItem({
    itemnum: '6I-2499',
    description: 'Filter, Primary Air',
  });
  expect(title).toBe('6I-2499 Filter, Primary Air');

  title = controller.computedItem({
    itemnum: '6I-2499',
  });
  expect(title).toBe('6I-2499');

  title = controller.computedItem({
    description: 'Filter, Primary Air',
  });
  expect(title).toBe('Filter, Primary Air');
});

it('computedToolItem should return correct value', async () => {
  const controller = new ReportWorkDataController();

  let title = controller.computedToolItem({
    itemnum: '6I-2499',
    toolitem: {
      description: 'Filter, Primary Air',
    },
  });
  expect(title).toBe('6I-2499 Filter, Primary Air');

  title = controller.computedToolItem({
    itemnum: '6I-2499',
    toolitem: {}
  });
  expect(title).toBe('6I-2499');

  title = controller.computedToolItem({
    toolitem: {
      description: 'Filter, Primary Air',
    },
  });
  expect(title).toBe('Filter, Primary Air');

  title = controller.computedToolItem({
    toolitem: {}
  });
  expect(title).toBeNull();
});

it('computedItemDescription should return correct value', async () => {
  const controller = new ReportWorkDataController();

  let title = controller.computedItemDescription(
    '6I-2499',
    'Filter, Primary Air'
  );
  expect(title).toBe('6I-2499 Filter, Primary Air');

  title = controller.computedItemDescription('6I-2499');
  expect(title).toBe('6I-2499');

  title = controller.computedItemDescription('Filter, Primary Air');
  expect(title).toBe('Filter, Primary Air');
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
// This test checks if the formattedLaborStartDate() method returns the correct date string when given a startdate property.
it("formattedLaborStartDate() returns the correct date string", async() => {
  const controller = new ReportWorkDataController();
  const app = new Application();
  await app.initialize();
  controller.onDatasourceInitialized('','',app);
  const item = {
    startdate: new Date("2023-04-15"),
  };
  const spyDateToString = jest.spyOn(app.dataFormatter, "dateToString");
  spyDateToString.mockImplementation(() => {
    return "April 15, 2023";
  });
  const result = controller.formattedLaborStartDate(item);
  expect(result).toBe("April 15, 2023");
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
// This test checks if the formattedLaborFinishDate() method returns the correct date format when given a labor item with a finish date
it("should return the correct date format for a labor item with a finish date", async() => {
  const controller = new ReportWorkDataController();
  const app = new Application();
  await app.initialize();
  controller.onDatasourceInitialized('','',app);
  const laborItem = {
    finishdate: new Date("2023-01-02")
  };
  const spyDateToString = jest.spyOn(app.dataFormatter, "dateToString");
  spyDateToString.mockImplementation(() => {
    return "January 02, 2023";
  });
  expect(controller.formattedLaborFinishDate(laborItem)).toEqual("January 02, 2023");
});

// Assisted by WCA@IBM
// Latest GenAI contribution: ibm/granite-20b-code-instruct-v2
// This test checks if the formattedLaborFinishDate() method returns the correct date format when given a labor item with a finish date
it("should return the correct date format for a labor item with a finish date", async() => {
  const controller = new ReportWorkDataController();
  const app = new Application();
  await app.initialize();
  controller.onDatasourceInitialized('','',app);
  const item = {
    pluscduedate_np: new Date("2023-01-02")
  };
  const spyDateToString = jest.spyOn(app.dataFormatter, "dateToString");
  spyDateToString.mockImplementation(() => {
    return "January 02, 2023";
  });
  expect(controller.computedPluscDueDate(item)).toEqual("January 02, 2023");
});