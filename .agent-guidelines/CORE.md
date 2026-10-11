# CORE — Architettura, naming, restrizioni assolute

## Stack

| Layer             | Tecnologia                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| Frontend          | SolidJS, Vite, SCSS modules, @ark-ui/solid, @solidjs/router               |
| Web server        | Nginx (Alpine)                                                            |
| Backend           | NestJS, TypeScript                                                        |
| Worker            | NestJS standalone (no HTTP), TypeScript                                   |
| Message broker    | RabbitMQ 3                                                                |
| ORM               | TypeORM (migrations, synchronize disabilitato)                            |
| Database          | PostgreSQL 16 Alpine                                                      |
| Log collector     | Fluent Bit                                                                |
| Package condiviso | `packages/shared` — entity, RabbitMQ module, payloads, env schema, logger |
| Orchestrazione    | Docker Compose                                                            |

## Struttura del foundation

```
foundation/
├── packages/
│   └── shared/                     # package condiviso backend + worker
│       └── src/
│           ├── config/             # baseEnvSchema Zod, createEnvValidation()
│           ├── entities/
│           │   ├── infrastructure/ # Tenant, TenantAwareEntity, User, RefreshToken, AuditLog
│           │   └── domain/         # entity di business (Todo come esempio)
│           ├── interfaces/         # PaginatedResponse<T>
│           ├── logger/             # JsonLogger — structured JSON output
│           ├── payloads/
│           │   ├── infrastructure/ # placeholder
│           │   └── domain/         # TodoCreatePayload, TodoCompletedPayload
│           ├── rabbitmq/           # RabbitmqModule, RabbitmqService, constants
│           └── index.ts            # barrel export
├── frontend/
│   ├── nginx/nginx.conf
│   └── src/
│       ├── domain/                 # ← codice di dominio (business logic)
│       │   └── todos/              # feature di esempio — da rimuovere nei fork
│       │       ├── components/
│       │       ├── routes/
│       │       └── services/
│       ├── components/
│       │   ├── shared/             # ProtectedRoute
│       │   ├── UI/                 # Buttons, Checkbox, Dialog, Input, Toast
│       │   └── utility/            # Grid overlay
│       ├── layouts/MainLayout/
│       ├── lib/                    # fetchWithRefresh, toaster, websocket
│       ├── routes/login/
│       ├── services/               # auth-service.js
│       ├── store/                  # auth.store.js
│       └── styles/                 # ITCSS 4-layer SCSS
├── backend/
│   └── src/
│       ├── audit/                  # AuditSubscriber — logga INSERT/UPDATE/SOFT_DELETE
│       ├── auth/                   # JWT, guard, strategy, AppClsStore (tenantId + userId)
│       ├── common/
│       │   ├── dto/                # PaginationQueryDto
│       │   └── helpers/            # paginate.helper.ts
│       ├── config/                 # datasource.config.ts, env.config.ts (Zod)
│       ├── domain/                 # ← codice di dominio
│       │   ├── todos/              # modulo di esempio — da rimuovere nei fork
│       │   └── domain.module.ts    # importa tutti i moduli di dominio
│       ├── events/                 # WebSocket gateway + consumer RabbitMQ
│       ├── filters/                # AllExceptionsFilter globale
│       ├── health/                 # @nestjs/terminus — DB, RabbitMQ, disco
│       ├── migrations/
│       ├── seeds/                  # seed.script.ts, seed.config.ts
│       ├── tenant/                 # TenantInterceptor, TenantSubscriber, TenantModule
│       ├── users/
│       ├── app.controller.ts       # GET /api/health — non rimuovere
│       ├── app.module.ts           # AuditSubscriber + TenantSubscriber in subscribers
│       └── main.ts                 # JsonLogger, Swagger, cookie-parser, CORS
├── worker/
│   └── src/
│       ├── cleanup/                # CleanupService — @Cron pulizia refresh token
│       ├── config/                 # env.config.ts (Zod)
│       ├── todos/                  # consumer
│       ├── app.module.ts           # ScheduleModule, CleanupModule
│       └── main.ts                 # JsonLogger
├── fluent-bit/
│   ├── Dockerfile
│   └── fluent-bit.conf
├── scripts/                        # check-fork-safety.sh
├── docs/
├── .env.example
├── docker-compose.yml
└── Makefile
```

## Separazione infrastruttura / dominio

Il codice è diviso fisicamente in due aree per rendere il template forkabile:

- **Infrastruttura** — auth, audit, tenant, events, filters, config, health, common, layouts, UI, stili, logger. Gestita dal template.
- **Dominio** — entity di business, controller, servizi, pagine, componenti specifici. Vive dentro cartelle `domain/`.

`AppModule` importa solo `DomainModule` — i junior aggiungono moduli in `domain/domain.module.ts` senza toccare `app.module.ts`.

## Multi-tenancy

- DB singolo con discriminator `tenant_id` su tutte le entity di dominio
- `TenantAwareEntity` (classe astratta in shared): aggiunge `tenant_id` + `deleted_at` (soft delete)
- `TenantInterceptor`: verifica tenant attivo, scrive `tenantId` + `userId` nel CLS
- `TenantSubscriber`: auto-inject `tenant_id` su INSERT da CLS
- Worker: niente CLS, `tenant_id` dal payload RabbitMQ, settato esplicitamente sull'entity
- Tutte le query nei service filtrano per `tenant_id` (da CLS) + `user_id` (da JWT)

## Soft delete

- `@DeleteDateColumn()` su `TenantAwareEntity` — ereditato da tutte le entity di dominio
- Usare `repository.softRemove()` invece di `repository.remove()`
- Usare `repository.recover()` per ripristinare
- `find*()` esclude automaticamente i record soft-deleted
- Per includerli: `{ withDeleted: true }`

## Audit trail

- `AuditSubscriber` intercetta automaticamente INSERT/UPDATE/SOFT_DELETE su entity tenant-aware
- Persiste nella tabella `audit_log` (NON estende TenantAwareEntity)
- Campi sensibili (`password`) filtrati automaticamente
- `userId` dal CLS (null nel worker)
- Nessuna azione richiesta nei service — è trasparente

## Logging

- `JsonLogger` (in `packages/shared/src/logger/`) emette JSON su stdout
- Usato da backend e worker in `NestFactory.create()` / `createApplicationContext()`
- Fluent Bit raccoglie i log via Docker `fluentd` log driver e li scrive su file rotati

## Entity arrays

Le entity sono organizzate in due array esportati da shared:

- `infrastructureEntities` — Tenant, User, RefreshToken, AuditLog
- `domainEntities` — Todo (esempio)

Per aggiungere una nuova entity di dominio basta aggiungerla a `domainEntities` in `entities/domain/index.ts`.

## npm Workspaces

`package.json` root dichiara `"workspaces": ["packages/*", "backend", "worker"]`.
`frontend` è **escluso** — usa Vite e non condivide dipendenze npm con backend/worker.

**Prima di buildare backend o worker in locale**, `shared` deve essere compilato:

```bash
make build-packages
```

## Naming conventions

### File e cartelle

- Componenti SolidJS: `PascalCase.jsx` con `PascalCase.module.scss` co-located
- Store frontend: `camelCase.store.js` in `src/store/`
- Backend: suffissi ammessi — `module|controller|service|guard|strategy|decorator|dto|entity|config|filter|interceptor|middleware|pipe|subscriber|indicator|spec`
- Entity: sempre in `packages/shared/src/entities/` — mai nel backend o nel worker
- Test backend/worker: `*.spec.ts` co-located
- Test frontend: `*.test.js` co-located
- Cartelle `migrations/` e `seeds/`: escluse dal naming convention check

### Branch

- `ai/<descrizione-breve-kebab-case>` — branch agenti AI
- `feature/<descrizione>` — feature developer
- `fix/<descrizione>` — bugfix developer

## Lingua

- **Commenti nel codice:** inglese
- **Documentazione** (README, docs/): italiano

## File header obbligatorio

Ogni file TS/JS deve iniziare con questo blocco:

```
// ============================================================
// ROLE: [cosa fa questo file, 1 riga]
// DEPENDS ON: [file/moduli da cui dipende]
// USED BY: [chi usa questo modulo]
// KEY DECISIONS: [perché alcune scelte non ovvie]
// GOTCHAS: [trappole, edge case, comportamenti inattesi]
// LAST UPDATED: [data ISO + breve descrizione]
// ============================================================
```

## Regole ESLint

- `explicit-function-return-type`, `no-floating-promises`, `complexity` max 10, `max-lines-per-function` 50, `no-console`, `no-explicit-any`
- Override per `**/*.spec.ts`: disabilita `explicit-function-return-type`, `max-lines-per-function`, `no-unsafe-*`, `unbound-method`

## Commit

- Conventional Commits con commitlint
- `subject-case: lower-case` — nomi di librerie vanno lowercased nel subject
- Pre-commit hook con Husky + lint-staged

## Regole generali

- Non duplicare logica già esistente: cercare prima
- Prima di modificare un file esistente, leggerlo interamente
- Al termine di ogni modifica, elencare i file toccati
- Problemi fuori scope: segnalare nel summary senza sistemare autonomamente

## Gestione dipendenze

Nessuna nuova dipendenza senza approvazione esplicita. Segnalare nel summary come domanda aperta.

## Gestione ambiguità

Se un requisito è ambiguo, l'agente si ferma e formula la domanda specifica nel summary. Nessuna implementazione basata su assunzioni non dichiarate.

## File protetti — mai toccati dagli agenti

```
vite.config.*
package.json        (root e ogni sub-package)
package-lock.json
.env*               (eccetto .env.example)
docker-compose.yml
fluent-bit/
.github/workflows/*
Makefile
```
