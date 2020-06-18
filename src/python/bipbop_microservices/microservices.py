import json
import logging
import os
import socketserver
import struct
from multiprocessing import TimeoutError
from multiprocessing.pool import ThreadPool
from typing import Any, Callable, Dict, Optional, Tuple, Union

from jsonschema import validate

__all__ = ['udp_server', 'tcp_server', 'register_service']


class ErrorCodes:
    SERVER_OVERLOADED = 1
    WRONG_PARAMETERS = 2
    SERVER_ERROR = 3
    UNKNOWN_ERROR = 4
    INVALID_CHECKSUM = 5


registered_services = {}


def register_service(service: str, service_function: Callable[[Any], Any], input_schema: object, output_schema: object):
    registered_services[service] = [
        service_function,
        input_schema,
        output_schema
    ]


register_service('mirror', lambda payload: payload,
                 {'type': 'string'},
                 {'type': 'string'})


def _get_attr(obj, key, default_error):
    return getattr(obj, key) if hasattr(obj, key) else default_error


class GenericBaseHandler:
    def _read_payload(self, request_len: int) -> str:
        raise NotImplementedError('request_len not implemented')

    def _payload_len(self) -> int:
        raise NotImplementedError('request_len not implemented')

    def _write_response(self, response: str):
        raise NotImplementedError('write_response not implemented')

    def _generic_error(self, e):
        return "{}: an error has ocurred".format(type(e).__name__)

    def _handle_error(self, e):
        logging.exception(e)

        message = None
        code = ErrorCodes.UNKNOWN_ERROR

        message = str(_get_attr(e, 'message', self._generic_error(e)))
        if isinstance(e, EOFError):
            code = ErrorCodes.INVALID_CHECKSUM
        else:
            code = int(_get_attr(e, 'code', code))

        self._write_response(json.dumps({
            'errors': [{
                'code': code,
                'description': message
            }],
            'payload': None
        }))

    def _get_request(self) -> Union[str, None]:
        request_len = self._payload_len()
        if not request_len:
            return None
        request = self._read_payload(request_len)

        if request_len < len(request):
            raise EOFError('incomplete package')

        return json.loads(request)

    def _internal_handle(self) -> str:
        request_object = self._get_request()
        if request_object is None:
            return

        payload = request_object['payload']
        service = request_object['service']

        if service not in registered_services:
            raise NotImplementedError(
                'Service not implemented {}'.format(service))

        [service, input_schema, output_schema] = registered_services[service]
        validate(payload, input_schema)
        response_content = service(payload)
        validate(response_content, output_schema)
        return json.dumps({'payload': response_content})

    def handle(self):
        try:
            response = self._internal_handle()
            self._write_response(response)
        except EOFError:
            pass
        except BrokenPipeError:
            pass
        except Exception as e:
            self._handle_error(e)


class TCPServiceHandler(GenericBaseHandler, socketserver.BaseRequestHandler):

    def handle(self):
        while True:
            super().handle()

    def _read_payload(self, request_len: int) -> str:
        data = self.request.recv(request_len)
        while len(data) < request_len:
            data += self.request.recv(request_len - len(data))
        return data

    def _payload_len(self):
        response = self.request.recv(4)
        if len(response) == 0:
            return 0
        if len(response) < 4:
            raise EOFError
        return struct.unpack("I", response)[0]

    def _write_response(self, response: str):
        self.request.sendall(struct.pack("I", len(response)) +
                             bytes(response, encoding='utf8'))


class UDPServiceHandler(GenericBaseHandler, socketserver.DatagramRequestHandler):
    def _read_payload(self, request_len: int):
        return self.rfile.read(request_len)

    def _payload_len(self) -> str:
        response = self.rfile.read(4)
        if len(response) == 0:
            return 0
        if len(response) < 4:
            raise EOFError
        return struct.unpack("I", response)[0]

    def _write_response(self, response: str):
        self.wfile.write(struct.pack("I", len(response)) +
                         bytes(response, encoding='utf8'))


class GenericServer(socketserver.ThreadingMixIn):
    request_queue_size = 20
    allow_reuse_address = True
    daemon_threads = False
    timeout = 10


class ThreadedTCPServer(GenericServer, socketserver.TCPServer):
    pass


class ThreadedUDPServer(GenericServer, socketserver.UDPServer):
    pass


_default_host = '0.0.0.0'
_default_port = 3000


def _env(key):
    return os.environ[key] if key in os.environ else None


def _first(*args):
    return next(s for s in args if s)


def listener_config(param_host: Optional[str] = None, param_port: Optional[int] = None) -> Tuple[str, int]:
    host = str(_first(param_host, _env('SERVER_HOST'), _default_host))
    port = int(_first(param_port, _env('SERVER_PORT'), _default_port))
    return (host, port)


def tcp_server(host: Optional[str] = None, port: Optional[int] = None) -> ThreadedTCPServer:
    return ThreadedTCPServer(listener_config(host, port), TCPServiceHandler)


def udp_server(host: Optional[str] = None, port: Optional[int] = None) -> ThreadedUDPServer:
    return ThreadedUDPServer(listener_config(host, port), UDPServiceHandler)
