import net from 'net';

import { jspack } from 'jspack';
import { validate } from 'jsonschema';
import { SendFormat } from './SendFormat';
import { ReceiveFormat, receiveSchema } from './ReceiveSchema';
import { ResponseError } from './ResponseError';
import { Services } from './Services';

export enum ApplicationState {
    Connected,
    ClientSendingJSONSize,
    ClientSendingJSON,
    Processing,
    Disconnecting,
    Disconnected
}

export interface Configuration {
    timeout: number;
    services: Services;
    maxPayloadSize: number;
    hookError: (client: net.Socket, e: Error) => any;
}

export interface ClientConfiguration extends Configuration {
    server: net.Server;
}

export class Client {
    protected readonly client: net.Socket;
    protected readonly configuration: ClientConfiguration;
    protected timeout?: NodeJS.Timeout;

    protected dataReceiver: (buffer: Buffer) => void;

    protected readonly state: {
        ApplicationState: ApplicationState;
        ApplicationNextState: ApplicationState;
        ExpectedBytes: number;
        Chunks: Array<Buffer>;
    };

    constructor(client: net.Socket, configuration: ClientConfiguration) {
        this.client = client;
        this.configuration = configuration;
        this.state = {
            ApplicationState: ApplicationState.Connected,
            ApplicationNextState: ApplicationState.ClientSendingJSONSize,
            ExpectedBytes: 4,
            Chunks: []
        };

        this.dataReceiver = (buffer) => this.receiveData(buffer);
        this.client.on('error', (e) => {
            this.disconnectError(e);
            this.configuration.hookError(this.client, e);
        });
        this.client.on('data', this.dataReceiver);
        this.client.on('close', () => this.changeState(ApplicationState.Disconnected));
        this.setTimeout();
    }

    protected clearTimeout() {
        if (this.timeout) clearTimeout(this.timeout);
    }

    protected setTimeout() {
        this.clearTimeout();
        if (!this.isConnected()) return;
        this.timeout = setTimeout(() => {
            this.disconnectClient();
        }, this.configuration.timeout);
    }

    protected changeState(state: ApplicationState, expectedBytes = 0, expectedNextState?: ApplicationState) {
        this.state.ApplicationState = state;
        this.state.ExpectedBytes = expectedBytes;
        this.state.ApplicationNextState = expectedNextState || state;
    }

    protected async writeClient(message: SendFormat) {
        if ([ApplicationState.Processing].indexOf(this.state.ApplicationState) !== -1)
        return new Promise((resolve, reject) => {
            const response = Buffer.from(JSON.stringify(message));
            const sendSize = Buffer.from(jspack.Pack("<I", [response.length]));
            this.client.write(sendSize, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.client.write(response, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            });
        });
    }

    protected async disconnectClient() {
        if (!this.isConnected()) return;
        this.changeState(ApplicationState.Disconnecting);
        this.client.off('data', this.dataReceiver);
        return new Promise((resolve, reject) => this.client.end(() => {
            this.changeState(ApplicationState.Disconnected);
            resolve();
        }));
    }

    protected async disconnectError(error?: Array<Error> | Error, clientResponse: boolean = false) {
        if (typeof error === 'undefined') {
            await this.disconnectClient();
            return;
        }

        const userError = Array.isArray(error) ? error : [error];

        userError.map(e => this.configuration.hookError(this.client, e));

        if (clientResponse) {
            await this.writeClient({
                error: userError.map(e => ResponseError.from(e)),
                payload: null
            });
        } else {
            await this.disconnectClient();
        }
    }

    protected expectChunk(data: Buffer) {
        const { ExpectedBytes } = this.state;
        this.state.Chunks.push(data);

        const bufferSize = this.state.Chunks.reduce((initialData, chunk) => initialData + chunk.length, 0);

        if (bufferSize < ExpectedBytes) {
            return null;
        }

        this.changeState(this.state.ApplicationNextState, 0);

        const buffer = Buffer.concat(this.state.Chunks, bufferSize);
        this.state.Chunks = [];
        return [buffer.slice(0, ExpectedBytes), buffer.slice(ExpectedBytes)];
    }

    get services(): Services {
        return {
            'close': {
                call: () => this.disconnectClient(),
                request: {},
                response: {}
            },
            'index': {
                call: () => receiveSchema(this.configuration.services),
                request: {},
                response: {}
            },
            ...this.configuration.services
        };        
    }

    protected async unsafeClientSendingJSON(buffer: Buffer) {
        const request = JSON.parse(buffer.toString('utf-8')) as ReceiveFormat;
        if (!request) {
            await this.disconnectClient();
            return;
        }

        const validation = validate(request, receiveSchema(this.services));
        if (!validation.valid)
            return this.disconnectError(validation.errors, true);
        const serviceResponse = await Promise.resolve(this.services[request.service].call(request.payload));

        if (this.state.ApplicationState !== ApplicationState.Processing)
            return;

        const responseValidation = validate(serviceResponse, this.services[request.service].response);
        if (!responseValidation.valid) {
            return this.disconnectError(responseValidation.errors, true);
        }
        await this.writeClient({ payload: serviceResponse });
    }

    protected isConnected() {
        return [
            ApplicationState.Disconnected,
            ApplicationState.Disconnecting
        ].indexOf(this.state.ApplicationState) == -1;
    }

    protected async clientSendingJSON(buffer: Buffer) {
        try {
            await this.unsafeClientSendingJSON(buffer);
            if (!this.isConnected()) return;
            this.changeState(ApplicationState.Connected, 4, ApplicationState.ClientSendingJSONSize);
            this.client.on('data', this.dataReceiver);
        } catch (e) {
            try {
                this.disconnectError(e, true);
            }
            catch (e) {
                this.configuration.hookError(this.client, e);
            }
        }
    }

    protected receiveData(data: Buffer): void {
        const chunks = this.expectChunk(data);
        if (!chunks) return;
        const [buffer, nextBuffer] = chunks;
        switch (this.state.ApplicationState) {
            case ApplicationState.ClientSendingJSONSize:
                const expectedBytes = jspack.Unpack('<I', buffer, 0).pop() || 0;
                if (expectedBytes > this.configuration.maxPayloadSize)
                    this.disconnectError(new Error('Payload too long'), true);
                this.changeState(ApplicationState.ClientSendingJSON, expectedBytes);
                break;
            case ApplicationState.ClientSendingJSON:
                this.client.off('data', this.dataReceiver);
                this.changeState(ApplicationState.Processing, 0);
                this.clearTimeout();
                this.clientSendingJSON(buffer);
                this.setTimeout();
                break;
        }
        if (nextBuffer.length !== 0) this.receiveData(nextBuffer);
    }
}
