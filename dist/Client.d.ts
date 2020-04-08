/// <reference types="node" />
import net from 'net';
import { SendFormat } from './SendFormat';
import { Services } from './Services';
export declare enum ApplicationState {
    Connected = 0,
    ClientSendingJSONSize = 1,
    ClientSendingJSON = 2,
    Processing = 3,
    Disconnecting = 4,
    Disconnected = 5
}
declare type HookError = (client: net.Socket, e: Error) => any;
export interface Configuration {
    timeout: number;
    services: Services;
    maxPayloadSize: number;
    hookError: HookError;
}
export interface ClientConfiguration extends Configuration {
    server: net.Server;
}
export declare class Client {
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
    constructor(client: net.Socket, configuration: ClientConfiguration);
    protected clearTimeout(): void;
    protected setTimeout(): void;
    protected changeState(state: ApplicationState, expectedBytes?: number, expectedNextState?: ApplicationState): void;
    protected writeClient(message: SendFormat): Promise<unknown>;
    protected disconnectClient(): Promise<unknown>;
    protected disconnectError(error?: Array<Error> | Error, clientResponse?: boolean): Promise<void>;
    protected expectChunk(data: Buffer): Buffer[] | null;
    get services(): Services;
    protected unsafeClientSendingJSON(buffer: Buffer): Promise<void>;
    protected isConnected(): boolean;
    protected clientSendingJSON(buffer: Buffer): Promise<void>;
    protected receiveData(data: Buffer): void;
}
export {};
