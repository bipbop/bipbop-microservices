# bipbop-microservices
Serviços pequenos e de baixo consumo de memória escritos em JavaScript instalados em rede segura.

## Instalação

```bash
npm install -g bipbop-microservice
bipbop-microservice
```

## Comunicação

Comunicação toda realizada em JSON.

```
uint    <=  4 Bytes do tamanho do PAYLOAD
char[]  <=  PAYLOAD JSON
uint    =>  4 Bytes do tamanho do RESPONSE
char[]  =>  RESPONSE JSON
```

### Lista Microserviços

Retorna a lista de microserviços e seus respectivos parâmetros em [JSON-Schema](https://jsonschema.net/).

### Chamada

```json
{"service": "index", "payload": ""}
```
## TL-DR

```js
const { createServer } = require("bipbop-microservices");

createServer({
  hookError: (_, e) => console.error(e),
  timeout: 3000,
  maxPayloadSize: 512000,
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

server.maxConnections = 10;
server.listen(serverPort);
```
