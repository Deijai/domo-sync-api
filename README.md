# Poupa Fila DMA — API

API do sistema **Poupa Fila DMA**: gestão de fichas de atendimento médico, reserva segura contra dupla marcação, cadastro de pacientes, especialidades, profissionais, unidades de saúde e relatórios.

## Stack

- NestJS 11 + TypeScript
- Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL
- JWT (access + refresh token com rotação e hash no banco)
- Swagger/OpenAPI em `/docs`
- Helmet, CORS, Throttler (rate limit)

## Pré-requisitos

- Node.js 22+
- Docker (para o PostgreSQL)

## Como rodar

1. Suba o PostgreSQL (na raiz do repositório, um nível acima desta pasta):

   ```bash
   docker compose up -d postgres
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure o `.env` (já existe um `.env` de desenvolvimento; ajuste se necessário a partir do `.env.example`).

4. Rode a migration inicial:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Rode o seed (cria a role ADMIN com todas as permissões, o usuário admin e dados de teste — UBS Centro, Dermatologia, um profissional de teste):

   ```bash
   npm run prisma:seed
   ```

6. Suba a API em modo desenvolvimento:

   ```bash
   npm run start:dev
   ```

7. Acesse o Swagger em `http://localhost:3333/docs`.

### Login inicial (seed)

- **E-mail:** `admin@poupafiladma.local` (ou o valor de `ADMIN_EMAIL` no `.env`)
- **Senha:** `Admin@123456` (ou o valor de `ADMIN_PASSWORD` no `.env`)

Use `POST /auth/login` e depois "Authorize" no Swagger com o `accessToken` retornado.

## Rodar tudo via Docker (API + Postgres)

Na raiz do repositório:

```bash
docker compose up -d
```

## Testes

```bash
npm test
```

## Fluxo principal do domínio

1. Admin/operador cria um **lote de fichas** (`POST /tickets/batches`) para uma especialidade, profissional, unidade e data — a API gera as fichas numeradas automaticamente, todas com status `AVAILABLE`.
2. O paciente se cadastra (`POST /patients/public-register`) e loga (`POST /auth/patient-login`) pelo CPF ou e-mail.
3. O paciente lista as fichas abertas (`GET /mobile/tickets/open`) e reserva uma ficha específica (`POST /mobile/tickets/:id/reserve`).
4. A reserva é atômica: a API só marca a ficha como `RESERVED` se ela ainda estiver `AVAILABLE` dentro de uma transação (`updateMany` condicional). Se duas pessoas tentarem reservar a mesma ficha ao mesmo tempo, a segunda recebe `409 Conflict`.
5. A secretaria confirma presença (`POST /tickets/:id/confirm-presence`), marca atendimento (`POST /tickets/:id/attend`) ou falta (`POST /tickets/:id/no-show`).
6. Fichas podem ser canceladas (`POST /tickets/:id/cancel`), transferidas para outro paciente/profissional/data (`POST /tickets/:id/transfer` — gera uma nova ficha e marca a original como `TRANSFERRED`) ou reabertas (`POST /tickets/:id/reopen`).
7. Relatórios agregados ficam em `GET /reports/*` (resumo, por status, especialidade, profissional, unidade, paciente e taxa de comparecimento).

## Estrutura

```txt
src/
├── main.ts
├── app.module.ts
├── common/          # decorators, filtro global de exceções, guards, paginação, utils
├── prisma/          # PrismaService (driver adapter)
├── database/
│   └── seed.ts
└── modules/
    ├── auth/
    ├── users/
    ├── roles/
    ├── permissions/
    ├── patients/
    ├── specialties/
    ├── professionals/
    ├── health-units/
    ├── tickets/       # batches, ações administrativas e endpoints mobile
    └── reports/
```
