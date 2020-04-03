import { ResponseErrorCodes } from './ResponseErrorCodes';
export declare class ResponseError extends Error {
    code: ResponseErrorCodes;
    description: string;
    constructor(message: string, code?: ResponseErrorCodes);
    static from(e: Error): ResponseError;
}
