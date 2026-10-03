# Private messaging

Buyer/seller conversations use PostgreSQL as their source of truth and the existing Ably connection/JWT flow for update delivery. Apply the schema migration manually before using these routes.

## Routes and entry points

- `/account/messages`: ten conversations per page, newest activity first, using the existing pagination helper and nuqs.
- `/account/messages/[conversationId]`: selected conversation, latest fifty messages, composer and explicit older-history loading.
- `/messages`: compatibility redirect to `/account/messages`.
- `GET /api/messages/[conversationId]?before=<sequence>`: older history; `after=<sequence>` retrieves missed messages. Each response contains at most fifty messages.
- `GET /api/ably-token?conversationId=<id>`: fresh session and participant check, then a five-minute subscribe-only JWT for the selected conversation and the caller's inbox. Without an ID, only the caller's inbox is granted.
- Server Actions: `openListingConversation`, `sendConversationMessage`, `markConversationRead`.

## Creation, sending and access

`Message seller` is hidden from the owner and links guests to login. An authenticated click submits only the listing ID. The server derives the buyer from the session and seller from an active listing, rejects self-contact, checks the current database ban, locks/rechecks visibility, and uses `createMany(skipDuplicates)` with the composite unique constraint. Simultaneous clicks converge on one conversation.

Every read, write and token request independently authenticates. Conversation queries constrain the buyer/seller to the acting user. Private data has no shared Next.js cache, and history/token responses use `private, no-store`.

Sending validates trimmed plain text of 1–2000 characters with Zod, checks membership and the per-user limiter, then rechecks membership and the current ban inside a transaction. A conversation lock serializes sequence assignment. Message creation and activity changes commit together. Client-generated message UUIDs make retries of a lost response idempotent; a UUID belonging to another conversation/sender or different content is rejected.

The user row uses a non-key update lock to coordinate with ban changes while allowing foreign-key checks. Creation acquires the seller's key-share lock before locking the listing, matching existing owner mutations' user-to-listing lock order.

After the transaction commits, the server publishes `changed` to `chat:conversation:<id>` and each participant's `chat:messages:user:<id>` channel. `channels.ts` supplies the exact same names to publishing, JWT capabilities, and client subscriptions. Events contain no message text. Clients refetch authorized database history and merge by message ID/sequence; they never use event payloads as message records. Browser tokens cannot publish, access Ably history/presence, or subscribe to arbitrary conversations. The existing `ABLY_CHAT_API_KEY` stays server-only and must allow server publishing and subscribing on these channels in the `chat:` namespace. Ably intersects JWT permissions with the signing key's permissions: a valid JWT and connected transport do not establish channel access. Ably documents this capability model in [Capabilities](https://ably.com/docs/auth/capabilities).

Inbox subscriptions are mounted only within the messages feature. They update conversation previews and unread counts, without adding a global notification system. `ably` is externalized for native Node.js server loading; browser SDK imports keep the existing provider.

## Read state, limits and failure behavior

`lastSequence` plus `buyerReadSequence`/`sellerReadSequence` provide read watermarks without a participant table. Unread counts include only the other participant's messages above the viewer's watermark. Opening a visible, focused conversation marks reconciled messages read through their observed sequence. Conditional updates only advance the watermark, so an older request cannot undo a newer read or clear a message arriving after that snapshot. Read-state changes notify the viewer's own inbox, including other tabs.

Upstash uses the existing fail-closed limiter helper: sends allow thirty attempts per user per minute (`ratelimit:messages:send`); conversation creation allows ten (`ratelimit:messages:create`). Redis timeouts/errors block writes. Existing Better Auth ban behavior is retained: banning revokes sessions and prevents login. A still-valid session can read history, while an active database ban prevents sending/creation. Expired bans follow Better Auth's expiration semantics.

Messages render as escaped React text. Enter adds a newline; the Send button submits. Pending, empty, unavailable conversation/listing, validation, ban, rate-limit and retry states are included. Expected access failures do not expose private records; unexpected failures return generic messages.

If Ably fails, committed messages remain successful and visible to the sender, with a delivery-delay notice. Visible chats reconcile from PostgreSQL every fifteen seconds, and the conversation list refreshes every thirty seconds. Reconnection, attachment, focus and visibility changes also trigger reconciliation. There is no durable realtime outbox; a failed event is recovered by database reads rather than guaranteed event replay.

Realtime availability distinguishes silent initialization, availability after connection and channel attachment, and confirmed failure. Initial render, token loading, channel attachment, and transient disconnections do not show a banner. Failed/suspended connections or channels, rejected subscriptions, and confirmed auth errors show the fallback notice. Reattachment clears the subscription failure; disposed subscriptions cannot set a stale failure during provider cleanup. The SDK handles transient reconnects without an additional UI timer. See [connection states](https://ably.com/docs/connect/states?lang=javascript) and [error codes](https://ably.com/docs/platform/errors/codes).

Existing conversations remain readable and writable after listing status changes. Hard deletion sets the new listing foreign key to null; the saved listing title remains, with an unavailable-listing header and placeholder thumbnail. Existing listing/image/favorite cascades are unchanged. Participant/sender user references use `Restrict` to prevent deleting chat history indirectly through a hard user deletion. An eventual account-deletion feature will need an explicit history/identity retention policy.

## Prisma changes and manual migration

`Conversation` adds ID, nullable listing reference, listing-title snapshot, buyer/seller references, creation/activity timestamps, message sequence and two read watermarks. `Message` adds ID, conversation/sender references, bounded content, sequence and creation time. `User` and `Listing` gain reverse relation fields only.

Constraints/indexes:

- Unique `(buyerId, sellerId, listingId)` prevents duplicate conversations for an existing listing.
- `(buyerId, lastMessageAt, id)` and `(sellerId, lastMessageAt, id)` support participant activity ordering; `listingId` supports its foreign key.
- Unique `(conversationId, sequence)` supports deterministic history paging; `(conversationId, senderId, sequence)` supports unread counts, and `senderId` supports its foreign key.
- Listing deletion uses `SetNull`; participant/sender deletion uses `Restrict`; message-to-conversation deletion uses `Cascade`.

The schema-to-schema SQL diff was reviewed: only new tables, indexes and foreign keys, with no drops, data deletion or changes to existing columns. No migration was applied, and no migration file was generated against a database.

Run manually against the intended **development** database configured by `DATABASE_DIRECT_URL`:

```sh
pnpm exec prisma migrate dev --name add-private-messaging
pnpm exec prisma generate
```

Review and commit the generated migration. For deployment, apply that committed migration manually to the intended target before serving the new feature:

```sh
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Generation was run locally to validate TypeScript; deployment/other checkouts still require generation. The normal `pnpm build` script applies migrations, so verification here used `pnpm exec next build --webpack` instead.

## Tests and verification

Run the realtime authorization regression tests with the already-installed tsx loader:

```sh
pnpm exec node --import tsx --test tests/*.test.mjs
pnpm lint
pnpm exec tsc --noEmit --incremental false
```

The authorization test adapter replaces only Next's `server-only` marker and injects isolated database/session mocks. Coverage includes the `chat:` namespace, buyer/seller membership, foreign/missing conversation denial, unauthenticated and invalid requests, channel injection, and exact subscribe-only signed JWT capabilities matching the client channel helpers. State tests cover silent initial server rendering, token loading/attachment, transient reconnects, confirmed connection/auth/channel failures (including Ably `40160`), recovery, and stale rejection/listener cleanup. No live PostgreSQL/Redis/Ably calls or database fixtures are used by the automated tests.

Live two-user chat and migration execution remain to be verified after the operator applies the migration. Temporary schema copies/SQL review output and format manifests were removed; no test records, debug routes or scripts were created in the application.

## Changed files

| Area               | Files                                                                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma             | `prisma/models/messaging.prisma`, `prisma/models/auth.prisma`, `prisma/models/listing.prisma`                                                                                                                                            |
| Infrastructure     | `src/lib/ably.ts`, `src/lib/rate-limit.ts`, `src/app/chat-provider.tsx`, `next.config.ts`                                                                                                                                                |
| API                | `src/app/api/ably-token/route.ts`, `src/app/api/messages/[conversationId]/route.ts`                                                                                                                                                      |
| Server feature     | `workflow.ts`, `server.ts`, `actions.ts`, `schema.ts`, `types.ts`, `channels.ts` in this directory                                                                                                                                       |
| UI feature         | `chat-view.tsx`, `messages-screen.tsx`, `realtime.tsx`, `load-messages.ts`, `message-seller-button.tsx`, `listing-thumbnail.tsx`, `format-time.ts`, this README                                                                          |
| Pages              | `src/app/(protected)/(user)/account/messages/page.tsx`, `src/app/(protected)/(user)/account/messages/[conversationId]/page.tsx`, `src/app/(protected)/(user)/account/messages/error.tsx`, `src/app/(protected)/(user)/messages/page.tsx` |
| Listing/navigation | `src/app/(public)/listings/[id]/page.tsx`, `src/features/account/account-navigation.tsx`, `src/widgets/public-header/mocks/mocks.ts`                                                                                                     |
| Tests              | `tests/messages-realtime.test.mjs`, `tests/messages-realtime-state.test.mjs`                                                                                                                                                             |
