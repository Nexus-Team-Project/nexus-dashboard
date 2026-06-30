# Nexus Dashboard Agent Guide

> **Writing rule - no em-dashes.** Never use an em-dash (—) or en-dash (–) anywhere: not in code, comments, documentation, commit messages, UI/i18n text, or chat replies. Use a regular hyphen (-) instead (optionally spaced as " - "). This applies to all generated output in this repo.

This file covers the `nexus-dashboard` project — the real Nexus product app where tenants and members work after login. Treat source code as final truth when behavior differs.

## Workspace Context

`nexus-dashboard/` is the primary user-facing Nexus application. It does not own authentication; it receives sessions from the website backend.

Related projects:
- `nexus-website/` — login/entry frontend + production backend (`nexus-website/backend`). **All backend is there.**
- `nexus-files/` (at workspace root `C:\Nexus`) — authoritative specs (`.docx`): `NEXUS_PRODSPEC_Roles_v0_1.docx`, `NEXUS_Developer_Onboarding_Guide_v1_0.docx`, `NEXUS_Data_Model_v9_3.docx`, `NEXUS_SDD_Identity_Service_v4_3.docx`, `NEXUS_SDD_Tenant_Onboarding_v2_6.docx`, `NEXUS_SDD_Member_Management_v4_4.docx`, `NEXUS_SDD_Catalog_Service_v4_3.docx`, `NEXUS_SDD_Supply_Service_v4_4.docx`, `NEXUS_SDD_Platform_Pricing_Service_v1_3.docx`, `NEXUS_SDD_Orchestrator_v1_3.docx`, `NEXUS_FLOW_00*` flow docs.
- `progress.md` (at repo root) — management-facing summary; update when alignment progress changes.

## Architecture Overview

Three deployable services:
- **Website frontend**: `nexus-website` — React 19, TypeScript, Vite, Tailwind. Role: login/entry.
- **Backend API**: `nexus-website/backend` — Express, TypeScript, Prisma, PostgreSQL, MongoDB, Socket.io.
- **Dashboard frontend** (this project): React 19, TypeScript, Vite. Primary user-facing Nexus app.

**Databases (owned by backend):**
- **PostgreSQL/Prisma** — login website only: users, tokens, pending registrations, OAuth, auth handoff.
- **MongoDB** — authoritative for all NEXUS domain data: tenants, members, roles, onboarding, catalog, wallet, ledger, payments, events, sagas.

Dashboard must not connect directly to MongoDB. All context comes through backend APIs (`/api/me`, `/api/onboarding/status`, `/api/business-setup`). Prefer `/api/v1/*` for new calls.

## Current User Flow

1. User signs in at `nexus-website` (email/password or Google).
2. Backend issues access token (JSON) + httpOnly refresh cookie `nexus_refresh`.
3. Website creates a one-time dashboard handoff code via `/api/auth/create-code`.
4. Browser redirects to dashboard: `/auth/callback?code=...&redirect=...&lang=...`.
5. Dashboard calls `/api/auth/code-exchange`, stores access token **in memory only**, relies on refresh cookie for session restore.
6. Dashboard calls `/api/me` → MongoDB-derived context → decides: onboarding / member mode / tenant dashboard.
7. Invite links: email opens website login with `dashboardRedirect=/member-invite/accept?token=...`; after auth, SSO redirects to dashboard accept.
8. New registrations via invite: website stores `dashboardRedirect` through signup + email verification, creates SSO code after verification. **Do not redirect verified invite signups to `/workspace`.**
9. Google OAuth and email/password signup must both preserve `dashboardRedirect` server-side (`PendingRegistration.dashboardRedirect`) — must survive different browser/device.
10. Multiple invites per email = multiple `tenantMemberInvitations` records. Never replace with a boolean flag. Recover via `/api/v1/member-invitations/mine`.

**Auth details:**
- Handoff codes: in-memory, single-use, 30s TTL.
- Access tokens: frontend memory only, 30min TTL. Never localStorage.
- Refresh tokens: 30-day rotation. `replacedByTokenHash` chain with 30s grace window prevents bulk-revoke on concurrent refresh.
- Dashboard API deduplicates concurrent refresh calls via `_refreshPromise`, retries once on 401 (`src/lib/api.ts`).
- Cookie: `SameSite=Lax; HttpOnly`. Cross-subdomain sharing requires `COOKIE_DOMAIN=.nexus-payment.com` in Railway prod.
- Unauthenticated users redirect to website login, preserving current path in `dashboardRedirect`.
- `rememberMe` checkbox changes backend refresh-token lifetime (`30d` vs `7d`) and must survive handoff and rotation.

## User Types And Onboarding

Identity has two layers:
- **Prisma `User.role`**: `USER`, `ADMIN`, `AGENT` — legacy login-site only. **Do not use for NEXUS tenant auth.**
- **Mongo tenant/member context**: authoritative product identity. Do not confuse Mongo tenant `admin` with Prisma `ADMIN`.

**Tenant billing (Mongo `Tenant.plan`):**
- `basic` = 3 non-member seats, `advanced` = 5, `premium` = 10. New tenants default to `basic`.
- `member` role is unlimited; all other roles consume a seat.
- `/api/me` includes `context.plan` and `context.seats`. Backend enforces limit on invite and role change.
- Dashboard locks non-member role options at limit (lock icon + tooltip). Upgrade button shows "Coming Soon" modal.

**Dashboard modes from `/api/me`:**
- `needs_workspace_setup` — no active tenant/member record → force `WorkspaceSetupModal`.
- `tenant` — active `tenantMembers` record. Roles: `admin`, `finance`, `operator`, `analyst`, `developer`, `support`, `supply_manager`, `member`.
  - Invited users with only `NexusIdentity` + `TenantMember` (no legacy `tenantMembers`) must still resolve as `tenant`.
  - `/api/me` returns `context.tenantName`, `authorization.canViewMembers`, `authorization.canManageMembers`.
  - Member list includes `invitationStatus` + `invitationExpiresAt`; must include pending-only rows even without a `TenantMember` record.
  - **Tenant `member` role** no longer gets a dedicated member dashboard in this app. It routes to the workspace-setup wizard so the user can create their own workspace. The member-facing experience lives in nexus-wallet.
  - **Other non-admin staff roles** (finance, hr_manager, supply_manager, developer, support_agent, billing_manager, payments_manager, back_office_manager) use the full `DashboardLayout`, permission-gated per route.
- `regular_user` — skipped workspace setup; routes to the workspace-setup wizard (no dedicated member screen in this app).
- `workspace_setup_deferred` — chose complete later; locked/deferred screen.

**Workspace setup** (`POST /api/onboarding/workspace`): creates Mongo `tenants` + `tenantMembers` (role `admin`) + `onboardingStates` (`business_setup_required`).

**Skip options:** `regular_user` → `members` doc + `member_created` state. `complete_later` → `workspace_setup_deferred` state, no tenant/member created.

**Business setup** (`/api/business-setup`): tenant admins only — not for invited members. `GET` = load draft, `PATCH` = save draft, `POST` = submit.

## Important Dashboard Files

- `src/App.tsx` — route tree, auth gate, onboarding routing, Sonner toaster
- `src/contexts/AuthContext.tsx` — SSO code exchange, refresh cookie restore, in-memory token, logout redirect
- `src/lib/api.ts` — API client + typed contracts for all backend calls
- `src/components/workspace/WorkspaceSetupModal.tsx` — wizard + skip choices
- `src/components/workspace/OnboardingWizard.tsx` — first-run setup form
- `src/pages/BusinessSetupPage.tsx` — tenant-only business setup
- `src/pages/RolesPermissions.tsx` — Mongo-backed member/role list; calls `/api/v1/tenant/members` + `/api/v1/tenant/roles`
- `src/pages/InviteCollaborators.tsx` — single/bulk invite UI (one email, paste, .txt upload, role dropdowns, permission previews)
- `src/pages/MemberInviteAccept.tsx` — accepts invite token, refreshes `/api/me`; member-role invites end on a "open Nexus Wallet" confirmation linking to `VITE_WALLET_URL`; staff-role invites show "Open dashboard"
- `src/components/PendingInvitationsPanel.tsx` — shows pending invites by email; accepts each separately
- `src/lib/tenantRoles.ts` — role labels, descriptions, email parsing
- **Deleted (2026-05-31):** `src/layouts/MemberLayout.tsx`, `src/components/MemberSidebar.tsx`, `src/pages/TenantMemberDashboard.tsx`, `src/pages/MemberCatalog.tsx`, `src/components/catalog/MemberCatalogFilters.tsx`, `src/components/catalog/MemberCatalogBackdrop.tsx` — member experience moved to nexus-wallet.
- `src/components/business-setup/` — business setup layout, sidebar, step components
- `src/layouts/DashboardLayout.tsx` — tenant dashboard shell (responsive: drawer sidebar on mobile)
- `src/components/UserPanel.tsx` — logout entry
- `src/components/Header.tsx`, `DashboardHeader.tsx`, `Sidebar.tsx` — session/user surfaces
- `src/components/Sidebar.tsx`, `NavTiles.tsx`, `SearchBar.tsx`, `src/pages/Settings.tsx` — show member/role links only when `authorization.canViewMembers`; show invite/manage only when `authorization.canManageMembers`
- `src/contexts/DevModeContext.tsx` + `src/pages/DevPlaygroundRoute.tsx` — dev-mode gating

Many dashboard pages use mock/static data. Check `src/lib/api.ts` connection before changing any workflow.

## Key Backend API Routes (for dashboard context)

- `GET /api/me` — user context, mode, authorization flags, plan/seats
- `POST /api/onboarding/workspace` — workspace setup
- `GET|PATCH|POST /api/business-setup` — business setup draft/submit
- `GET /api/v1/tenant/members` — tenant member list
- `GET /api/v1/tenant/roles` — tenant role list
- `POST /api/v1/tenant/members/invite` — single invite
- `POST /api/v1/tenant/members/invite/bulk` — bulk invite
- `GET /api/v1/member-invitations/mine` — pending invites for authenticated user
- `POST /api/v1/member-invitations/:token` — accept invite

## Environment And URLs

**Frontend env:**
- `VITE_API_URL` — backend API base URL
- `VITE_AUTH_URL` — auth calls (if different from VITE_API_URL)
- `VITE_WEBSITE_URL` — website login/logout redirect target
- `VITE_WALLET_URL` — nexus-wallet URL; dev default `http://localhost:8080`, prod `https://wallet.nexus-payment.com`; used by `MemberInviteAccept` for the member-role invite confirmation link

**Local ports:** Website: `3000` | Backend: `3001` | Dashboard (this): `5174`

**Production:** `nexus-payment.com` | `dashboard.nexus-payment.com` | `api.nexus-payment.com`

Never commit production secrets. Keep `.env` local; use Railway variables for prod.

## Commands

```powershell
# Dashboard frontend — C:\Nexus\nexus-dashboard
npm run dev | build | lint

# All services at once — from C:\Nexus
npm run dev           # website:3000, backend:3001, dashboard:5174
npm run install:all
```

## Branching Strategy

Integration branch: `development`.

**Before any change:** `git checkout development && git pull origin development && git checkout -b <type>/<short-name>`

Branch types: `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`

**Rules:**
- Never work directly on `development`; never merge/push without user approval.
- For changes touching both projects, create matching branches in both repos.
- Frontend/UI: require manual user check before moving to next UI step.
- Push after stable checkpoint, before risky work, or before handoff.

**Deployment:** `nexus-dashboard/railway.toml` — Vite build + `serve dist`.

## Security Boundaries

- Always use backend-protected endpoints with Bearer tokens; never call MongoDB directly.
- Never store access tokens in localStorage; memory only.
- Refresh cookie: httpOnly always; never read in JS.
- Never expose secrets (JWT, OAuth, SMTP, payment, MONGODB_URI) to this frontend.
- Verify actual backend middleware wiring, not just frontend guards.
- **Frontend guards are UX only — every business rule enforced in the UI must also be enforced in the backend.** A frontend check with no matching backend check is not a guard, it is a hint. Never ship a frontend-only guard for anything that affects data integrity, money, or access control. When adding a guard in the dashboard, always confirm or add the matching backend route/service check.

## Service Teaser Page Pattern

Every service page must show a professional teaser when `serviceMode === 'inactive'`. The teaser replaces the page content entirely and must include: bilingual (HE+EN) headline + subtitle explaining the service value, 3–4 feature highlights with SVG icons, 2–3 stat/social-proof figures, and a single CTA button that calls `onActivate`. Use only existing design tokens (`bg-primary`, `text-slate-*`). Name the component `<ServiceName>Teaser.tsx`. Reference implementation: `src/components/BenefitsCatalogTeaser.tsx`.

## Offer Types - Agent Rule

**Note (2026-05-31):** `src/pages/MemberCatalog.tsx` and `src/components/catalog/MemberCatalogFilters.tsx` have been deleted. The member-facing catalog is now in nexus-wallet. The admin-side offer modal (`src/components/catalog/OfferModal.tsx`) remains.

**Note (2026-06-18) — voucher offer form is type-specialized.** On Create/Edit Offer the offer-type selector is the first card (`src/components/offer/OfferTypeField.tsx`), above the image gallery. When `executionType === 'voucher'`: the image gallery is capped at 1 (`maxImages={executionType === 'voucher' ? 1 : 6}`, trimmed on switch), there is **no** stock-limit input (non-voucher types keep it), and the absolute valid-from/valid-until dates are replaced by a **purchase-anchored validity duration** — `voucherValidityValue` (positive int) + `voucherValidityUnit` (`days`|`months`|`years`) on `NexusOffer`/`CatalogItem`. Empty = never expires. Vouchers persist `validFrom`/`validUntil` as null (backend forces this), so the catalog never calendar-expires a voucher; the per-purchase expiry is computed later in the wallet/checkout phase. Server validation (both-or-neither + per-unit ceilings + image cap) lives in `nexus-website/backend/src/routes/offers.routes.ts` + `services/supply-voucher.helper.ts`. The validity control follows page direction (RTL in Hebrew, select arrow on the left).

**Note (2026-06-18b) — two more voucher-only fields.** `voucherStackable` (boolean) is a **mandatory** combine-with-promotions ("כפל מבצעים") choice — the form has no default and blocks submit until Yes/No is picked, and the backend 400s a voucher without it (`assertVoucherStackable`). `voucherBackgroundColor` (`#rrggbb` | null) backs an **"Image | Color" chooser** for the voucher card background (`src/components/offer/VoucherBackgroundField.tsx`, reusing `components/common/BrandColorPicker`): image and color are mutually exclusive, both optional. Resolution order for the card background is **image → color → tenant `tenantLogoUrl` + `tenantBrandColor`** (the tenant fallback is rendered at display time, not stored). `OfferFormLayout` has a `coverColor` prop for the color hero; `OfferModal` shows the combine row + color hero. Both fields are voucher-only (null for other types), live on `NexusOffer`/`CatalogItem`, validated server-side in `offers.routes.ts` (+ `services/supply-voucher.helper.ts`), and affect no price/filter/sort. The member-facing voucher card render (with the tenant fallback) is a nexus-wallet follow-up.

**Note (2026-06-21) — voucher publish is two-step + has inventory.** _(create-page trigger superseded by Note 2026-06-22 below; inventory storage/endpoints still current.)_ Publishing a voucher is two-step via `components/offer/VoucherInventoryModal.tsx` (tabs: Insert links, Generate barcodes; Skip = no inventory, Insert = record inventory). Inventory is stored one-doc-per-unit in a new backend `voucherCodes` collection (`kind: 'barcode' | 'link'`, `value`, `status`) — never embedded in the offer. **Barcode `value`s are MOCK placeholders (`MOCK-0001`…) for now**; real Code128/crypto-unique generation is a deferred follow-up. Links are real http(s) URLs (scheme-validated + deduped on both ends; unique `(offerId,value)`). Stock derives from inventory: `stockLimit` = total unit count, **appended** on edit/re-publish (`POST /api/v1/offers/:offerId/inventory`); the edit popup pre-fills existing links via `GET /api/v1/offers/:offerId/inventory`. Both endpoints are admin-gated (`supply.manage_offers`) + ownership-checked + voucher-only. Vouchers no longer carry an offer-level `implementationLink` (removed from the form, server-nulled), and the "how to use the benefit" block was removed from the benefits-partnerships detail modal (`OfferModal.tsx`, the product-catalog modal, is unchanged). `ProductCatalog` cards show an out-of-stock / `N+` stock badge (`STOCK_BADGE_MAX`), and both catalog pages overlay a `badge_combinable` (כפל מבצעים) badge on the card image for `voucherStackable === true`. **Out of scope (future):** the customer purchase/redemption flow (assigning/consuming a code, advancing `stockUsed`, rendering the barcode image).

**Note (2026-06-21b) — voucher CSV bulk upload.** On `/supply/create` a voucher shows a **Manual | CSV bulk** toggle (`CreationModeTabs`); the page header + toggle persist and only the content below swaps (CSV mode renders `VoucherCsvBulk` inside `OfferFormLayout` with `hideSave`). **One row = one voucher.** CSV contract + client validation live in `src/lib/voucherCsv.ts` (`VOUCHER_CSV_HEADERS`, `validateVoucherRow`, `buildTemplateCsv`); parsing reuses `src/lib/csvParser.ts`. Publish → `bulkCreateVouchers` → `POST /api/v1/offers/bulk` (admin `supply.ingest`, tenant from session, row cap 200, per-row results) backed by `backend/src/services/voucher-bulk.service.ts`. Rules: `visibility` defaults `tenant_only`, `ecosystem` is **server-gated on business setup** (CSV value never trusted); inventory is `barcodeQuantity` **XOR** `links` (`|`-separated http(s)) — empty/invalid inventory is **lenient → out of stock**, only both-set is a hard error; `imageUrl` is re-hosted via Cloudinary **upload-from-URL** (`uploadOfferImageFromUrl`), image-wins-over-color, bad image silently → color; tenant_only bulk vouchers are **auto-adopted** (show in product-catalog like manual). Color-mode vouchers render a `VoucherColorTile` on catalog cards + a color hero in `OfferModal` (the stored default placeholder no longer masks the chosen color). **Future:** non-voucher bulk, async large-batch worker, real barcode generation.

**Note (2026-06-21c) — offer soft-delete + list refetch.** Deleting an offer is a backend soft-delete: it sets a dedicated `deletedAt` field (orthogonal to `status`) so deleted offers are excluded from every read and never revived by a status sweep — see root `CLAUDE.md` "Offer soft-delete". Frontend impact: in `src/pages/BenefitsPartnerships.tsx` the service activate + deactivate handlers call the `useCatalogList` `refresh()` (aliased `loadCatalog`) **after** `reloadMe()`, because `reloadMe()` only refreshes `/api/me` (catalogMode), not the offers query — without it, offers restored on re-activation (or suspended on deactivation) stay stale until a hard page refresh. Use the same "refetch after the mutation" pattern for any future action that changes the offer set server-side.

**Note (2026-06-22) — voucher inventory is a dedicated step; Publish is gated + confirmed (create page).** On `/supply/create` (manual mode), inventory and Publish are now decoupled (OpenSpec `voucher-inventory-publish-gate`). A voucher-only **`VoucherInventorySection`** card has a button that opens `VoucherInventoryModal`; the modal **only records the choice in memory** (`stagedInventory` + `inventoryChoiceMade` in `CreateOffer`) and closes — it performs **no** backend call. The hero **Publish is disabled until an inventory choice is made** (inserted or skipped) via `OfferFormLayout`'s new `saveDisabled` + `saveHint` props, then opens **`PublishConfirmModal`** (approve/cancel, modeled on `DeleteOfferConfirmModal`); only on approve does `finalizePublish(stagedInventory)` create the offer and then apply the inventory (the create-then-apply mechanism is unchanged — reworking the upload is a future step). The **Image option was removed** from `VoucherInventoryModal` (it offers only links + barcodes; `vi_tabImage`/`vi_imageSoon` deleted). `CreateOffer` validation + payload build were extracted to `src/pages/createOfferFormData.ts` (`validateCreateOffer`, `buildCreateOfferFormData`, `voucherInventorySummary`) to stay ≤350 lines. **No backend change** (inventory `kind` was already `'barcode' | 'link'`; skip is a valid outcome, so the mandatory-choice gate is UX-only). `EditOffer` is unchanged except it inherits the Image-tab removal.

**Note (2026-06-22b) — voucher inventory: provider barcode strings, optional link codes, client-side render + preview.** In `VoucherInventoryModal` (shared by Create + Edit): the **barcode tab** is value **rows** (provider-entered strings; no quantity) — backend stores them verbatim (`addBarcodes`); the **links tab** has a required url + an **optional `code`** (safe charset `^[A-Za-z0-9._\-/:+]{1,128}$`, mirrored client+server, never HTML). **Paste-to-grow** (helpers in `components/offer/voucherInventoryPaste.ts`): barcodes split on commas/newlines; links parse one row per line as `link, code`/`link code` (deduped by link). Barcode/QR images render **client-side only** (`react-barcode` CODE128 + `qrcode.react`) — the backend stores strings and renders nothing. Finishing the barcode tab opens `components/offer/CodePreviewModal.tsx` (sample barcode + QR) before staging. **One kind per voucher**: backend `assertKindMatches` rejects mixing (409); the popup's `lockedKind` prop disables the other tab on Edit. A `voucherCodes` link unit may carry an optional `code`. `OfferInventoryInput` is now `{ kind:'barcode', values:string[] } | { kind:'link', links:{url,code?}[] }`. CSV bulk still mints mock barcodes (separate path — follow-up). `CreateOffer` validation/payload helpers live in `src/pages/createOfferFormData.ts`. The row list is a **fixed-height (`h-[340px]`) scroll area** so the popup never grows as rows are added (scrollbar on the right in Hebrew / left in English via the container `dir`). **Duplicates are rejected** in both UI (finish-time error) and backend (`addBarcodes`/`addLinks` throw 400 on in-batch dup values, on top of the unique `(offerId,value)` index).

**Note (2026-06-22c) — voucher offers are PARENT + VARIANTS.** A voucher offer holds one or more variants (OpenSpec `voucher-offer-variants`). Global fields (title, image/color, description, category) stay on the parent; **per variant**: face/Nexus/member price, purchase-anchored validity, כפל מבצעים (`voucherStackable`), SKU, tags, and **redeemable inventory**. A single shared toggle (`redemptionScope: 'shared' | 'per_variant'`) controls whether תנאי מימוש (`terms`) + אופן מימוש (`implementationInstructions`) live on the parent or per variant. **Authoring (voucher path only; non-voucher forms unchanged):** `CreateOffer`/`EditOffer` render `VoucherRedemptionScopeCard` (wraps `RedemptionScopeToggle`) + `VariantsManager` (owns the in-progress draft + the per-variant inventory popup; "צור וריאנט" → `VariantBuilder` → "Save Variant" → `VariantList` with edit/delete). `CreateOfferDetailsSection` takes `hidePricing` (voucher price is per variant). Draft model + pure helpers (validation, dedupe signature, payload mapping) live in `src/pages/voucherVariantDraft.ts`. Publish is gated until ≥1 variant and no open draft; inventory applies per variant at publish via `addVariantInventory(offerId, variantId, input)` / `getVariantInventory` (offer-level `addOfferInventory`/`getOfferInventory` kept as compat). `CatalogItem`/`NexusOffer` gained `variants?: CatalogVariant[]` + `redemptionScope`; each variant's `nexus_cost` is stripped server-side for non-privileged callers. **Display:** `OfferModal` shows a "from {lowest}" price + a variants summary; `BenefitsPartnerships` cards/table show "from" pricing + a variant-count chip and open `OfferModal` to reveal variants; price sort/filter ride the backend representative (lowest member) price - no filter-field change. **Duplicate variants** are rejected in the UI (`VariantsManager`) and the API (400). **Still pending:** the nexus-wallet member card (one card + price range + reveal variants) and `FieldTooltip` icons on the variant-builder fields.

**Note (2026-06-24) - link inventory codes must be unique across links.** In `VoucherInventoryModal` the "Insert links" tab dedupes by URL, and now a non-empty `code` may not be shared across DIFFERENT links. The pure check is `findDuplicateCodes(rows)` in `components/offer/voucherInventoryPaste.ts` (exact match after trim, case-sensitive, empty codes ignored), run in `finishLinks()` after the URL-dedup step; on conflict the modal blocks the upload, flags the offending code inputs with `border-red-500` (`dupCodes` state + `aria-invalid`), and shows `vi_errCodeDup` naming the codes. Duplicate links (repeated URLs) also get the red border (`dupUrls` + pure `findDuplicateUrls`), shown with the existing amber combine notice. Backend enforces the same rule: `addLinks()` in `nexus-website/backend/src/services/voucher-inventory.service.ts` calls `assertNoLinkCodeConflicts()` (batch + existing variant links) and throws 409; the pure `findConflictingCodes(items, existing)` is exported + unit-tested. Empty/missing codes are always allowed.

**Note (2026-06-25) - voucher validity is UNIT-LEVEL dating (type up, value down).** Voucher validity is split into a TYPE and a VALUE (OpenSpec `voucher-unit-level-dating`). The TYPE (`limit` = N units from purchase, or `from_until` = absolute window) is an offer-level default `NexusOffer.defaultValidityType` with an optional per-variant `OfferVariant.validityTypeOverride` (null = inherit), mirroring the shared-redemption pattern. The VALUE lives on each `voucherCodes` unit: `validityValue`+`validityUnit` (the limit recipe) and `validFrom`+`validUntil` (the actual window). `from/until` is the single source of truth for the window: authored at inventory time for `from_until`; left empty for `limit` units until purchase, when the future redemption flow fills it (purchase date + limit). **Validity left the variant entirely** - it is gone from `offerVariantSchema`, from the dedupe signature (`variantSignature`/`draftSignature`), and from `validateVoucherVariants`; two variants differing only by date are now the SAME variant, so one variant holds differently-dated batches. **No "never expires"**: every voucher requires a date/limit. Authoring: `VoucherValidityTypeCard` (parent default, next to `VoucherRedemptionScopeCard`) + a type-override toggle in `VariantBuilder`; the date/limit VALUE is entered per batch in `VoucherInventoryModal` (limit defaults to 5 years; a `from_until` window under 5 years shows a non-blocking legal advisory). The batch validity rides `OfferInventoryInput` and is stamped onto every unit by `addBarcodes`/`addLinks`. Inventory management: `VariantInventoryManagerModal` (opened from the variant table stock cell in `BenefitsPartnerships`) lists units paged with value/validity/status, filters by expiring-soon (1m/3m/1y) + no-window, adds dated batches, edits a unit (`PATCH .../inventory/:codeId`), bulk re-stamps, and deletes (`DELETE .../inventory/:codeId`); list via `GET .../inventory/units`. Editing the type on a LIVE (edit) offer first shows `ValidityFlipConfirmModal` (lossless - the other set is preserved). Display: per-variant validity now shows only the TYPE label (`validityTypeLabel` in `lib/voucherValidity.ts`) in `OfferModal` + the Benefits table - exact dates are per unit. Migration: `backend/scripts/backfill-voucher-unit-dating.ts` (dry-run/`--apply`) moves each variant's prior validity onto its units, sets `defaultValidityType` (majority-wins, minority gets an override), and reports legacy never-expires units for manual resolution. `delete-login-user` already removes `voucherCodes` by offerId, so the new fields need no change there.

**Note (2026-06-25c) - validity TYPE is per batch, not per variant; inventory tables show created/updated.** The per-variant validity-type override was removed (`VariantBuilder` no longer has a type control; `DraftVariant`/`CatalogVariant` no longer carry `validityTypeOverride`). `VoucherValidityTypeCard` still sets the offer-level `defaultValidityType`, which is now ONLY the **default selection for the batch upload modal**. `VoucherInventoryModal` has a **limit/from-until toggle** (defaults to that offer default) - each batch declares its own type, so one variant can hold mixed-type batches. The unit editors (`StagedInventoryModal`, `VariantInventoryManagerModal`) infer a unit's type and let you switch it. The flip-confirm modal and the type-mismatch publish gate were **deleted** (no variant-level type to flip). The manage modal + the Edit staged saved-units table show **Created/Updated** columns, and the Edit saved-units table has column headers. Bulk re-stamp uses one `bulkUpdateUnitValidity` request whose response includes a per-unit from->to audit.

**Note (2026-06-25b) - authoring inventory is staged-until-publish; only Benefits Partnerships writes immediately.** The per-variant `VoucherInventoryModal` staging popup was removed from the Create/Edit variant builder. Authoring now opens `StagedInventoryModal` (mirrors the manage modal, in-memory): add batches, edit a unit's date, delete - every row shows an "unsaved" badge, and nothing is written until Publish/Save. `DraftVariant` holds `stagedUnits: StagedUnit[]` (per-unit validity) instead of a single `inventory` batch + `inventoryChoiceMade`; on publish/save they are grouped by kind+validity (`stagedUnitsToBatches`) and applied via `addVariantInventory` per batch. A variant may stage multiple differently-dated batches. **Publish no longer requires an inventory choice** - a voucher can publish out of stock (the old two-step "inventory choice required" gate from `voucher-inventory` is superseded); the only inventory-related publish blocker is a staged unit whose validity type no longer matches its variant's effective type (`co_invDateNeeded`). `VariantInventoryManagerModal` on Benefits Partnerships remains **live** (writes immediately) and its bulk re-stamp now sends ONE request (`bulkUpdateUnitValidity` -> `PATCH .../inventory` with `{ codeIds[], validity }`), not one PATCH per unit. On the **Edit page** the staged modal also shows the saved variant's already-saved codes (first page, read-only base) and now lets you **edit their dates too - staged** (`DraftVariant.stagedEdits[]`, "unsaved" badge), applied on Save via the bulk endpoint grouped by validity (`stagedEditsToBulk` -> few requests regardless of count). Codes beyond the first page are edited on Benefits. Apply errors now surface the specific backend message instead of a generic toast.

**Note (2026-06-28) - voucher CSV bulk replaced by XLSX variant/inventory import; Sale Price may equal Value.** OpenSpec `voucher-xlsx-variant-import`. The voucher **CSV bulk upload was removed entirely** from `/supply/create` (deleted `VoucherCsvBulk`, `CreationModeTabs`, `lib/voucherCsv`, `bulkCreateVouchers` + its types, and the `vb_*` i18n; shared `lib/csvParser.ts` kept for member invite/contacts). It is replaced by an **Excel (XLSX) import where one row = one barcoded inventory unit** (not one offer). New entry: `VoucherImportControls` renders **Manual** + **Import** buttons (voucher-only) where the toggle was; **Import opens `VoucherImportModal` directly** (no intermediate menu). The upload step accepts **both CSV and XLSX** (`.csv`, `.xlsx`, `.xls`) and states the accepted types: CSV is parsed by `lib/csvParser.ts` `parseCsv`, XLSX by `lib/xlsxReader.ts` (SheetJS `xlsx`); both yield the same `{ headers, rows }` so map -> match -> transform are identical. The modal flow is upload -> map -> match; `VoucherColumnMapping` (a clone of `/users` `components/ColumnMapping.tsx`, leaving it untouched) exposes **every "Create Variant" field as a mapping target with NOTHING required and no mandatory/optional indicators**: Value (`face_value`), Sale price (`nexus_cost`), SKU, Allow-stackable, Tags, Terms of use, Redemption method, Start date, End date, Duration, and inventory as **Barcode OR Link**. The admin maps whatever the file has and completes the rest in the form; the only hard stop is more link codes than links. When stackable is mapped, `StackableValueMatch` lists **every** distinct value (any count) and the admin maps each to yes/no - no error on the number of distinct values. `pages/voucherXlsxImport.ts` `rowsToDraftVariants` groups rows by the **full `draftSignature`** (Value, Sale price, stackable, SKU, redemption-when-mapped) so generated variants are never mutual duplicates regardless of which fields are mapped; tags are **unioned** across a group; Value and Sale price each come **only from their own mapped column** (no coupling/default - an unmapped price stays empty for the admin to fill); unmapped stackable -> variant `stackable` left **unset** (existing mandatory gate, no default). Each row with an inventory value becomes one staged unit (**barcode wins over link**; a unit whose kind conflicts with the variant's existing kind is dropped + counted - one kind per variant). Validity is per row via `lib/voucherImportDates.ts` `resolveUnitValidity(start, end, duration, today)`: **End date** -> `from_until` [Start or today, End]; else **Duration** (`parseDuration`: number + day/month/year, bare number = years) -> `limit`; else **Start only** -> `from_until` [Start, Start+5y]; else a **fixed 5-year `limit`** lifespan. A non-empty **unparseable** value in a mapped Start/End column **fails the whole load** (error toast naming the values, nothing imported) instead of defaulting to 5y - so a bad date (e.g. a Hebrew-month string) is never silently masked; this is surfaced via `VoucherImportOutcome.dateErrors`. The modal **locks body scroll** while open; its step panels share `ImportScrollPanel`, which puts the vertical scrollbar on the **right in Hebrew and left in English** (scroll box `dir` set to the opposite of the language; content direction restored on a real inner wrapper). The mapping step's column list is its own scroll container and gets the same dir flip so its scrollbar follows the language too. The app-wide sonner `<Toaster>` uses `expand` + `visibleToasts={5}` so the import's success + warnings stack instead of overlapping. Date strings (US `M/D/YYYY`+time, `D-MMM-YYYY`, `MM/DD/YYYY`, ISO, Excel serials) normalize to `YYYY-MM-DD` via `normalizeExpiry`. A variant MAY hold mixed from_until + limit units (batched at publish). On confirm, `CreateOffer.handleImport` appends the generated `DraftVariant[]` into the form (rendered by the existing `VariantsManager`), sets the offer `defaultValidityType = 'from_until'`, and toasts counts + any duplicate-barcode / conflicting-kind / skipped-row warnings; publish rides the **unchanged** per-variant `stagedUnitsToBatches` -> `addVariantInventory` path (NO backend/endpoint/schema change). **Price rule relaxed:** a variant's Sale price (`nexus_cost`) may now **equal** the Value (`face_value`), only blocked when it exceeds it - enforced in `voucherVariantDraft.ts` (`validateVariantDraft` + `nexusPriceError`) AND the backend `validateVoucherVariants` in `offers.routes.ts` (the one backend edit). New i18n keys are `vxi_*` (EN + HE). **Orphaned:** the backend CSV bulk path (`POST /api/v1/offers/bulk`, `voucher-bulk.service.ts`, `supply.ingest`) now has no caller - left in place, cleanup is a follow-up. **No test runner in the repo** - the import/date/grouping logic is pure and was verified by throwaway scripts; adding vitest is a pending decision.

**Note (2026-06-29) - API error parsing, publish gate, voucher link validation.** (1) **No more `[object Object]` errors:** the API client (`lib/api.ts` `request`) now runs every non-ok body through `lib/apiError.ts` `extractApiError`, which walks any backend error shape (plain string, Zod `flatten()`, Zod `format()`, nested `fieldErrors.variants`) and returns the real message(s) joined - so a validation object never reaches the UI as `[object Object]`. All API calls go through `request`, so this is app-wide; callers keep using `err.message`. (2) **Publish gate covers global + variant fields:** `computePublishBlockers` (in `createOfferFormData.ts`) now also requires a `category` (`co_errCategoryRequired`) and re-runs `validateVariantDraft` on **every** variant, so variants added programmatically (XLSX import, which bypasses per-variant Save) cannot publish while incomplete (missing price, unset mandatory stackable, bad SKU). Signature gained a `language` arg; both `CreateOffer` and `EditOffer` pass `category` + `language`. (3) **Voucher inventory links accept any string:** the http(s)/URL requirement was removed in both the frontend (`VoucherInventoryModal.finishLinks` no longer calls `isHttpUrl`) and the backend (`offers.routes.ts` inventory `links[].url` is now `z.string().trim().min(1).max(2048)`, was `.url().refine(http(s))`). A "link" may be free text; the optional `code` still must match `VOUCHER_CODE_REGEX` and is never rendered as HTML.

**Note (2026-06-29b) - Product Catalog page is gated to catalog-editing roles (backend + frontend).** `/product-catalog` shows only the tenant's OWN uploaded offers via `getPlatformOffers({ ownedOnly: true })`, which the backend scopes to `createdByTenantId === server-derived tenantId` (adopted/imported/other-tenant offers never appear). The `ownedOnly` view of `GET /api/v1/offers/platform` now requires `supply.manage_offers` (owner/admin/supply_manager/platform admin); the browse-and-adopt view (no `ownedOnly`, used by Benefits Partnerships) stays on `catalog.view`. The dashboard guards BOTH `/product-catalog` routes in `App.tsx` with `canManageCatalog` (`me.authorization.canManageSupply || isPlatformAdmin`) - one of the two routes was previously ungated. The frontend guard is UX only; the backend `ownedOnly` permission is the real boundary. `ProductCatalog.tsx` loads ALL own offers via a bounded page-accumulation loop (the backend hard-caps a page at 100; 50-page safety cap).

**Whenever adding or changing an `executionType` value, or adding any new field on `NexusOffer` / `CatalogItem` that changes how an offer is displayed, priced, or filtered, the agent MUST**:

1. Read `src/components/catalog/OfferModal.tsx`.
2. Update the `EXECUTION_TYPE_LABELS` table in `src/lib/api.ts` so the new type renders as a badge in the admin modal.
3. Update `displayPrice()` in `OfferModal.tsx` if the new type resolves price differently than `market_price ?? member_price`. Vouchers already special-case to `member_price` only - `face_value` must never be shown as the selling price.
4. Filtering is fully server-side. Any new offer field that affects price, dates, type, tags, or sort must (a) be Zod-validated in `nexus-website/backend/src/routes/offers.routes.ts`, (b) added to `buildFilterClauses()` or `buildSortMap()` in `catalog-query.helper.ts`, and (c) added to `CatalogFilters` in `catalogFilters.ts` + the `useCatalogList` `query` memo + dep list. New pricing fields must update `computeDisplayPrice()` in `nexus-website/backend/src/services/supply-price.helper.ts` and the recompute call sites in `supply.service.ts`.
5. Update the `OfferDetails` sub-component in `OfferModal.tsx` if the new field should appear in the offer-detail panel.
6. Add bilingual (EN + HE) i18n keys in `src/i18n/translations.ts` for every new label, tooltip, or chip text.

Do not ship a backend change to offer types or offer fields without circling back to `OfferModal.tsx` so the admin detail modal stays in sync with the new shape.
 of
**Note (2026-06-29c) - rich-text description: editor renders prose; descriptions render readably everywhere.** Offer descriptions are author-controlled HTML (TipTap). Two standing facts: (1) Heading + list visibility in `RichTextEditor.tsx` comes from explicit `.ProseMirror h1/h2/h3` + `ul/ol/li` + `blockquote` rules in `index.css` - Tailwind preflight neutralizes `<h1>-<h3>` sizes + list markers, so without these the H1/H2/H3 and list toolbar buttons modify the HTML but look like they do nothing in the editor. Do not remove those `.ProseMirror` rules. The editor also deduplicates extensions: StarterKit v3 bundles Link + Underline, so the editor passes `StarterKit.configure({ link: false, underline: false })` and registers its own configured Link/Underline once - do not re-add the bundled ones. (2) The full description is shown ONLY through the one shared, offer-type-agnostic dialog `components/OfferDescriptionModal.tsx` (presentational: full HTML on a clean white panel; portal/Escape/focus-trap/scroll-lock/RTL, `z-[300]` so it stacks above any open detail modal). Reuse it - do not hand-roll a per-surface renderer. Every surface opens it via a "View description" button: the Benefits cards-tab cards themselves (featured + regular), the Benefits table cell, the Benefits card detail modal, the Product Catalog grid card, and the Product Catalog detail modal (`OfferModal`). Both detail modals open the description in this SEPARATE dialog rather than rendering it inline. **Never render a description over an image/overlay or force its color (`[&_*]:!text-white`)** - that destroys the author's custom HTML colors; always put it on a high-contrast light surface. i18n keys are `desc_*` (EN+HE).

## Coding Standards

- **Production-grade always.** No prototype shortcuts, demo branches, silent failures, or hardcoded secrets.
- **Security:** validate/sanitize inputs, enforce auth/authz server-side assumption, no XSS interpolation.
- **Document all code:** file purpose comment at top; every function documents inputs/outputs; document complex state.
- **File size ≤350 lines.** Split when larger.
- **Fail gracefully** with logging; never swallow errors silently.
- **Tests** for behavior, security, and data contracts.
- **TypeScript strict:** no `any`; prefer narrow interfaces and `unknown`.
- **React:** functional components, hooks, semantic HTML, ARIA, keyboard nav, fully responsive.
- **Tailwind mobile-first.** Use `cn()` for conditional classes.
- **UI/frontend changes:** always invoke `ui-ux-pro-max` or `frontend-design` skill before implementing.
- **Design consistency:** read 2+ existing pages before adding a new one. Primary button: `bg-primary shadow-sm hover:opacity-90`. Secondary: `border border-slate-200 bg-white hover:bg-slate-50 text-slate-700`. Container: `max-w-7xl`. No ad-hoc color tokens.
- **Skeleton loading mandatory:** every API-dependent page must show `animate-pulse` skeleton matching content shape. No blank screens while loading. Reference `Home.tsx`, `Settings.tsx`, `Transactions.tsx`.
- **NEVER commit or push without explicit user approval.** Workflow: stage → diff summary → caveman-commit message → wait for "yes/go ahead" → commit/push. No exceptions.

## Unbreakable Rules

- Update `progress.md` before final response when meaningful work happened.
- Update `CLAUDE.md` + `specs.md` when architecture, flows, routes, or security behavior change.
- Work on feature/fix branch from `development`; never directly on `development`; never merge without user approval.
- `nexus-dashboard` = real product app. All backend = `nexus-website/backend`.
- All billing/payments = PayMe + Mongo domain models via backend API. Never call payment providers directly from frontend.
- Check `progress.md` before marking done.

## Agent Working Rules

- Start with specific files listed above; check `nexus-files/` first for heavy features.
- Dashboard behavior → check both frontend state and `/api/me` / onboarding routes.
- Frontend auth changes → test full chain: login → handoff code → dashboard exchange → `/api/me` → refresh restore → logout.
- Do not modify `_recycled/` without explicit user request.
- Windows git safe-directory: `git -c safe.directory='C:/Nexus/nexus-dashboard' ...`

## Known Drift Points

Re-check when touched:
- Production URLs: frontend env files or Railway variables
- Auth handoff: `AuthContext.tsx`, dashboard `src/lib/api.ts`
- Onboarding context: backend `onboarding.service.ts`
- Dashboard mock-data pages (many still use static data)
