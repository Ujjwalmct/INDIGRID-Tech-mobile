/*
 * Licensed Materials - Property of IBM
 *
 * 5737-M60, 5737-M66
 *
 * (C) Copyright IBM Corp. 2021,2023 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */
import ClassificationController from './ClassificationController';
import classificationData from './test/classificationdata';  
import {Application,Datasource,JSONDataAdapter,Page,} from "@maximo/maximo-js-api";

function newClassificationDS(
  data = classificationData,
  items = "member",
  idAttribute = "classstructureid",
  name = "classListDummyDS"
) {
  const da = new JSONDataAdapter({
    src: data,
    items: items,
  });
  const ds = new Datasource(da, {
    idAttribute: idAttribute,
    name: name,
  });
  return ds;
}

function newDatasource(data = classificationData, name = "workOrderClassDomain") {
  const da = new JSONDataAdapter({
    src: data,
    items: 'member'
  });

  const ds = new Datasource(da, {
    idAttribute: name,
    name: name,
  });

  return ds;
}

it('initializes datasource', async () => {
  global.open = jest.fn();

  const controller = new ClassificationController();
  const app = new Application();
  const page = new Page({ name: "createwo" }); 
  app.registerPage(page);
  app.registerController(controller);
  const classListDummyDS = newClassificationDS(classificationData, "classListDummyDS");
  app.registerDatasource(classListDummyDS);  
  await app.initialize();

  expect(classListDummyDS.dataAdapter.itemCount).not.toBe(0);
});

it('onAfterLoadData should be called', async() => {
  const controller = new ClassificationController();
  const app = new Application();
  const page = new Page({ name: "createwo" }); 
  app.registerPage(page);
  app.registerController(controller);
  app.findDatasource  = 
      jest.fn().mockReturnValue({
      load: jest.fn(),
    })
  const workOrderClassDomain = newDatasource(classificationData, "workOrderClassDomain");
  app.registerDatasource(workOrderClassDomain);
  await app.initialize();
  controller.onDatasourceInitialized(workOrderClassDomain,app);
  let testItemData = {...classificationData};
  testItemData.responseInfo.totalCount = 1;
  testItemData.member = [];
  testItemData.member.push(classificationData.member[0]);
  await controller.onAfterLoadData(workOrderClassDomain, testItemData.member); 
  expect(testItemData.member.length).toBe(1);

  workOrderClassDomain.dataAdapter.totalCount = 2;
  const resetStub = jest.spyOn(workOrderClassDomain, 'reset');
  await controller.onAfterLoadData(workOrderClassDomain, testItemData.member); 
  expect(resetStub).toHaveBeenCalled();
});