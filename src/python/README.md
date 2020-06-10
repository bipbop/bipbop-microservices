# Microserviços BIPBOP - Python

O objetivo desta aplicação é permitir que softwares de Machine Learning funcionem de maneira rápida, discreta e integrada nas aplicações BIPBOP.

## TL-DR

```python
from bipbop_microservices import udp_server, register_service
register_service('uppercase', lambda content: content.upper(), { type: "string" }, { type: "string" })
udp_server().serve_forever()
```
