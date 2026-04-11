import { Request, Response } from 'express';
import schedulesSerializer from '../serializers/schedules';
import schedulesService from '../services/schedules/schedules-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function createSchedule(request: Request, response: Response): Promise<void> {
  const activityScheduleCreateRequest = schedulesSerializer.schedules.fromCreateRequest(request);
  const activitySchedule = await schedulesService.createSchedule(activityScheduleCreateRequest);
  const activityScheduleResponse = schedulesSerializer.schedules.toResponse(activitySchedule);

  response
    .status(httpStatus.CREATED)
    .send(activityScheduleResponse);
}

async function listSchedules(request: Request, response: Response): Promise<void> {
  const activitySchedules = await schedulesService.listSchedules();
  const activitySchedulesResponse = activitySchedules.map(schedulesSerializer.schedules.toResponse);

  response
    .status(httpStatus.OK)
    .send(activitySchedulesResponse);
}

async function getScheduleById(request: Request, response: Response): Promise<void> {
  const activityScheduleId = request.params.activityScheduleId!;
  const activitySchedule = await schedulesService.getScheduleById(activityScheduleId);

  response.status(httpStatus.OK)
    .send(schedulesSerializer.schedules.toResponse(activitySchedule));
}

async function updateSchedule(request: Request, response: Response): Promise<void> {
  const activityScheduleUpdateRequest = schedulesSerializer.schedules.fromUpdateRequest(request);
  const activitySchedule = await schedulesService.updateSchedule(activityScheduleUpdateRequest);
  const activityScheduleResponse = schedulesSerializer.schedules.toResponse(activitySchedule);

  response
    .status(httpStatus.OK)
    .send(activityScheduleResponse);
}

async function addScheduleItem(request: Request, response: Response): Promise<void> {
  const scheduleItemRequest = schedulesSerializer.scheduleItems.fromCreateRequest(request);
  const scheduleItem = await schedulesService.addScheduleItem(scheduleItemRequest);
  const scheduleItemResponse = schedulesSerializer.scheduleItems.toResponse(scheduleItem);

  response
    .status(httpStatus.CREATED)
    .send(scheduleItemResponse);
}

export default {
  createSchedule: tryDecorator.decorate(createSchedule),
  listSchedules: tryDecorator.decorate(listSchedules),
  getScheduleById: tryDecorator.decorate(getScheduleById),
  updateSchedule: tryDecorator.decorate(updateSchedule),

  addScheduleItem: tryDecorator.decorate(addScheduleItem),
};
