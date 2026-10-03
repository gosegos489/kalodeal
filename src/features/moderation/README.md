# Chat reports and moderator accounts

Apply the additive schema migration manually before using the report routes:

```sh
pnpm exec prisma migrate dev --name add_chat_reports
pnpm exec prisma generate
```

Use the intended development database through `DATABASE_DIRECT_URL`. No migration, database push or database reset was run during implementation. Prisma Client was generated locally for validation. Prisma 7 requires explicit generation after migration.

## Report workflow

The existing conversation header offers **Report user**. The Server Action accepts only conversation ID, validated reason and up to 500 characters of optional details. It derives the reporter from a fresh session, queries the conversation with buyer/seller membership, derives the other participant and rejects self-reports. Extra identity fields are rejected by the strict Zod schema. Message content is never copied into a report or logged.

Reports use `ChatReport`, `ChatReportReason` and `ChatReportStatus` (`OPEN`, `RESOLVED`). A PostgreSQL user-row lock serializes submissions from the same reporter. The transaction checks for an existing open report with the same reporter, conversation and reported user; retries return the existing report. Resolution permits a later new report. The existing fail-closed Upstash helper limits submissions to five attempts per user per ten minutes, including duplicate attempts.

Conversation, reporter and reported-user foreign keys use `Restrict` to retain report context. The optional reviewer uses `SetNull`. Existing listing deletion keeps the conversation and title snapshot through `SetNull`; message deletion still follows the conversation's existing cascade behavior. No existing foreign-key behavior was changed.

## Moderator workflow and access

- `/moderator/chat-reports`: server-paginated queue (ten reports), open/resolved/all filters, open reports before resolved and newest first.
- `/moderator/chat-reports/[id]`: report context, existing ban/unban controls, resolve action, and read-only conversation history.
- `/moderator/chat-reports/lookup`: explicit server-side support search by conversation ID, participant name/email or listing ID/title. Empty queries do not return a conversation feed.
- `/moderator/chat-reports/lookup/[id]`: read-only support review.

Each rendering entry point calls `requireModerator()`. Each report data operation also authorizes its own fresh-session staff actor before any private read. Ordinary users cannot read report data or resolve reports, including their own. Resolve rechecks the moderator/admin role and ban under a user-row lock, then conditionally updates only an open report with reviewer ID and timestamp. A repeated resolve does not overwrite the original review.

History reads use an independent moderator-only database path, capped at 50 messages plus one lookahead row, with an older sequence cursor. They do not use participant endpoints, send messages, change read watermarks, add participants or request Ably capabilities. Ban/unban reuses `UserBanControls`, `banUser`/`unbanUser` and the existing Better Auth hook and role policy: moderators manage only users, admins may also manage moderators, and self-bans/admin targets remain excluded.

## Staff account separation

`user.role === 'moderator'` identifies the existing staff role; no new identity model or Better Auth role definition was introduced. Login lands at `/account`, where the server guard sends moderators to `/moderator`. All routes in the `(user)` group use this guard, including `/sell` and legacy messages routes. Header desktop/mobile menus point directly to the moderator panel. Moderator navigation contains Dashboard, Listings, Avatars, Users, Chat reports and Logout. Account navigation's existing logout implementation is shared.

Post listing, favorites, buyer/seller messages, account listings, plans, orders and analytics are absent from the moderator account experience. Seller links in the public footer/home empty state, public listing favorite controls and the message-seller CTA are also hidden for moderators. Admins retain their previous marketplace/admin/moderation access.

Server entry points reject moderators independently for listing creation, text editing, deletion, bumping, photo management, PRO checkout, billing portal, favorites, invoice links, seller profile editing and avatar upload/removal. Listing creation, bumps, photos and Checkout additionally recheck role/ban under their existing transaction lock. Participant messaging operations and Ably channel authorization reject moderators. Avatar moderation and existing staff ban tools continue to work. Account-security password changes retain the existing authenticated flow; no staff seller-settings route was added.

Stripe products/prices and webhook reconciliation remain unchanged. Preexisting subscriptions and listings are not deleted or canceled by this role rule.

## Verification

```sh
pnpm test:moderation
pnpm lint
pnpm exec tsc --noEmit --incremental false
```

The Node test runner uses installed `tsx` and isolated session/database/service adapters. Tests exercise report identity derivation, membership, self-report denial, concurrent duplicates, input/cursor validation, staff-only reads and resolution, read-only bounded history, manual lookup, existing ban policy, real account/moderator guards, the actual create-listing Route Handler, the actual Checkout Server Action and rendered Header/navigation. They do not connect to PostgreSQL, Redis, R2, Stripe or Ably. Transaction emulation checks application ordering and lock use; it does not prove live PostgreSQL concurrency behavior.

Lint, TypeScript, scoped formatting, Prisma validation and all 25 tests passed. Build verification used `pnpm exec next build --webpack`, bypassing the migration-bearing `pnpm build` script. Compilation and TypeScript passed, but prerendering `/categories` failed because the configured PostgreSQL server was unreachable. Live report persistence and browser interactions require the manual migration and are not established by the isolated tests.

## Changed files

```text
DESIGN.md (local ignored design note)
package.json
prisma/models/auth.prisma
prisma/models/messaging.prisma
src/app/(protected)/(moderator)/moderator/chat-reports/[id]/page.tsx
src/app/(protected)/(moderator)/moderator/chat-reports/lookup/[id]/page.tsx
src/app/(protected)/(moderator)/moderator/chat-reports/lookup/page.tsx
src/app/(protected)/(moderator)/moderator/chat-reports/page.tsx
src/app/(protected)/(user)/layout.tsx
src/app/(public)/listings/[id]/page.tsx
src/app/(public)/page.tsx
src/app/api/account/avatar/route.ts
src/app/api/listings/[id]/photos/route.ts
src/app/api/listings/route.ts
src/entities/listing/get-listing.ts
src/entities/listing/types.ts
src/entities/listing/ui/listing-card.tsx
src/features/account/account-navigation.tsx
src/features/account/actions.ts
src/features/account/bump-listing.ts
src/features/account/data.ts
src/features/account/settings/actions.ts
src/features/account/settings/server.ts
src/features/auth/actions/login.ts
src/features/auth/logout-button.tsx
src/features/billing/actions.ts
src/features/edit-listing/actions.ts
src/features/edit-listing/data.ts
src/features/edit-listing/photo-mutations.ts
src/features/favorites/actions.ts
src/features/favorites/data.ts
src/features/messages/chat-view.tsx
src/features/messages/report-schema.ts
src/features/messages/report-user-button.tsx
src/features/messages/workflow.ts
src/features/moderation/README.md
src/features/moderation/chat-report-actions.ts
src/features/moderation/chat-report-queue.tsx
src/features/moderation/chat-report-review.tsx
src/features/moderation/chat-report-server.ts
src/features/moderation/chat-report-workflow.ts
src/features/moderation/conversation-lookup.tsx
src/features/moderation/data.ts
src/features/moderation/moderation-dashboard.tsx
src/features/moderation/moderator-conversation-history.tsx
src/features/moderation/moderator-navigation.tsx
src/features/moderation/moderator-shell.tsx
src/features/moderation/resolve-report-button.tsx
src/features/orders/actions.ts
src/features/orders/data.ts
src/lib/account-role.ts
src/lib/active-user.ts
src/lib/auth-security.ts
src/lib/auth-utils.ts
src/lib/rate-limit.ts
src/widgets/public-footer/public-footer.tsx
src/widgets/public-header/mocks/mocks.ts
src/widgets/public-header/ui/action-buttons-with-session.tsx
src/widgets/public-header/ui/action-buttons.tsx
src/widgets/public-header/ui/mobile-menu-with-session.tsx
src/widgets/public-header/ui/mobile-menu.tsx
tests/moderation.test.mjs
```
