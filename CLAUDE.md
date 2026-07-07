# CLAUDE.md — Backend API

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT + Refresh Token
- Swagger/OpenAPI

## Estrutura obrigatória

```txt
src
├── main.ts
├── app.module.ts
├── config
├── common
│   ├── decorators
│   ├── filters
│   ├── guards
│   ├── interceptors
│   ├── pipes
│   └── utils
├── prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules
    ├── auth
    ├── users
    ├── roles
    ├── patients
    ├── specialties
    ├── doctors
    ├── health-units
    ├── ticket-batches
    ├── appointment-tickets
    ├── waitlist
    ├── dashboard
    └── audit
```

## Padrão de módulo

Todo módulo deve ter:

```txt
module.ts
controller.ts
service.ts
repository.ts
dto
mapper.ts
```

## Regras

- Controller não tem regra de negócio.
- Service concentra regras.
- Repository acessa Prisma.
- DTO valida entrada.
- Mapper transforma entidade em response.
- Swagger em todos os endpoints.
- Erros padronizados.
- Não retornar passwordHash.
- Usar transações para operações críticas.

## Endpoint de retirada de ficha

Usar `$transaction` e SQL raw com `FOR UPDATE SKIP LOCKED` quando necessário.

Nunca entregar ficha sem transação.
