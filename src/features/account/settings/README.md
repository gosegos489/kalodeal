# Profile moderation

Profile names and avatars share the existing moderator queue at `/moderator/avatars` (navigation label: **Profiles**). The admin queue also shows both. This extends the avatar lifecycle without introducing a history table or another moderation service.

## Database and deployment

`User` adds three nullable fields:

- `pendingName`: the submitted name, visible only in owner settings and staff review.
- `nameModerationMessage`: the current name change request.
- `avatarModerationMessage`: the current avatar change request.

Existing `name` and `image` remain the approved public values. Existing names are preserved; there is no retroactive moderation or data backfill. The schema change is additive. No migration, database push/reset, seed or production write was run for this change.

Manually create/apply the migration against the intended development database:

```sh
pnpm exec prisma migrate dev --name add-profile-name-moderation-feedback
pnpm exec prisma generate
```

Prisma Client generation is required after updating the schema. It has already been run locally for type checking; it does not apply the migration. Keep migration SQL under review before applying it to a populated deployment. Deployments subsequently apply the reviewed migration using the project's existing deployment workflow.

## Submission and review

| Operation          | Name                                                                  | Avatar                                                                                                                               |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Submit replacement | Store a trimmed `pendingName`; keep `name`; clear name feedback.      | Use the existing upload reservation/PUT flow; clear avatar feedback only after a successful PUT.                                     |
| Approve            | Publish the database's pending name; clear pending and name feedback. | Verify/read the pending object, publish its versioned URL, clear pending and avatar feedback, then clean up the old approved object. |
| Reject             | Clear pending; keep approved name; clear name feedback.               | Clear pending; retain approved avatar; use the durable cleanup marker to delete the rejected object.                                 |
| Request changes    | Reject pending and save trimmed name feedback.                        | Reject pending through the same safe cleanup flow and save trimmed avatar feedback.                                                  |

An empty name explicitly removes the public name and cancels a pending replacement. It continues to show `Seller`; there is no text to review. Submitting the current approved name cancels a pending name replacement. New account registration sends a non-empty name to the same pending queue and starts with an empty approved name.

Messages are required for Request changes and limited to 500 characters by shared Zod validation. Name validation trims text, allows 2–64 characters for non-empty names, and rejects markup delimiters, email-shaped names and control characters. Content policy remains a human moderation decision.

Name submissions and decisions take the same PostgreSQL user-row lock used by avatar operations. A review version hashes the pending content together with `updatedAt`: older cards cannot publish a different replacement, even if two updates have the same timestamp. Approval reads the name from the database; client input cannot supply the published value. Avatar version checks, encrypted storage, ownership checks, file size/type/signature validation and retryable cleanup remain in place.

## Private feedback and public data

Account → Settings → Profile displays an **Awaiting moderation** badge and explains that the public name stays unchanged. Without an approved name, it explains the `Seller` fallback. Name and avatar change requests appear in separate neutral alerts next to their fields. React renders moderator feedback as escaped text.

Every mutation derives the acting user from a fresh session. Moderation additionally re-reads the current role and ban state through `getSettingsActor(true)`, allowing moderators/admins only. The target ID and version are untrusted inputs, validated and checked against database state. Settings reads are scoped to the authenticated owner.

Better Auth's generic user/admin update paths cannot set names, avatars or moderation fields. Its user create hook queues registration names, and its update hook prevents direct name publication. The three new fields are configured with `input: false` and `returned: false`; they are excluded from auth user responses/session payloads. See [Better Auth's field controls](https://better-auth.com/docs/concepts/database).

Listing seller reads select only approved `name` and `image`. A pending avatar replacement keeps the approved avatar visible. Listing cards and favorites do not select seller moderation data; messaging participant reads select only `name`. Pending names and feedback are not added to public/entity or messaging projections.

Submission/review refreshes owner settings and staff queues/dashboard. Public changes additionally refresh listing detail pages, account summaries, account messages and the moderator user list. Listing detail uses request-local React cache, not a shared seller cache; existing listing feed caches contain no seller profile data and do not need global invalidation.

## Files

- `prisma/models/auth.prisma`: additive fields.
- `src/features/account/settings/name-moderation.ts`, `auth-profile.ts`, `schema.ts`, `actions.ts`: submission, validation, review, auth guard and refresh.
- `src/features/account/settings/avatar-lifecycle.ts`, `server.ts`: feedback added to the existing storage lifecycle.
- `src/features/account/settings/profile-form.tsx`, `profile-moderation-notice.tsx`, `src/app/(protected)/(user)/account/settings/page.tsx`: private pending status and feedback.
- `src/features/account/settings/avatar-moderation-queue.tsx`, `avatar-moderation-controls.tsx`: combined profile queue and Request changes form.
- `src/features/moderation/search.ts`, `data.ts`, `moderation-dashboard.tsx`, `moderator-navigation.tsx`, `moderator-shell.tsx`: pending-name discovery, counts and labels.
- `src/lib/auth.ts`: registration hook and private auth fields.
- `src/entities/listing/get-listing.ts`: approved seller projection.
- `src/app/api/account/avatar/route.ts`: refresh the combined queue after upload.
- `src/app/api/account/avatar-pending/[userId]/[version]/route.ts`, `src/app/api/users/[userId]/avatar/[version]/route.ts`: reuse the avatar reference schema separately from review decisions.
- `tests/profile-moderation.test.mts`, `tests/typescript-loader.mjs`: isolated Node tests using the installed TypeScript compiler; no added dependency.

## Verification

Run the focused suite with Node 24 or another version supporting synchronous `registerHooks`:

```sh
pnpm exec node --import ./tests/typescript-loader.mjs --test tests/profile-moderation.test.mts
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm exec prisma validate
```

The suite exercises the actual actions, authorization guard, avatar lifecycle, listing read, configured auth hooks/output filtering and rendered Profile form with infrastructure substituted in memory. It covers submission/public isolation, approvals, rejection, feedback, role/ban checks, stale/concurrent decisions, timestamp collisions, avatar cleanup outages and failed uploads. Fixtures exist only inside the test process.

The checks pass locally. Live PostgreSQL locking, the manual migration, R2/Redis/email delivery and browser interaction have not been verified. A production build was not run: `pnpm build` applies migrations, and the new fields require the user's manual database migration before runtime validation.
