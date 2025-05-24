export interface StatusResponse<T> {
  ok: boolean;
  statusCode: number;
  message: string | string[];
  data?: T;
}
