import net from 'net';
import { Configuration, Client } from './Client';

const clients: Array<Client> = [];

export function createServer(configuration: Configuration) {
    const server: net.Server = net.createServer((client) => {
        clients.push(new Client(client, { server, ...configuration }));
    });
    return server;
}