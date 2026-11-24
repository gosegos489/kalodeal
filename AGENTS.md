# Kalodeal agent guide

Kalodeal is a Cyprus classifieds marketplace for buyers, personal sellers and business sellers. Read [PRODUCT.md](PRODUCT.md) for product and UX context and [DESIGN.md](DESIGN.md) before visual or frontend changes. Current code and migrations define implemented behavior.

## Workflow

1. Trace the request through its current route, feature, data access and tests. Check Git status and preserve in-progress work.
2. Read [PRODUCT.md](PRODUCT.md) when the task affects product behavior, copy or user journeys.
3. Read [DESIGN.md](DESIGN.md) before changing the frontend or visual system.
4. Use [Impeccable](.agents/skills/impeccable/SKILL.md) for interface design, layout, hierarchy, typography, color, accessibility, responsive design and design audits.
5. Use [emil-design-eng](.agents/skills/emil-design-eng/SKILL.md) or a narrower installed Emil skill for motion, gestures, interaction feedback and component craftsmanship. Use the design skills for UI work and skip this workflow for unrelated backend-only tasks.
6. Reuse the existing components, variants and semantic tokens.
7. Implement the smallest coherent solution through the existing entry points.
8. Verify the affected behavior with appropriate tests and visual checks.
9. Review the final diff and report verification gaps.

When guidance conflicts, apply security, correctness and accessibility first. Then follow explicit user requirements, verified product requirements, the established Kalodeal design system, and relevant skill recommendations in that order.

## Stack and repository map

Next.js 16 App Router uses React 19, strict TypeScript, Cache Components and next-intl. The UI uses Tailwind CSS 4, shadcn components built on Base UI and Lucide. The backend uses Prisma 7 over PostgreSQL and Better Auth. Integrations include Stripe billing, Ably messaging, S3-compatible R2 storage, Upstash Redis, Resend and Sentry. React Email templates live in [emails](emails).

| Path | Responsibility |
| --- | --- |
| [src/app](src/app) | Route groups, layouts, route handlers, metadata and route-level loading/error UI |
| [src/entities](src/entities) | Domain catalogues, shared domain queries and entity presentation |
| [src/features](src/features) | Product workflows and their actions, schemas, queries and UI |
| [src/components/ui](src/components/ui), [src/shared/ui](src/shared/ui), [src/widgets](src/widgets) | Primitives, shared layout and route helpers, site chrome and consent |
| [src/lib](src/lib), [src/i18n](src/i18n) | Integration clients and cross-cutting policy, locale routing and messages |
| [prisma](prisma) | Split PostgreSQL models, migrations and seed scripts |

## Code and data

- Follow the neighboring TypeScript, [Prettier](.prettierrc) and [ESLint](eslint.config.mjs) conventions. Reuse the `@/` alias, typed props and `cn` for class composition in application code. Keep App Router entries focused on route composition. Put domain reads and mutations with their entity or feature.
- Prefer Server Components and server-side reads. Use client components for browser state and interaction. Use the existing React Hook Form and Zod patterns for interactive forms. Keep search, filter, sorting and pagination state in the URL with nuqs and the shared server parser. TanStack Query is available in the app provider. Follow the feature's existing data pattern.
- Keep Prisma, credentials and integration clients on the server. Validate untrusted input at every action or route boundary and use the existing safe error and result conventions. Preserve scoped queries, explicit selections, transactions, ownership locks and conditional versions where concurrent changes can race. Maintain compatibility with legacy listings, categories and billing data.
- Use [cache tags](src/lib/cache-tags.ts) and existing cache lifetimes for bounded public data. Invalidate affected paths or tags on writes. Keep private, permission-sensitive and expiry-sensitive reads current. Preserve pagination, image sizing, lazy loading, route fallbacks and metadata behavior. Add client JavaScript only where the interaction needs it.
- Preserve English unprefixed and Greek `/el` URLs on the homepage, categories and listing detail. Reuse [locale routing](src/i18n/routing.ts) and message catalogs on those surfaces.

## Authorization, privacy and billing

- Check authorization in each protected entry point. Use [auth utilities](src/lib/auth-utils.ts) for fresh mutation sessions and ban checks, and apply ownership, role, participant and state checks server-side. Recheck permissions inside existing transaction locks where changes can race. The moderator role is staff-only. Admin retains marketplace access.
- Minimize public data and preserve listing eligibility, approved identity display and privacy-safe seller names. Keep phone reveals, conversation access and staff reads scoped. Preserve signed/private asset access, upload type and size checks, cleanup, the avatar encryption envelope and the separate `AVATAR_ENCRYPTION_SECRET`. Key rotation must preserve access to existing objects. Keep secrets out of the repository, client bundles, URLs and logs. Preserve [Sentry redaction](src/lib/sentry-privacy.ts) and the Google Analytics consent gate. Check current call sites before relying on a rate-limit helper.
- Use the [plan catalog](src/lib/plan-limits.ts) for prices and limits. Preserve paid-period entitlements, reserved listing slots, downgrade behavior, credit and Featured constraints, and legacy Pro Price compatibility. Billing relies on recognized Stripe Prices and supported configuration in the matching Stripe mode.
- [Stripe reconciliation](src/features/billing/webhook.ts) verifies signatures against the raw request body and derives entitlements from mode-checked events and authoritative Stripe state under the owner's lock. Keep event and invoice processing idempotent. Keep subscription/customer checks and Billing Portal safeguards. Checkout redirects are display and polling signals. Use Stripe test mode and isolated data for local billing verification. Dashboard and live configuration changes require explicit authorization.

## Development and verification

Use the pnpm version pinned in [package.json](package.json). Node.js 24 was used for the verification pass. The install runs Prisma client generation. Use a local or isolated development environment, with `DATABASE_DIRECT_URL` for Prisma CLI and `DATABASE_POOL_URL` for application queries. Enable external services only as needed for the route being verified. The historical README named Vercel as the deployment target. Confirm the actual environment and its configured services before deployment.

| Command | Purpose |
| --- | --- |
| `pnpm install --frozen-lockfile` | Restore locked dependencies and generate Prisma Client |
| `pnpm dev` | Run the Next.js development server |
| `pnpm email:dev` | Preview React Email templates on port 3001 |
| `pnpm exec prisma generate` | Regenerate ignored client output from the checked-in schema |
| `pnpm exec prisma validate` | Validate the schema with a local direct URL configured |
| `pnpm lint` | Run repository ESLint |
| `pnpm exec tsc --noEmit --incremental false` | Check TypeScript with generated Prisma and Next types available |
| `pnpm exec tsx --test src/entities/location/catalog.test.ts src/entities/user/seller-categories.test.ts src/features/account/settings/*.test.ts` | Run focused offline catalog, seller and profile tests |
| `pnpm exec next build` | Compile the app when the required development services are configured |
| `pnpm build` | Deploys Prisma migrations first, generates the client, then builds Next.js. Use only against an explicitly intended database. |
| `pnpm start` | Serve an existing production build |

Authentication tests in `src/features/auth/account-type.test.ts` use in-memory adapters. Outside Next.js the test process needs to resolve `server-only` to Next's server marker. Keep any runner mapping scoped to tests. Use an isolated database for `prisma migrate dev`. Review migration SQL and test compatibility before deploying it. Validate relevant roles, access, loading/empty/error states and legacy records when behavior changes.

For UI changes, use a running app and representative desktop and mobile widths. Check keyboard and touch input, focus, reduced motion and available locales. For billing or listing visibility changes, verify normal, retry, expired and concurrent paths as appropriate. A change is done when the requested behavior works through its entry point, suitable checks pass or their limits are recorded, and the diff contains only authorized changes.

## Project-local design skills

Codex discovers skill folders in [.agents/skills](.agents/skills). If the current session lacks a new skill, open its `SKILL.md` directly and follow its linked playbook. Start a fresh Codex session from the repo root if needed for discovery. Keep the skill sources, [Emil lockfile](skills-lock.json) and [hook manifest](.codex/hooks.json) shareable through Git. Keep platform binaries and local settings out of Git.

For Impeccable, use `$impeccable init` to refresh product context when needed and `$impeccable document` to refresh the incumbent design system and [sidecar](.impeccable/design.json). Review the hook in Codex with `/hooks` and follow the normal per-command trust prompts. The hook checks UI edits and end-of-turn changes. The project's [Live configuration](.impeccable/live/config.json) targets the shared document for local design sessions. For Emil, choose the narrowest applicable motion, performance, gesture or touch workflow. Review upstream code and permissions before updating either skill set.
