import udp from 'dgram'
import { crc32 } from 'crc';
import { Services } from './Services';
import { ReceiveFormat, receiveSchema } from './ReceiveSchema';
import { validate } from 'jsonschema';
import { SendFormat } from './SendFormat';

export function udpServer(services: Services, udpSocket: udp.Socket) {
    const schema = receiveSchema(services);
    udpSocket.on('message', async (msg, clientInformation) => {

        const respond = (response: SendFormat) => {
            const responseString = JSON.stringify(response);
            udpSocket.send(
                Buffer.concat([checksum, Buffer.from(crc32(responseString).toString(16)), Buffer.from(responseString)]),
                clientInformation.port, clientInformation.address);
        }

        const payload = msg.slice(16);
        const checksum = msg.slice(0, 16);
        const checksumConfirm = crc32(payload).toString(16);
        if (checksum.toString('ascii') !== checksumConfirm) return;
        const content = JSON.parse(payload.toString('utf-8')) as ReceiveFormat;
        const contentValidation = validate(content, schema);
        if (!contentValidation.valid) return;
        const response = await Promise.resolve(services[content.service].call(content));
        const responseValidation = validate(response, schema);

        if (!responseValidation.valid) return;
        respond({payload: response});
    });
}