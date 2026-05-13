## Objetivo

Substituir a camada atual de autenticação/permissões (que está espalhada entre `profiles.role`, `profiles.is_superadmin`, `account_members.role`, `school_memberships.role` e a RPC `get_user_access`) por um modelo único, previsível e seguro, mantendo:

- Login funcional e estável (sem loops, sem timeouts).
- Multi-tenant por `school_id` (todas as RLS continuam operando via `current_school_id()`).
- Os 10 papéis atuais: `superadmin, owner, admin, administracao, secretaria, coordenador, diretor, professor, psicologo, auxiliar`.
- Cadastro por **auto-cadastro com aprovação** (novo).

## Arquitetura final

```text
auth.users (Supabase)
   │
   ├── public.profiles            → dados pessoais (nome, foto, telefone)
   │                                NÃO contém role nem is_superadmin
   │
   └── public.user_roles          → ÚNICA fonte de verdade de papéis
        (user_id, school_id, role app_role, status, created_at)
        - status: pending | active | rejected | suspended
        - school_id NULL apenas para superadmin global
```

Funções SECURITY DEFINER (sem recursão):
- `public.has_role(_user_id uuid, _school_id uuid, _role app_role) → boolean`
- `public.is_superadmin(_user_id uuid) → boolean`
- `public.current_school_id() → uuid` (reescrita para ler de `user_roles` ativo)
- `public.get_my_access() → table(role, school_id, status)` — substitui a antiga `get_user_access`

## Fases

### Fase 1 — Banco (migration única, reversível)

1. Criar enum `public.app_role` com os 10 papéis e enum `public.role_status` (pending/active/rejected/suspended).
2. Criar tabela `public.user_roles` com unique `(user_id, school_id, role)` e índices.
3. Criar funções `has_role`, `is_superadmin`, `current_school_id`, `get_my_access`.
4. **Migrar dados existentes** para `user_roles`:
   - `profiles.is_superadmin = true` → role `superadmin`, school_id NULL, status `active`.
   - `account_members` → role correspondente, school_id = `account_id`, status `active`.
   - `school_memberships` (status `ativo`) → role correspondente, status `active`.
5. RLS na própria `user_roles`: o usuário lê só os próprios; admins/owners da escola gerenciam os da sua escola; superadmin gerencia tudo.
6. Manter `account_members` e `school_memberships` **intocados** por enquanto (compatibilidade). RLS de outras tabelas continuam usando `current_school_id()`, que agora lê de `user_roles`.

### Fase 2 — Edge Function de aprovação

- `signup-request`: chamada após `signUp`; cria linha em `user_roles` com `status = 'pending'` para a escola escolhida no formulário, role solicitada.
- `approve-user` / `reject-user`: chamada por owner/admin; muda `status` para `active`/`rejected`.
- Manter a `create-user` atual para convites diretos (admin cria já aprovado).

### Fase 3 — Frontend

- `src/contexts/AuthContext.tsx`: reescrever, simples e linear.
  - `onAuthStateChange` define só `session`.
  - Um único `useEffect` que, quando há `session`, chama `supabase.rpc('get_my_access')` com `.maybeSingle()` e timeout de 8s.
  - Estados: `loading`, `session`, `role`, `schoolId`, `status`.
- `src/pages/auth/Login.tsx`: simplificar — só `signInWithPassword` + redirect baseado em `dashboardRole`. Quando `status='pending'` → `/aguardando-aprovacao`. Quando `status='rejected'` → `/sem-acesso`.
- Nova página `src/pages/auth/Signup.tsx`: email, senha, nome, escola (select), papel solicitado (select restrito).
- Nova página `src/pages/auth/PendingApproval.tsx`.
- Nova página em Settings: **"Solicitações de acesso"** para owner/admin aprovar/rejeitar.
- `ProtectedRoute` e `RoleRoute`: usam só `role` + `status==='active'` do contexto.
- Remover/limpar: `useUserAccess.ts` (substituído), leituras dispersas de `profiles.role`/`is_superadmin`/`account_members`.

### Fase 4 — Verificação

- `supabase linter` após a migration.
- Login manual com usuário existente de cada papel via `supabase--read_query` para confirmar que a migração preencheu `user_roles` corretamente.
- Console limpo, sem loops, sem `Failed to fetch`.

## O que **não** muda

- `src/integrations/supabase/client.ts` (mantido).
- Layout, dashboards, Central Operacional, módulos de secretaria/pedagógico.
- RLS das demais tabelas (continuam via `current_school_id()`, que agora resolve a partir de `user_roles`).
- Buckets de storage.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Usuários existentes ficarem sem role após migração | Script de migração consolida `profiles + account_members + school_memberships`; rodo `SELECT` de auditoria antes/depois |
| RLS quebrar por mudança em `current_school_id()` | A função nova retorna o mesmo tipo/valor para usuários ativos; testo com `SELECT current_school_id()` por papel |
| Loop de auth voltar | `AuthContext` novo é linear, sem dependências circulares no `useEffect`, com timeout |
| Auto-cadastro abrir brecha | Linha entra como `pending`; RLS de outras tabelas exige `status='active'` via `current_school_id()` retornando NULL para pendentes |

## Entregáveis desta execução

1. 1 migration SQL (enum, tabela, funções, RLS, backfill).
2. 3 edge functions (`signup-request`, `approve-user`, `reject-user`).
3. AuthContext + Login refatorados; Signup, PendingApproval, ApprovalQueue criados.
4. Limpeza de `useUserAccess` e leituras antigas.
5. Atualização do `mem://index.md` refletindo a nova fonte única de papéis.

---

**Confirma este plano para eu executar?** Se quiser ajustar algo (ex.: não permitir auto-cadastro de `superadmin`/`owner`, manter tabelas antigas, mudar nomes), me diga antes — depois de aprovado, executo as 4 fases em sequência.