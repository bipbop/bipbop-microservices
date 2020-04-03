import { Schema } from 'jsonschema';
export declare type ServiceDefinition<P = any, R = any> = {
    call: (payload: P) => any;
    request: Schema;
    response: Schema;
};
