import { Schema } from 'jsonschema';

export type ServiceDefinition<P = any, R = any> = {
    call: (payload: P) => any;
    request: Schema;
    response: Schema;
};
