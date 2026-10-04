# Listing lifecycle and moderation

Implemented for the October 4, 2026 lifecycle update. The additive migration is prepared but has not been applied. Prisma Client generation is local and does not modify the database.

## Source audit before the change

`PENDING` was assigned by creation and sensitive edits to an `ACTIVE` listing. `ACTIVE` was assigned only by moderator approval and was the only public status. Moderator rejection assigned `REJECTED`; edits preserved it. `INACTIVE`, `HIDDEN` and `SOLD` existed in the enum and display/read code but had no transition writers. There was no owner Hide/Sold implementation, no individual moderator photo removal, no moderator content editor and no Listing moderation feedback storage. Listing had no `moderatedAt` or `moderatedBy` fields.

The audit covered every status reference outside generated output, including Prisma/migrations, creation, text/photo edits, moderation, account rows and quotas, Favorites, listing details/metadata/JSON-LD, phone reveal, views, buyer/seller messaging, search/category feeds/counts, sitemap, analytics and Bump. Source inspection does not establish legacy data written outside this application.

## State machine

| From              | Action                                    | To                |
| ----------------- | ----------------------------------------- | ----------------- |
| New               | Owner submits                             | PENDING           |
| PENDING           | Moderator Approve                         | ACTIVE            |
| PENDING           | Moderator Request changes                 | CHANGES_REQUESTED |
| PENDING           | Moderator Reject                          | REJECTED          |
| CHANGES_REQUESTED | Owner edits and selects Submit for review | PENDING           |
| ACTIVE            | Owner Hide                                | INACTIVE          |
| INACTIVE          | Owner Unhide                              | ACTIVE            |
| ACTIVE            | Moderator Hide with feedback              | HIDDEN            |
| HIDDEN            | Owner edits and selects Submit for review | PENDING           |
| ACTIVE / INACTIVE | Owner Mark as sold                        | SOLD              |
| ACTIVE / INACTIVE | Owner changes sensitive details or photos | PENDING           |

Only `ACTIVE` is public in browse/search/categories, detail access for non-owners, sitemap, phone reveal, new favorites, views and new buyer conversations. `SOLD` retains the existing non-public behavior. Owners can view all their states. Existing Favorites retain current listing statuses and only link to public listings; moderation feedback is not exposed to other users through Favorites.

## Owner actions

View, Edit and the existing Delete confirmation remain available in every state. Editing `REJECTED` or `SOLD` preserves that state and does not republish it.

| State             | Additional enabled owner actions   | Bump                                            |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| ACTIVE            | Hide, Mark as sold                 | Pro with remaining bumps                        |
| INACTIVE          | Unhide, Mark as sold               | Disabled: unhide first                          |
| PENDING           | Save edits while awaiting approval | Disabled: approval required                     |
| CHANGES_REQUESTED | Edit listing, Submit for review    | Disabled: submit corrections and await approval |
| HIDDEN            | Edit listing, Submit for review    | Disabled: hidden by moderation                  |
| REJECTED          | None                               | Disabled: rejected                              |
| SOLD              | None                               | Disabled: sold                                  |

Hide/Unhide change only status and the concurrency version (`updatedAt`). They preserve content, `createdAt`, `sortDate`, `bumpedAt` and subscription bump usage. Unhide checks current category availability and plan quota under the owner user-row lock. Owner-hidden listings release a listing slot, so a later Unhide may require freeing a slot.

`INACTIVE` keeps approval by a transition invariant: the only application transition into it is owner Hide from `ACTIVE`; every sensitive text/photo edit moves it to `PENDING`. A no-op edit/reorder does not revoke approval. There is no parallel approved/pending content version, approval flag or JSON snapshot. Historical INACTIVE records, if imported or written outside the audited application, need their approval provenance checked before adopting this invariant.

Mark as sold has a confirmation dialog. It is allowed from `ACTIVE` and `INACTIVE`, releases the slot and removes the listing from public browsing. No Relist or Sold-to-Active transition was added.

## Moderation and feedback

Moderator controls offer Approve, Request changes and Reject for `PENDING`. `ACTIVE` offers Hide listing with a required message. Hidden and changes-requested listings await owner submission; there is no direct owner HIDDEN-to-ACTIVE path.

Request changes stores the explicit `CHANGES_REQUESTED` status, optional reason code and mandatory custom message. Request changes and Hide trim messages and require 1–500 characters. Reject permits an optional bounded message and is final. Reasons are optional suggested categories, including Other; they never replace the custom message.

Feedback and human-readable status labels appear directly under My Listings rows and in the editing form. Corrections workflows keep photo changes in their current HIDDEN/CHANGES_REQUESTED state until explicit Submit for review. Submission also works for photo-only corrections with unchanged text. It clears both feedback fields and returns the listing to `PENDING`; Approve also clears feedback.

Moderator Change category accepts only a current, existing, active category for a `PENDING` listing. It updates only `categoryId` and the concurrency version, retaining `PENDING`. The moderator saves the category first and then approves the refreshed version. Title, description, price and contacts remain owner-authored. Category choices reuse the existing active category tree; server validation retains the project's selected-category activity policy.

The filter includes Awaiting approval, Changes requested, Published, Hidden by moderation, Hidden by owner and Rejected, plus All statuses. Sold records remain accessible through All statuses without a separate moderation filter. The default actionable queue and dashboard count only `PENDING`.

Photos reuse owner management, signature/size validation, generated R2 keys and post-commit cleanup. There is no new moderator photo deletion workflow; inappropriate photos use Request changes. Failed uploads, stale edits and quota failures compensate new objects without deleting previous images prematurely.

## Automatic refresh

My Listings, the listing/profile/chat-report queues, the moderator dashboard and individual listing reviews mount `RouteAutoRefresh` after their server reads resolve. There is no polling in account/moderator layouts. An empty queue continues polling; an unavailable/deleted listing review shows a return-to-queue message and stops polling.

The client schedules `router.refresh()` every 25 seconds after the previous refresh finishes. The existing Server Components and uncached, authorized Prisma reads supply fresh database data; there is no new endpoint or Ably integration. Hidden tabs cancel the timer. Returning to a visible tab refreshes immediately; a return during an in-flight refresh queues one follow-up after its React transition completes. Cleanup removes the timer and visibility listener on unmount/route deactivation.

The review preserves its version binding across refreshes. When a listing, pending name or pending avatar changes, decision controls are replaced with a notice and Review latest version button. Acknowledging the latest version clears old draft feedback/category selections. Listing photo galleries reset on a new listing version. The server remains authoritative: Approve, Reject, Request changes, Hide and Change category condition writes on the current listing status and expected `updatedAt`; profile photo/name moderation validates the pending version under its existing user-row lock. Chat report resolution requires the persisted OPEN status. Polling cannot authorize a stale decision.

Manual browser checks, with separate owner/moderator sessions:

1. Leave an empty moderation queue open, create a listing as its owner, and confirm it appears after the next refresh.
2. Leave My Listings open and approve/reject/request changes/hide from moderation; confirm the status and feedback update automatically.
3. Hide a tab for several intervals and confirm no periodic refresh requests; return and confirm an immediate refresh. Throttle a refresh to longer than 25 seconds and confirm automatic requests do not overlap.
4. Keep a review open while its owner edits text/photos or deletes it. A changed version requires another review; deletion removes decision controls and offers Back to queue. Submit an old decision before polling catches up and confirm the server rejects it.
5. Replace/remove a pending avatar or name while its moderation form is open; confirm the form cannot apply old feedback to the replacement.

## Authorization, quotas and cache

Every mutation validates runtime inputs and rejects extra fields. Owner identity comes from a fresh session, not the client. Owner transitions enforce ownership, expected version and legal source state; owner text/photo operations recheck role/ban under the user-row lock. Moderator writes check current moderator/admin RBAC under a share lock and use conditional status/version updates to reject stale reviews.

`PENDING`, `CHANGES_REQUESTED` and `ACTIVE` reserve listing slots. Unhide and edits that re-enter a reserved state check subscription/count in the same owner-locked transaction as the mutation. Creation's existing locked quota recheck is preserved. Visibility actions reuse the existing fail-closed update limiter and never debit Bump.

Bump remains server-side ACTIVE-only, Pro-only and quota-checked. Its disabled helpers are visible and state-specific. Free shows Bump (Pro) and Available with Pro; exhausted Pro shows No bumps remaining this billing period.

Writes invalidate listing/category/count tags, both old/new exact-category tags when appropriate, and affected account/moderator/detail/sell paths. Favorites are read fresh. A committed mutation remains a successful result if cache refresh subsequently fails.

## Manual migration

Review `prisma/migrations/20261004120000_listing_changes_requested_feedback/migration.sql`. It only adds CHANGES_REQUESTED and nullable moderationMessage/moderationReason, with no data deletion or new approval/version storage. All previous records receive null feedback; no fabricated moderation history or status backfill is added.

Apply reviewed migrations yourself against the intended `DATABASE_DIRECT_URL`, then generate the client:

```sh
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

`migrate deploy` applies all pending migrations in this repository. No migrate dev/deploy, db push, db execute or reset command was executed during implementation. The migration was generated with a local schema-to-schema diff, without querying a database.

## Verification

```sh
pnpm exec node --test tests/route-refresh-poller.test.mjs tests/moderation-concurrency.test.mjs
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm exec prisma validate
```

The standalone Node 24+ tests use the installed TypeScript transpiler and isolated infrastructure adapters; no test framework or dependency was added. The 52 auto-refresh/concurrency checks cover timer completion, hidden tabs, immediate return refresh, coalescing and cleanup, plus actual listing actions with stale/deleted records before and during conditional writes, illegal source states, repeated decisions, fresh role/ban denial and invalid version input. Profile checks cover replaced/removed avatars, competing approvals and stale name review under the existing lock contract.

Transaction serialization is emulated and does not prove live PostgreSQL locking. Browser interaction and live PostgreSQL/Redis/R2 integration were not verified; the database migration has intentionally not been applied. The migration-bearing `pnpm build` was not run.

## Changed files

```text
prisma/migrations/20261004120000_listing_changes_requested_feedback/migration.sql
prisma/models/listing.prisma
src/app/(protected)/(user)/account/page.tsx
src/app/(protected)/(user)/account/listings/page.tsx
src/app/(public)/listings/[id]/page.tsx
src/app/api/listings/[id]/photos/route.ts
src/app/api/listings/route.ts
src/entities/listing/lifecycle.ts
src/entities/listing/ui/listing-card.tsx
src/entities/listing/ui/listing-row.tsx
src/features/account/bump-listing-button.tsx
src/features/account/data.ts
src/features/account/listing-actions.ts
src/features/account/listing-moderation-feedback.tsx
src/features/account/listing-owner-actions.tsx
src/features/account/listing-status-badge.tsx
src/features/account/my-listing-row.tsx
src/features/account/settings/avatar-moderation-controls.tsx
src/features/account/settings/avatar-moderation-queue.tsx
src/features/billing/plan-comparison.tsx
src/features/create-listing/listing-allowance-card.tsx
src/features/create-listing/listing-form.tsx
src/features/create-listing/publish-listing-card.tsx
src/features/edit-listing/actions.ts
src/features/edit-listing/data.ts
src/features/edit-listing/listing-photos.tsx
src/features/edit-listing/photo-mutations.ts
src/features/edit-listing/types.ts
src/features/moderation/actions.ts
src/features/moderation/chat-report-queue.tsx
src/features/moderation/data.ts
src/features/moderation/listing-lifecycle.md
src/features/moderation/listing-moderation-controls.tsx
src/features/moderation/listing-moderation-queue.tsx
src/features/moderation/listing-review.tsx
src/features/moderation/moderation-search.tsx
src/features/moderation/moderation-dashboard.tsx
src/features/moderation/schema.ts
src/features/moderation/search.ts
src/lib/listing-slots.ts
src/lib/plan-limits.ts
src/shared/ui/route-auto-refresh.tsx
src/shared/ui/route-refresh-poller.ts
tests/helpers/load-project-modules.mjs
tests/moderation-concurrency.test.mjs
tests/route-refresh-poller.test.mjs
```
