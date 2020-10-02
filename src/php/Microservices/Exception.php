<?php

namespace BIPBOP\Microservices;

class Exception extends \Exception {
    const CODE_TIMEOUT = 1;
    const CODE_JSON = 2;
    const CODE_SERVICE = 3;
    const CODE_PAYLOAD = 4;
    const CODE_EMPTY_RESPONSE = 5;
    const CODE_NO_RETRY = 5;
}
