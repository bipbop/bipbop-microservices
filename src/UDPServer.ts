import udp from 'dgram'
import { crc32 } from 'crc';
import { Services } from './Services';
import { ReceiveFormat, receiveSchema } from './ReceiveSchema';
import { validate } from 'jsonschema';
import { SendFormat, ResponseErrors } from './SendFormat';
import { ResponseError } from './ResponseError';
import { jspack } from 'jspack';

type HookError = (client: udp.RemoteInfo, e: Error) => any;

export function udpServer(services: Services, udpSocket: udp.Socket, hookError?: HookError) {
    const schema = receiveSchema(services);
    udpSocket.on('message', async (msg, clientInformation) => {

        const payload = msg.slice(4);

        const respond = (response: SendFormat) => {
            const responseString = Buffer.from(JSON.stringify(response));
            const responseBuffer = Buffer.concat([
                Buffer.from(jspack.Pack("<I", [responseString.length])) /* crc32 request */,
                responseString /* response */
            ]);
            udpSocket.send(responseBuffer, clientInformation.port, clientInformation.address, (error, bytes) => {
                if (!hookError) return;
                if (error) hookError(clientInformation, error);
                if (bytes !== responseBuffer.length) {
                    hookError(clientInformation, new Error(`wrong byte size, expected ${responseBuffer.length}, writed ${bytes}`));
                }
            });
        }

        const respondError = (e: Array<ResponseError | Error> | ResponseError | Error) => {
            if (Array.isArray(e) && !e.length) throw new TypeError('at least one error is needed')
            const useError = Array.isArray(e) ? e.map(e => ResponseError.from(e)) : [ResponseError.from(e)];
            if (hookError) useError.forEach(e => hookError(clientInformation, e))
            respond({ errors: useError as ResponseErrors, payload: null });
        }

        const content = JSON.parse(payload.toString('utf-8')) as ReceiveFormat;
        const contentValidation = validate(content, schema);
        if (!contentValidation.valid) {
            respondError(contentValidation.errors);
            return;
        }

        const response = await Promise.resolve(services[content.service].call(content.payload));
        const responseValidation = validate(response, services[content.service].response);

        if (!responseValidation.valid) {
            respondError(responseValidation.errors);
            return;
        }

        respond({ payload: response });
    });
}