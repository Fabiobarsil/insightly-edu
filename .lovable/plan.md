## Quadro de Avisos Centralizado + Roteamento de Intervenções

### Objetivo
Substituir os avisos mockados (Professores e Psicologia) por um quadro de avisos real, alimentado pela **Secretaria**, e permitir que **intervenções da Coordenação** sejam roteadas automaticamente para:
- **Psicólogo** → quadro de avisos da Psicologia
- **Professor específico** → quadro de avisos pessoal daquele professor
- **Geral / Escola** → todos os destinatários

---

### 1. Banco de dados

Nova tabela `school_announcements`:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `school_id` | uuid | tenant |
| `title` | text | título do aviso |
| `content` | text | corpo |
| `audience` | text | `geral` \| `professores` \| `psicologia` \| `professor` |
| `target_user_id` | uuid \| null | preenchido quando `audience='professor'` |
| `source` | text | `secretaria` \| `coordenacao` \| `intervencao` |
| `intervention_id` | uuid \| null | FK opcional para `pedagogical_interventions` |
| `priority` | text | `baixa` \| `media` \| `alta` \| `urgente` |
| `created_by` | uuid | autor |
| `read_at` | timestamptz \| null | (opcional, leitura) |
| `created_at` / `updated_at` | timestamptz | padrão |

RLS multi-tenant: `school_id = current_school_id()`.
Insert: secretaria, coordenacao, owner.
Select: todos os membros da escola; quando `audience='professor'`, exibir apenas se `target_user_id = auth.uid()` ou role administrativa.

### 2. Roteamento automático de intervenções

Trigger `AFTER INSERT` em `pedagogical_interventions`:
- Se `recommendation` indicar psicólogo (ou novo campo `target_role='psicologo'`) → cria aviso `audience='psicologia'`.
- Se `teacher_id IS NOT NULL` → cria aviso `audience='professor'`, `target_user_id = teacher.profile_id`.
- Caso contrário → `audience='geral'`.

(Adicionar coluna `target_role text` em `pedagogical_interventions` para deixar explícito o destino.)

### 3. Frontend

**Novo componente reutilizável** `src/components/announcements/AnnouncementsBoard.tsx`:
- Props: `audience: 'professores' | 'psicologia' | 'geral'`, `targetUserId?: string`.
- Lê de `school_announcements` filtrado por audiência (e por `target_user_id = auth.uid()` quando aplicável).
- Realtime via Supabase Channel.

**Substituir mocks**:
- `ProfessorDashboard.tsx`: usar `<AnnouncementsBoard audience="professores" targetUserId={user.id} />`.
- `PsicologiaDashboard.tsx`: usar `<AnnouncementsBoard audience="psicologia" />`.

**Painel de criação na Secretaria** (`SecretariaDashboard` ou nova aba):
- Modal "Novo Aviso" com campos: título, conteúdo, audiência (geral / professores / psicologia / professor específico), prioridade.
- Quando audiência = professor específico, select com lista de professores.

**Coordenação (`CoordinationDashboard`)**: ao criar intervenção, novo campo "Destinatário" (psicólogo / professor da disciplina / geral). O trigger faz o resto.

### 4. Arquivos afetados

- `supabase/migrations/*` — nova tabela + RLS + trigger.
- `src/components/announcements/AnnouncementsBoard.tsx` (novo).
- `src/components/announcements/AnnouncementFormModal.tsx` (novo, secretaria).
- `src/pages/dashboards/ProfessorDashboard.tsx` — remover mock, usar componente.
- `src/pages/dashboards/PsicologiaDashboard.tsx` — idem.
- `src/pages/dashboards/SecretariaDashboard.tsx` — botão "Publicar aviso".
- `src/components/coordenacao/InterventionFormModal` (se existir) — campo destinatário + `target_role`.

### Confirmações antes de seguir
1. Posso criar a tabela `school_announcements` e o trigger automático?
2. O destinatário "professor específico" deve ser escolhido entre professores cadastrados (`teachers.profile_id`), correto?
3. A criação de avisos manuais deve ficar **só na Secretaria**, ou Coordenação também publica?
