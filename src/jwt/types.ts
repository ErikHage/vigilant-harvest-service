export interface Actor {
  sessionId: string,
  userId: string,
  username: string,
  roleIds: string[],
  expiration: number,
}
