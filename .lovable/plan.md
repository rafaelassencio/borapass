Vou implementar em uma única fase (com aprovação da migração de banco antes do código).

## 1. Banco de dados (nova migração)

**Novo enum de papéis** — adicionar valores ao `app_role`:
- `admin`, `support`, `partner`, `user`, `premium` (Viajante = `user`, Viajante Premium = `premium`).

**Nova tabela `cities`**
- Campos: `name`, `state`, `slug`, `active`, `sort_order`.
- RLS: público lê ativas; admin/support gerenciam.

**Alterações em `listings`**
- Coluna `status` (`pending` | `approved` | `rejected`) default `pending`.
- Coluna `city_id` (FK opcional para `cities`).
- Ajuste RLS: público vê apenas `active = true AND status = 'approved'`; parceiro vê e edita apenas os próprios (qualquer status); admin/support aprovam/rejeitam.

**Nova tabela `notifications`**
- Campos: `user_id`, `type` (`event_today` | `coupon_available` | `coupon_nearby` | `listing_approved` | `listing_rejected`), `title`, `body`, `listing_id`, `read_at`.
- RLS: usuário lê/atualiza as próprias; sistema (service_role) insere.

**Novas funções**
- `has_role` já existe; adiciono helper `is_staff()` = admin ou support.
- Trigger em `listings` para criar notificação ao parceiro quando `status` muda para approved/rejected.
- Trigger diário (via `pg_cron`) — opcional; se pesado, gero notificações client-side ao abrir Home + Web Push somente para eventos de hoje detectados server-side em uma server function chamada pelo cliente.

## 2. Notificações (Web Push)

Como o app roda em navegador, uso a Notifications API nativa (não FCM/APNs — evita configuração de serviço externo nesta fase):
- Pedir permissão em `/perfil` com um toggle "Ativar notificações".
- Uma server function (`src/lib/notifications.functions.ts`) retorna notificações não lidas + eventos de hoje + cupons novos (últimas 24h) ou próximos (mesma cidade do perfil).
- Home dispara ao carregar: chama a fn, mostra `new Notification(...)` para as não vistas e marca como lidas.
- Bell no header do Home mostra badge com contagem.

Sem service worker persistente (fora do escopo pedido: alerta enquanto o app está aberto). Se quiser push offline real, é fase separada (FCM).

## 3. Painel Admin — novos menus

`/admin` ganha abas:
- **Usuários** (já existe) — expandido para papéis `admin/support/partner/user/premium`, filtro por papel.
- **Cidades** (novo) — CRUD.
- **Aprovações** (novo) — lista `listings` com `status = pending`, botões Aprovar / Rejeitar.
- **Anúncios** (já existe).

Suporte tem acesso a Aprovações + Usuários (somente leitura de admins; pode gerenciar user/premium/partner).

## 4. Painel Parceiro

- Ao criar/editar anúncio, `status` volta a `pending`.
- Badge visível: Pendente / Aprovado / Rejeitado.
- Bloqueio para não parceiros mantido.

## 5. Home — seletor de cidade

- Nome da cidade no header vira botão → abre bottom sheet com lista de `cities` ativas.
- Cidade selecionada persiste em `localStorage` + atualiza `profiles.city` se logado.
- Todas as listas públicas passam a filtrar por cidade selecionada.

## Detalhes técnicos

- Migração única com GRANTs para cada nova tabela.
- Hooks React Query novos: `useCities`, `useNotifications`, `usePendingListings`.
- `useRoles` atualizada para incluir `isSupport`, `isPremium`.
- Rotas afetadas: `src/routes/index.tsx`, `src/routes/admin.tsx`, `src/routes/parceiro.tsx`, `src/routes/perfil.tsx`, e todas as `*.index.tsx` (filtro cidade + status approved).
- Sem alteração em `client.ts`, `types.ts` (regenerado após migração).

## Fora do escopo desta fase

- Push notifications reais em background (FCM/service worker).
- Diferenciação de features entre Viajante e Viajante Premium (só o papel é criado; UI de upgrade fica para depois).
- Chat de suporte.

Confirma para eu começar pela migração?
