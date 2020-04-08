import { ResponseError } from './ResponseError';
export declare type SendFormat<P = any> = {
    errors?: Array<ResponseError>;
    payload: P;
};
