import { Request, Response } from 'express';

import activityLogService from '../services/activity-log/activity-log-service';
import activityLogSerializers from '../serializers/activity-log';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function upsertActivityLogEntry(request: Request, response: Response) {
  const activityLogEntryRequest = activityLogSerializers.activityLogEntries.upsert.fromRequest(request);

  const activityLogEntry = await activityLogService.upsertActivityLogEntry(activityLogEntryRequest);
  const activityLogEntryResponse = activityLogSerializers.activityLogEntries.toResponse(activityLogEntry);

  response
    .status(activityLogEntryRequest.entryId === undefined ? httpStatus.CREATED : httpStatus.OK)
    .send(activityLogEntryResponse);
}

async function getActivityLogEntries(request: Request, response: Response) {
  // add query param filter by activity type? and maybe sub type?
  const plantingYear = activityLogSerializers.activityLogEntries.getByYear.fromRequest(request);

  const activityLogEntries = await activityLogService.getActivityLogEntriesForYear(plantingYear);
  const activityLogEntriesResponse = activityLogEntries.map(activityLogSerializers.activityLogEntries.toResponse);

  response
    .status(httpStatus.OK)
    .send(activityLogEntriesResponse);
}

async function deleteActivityLogEntry(request: Request, response: Response) {
  const { entryId, } = request.params;

  await activityLogService.deleteActivityLogEntryById(entryId!);

  response.sendStatus(httpStatus.NO_CONTENT);
}

export default {
  upsertActivityLogEntry: tryDecorator.decorate(upsertActivityLogEntry),
  getActivityLogEntries: tryDecorator.decorate(getActivityLogEntries),
  deleteActivityLogEntry: tryDecorator.decorate(deleteActivityLogEntry),
}
