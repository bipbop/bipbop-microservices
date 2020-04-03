import { ResponseErrorCodes } from './ResponseErrorCodes';

export class ResponseError extends Error {
    public code: ResponseErrorCodes = ResponseErrorCodes.UnknownError;
    public description: string;

    constructor(message: string, code: ResponseErrorCodes = ResponseErrorCodes.UnknownError) {
        super(message);
        this.description = message;
    }

    static from(e: Error) {
        if (e instanceof ResponseError) return e;
        return new ResponseError(e.message);
    }
}
