import { ResponseError } from './ResponseError';
export declare type SendFormat<P = any> = {
    error?: Array<ResponseError>;
    payload: P;
};
