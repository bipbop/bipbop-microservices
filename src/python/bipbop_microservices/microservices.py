from typing import Callable, Any, Optional
from jsonschema import validate

import os
import json
import struct
import socketserver

error_codes = {
    'ServerOverloaded': 1,
    'WrongParameters': 2,
    'ServerError': 3,
    'UnknownError': 4,
    'InvalidChecksum': 5,
}

registered_services = {}

def register_service(service: str, service_function: Callable[[Any], Any], input_schema: object, output_schema: object):
  registered_services[service] = [service_function, input_schema, output_schema]

register_service('mirror', lambda payload: payload, {type: 'string'}, {'type': 'string'})

class ThreadedUDPServer(socketserver.ThreadingMixIn, socketserver.UDPServer):
  daemon_threads = False
  allow_reuse_address = True

class ServiceHandler(socketserver.DatagramRequestHandler):

  def handle_error(self, e):
    message = str(getattr(e, 'message') if hasattr(e, 'message') else "{}: an error has ocurred".  format(type(e).__name__))
    code = int(getattr(e, 'code') if hasattr(e, 'code') else error_codes['UnknownError'])
    self.write_response(json.dumps({
      'errors': [{
          'code': code,
          'description': message
      }],
      'payload': None
    }))

  def handle(self):
    try:
      response = self.internal_handle()
      self.write_response(response)
    except Exception as e:
      raise e
      # self.handle_error(e)

  def internal_handle(self) -> str:
    request_len = struct.unpack("I", self.rfile.read(4))[0]
    request = self.rfile.read(request_len)
    request_object = json.loads(request)

    payload = request_object['payload']
    service = request_object['service']

    if service not in registered_services:
      raise NotImplementedError('Service not implemented {}'.format(service))

    [service, input_schema, output_schema] = registered_services[service]
    validate(payload, input_schema)
    response_content = service(payload)
    validate(response_content, output_schema)
    return json.dumps({ 'payload': response_content })

  def write_response(self, response: str):
    self.wfile.write(struct.pack("I", len(response)) + bytes(response, encoding='utf8'))

default_host = '0.0.0.0'
default_port  = 3000

def udp_server(param_host: Optional[str] = None, param_port: Optional[int] = None) -> ThreadedUDPServer:
  env = lambda key: os.environ[key] if key in os.environ else None
  host = str(next(s for s in [param_host, env('SERVER_HOST'), default_host] if s))
  port = int(next(s for s in [param_port, env('SERVER_PORT'), default_port] if s))
  return ThreadedUDPServer((host, port), ServiceHandler)
