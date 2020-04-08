import { ResponseError } from './ResponseError';

export type SendFormat<P = any> = {
    errors?: Array<ResponseError>;
    payload: P;
};
