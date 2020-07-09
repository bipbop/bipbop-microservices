const metaphone = require('metaphone-ptbr');
const { distance } = require('@bipbop/entidades-partes');

module.exports = {
    entidades: {
        call: (payload) => distance(payload),
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
    metaphone: {
        call: (payload) => metaphone(payload),
        request: { type: 'string' },
        response: { type: 'string' }
    }
}