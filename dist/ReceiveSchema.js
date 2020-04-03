"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function receiveSchema(payloadSchemas) {
    return {
        "anyOf": Object.entries(payloadSchemas).map(function (_a) {
            var name = _a[0], schema = _a[1].request;
            return ({
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
            });
        })
    };
}
exports.receiveSchema = receiveSchema;
//# sourceMappingURL=ReceiveSchema.js.map