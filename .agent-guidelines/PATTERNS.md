# PATTERNS — Pattern specifici dello stack

## Componenti SolidJS

### Struttura cartella

Ogni componente risiede nella propria cartella con questi file co-located:

```
src/components/
└── MyComponent/
    ├── MyComponent.jsx
    └── MyComponent.module.scss
```

### Regole componente

- Esportare una singola funzione **named** — nessun `default export`
- Non superare le **150 righe** — se più lungo, suddividere in sotto-componenti
- Non importare direttamente da cartelle di componenti fratelli
- Le props devono avere tipo esplicito o essere destrutturate con valori di default chiari
- Niente logica di business nel componente — delegare a store o service

### Signals e reattività

```jsx
// ✓ Signal locale al componente
const [count, setCount] = createSignal(0);

// ✓ Effetto con cleanup esplicito
createEffect(() => {
  const timer = setInterval(() => setCount((c) => c + 1), 1000);
  onCleanup(() => clearInterval(timer));
});

// ✗ Non usare signals per stato derivabile
const [doubled, setDoubled] = createSignal(0); // sbagliato
const doubled = createMemo(() => count() * 2); // corretto
```

### Conditional rendering

```jsx
// ✓ <Show> per boolean
<Show when={isLoading()} fallback={<Content />}>
  <Spinner />
</Show>

// ✓ <For> per liste — mai .map() nel JSX
<For each={items()}>{(item) => <Item {...item} />}</For>

// ✓ <Switch>/<Match> per casi multipli
<Switch fallback={<NotFound />}>
  <Match when={status() === 'loading'}><Spinner /></Match>
  <Match when={status() === 'error'}><Error /></Match>
</Switch>
```

### Path alias frontend

```javascript
'@components' → src/components
'@services'   → src/services
'@styles'     → src/styles
'@lib'        → src/lib
'@domain'     → src/domain
```

## Store e Signals

### Struttura

Gli store globali risiedono in `src/store/` con naming `camelCase.store.js`.

### Pattern store

```javascript
// ✓ createStore per stato complesso (oggetti/array)
import { createStore } from 'solid-js/store';

const [cart, setCart] = createStore({ items: [], total: 0 });

export function addItem(item) {
  setCart('items', (items) => [...items, item]);
  setCart('total', (t) => t + item.price);
}
export { cart };
```

### Regole store

- Uno store per dominio — non creare store omnibus
- Non esporre setter direttamente: wrappare in funzioni named con semantica di dominio
- Derivazioni di stato: sempre `createMemo`, mai ricalcolare nel componente
- Niente side effect nei setter — usare `createEffect` nel punto di utilizzo

## SCSS e stili

### Architettura ITCSS 4-layer

```
src/styles/
├── 01-abstractions/    # variabili, funzioni, placeholder
├── 02-theme/           # token semantici (_map.scss)
├── 03-base/            # reset, elementi HTML
└── 04-utilities/       # classi utility
```

`02-theme/_map.scss` è iniettato globalmente via `vite.config.js` — disponibile senza import nei `.module.scss`.

### Regole SCSS

- Usare **SCSS modules** per tutti gli stili dei componenti, niente inline style
- Il file `.module.scss` si chiama come il componente
- Niente classi globali dal modulo di un componente — tutto scoped
- **Mai `border` su elementi con `border-radius`** — usare `box-shadow: inset 0 0 0 <width> <color>`

## Chiamate API — frontend

- Usare sempre `fetchWithRefresh` da `src/lib/fetchWithRefresh.js` — mai `fetch` diretto
- Sempre `credentials: 'include'` in ogni chiamata
- Usare path relativi — mai hostname hardcoded
- `POST /api/todos` risponde `202 Accepted`: il todo arriva via WebSocket, non nella risposta HTTP
- Endpoint `202` e `204`: non chiamare `.json()` — non hanno body

## Componenti UI (Ark UI)

- I componenti UI wrappano Ark UI — import per-component: `import { Field } from '@ark-ui/solid/field'`
- Esportati con barrel export da `components/UI/index.js`
- Non importare `@ark-ui/solid` direttamente nelle feature — passare sempre dai wrapper UI
- Styling con CSS modules e data attributes Ark (`data-scope`, `data-part`, `data-type`)

## Backend NestJS

### Struttura modulo di dominio

Ogni feature va in `backend/src/domain/<nome-modulo>/`:

```
backend/src/domain/
└── calls/
    ├── calls.module.ts
    ├── calls.controller.ts
    ├── calls.service.ts
    ├── calls.service.spec.ts
    └── dto/
        ├── create-call.dto.ts
        └── update-call.dto.ts
```

Registrare in `domain/domain.module.ts` — non toccare `app.module.ts`.

**Le entity non stanno nel backend** — vivono in `packages/shared/src/entities/domain/`. Importare sempre da `@foundation/shared`.

### Regole backend

- Tutta la logica di business nel **service**, mai nel controller
- Validazione input con DTO e `class-validator`
- `ValidationPipe` globale: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Return type espliciti obbligatori su tutti i metodi (regola ESLint)
- Usare `HttpException` o eccezioni NestJS standard — niente `throw new Error` grezzo

### Proteggere una route

**Default-deny** (R8 fase 2a): `JwtGuard` è registrato come `APP_GUARD` globale, quindi ogni controller è protetto per default. **Mai** `@UseGuards(JwtGuard)` su controller o handler. Le route pubbliche si marcano con `@Public()` (da `backend/src/auth/decorators/public.decorator.ts`) — sul singolo handler, non sulla classe, a meno che l'intero controller non sia pubblico:

```typescript
@Controller('/nome')
export class NomeController {
  @Get('/')
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponse<MyEntity>> {
    return this.service.findAll(user.id, query.page, query.pageSize);
  }

  @Public()
  @Get('/public')
  findPublic(): Promise<MyEntity[]> {
    return this.service.findPublic();
  }
}
```

### Filtrare per tenant nei service

```typescript
@Injectable()
export class NomeService {
  constructor(
    @InjectRepository(Entita)
    private readonly repo: Repository<Entita>,
    private readonly cls: ClsService<AppClsStore>
  ) {}

  private get tenantId(): string {
    return this.cls.get('tenantId');
  }

  // Tutte le query filtrano SEMPRE per tenant_id + user_id
  findAll(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<Entita>> {
    return paginate(
      this.repo,
      { where: { user_id: userId, tenant_id: this.tenantId } },
      page,
      pageSize
    );
  }

  // Soft delete — mai remove() fisico
  async remove(id: string, userId: string): Promise<void> {
    const entity = await this.findOne(id, userId);
    await this.repo.softRemove(entity);
  }

  // Restore — richiede withDeleted: true
  async restore(id: string, userId: string): Promise<Entita> {
    const entity = await this.repo.findOne({
      where: { id, user_id: userId, tenant_id: this.tenantId },
      withDeleted: true,
    });
    if (!entity) throw new NotFoundException();
    if (!entity.deleted_at) throw new NotFoundException('Non è eliminato');
    return this.repo.recover(entity);
  }
}
```

### DTO

- `create-nome.dto.ts` per POST
- `update-nome.dto.ts` estende `PartialType(CreateNomeDto)` per PATCH
- I DTO restano nel backend — sono contratti HTTP, non di dominio

### Rate limiting

- `@SkipThrottle()` per endpoint ad alta frequenza (refresh, me, health)
- `@Throttle({ default: { ttl: 60000, limit: N } })` per override per-route

## Entity — packages/shared

- Vivono **esclusivamente** in `packages/shared/src/entities/`
- Entity di dominio in `entities/domain/`, infrastrutturali in `entities/infrastructure/`
- Entity di dominio **devono** estendere `TenantAwareEntity` (eredita `tenant_id` + `deleted_at` + audit trail)
- `@PrimaryGeneratedColumn('uuid')` su tutti gli id
- Sempre `@CreateDateColumn()` e `@UpdateDateColumn()`
- Usare `!` (definite assignment) su tutte le proprietà
- Aggiungere all'array `domainEntities` in `entities/domain/index.ts`
- Dopo ogni modifica: `make build-packages` → generare migration

**Aggiungere una nuova entity di dominio:**

1. Creare il file in `packages/shared/src/entities/domain/`, estendere `TenantAwareEntity`
2. Aggiungerla all'array `domainEntities` e all'export in `entities/domain/index.ts`
3. `make build-packages`
4. `DB_HOST=localhost npm run migration:generate --workspace=backend -- src/migrations/NomeMigration`

## Worker NestJS

- Nessun HTTP server — `NestFactory.createApplicationContext(AppModule, { logger: new JsonLogger() })`
- `synchronize: false` in TypeORM — non gestisce lo schema
- `ScheduleModule.forRoot()` per job periodici (`@nestjs/schedule`)
- Ogni consumer implementa `OnModuleInit` e chiama `createConsumerChannel` in `onModuleInit()`

### Pattern consumer

```typescript
export class MyConsumer implements OnModuleInit {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
    @InjectRepository(MyEntity)
    private readonly repo: Repository<MyEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitmqService.createConsumerChannel(
      QUEUES.MY_ACTION,
      ROUTING_KEYS.MY_ACTION,
      this.handleAction.bind(this)
    );
  }

  private async handleAction(msg: ConsumeMessage): Promise<void> {
    const payload = JSON.parse(msg.content.toString()) as MyActionPayload;

    // SEMPRE settare tenant_id dal payload — il worker non ha CLS
    const entity = this.repo.create({
      ...data,
      tenant_id: payload.tenantId,
    });
    await this.repo.save(entity);

    // Pubblicare completed con tenantId per notifica WebSocket
    await this.rabbitmqService.publish(ROUTING_KEYS.MY_COMPLETED, {
      userId: payload.userId,
      tenantId: payload.tenantId,
      entity,
    });
  }
}
```

## RabbitMQ

### Aggiungere una nuova queue

1. Aggiungere costante in `packages/shared/src/rabbitmq/rabbitmq.constants.ts` (sia `QUEUES` che `ROUTING_KEYS`)
2. Aggiungere il payload in `packages/shared/src/payloads/domain/` — includere sempre `tenantId: string`
3. Pubblicare dal backend tramite `RabbitmqService.publish()`
4. Creare consumer nel worker
5. `make build-packages`
6. Nel backend, aggiungere handler in `EventsConsumer` per la queue `*.completed`

### Comportamento su errore

`nack(msg, false, false)` — va al DLX senza requeue. Ispezionabile su `http://localhost:15672`.

## Testing

- Backend: Jest + `@nestjs/testing`. File `.spec.ts` co-located.
- Worker: Jest + `@nestjs/testing`. File `.spec.ts` co-located.
- Frontend: Vitest integrato in `vite.config.js`. File `.test.js` co-located.
- Pattern: mock repository con `getRepositoryToken()`, mock CLS con `useValue`, `jest.mock()` per funzioni importate
- Comandi: `make test` (tutti), `make test-backend`, `make test-worker`, `make test-frontend`
