import { Schema } from 'jsonschema'
import { Services } from './Services';

export type ReceiveFormat<P = any> = { service: string; payload: P; };

export function receiveSchema(payloadSchemas: Services): Schema {
    return {
        "anyOf": Object.entries(payloadSchemas).map(([name, { request: schema }]): Schema => ({
            "type": "object",
            "title": name,
            "required": ["service", "payload"],
            "additionalProperties": false,
            "properties": {
                "token": { "type": "string" },
                "service": {
                    "enum": [name]
                },
                "payload": schema
            }
        }))
    }

}