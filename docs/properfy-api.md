# Properfy API

## Base URL
- Sandbox: https://sandbox.properfy.com.br/api/
- Produção: https://sistema.dominiodaimobiliaria.com.br/api/

## Autenticação
1. POST /auth com email e senha
2. Retorna token JWT
3. Usar como Bearer Token nas demais rotas

## Credenciais Sandbox
- Email: victor.macioski@hotmail.com
- Senha: XRWGMYLMMFRF

## Endpoints Principais (a descobrir)
- GET /properties - Listar imóveis
- GET /properties/{id} - Buscar imóvel por ID
- GET /properties?reference={ref} - Buscar por referência
