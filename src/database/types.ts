import { RowDataPacket } from 'mysql2';

export interface QueryPayload {
  sql: string,
  params: Array<string | number | null>
}

export interface CountRow extends RowDataPacket {
  count: number,
}
