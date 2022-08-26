export interface IResponse<T> {
  data: T;
}

export interface IServerError {
  message: string;
}