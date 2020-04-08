#!/usr/bin/env node
const dgram = require('dgram');
const { udpServer } = require('../dist/UDPServer');
const serverPort = parseInt(process.env.BIPBOP_MS_PORT || '3000', 10);
const server = dgram.createSocket('udp4');
udpServer(require('./services'), server, (client, e) => console.error(client, e));
server.bind(serverPort);
