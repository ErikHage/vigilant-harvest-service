import { Request, Response } from 'express';

import journalService from '../services/journal/journal-service';
import journalSerializers from '../serializers/journal';
import tryDecorator from '../middleware/try-decorator';

async function upsertJournalEntry(request: Request, response: Response) {
  const journalEntryRequest = journalSerializers.journalEntries.upsert.fromRequest(request);

  const journalEntry = await journalService.upsertJournalEntry(journalEntryRequest);
  const journalEntryResponse = journalSerializers.journalEntries.toResponse(journalEntry);

  response
    .status(journalEntryRequest.entryId === undefined ? 201 : 200)
    .send(journalEntryResponse);
}

async function getJournalEntries(request: Request, response: Response) {
  const plantingYear = journalSerializers.journalEntries.getByYear.fromRequest(request);

  const journalEntries = await journalService.getJournalEntriesForYear(plantingYear);
  const journalEntriesResponse = journalEntries.map(journalSerializers.journalEntries.toResponse);

  response
    .status(200)
    .send(journalEntriesResponse);
}

export default {
  upsertJournalEntry: tryDecorator.decorate(upsertJournalEntry),
  getJournalEntries: tryDecorator.decorate(getJournalEntries),
}
