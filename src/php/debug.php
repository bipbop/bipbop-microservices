<?php

require 'Microservices/Exception.php';
require 'Microservices/Client.php';

$client = new BIPBOP\Microservices\Client(
    "10.0.0.1",
    3000,
    BIPBOP\Microservices\Client::PROTO_UDP,
    ['sec' => 1, 'usec' => 0]);

var_dump($client->call("entidades", "Réu"));