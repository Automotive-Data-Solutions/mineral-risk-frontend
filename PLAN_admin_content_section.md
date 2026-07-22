# Admin Section — Content Management Scope
**Scoping doc, 2026-07-21. Decisions resolved same day (§3) — ready to build on
Nicole's go. Companion to INTELLIGENCE_HUB_DESIGN_BRIEF.md (whose "Things Still
Needed" item 6 — admin form — is stale; most of it exists).**

Goal: an Admin area inside the data platform (Stack 2, Clerk-gated) for managing
public Intelligence Hub content, structured so later admin surfaces (scoring runs,
ingestion, seed review) slot into the same nav group. This pass scopes **Content only**.

---

## 1. What already exists (inventory — verified against code 2026-07-21)

### Backend (all live, `app/api/routes/intelligence.py`)
| Capability | Route | Notes |
|---|---|---|
| Create draft | `POST /intelligence/posts` | 409 on slug conflict |
| Edit fields | `PATCH /intelligence/posts/{id}` | title, pillar, materials, geographies, summary, body, pdf_url, read_time, author, metadata_json |
| Lifecycle | `POST .../publish` `.../unpublish` `.../archive` | explicit verbs, not PATCH |
| Pin | `POST .../pin` `.../unpin` | pinned = top of public feed |
| Drafts inbox | `GET /posts/drafts` | |
| Docx import | `POST /posts/upload-docx` | mammoth pipeline → markdown body + extracted assets |
| Asset serving | `GET /content-assets/{path}` | interim; module notes an R2 migration to retire it |

### Frontend (pages EXIST but are orphaned — nothing links to them)
- **`/admin/insights`** — drafts + published tables, docx upload, opens editor.
- **`/admin/insights/[id]`** — two-pane editor: markdown + ```chart fences left,
  live preview (public ArticleRenderer) right; metadata edits (title, summary,
  materials, geographies, tags, pillar); Publish / Unpublish / Pin buttons.
- `lib/api/insights.ts` — client fns for everything above **except** create-from-scratch
  and archive (both exist server-side, no client fn / UI).
- Sidebar (`components/layout/sidebar.tsx`) — an "Admin" nav group is **commented out**
  (placeholders: Run Scoring, Ingestion, Seed Review). This is the actual access gap.

### Auth (read this before launch)
`require_admin` (`app/api/deps.py`) accepts Clerk org admins/owners or
`public_metadata.role ∈ {admin, owner, analyst}` — **but is currently disabled**
(LAUNCH_TODO 2026-07-19: early-return added because the role check blocked the only
user pre-launch). Today ANY signed-in dashboard user passes every admin API route.
Acceptable while Nicole is the only account; re-enabling is already on the launch
checklist and becomes mandatory the moment a second user exists.

---

## 2. Proposed v1 scope — "Content" admin

### 2.1 Access (the small, high-value piece)
- Restore the sidebar "Admin" group with a single **Content** item → `/admin/insights`.
- Hide the group client-side unless the Clerk user has an admin-ish role
  (`publicMetadata.role` or org role) — cosmetic gating; real enforcement is
  `require_admin` server-side once re-enabled. Direct-URL access by a non-admin
  should show a friendly "admin only" state rather than broken API calls.
- Breadcrumb + page title consistency with the rest of the platform.

### 2.2 Content management completeness (close the gaps in what exists)
1. **New post from scratch** — "New post" button → minimal dialog (title, type,
   slug auto-suggested) → `POST /posts` → editor. Today the only creation path is
   docx upload; Signals (1-2 paragraph alerts) shouldn't require a Word file.
2. **Archive** — client fn + button (backend verb exists). Archived posts leave
   the public feed but keep the row; list page needs a third status filter.
3. **List page filters** — type / status / pillar filter chips + search; the table
   will outgrow two flat lists quickly at 1 post/week + signals.
4. **Metadata gaps in the editor** — content_type change, author, read_time
   override, `pdf_url` (see 2.3), publish date display. (PATCH already accepts
   these; the editor just doesn't render inputs.)
5. **Entity-tag picker** — tags drive `linked_posts` on public company/regulation
   pages by EXACT match on canonical_name / regulation_key. Free-text entry is
   error-prone ("CATL" vs "Contemporary Amperex"). Scope: autocomplete backed by
   the existing companies/regulations endpoints, chips UI, free-text still allowed
   for non-entity tags.
6. **Report PDFs — R2 (decided)** — Nicole is setting up R2 storage. Build:
   backend presigned-upload endpoint (admin-gated) + editor "Upload PDF" that
   PUTs to the presigned URL and writes the public R2 URL into `pdf_url`.
   Blocked on: bucket name + public base URL + credentials in backend env.
   The interim content-assets route stays for docx-extracted images until the
   noted R2 migration retires it.
7. **Slug policy (decided)** — slug LOCKS at first publish. Editor shows it
   read-only with an explicit "Change slug" affordance that warns the public
   URL will break (no redirect table in v1; archive-and-republish is the
   fallback). Draft slugs stay freely editable.

### 2.3 Explicitly OUT of scope for v1
- Scoring runs / ingestion / seed review admin pages (nav placeholders only).
- Subscriber management (the hub subscribe form has no backend yet — separate scope).
- Scheduled publishing, revision history, multi-author workflows, comments.
- Hero image management beyond what docx import already extracts.
- Re-enabling `require_admin` (launch-checklist item, not a content feature —
  but v1 should NOT ship publicly without it).

---

## 3. Decisions (2026-07-21, Nicole)
1. **Roles**: ONE `admin` role for now — Nicole + partner both get full access.
   Simplify `require_admin` accordingly when re-enabling: accept
   `public_metadata.role == "admin"` (or Clerk org admin/owner); drop the
   `analyst` tier until a real need appears. Sidebar Admin group hides unless
   the signed-in user carries that role.
2. **PDF storage**: R2 — Nicole sets up the bucket; build per §2.2.6.
3. **Slug edits after publish**: locked, change-with-warning per §2.2.7.
4. **Signals authoring**: same full editor for now; revisit a quick-post form
   once the Signal format itself is settled.

## 4. Rough effort (build sizes, not commitments)
Access + nav + role-hide: small (hours). Create-from-scratch + archive + filters:
small-medium (a day-ish). Metadata gaps + slug lock: small. Entity-tag picker:
medium (the only genuinely new UI). Report PDF upload via R2: medium (presigned
endpoint + editor flow; blocked on bucket setup). Total v1: roughly 2-3 focused
days. Build order suggestion: access/nav first (immediate value, zero risk),
then creation/archive/filters, then tag picker, PDF last (waits on R2).


---

## 6. Follow-ups logged (not yet built)

- **Detail-page tag linking (SEO), 2026-07-22.** The feed card (quickview)
  now shows only a capped materials+geo subset — topic/entity tags and
  pillar were dropped there because card chips are NOT links (no SEO value,
  just crowding). The full tag set stays on the article DETAIL page. TODO:
  make those detail-page tags into real crawlable links — material/geo →
  filtered feed (the public `?material=`/`?geography=` filters already
  exist backend-side) or future material/geography profile pages; topic
  tags → a `?tag=` feed view. This is where the internal-linking / SEO
  payoff of rich tagging actually lands. Entity (company/regulation) links
  already ship via the article "Referenced" section.
- **Card facet caps** live in `components/hub/FeedRow.tsx`
  (`MAX_MATERIALS` / `MAX_GEOS`) if the 2+2 default needs tuning.
