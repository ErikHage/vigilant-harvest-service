import { FIXTURE_PREFIX, TEST_YEAR_MAX, TEST_YEAR_MIN } from './fixtures';
import { ApiResponse, HttpClient } from './http-client';
import { status } from './status-codes';

type Entry = Record<string, unknown>;

function isTestName(name: unknown): boolean {
  return typeof name === 'string' && name.startsWith(`${FIXTURE_PREFIX}-`);
}

function isTestYear(year: unknown): boolean {
  return typeof year === 'number' && year >= TEST_YEAR_MIN && year <= TEST_YEAR_MAX;
}

/** A list the check cannot read is not a list that came back clean. */
function entriesOf(response: ApiResponse): Entry[] {
  if (response.status !== status.OK || !Array.isArray(response.body)) {
    throw new Error(
      `Could not check for leftover test data: ${response.method} ${response.path} -> ${response.status}\n` +
      `  body: ${response.rawBody.slice(0, 500)}`
    );
  }

  return response.body as Entry[];
}

/**
 * Every record the suite created and did not remove, one line each.
 *
 * Reads only the top of each hierarchy. The foreign keys tie whatever sits
 * below to a parent listed here: no test year left means no plantings, journal
 * or log entries in one, and no test planting means no harvests, history or
 * year mappings.
 */
export async function findResidue(client: HttpClient): Promise<string[]> {
  const found: string[] = [];

  const named = async (path: string, field: string, what: string): Promise<void> => {
    entriesOf(await client.get(path))
      .filter(entry => isTestName(entry[field]))
      .forEach(entry => found.push(`${what} ${String(entry[field])}`));
  };

  await named('/plantings', 'name', 'planting');
  await named('/plants', 'friendlyName', 'plant');
  await named('/plots', 'friendlyName', 'plot');
  await named('/activity-schedules', 'name', 'activity schedule');

  for (const category of entriesOf(await client.get('/plant-categories'))) {
    if (isTestName(category.categoryName)) {
      found.push(`plant category ${String(category.categoryName)}`);
    }

    (category.subcategories as Entry[])
      .filter(subcategory => isTestName(subcategory.subcategoryName))
      .forEach(subcategory => found.push(`plant subcategory ${String(subcategory.subcategoryName)}`));
  }

  const testYears = entriesOf(await client.get('/planting-years'))
    .map(entry => entry.plantingYear)
    .filter(isTestYear);

  for (const year of testYears) {
    found.push(`planting year ${String(year)}`);

    for (const [ path, what, ] of [ [ 'journal', 'journal entry', ], [ 'activity-log', 'activity log entry', ], ]) {
      entriesOf(await client.get(`/${path}/${String(year)}`))
        .forEach(entry => found.push(`${what} ${String(entry.entryId)} in ${String(year)}`));
    }
  }

  return found;
}
