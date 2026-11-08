# Mini-SIEM

Uma frase sobre o que é e para que serve.

![Painel](docs/painel.png)

## Funcionalidades
- (o que deteta, como alerta, o que mostra)

## Arquitetura
auth.log → watcher (Node.js) → MySQL → regras de deteção → Telegram
                                      → API (Express) → painel (React)

## Decisões de segurança
- (SQL injection, XSS, menor privilégio, segredos, firewall, Docker ligado a 127.0.0.1...)

## Como instalar
(passos: clonar, .env, docker compose, npm install, build, systemd)

## O que aprendi / próximos passos