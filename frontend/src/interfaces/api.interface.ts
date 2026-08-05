export interface IApiResult<T> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
}
