import { ResponseError } from './ResponseError';

export type SendFormat<P = any> = {
    error?: Array<ResponseError>;
    payload: P;
};
