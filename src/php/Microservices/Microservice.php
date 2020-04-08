<?php

namespace BIPBOP\Microservices;

/**
 * Classe do Microserviço
 */
class Microservice
{
    const PROTO_UDP = 'udp';
    const PROTO_TCP = 'tcp';

    protected $socket;
    protected $proto;
    protected $hostname;
    protected $port;
    protected $timeout;

    protected static $instances = [];

    /**
     * Obtém a instância de um objeto
     * @param int $port Porta do microserviço
     * @param string $hostname Endereço IP ou HOSTNAME do microserviço
     * @param string $proto tcp ou udp
     */
    public static function getInstance(?string $hostname = null, ?int $port = null, ?string $proto = null): self
    {
        $key = sprintf(
            "%s:%s:%d",
            $proto ?: (getenv('BIPBOP_MS_PROTO') ?? 'udp'),
            $hostname ?: (getenv('BIPBOP_MS_HOST') ?? 'localhost'),
            $port ?: ((int)getenv('BIPBOP_MS_PORT') ?? 3000)
        );
        if (!isset(static::$instances[$key])) {
            static::$instances[$key] = new self($hostname, $port);
        }
        return static::$instances[$key];
    }

    /**
     * Contrói um novo objeto
     * @param int $port Porta do microserviço
     * @param string $hostname Endereço IP ou HOSTNAME do microserviço
     * @param string $proto tcp ou udp
     */
    public function __construct(
        ?string $hostname = null,
        ?int $port = null,
        ?string $proto = null,
        ?int $timeout = null
    ) {
        $this->proto = $proto ?: (getenv('BIPBOP_MS_PROTO') ?? 'udp');
        $this->hostname = $hostname ?: (getenv('BIPBOP_MS_HOST') ?? 'localhost');
        $this->port = $port ?: ((int)getenv('BIPBOP_MS_PORT') ?? 3000);
        $this->timeout = $timeout ?: ['sec' => 0, 'usec' => ((int)getenv('BIPBOP_MS_TIMEOUT') ?? 3000) ];
    }

    protected function throwError($v = null)
    {
        if ($v !== false) {
            return $v;
        }
        $error = error_get_last();
        if (!$error) {
            return;
        }
        $this->disconnect();
        throw new Exception($error['message']);
    }

    /**
     * Chama por um serviço
     * @param string $service Nome do serviço
     * @param mixed $payload Dados
     * @return mixed Retorno do Serviço
     */
    public function call(string $service, $payload = null)
    {
        $socket = $this->connect();

        $encode = json_encode(['service' => $service, 'payload' => $payload]);
        
        $this->throwError(@socket_write($socket, pack('I', strlen($encode)) . $encode));
    
        $data = $this->throwError(@socket_read($socket, 65507));
        $bytes = unpack("I", substr($data, 0, 4));
        $int = array_pop($bytes);
    
        $content = substr($data, 4);

        if ($this->proto !== self::PROTO_UDP) {
            while ($int > strlen($content)) {
                $content .= $this->throwError(socket_read($socket, $int - strlen($content)));
            }
        }

        $contentSize = strlen($content);
        if ($contentSize !== $int) {
            $this->disconnect();
            throw new Exception(sprintf("Expecting a different amount of bytes, expected %d, received %d", $int, $contentSize));
        }

        $decode = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->disconnect();
            throw new Exception(json_last_error_msg());
        }

        if (isset($decode['errors'])) {
            $message = implode("\n", array_map(function ($errors) {
                return $errors['description'];
            }, $decode['errors']));
            throw new Exception($message);
        }

        return $decode['payload'];
    }

    protected function connect()
    {
        if ($this->socket) {
            return $this->socket;
        }
        if ($this->proto == self::PROTO_UDP) {
            $this->socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
        } else {
            $this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        }

        socket_set_option($this->socket, SOL_SOCKET, SO_RCVTIMEO, $this->timeout);

        if (!@socket_connect($this->socket, $this->hostname, $this->port)) {
            $this->disconnect();
            $this->throwError();
            return;
        }


        return $this->socket;
    }

    protected function disconnect()
    {
        try {
            if ($this->socket && $this->proto != self::PROTO_UDP) {
                $this->call('close');
            }
        } catch (\Exception $e) {
            /* pass */
        } finally {
            if ($this->socket) {
                socket_close($this->socket);
            }
            $this->socket = null;
        }
    }

    public function __destruct()
    {
        $this->disconnect();
    }
}
