#!/usr/bin/env node

const metaphone = require('metaphone-ptbr');
const { distance } = require('entidades-partes');

const { createServer } = require('../dist/index');

const serverPort = parseInt(process.env.BIPBOP_MS_PORT || '3000', 10);
const maxPayloadSize = parseInt(process.env.BIPBOP_MS_MAX_PAYLOAD_SIZE || '100000', 10); /* 100kb */
const timeout = parseInt(process.env.BIPBOP_MS_TIMEOUT || '3000', 10); /* 3 seg */
const maxConnections = parseInt(process.env.BIPBOP_MS_MAX_CONNECTIONS || '500', 10); /* 100kb */

const server = createServer({
    hookError: (_, e) => console.error(e),
    timeout,
    maxPayloadSize,
    services: {
        entidades: {
            call: (payload) => {
                return distance(payload);
            },
            request: { type: 'string' },
            response: {
                type: 'object',
                required: [
                    "polo",
                    "parte",
                    "distance"
                ],
                properties: {
                    polo: { type: 'string' },
                    parte: { type: 'string' },
                    distance: { type: 'number' }
                }
            }
        },
        mirror: {
            call: (payload) => {
                return payload;
            },
            request: { type: 'string' },
            response: { type: 'string' }
        },
        metaphone: {
            call: (payload) => {
                return metaphone(payload);
            },
            request: { type: 'string' },
            response: { type: 'string' }
        }
    }
});

server.maxConnections = maxConnections;
server.listen(serverPort);
