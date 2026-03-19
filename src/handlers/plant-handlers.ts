import { Request, Response } from 'express';

import plantSerializers from '../serializers/plants';
import plantsService from '../services/plants/plants-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function upsertPlant(request: Request, response: Response) {
  // TODO move to a separate validator step
  if (request.body.subcategoryId == null) {
    response
      .status(httpStatus.BAD_REQUEST)
      .send({
        message: 'Subcategory is required',
      });
  } else {
    const plantRequest = plantSerializers.fromRequest(request);

    const planting = await plantsService.upsertPlant(plantRequest);
    const plantResponse = plantSerializers.toResponse(planting);

    response
      .status(plantRequest.plantId === undefined ? httpStatus.CREATED : httpStatus.OK)
      .send(plantResponse);
  }
}

async function getPlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('plantId required');
  } else {
    const plant = await plantsService.getPlantById(plantId!);
    const plantResponse = plantSerializers.toResponse(plant);

    response.status(httpStatus.OK).send(plantResponse);
  }
}

async function getPlants(request: Request, response: Response) {
  const plants = await plantsService.getPlants();
  const plantsResponse = plants.map(plantSerializers.toResponse);

  response.status(httpStatus.OK).send(plantsResponse);
}

async function deletePlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.sendStatus(httpStatus.BAD_REQUEST);
  } else {
    await plantsService.deletePlantById(plantId!);

    response.sendStatus(httpStatus.OK);
  }
}

async function insertCategory(request: Request, response: Response) {
  const plantCategoryRequest = plantSerializers.categories.fromCategoryRequest(request);

  const plantCategory = await plantsService.insertCategory(plantCategoryRequest);
  const plantCategoryResponse = plantSerializers.categories.toCategoryResponse(plantCategory);

  response
    .status(httpStatus.CREATED)
    .send(plantCategoryResponse);
}

async function getCategories(request: Request, response: Response) {
  const categories = await plantsService.getCategories();
  const categoriesResponse = categories.map(plantSerializers.categories.toCategoryResponse);

  response.status(httpStatus.OK).send(categoriesResponse);
}

async function insertSubcategory(request: Request, response: Response) {
  const plantSubcategoryRequest = plantSerializers.categories.fromSubcategoryRequest(request);

  const plantSubcategory = await plantsService.insertSubcategory(plantSubcategoryRequest);
  const plantSubcategoryResponse = plantSerializers.categories.toSubcategoryResponse(plantSubcategory);

  response
    .status(httpStatus.CREATED)
    .send(plantSubcategoryResponse);
}

export default {
  upsertPlant: tryDecorator.decorate(upsertPlant),
  getPlantById: tryDecorator.decorate(getPlantById),
  getPlants: tryDecorator.decorate(getPlants),
  deletePlantById: tryDecorator.decorate(deletePlantById),

  insertCategory: tryDecorator.decorate(insertCategory),
  getCategories: tryDecorator.decorate(getCategories),

  insertSubcategory: tryDecorator.decorate(insertSubcategory),
}
