/// <reference types="node" />
import udp from 'dgram';
import { Services } from './Services';
declare type HookError = (client: udp.RemoteInfo, e: Error) => any;
export declare function udpServer(services: Services, udpSocket: udp.Socket, hookError?: HookError): void;
export {};
