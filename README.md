# bipbop-microservices
Serviços pequenos e de baixo consumo de memória com pequenos PAYLOADS escritos em JavaScript instalados em rede segura.

## Instalação

```bash
npm install -g bipbop-microservice
bipbop-microservice
```

## Comunicação

Comunicação toda realizada em JSON.

### TCP/UDP

```
uint    <=  4 Bytes do tamanho do PAYLOAD
char[]  <=  PAYLOAD JSON
uint    =>  4 Bytes do tamanho do RESPONSE
char[]  =>  RESPONSE JSON
```

## Variáveis de Ambiente

```sh
BIPBOP_MS_PORT=3000
BIPBOP_MS_MAX_CONNECTIONS=500
BIPBOP_MS_MAX_PAYLOAD_SIZE=100000 #bytes
BIPBOP_MS_TIMEOUT=3000 #ms
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
    mirror: {
      call: (payload) => {
        return payload;
      },
      request: { type: 'string' },
      response: { type: 'string' }
    },
  }
});

server.maxConnections = 10;
server.listen(serverPort);
```

### Clientes 

### PHP

Existe uma biblioteca PHP para conexão com os microserviços.

```sh
composer require bipbop/microservices
```

```php
use BIPBOP;

$client = new Microservices\Client(
  "localhost",
  3000,
  Microservices\Client::PROTO_UDP,
  ['sec' => 3, 'usec' => 0]);
var_dump($client->call("mirror", "content"));
```