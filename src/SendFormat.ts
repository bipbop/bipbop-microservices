import { ResponseError } from './ResponseError';

export interface ResponseErrors extends Array<ResponseError> { 0: ResponseError }

export type SendFormat<P = any> = {
    errors: ResponseErrors
    payload: P | null
} | {
    payload: P
}
