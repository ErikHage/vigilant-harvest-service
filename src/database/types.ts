export interface QueryPayload {
  sql: string,
  params: Array<string | number | null>
}
