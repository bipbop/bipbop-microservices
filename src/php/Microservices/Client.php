<?php

namespace BIPBOP\Microservices;

/**
 * Classe do Microserviço
 */
class Client
{
    const PROTO_UDP = 'udp';
    const PROTO_TCP = 'tcp';

    private static $socketErrorConstants;

    protected static function socketErrorName($code)
    {
        if ($code === 0) {
            return null;
        }
        if (!self::$socketErrorConstants) {
            self::$socketErrorConstants = get_defined_constants(true)['sockets'];
        }
        return array_search($code, self::$socketErrorConstants, true);
    }

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
        ?array $timeout = null
    ) {
        $this->proto = $proto ?: (getenv('BIPBOP_MS_PROTO') ?? 'udp');
        $this->hostname = $hostname ?: (getenv('BIPBOP_MS_HOST') ?? 'localhost');
        $this->port = $port ?: ((int)getenv('BIPBOP_MS_PORT') ?? 3000);
        $this->timeout = $timeout ?: ['sec' => 0, 'usec' => ((int)getenv('BIPBOP_MS_TIMEOUT') ?? 3000) ];
    }

    protected function socketError(&$socketErrorCode = null)
    {
        $socketErrorCode = socket_last_error($this->socket);
        return self::socketErrorName($socketErrorCode);
    }

    protected function timeoutAt()
    {
        $time = microtime(true);
        $sec = $this->timeout['sec'] ?? 3;
        $usec = ($this->timeout['usec'] ?? 0) / 1000.;
        return $time + $sec + $usec;
    }

    protected function throwOnError($v = null, $defaultMessage = 'a fatal error occurred in microservice', $defaultCode = 0)
    {
        $socketErrorCode = null;
        $socketError = $this->socketError($socketErrorCode);

        if ($v !== false) {
            return $v;
        }

        switch ($socketError) {
            /* async */
            case 'SOCKET_EWOULDBLOCK':
            case 'SOCKET_EAGAIN':
            case 'SOCKET_EALREADY':
            case 'SOCKET_EINPROGRESS':
            case 'SOCKET_EISCONN':
            case 'MSG_TRUNC':
            case null:
                break;
            default:
                throw new Exception("socket error ${socketError} - ${$socketErrorCode}");
        }

        return $v;
    }

    protected function socketReadExpect($maxSize, $minimum) {
        $content = '';
        $timeout = $this->timeoutAt();
        while (strlen($content) < $minimum) {
            $content .= $this->socketRead($maxSize - strlen($content));
            if (strlen($content) >= $minimum) {
                return $content;
            }
            if ($timeout < microtime(true)) {
                throw new Exception('timeout occurred');
            }
            usleep(100);
        }
        return $content;
    }

    protected function socketRead($size)
    {
        $timeout = $this->timeoutAt();
        $content = false;
        while ($content === false) {
            $content = $this->throwOnError(@socket_read($this->socket, $size));
            if ($content !== false) {
                break;
            }
            if ($timeout < microtime(true)) {
                throw new Exception('timeout occurred');
            }
            usleep(100);
        }

        return $content;
    }

    /**
     * Chama por um serviço
     * @param string $service Nome do serviço
     * @param mixed $payload Dados
     * @return mixed Retorno do Serviço
     */
    public function call(string $service, $payload = null)
    {
        try {
            return $this->_call($service, $payload);
        } catch (Exception $e) {
            $this->disconnect();
            throw $e;
        }
    }

    public function _call(string $service, $payload = null)
    {
        $this->connect();

        $encode = json_encode(['service' => $service, 'payload' => $payload]);
        
        $this->throwOnError(@socket_write($this->socket, pack('I', strlen($encode)) . $encode));
        $data = $this->socketReadExpect(65535, 4);
        $bytesUnpack = @unpack("I", substr($data, 0, 4));
        $bytes = array_pop($bytesUnpack);
        if (!$bytes) throw new Exception('empty microservice response');
        $bytesPending = $bytes - (strlen($data) - 4);

        if ($this->proto !== self::PROTO_UDP) {
            $timeout = $this->timeoutAt();
            while ($bytesPending > 0) {
                $piece = $this->socketRead($this->socket, $bytesPending);
                $bytesPending -= strlen($piece);
                $data .= $piece;
                if ($bytesPending <= 0) {
                    break;
                }
                if ($timeout < microtime(true)) {
                    throw new Exception('timeout occurred');
                }
            }
        }

        $content = substr($data, 4);
        $contentSize = strlen($content);
        if ($contentSize !== $bytes) {
            throw new Exception(sprintf("Expecting a different amount of bytes, expected %d, received %d", $bytes, $contentSize));
        }

        $decode = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
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

        socket_set_nonblock($this->socket);
        socket_set_option($this->socket, SOL_SOCKET, SO_RCVTIMEO, $this->timeout);
        socket_set_option($this->socket, SOL_SOCKET, SO_SNDTIMEO, $this->timeout);

        $timeout = $this->timeoutAt();
        while (!@socket_connect($this->socket, $this->hostname, $this->port)) {
            if (in_array($this->socketError(), ['SOCKET_EISCONN'])) {
                break;
            }
            try {
                $this->throwOnError();
                if ($timeout < microtime(true)) {
                    throw new Exception('timeout ocurred');
                }
            } catch (\Exception $e) {
                $this->disconnect();
                throw $e;
            }
        }
    }

    protected function disconnect()
    {
        if ($this->socket) {
            socket_close($this->socket);
        }
        $this->socket = null;
    }

    public function __destruct()
    {
        $this->disconnect();
    }
}
