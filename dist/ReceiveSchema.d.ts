import { Schema } from 'jsonschema';
import { Services } from './Services';
export declare type ReceiveFormat<P = any> = {
    service: string;
    payload: P;
};
export declare function receiveSchema(payloadSchemas: Services): Schema;
