/// <reference types="node" />
import net from 'net';
import { Configuration } from './Client';
export declare function createServer(configuration: Configuration): net.Server;
