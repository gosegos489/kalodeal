# Kalodeal

**Kalodeal** is a modern full-stack classifieds marketplace built with **Next.js**, designed for buying, selling, and discovering products and services locally.

🌐 **Website:** [kalodeal.com](https://kalodeal.com)

> 🚧 Kalodeal is currently under active development.

## About the Project

Kalodeal is a full-stack marketplace platform inspired by modern classified advertising websites.

The goal of the project is to provide a fast, simple, and user-friendly way for people to:

- Create and manage listings
- Browse products and services
- Search and filter listings
- Discover listings by location
- Manage their account
- Communicate with other users
- Moderate marketplace content

The application is built using the **Next.js App Router** and follows a modern full-stack architecture with authentication, database integration, authorization, server-side logic, and responsive UI.

---

## Tech Stack

### Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

### Backend

- **Next.js Server Actions / Route Handlers**
- **Better Auth**
- **Prisma ORM**
- **PostgreSQL**

### Infrastructure & Services

- **Vercel**
- **Vercel Analytics**
- **Vercel Speed Insights**

---

## Features

### Authentication

- Email and password registration
- Login and logout
- Email verification
- Session management
- Protected routes
- Role-based access control

### User Roles

Kalodeal supports multiple access levels:

- **User**
- **Moderator**
- **Admin**

Different roles have different permissions for listings, users, and marketplace moderation.

### Listings

The marketplace is designed to support:

- Create listings
- Edit listings
- Delete listings
- Listing moderation
- Categories
- Images
- Pricing
- Location-based listings
- Search and filtering

### Marketplace

- Responsive marketplace UI
- Listing discovery
- Category navigation
- Region-based search
- Listing details
- Seller information

### Account

- User profile
- User listings
- Account management
- Authentication sessions

### Legal & Privacy

- Terms of Service
- Privacy Policy
- Cookie consent
- Analytics consent management

### SEO

- Dynamic metadata
- Dynamic sitemap
- Search-engine-friendly pages
- Optimized Next.js rendering

---

## Planned Features

Kalodeal is actively being developed. Planned features include:

- Real-time buyer/seller chat
- Favorites / saved listings
- Advanced search and filtering
- Cyprus region and area filtering
- Interactive location selection
- User notifications
- Listing promotion
- Subscription plans
- Online payments
- Seller profiles
- Marketplace moderation dashboard
- Admin dashboard

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   ├── legal/
│   ├── pricing/
│   ├── compare/
│   ├── how-it-works/
│   └── ...
│
├── components/
│   ├── ui/
│   └── ...
│
├── generated/
│   └── prisma/
│
├── lib/
│   ├── prisma.ts
│   └── ...
│
└── ...
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kalodeal.git
cd kalodeal
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="postgresql://..."

BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Required server-only avatar storage key; supply your own secret value.
AVATAR_ENCRYPTION_SECRET=""

DOMAIN_URL="http://localhost:3000"
PROJECT_NAME="Kalodeal"

UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

`AVATAR_ENCRYPTION_SECRET` is required when reading or uploading avatars. Supply a
separate, securely generated secret (at least 32 random bytes); do not reuse
`BETTER_AUTH_SECRET` for new storage. Validation rejects missing, empty and
whitespace-only values. This variable is read only by the `server-only` avatar
storage module. Never prefix it with `NEXT_PUBLIC_` or commit its value.

Avatar encryption keeps the existing HKDF and `KDA1` AES-256-GCM envelope. Configure
the variable in Vercel **Production**, **Preview** and **Development**, and redeploy
affected deployments. Environments accessing the same avatar objects must use the
same storage key; environments with isolated storage can use separate keys.

Before switching an existing deployment, inspect its bucket and DB avatar
references. Old objects encrypted with `BETTER_AUTH_SECRET` require the old key:
either initialize `AVATAR_ENCRYPTION_SECRET` to that exact previous value for a
compatible transition, or explicitly decrypt/re-encrypt the objects while preserving
their keys, references and envelope. Verify the migrated objects before removing the
old key. The application does not fall back to the authentication secret.

Additional environment variables may be required depending on the enabled services.

Upstash Redis protects listing creation (5 attempts per user per 10 minutes), Contact Us (3 attempts per IP per 10 minutes), and listing search (60 requests per IP per minute). Search requests to `/` with a `q` or `category` parameter are checked in `src/proxy.ts` before rendering, including direct requests and Next.js RSC/prefetch requests. Exceeding the search limit returns HTTP 429 with `Retry-After`; missing trusted IP information, Redis failures, and Redis timeouts return HTTP 503. These responses use `Cache-Control: no-store`. Both environment variables are required locally and in the deployment environment. Submissions and search requests are temporarily rejected if Redis is unavailable. On Vercel, the client IP comes from platform headers; a self-hosted reverse proxy must overwrite `x-real-ip` or provide a single trusted IP in `x-forwarded-for`. This application limit does not replace hosting/CDN protection against distributed DDoS attacks.

> Never commit production secrets or your `.env` file to Git.

---

## Stripe subscriptions

Plan limits are defined only in `src/lib/plan-limits.ts` and used by server validation and plan UI:

| Feature            | Free | Pro |
| ------------------ | ---- | --- |
| Active listings    | 1    | 10  |
| Photos per listing | 3    | 10  |
| Monthly bumps      | 0    | 4   |
| Advanced analytics | No   | Yes |

Listings awaiting moderation reserve a slot too. Free suits occasional sellers; Pro suits active sellers with more listings, richer photos, listing promotion, and analytics for views, favorites, and phone reveals. The configured Pro price remains €9.99/month; price display and Checkout read the existing Stripe Price rather than a separate UI price constant.

Billing requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, and `DOMAIN_URL` in the deployment environment. The PRO price must be an active, positive, monthly recurring price in the same Stripe mode as the secret key.

Configure Stripe Customer Portal to allow payment method updates, billing address updates, and subscription cancellation **at the end of the period**. Keep subscription plan/quantity changes disabled. Invoice history is optional; disabling it does not prevent subscription management. Set `STRIPE_PORTAL_CONFIGURATION_ID` to use a specific active configuration, or leave it unset to use the Dashboard default. The application reads these settings and does not create or change portal configurations during requests. Test and live environments need their own configuration.

Subscribe the webhook at `/api/webhook/stripe` to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Only webhook reconciliation updates subscription entitlements; the Checkout return URL does not grant PRO. Each confirmed paid monthly period grants `PLAN_LIMITS.PRO.monthlyBumps` bumps, with no carryover. This policy in `src/lib/plan-limits.ts` is the single source of truth for the action, account counter, and subscription UI. Scheduled cancellation preserves access until the paid period ends.

My listings always shows a Bump control for each owned listing. Only active listings with an eligible Pro plan and remaining allowance can be bumped. Free plans show disabled `Bump (Pro)` and an Upgrade link; exhausted allowance shows disabled `No bumps remaining`; other listing statuses show a disabled Bump control with a reason. A request disables the button and refreshes the server allowance afterward. There is no per-listing cooldown. Bumping changes only `bumpedAt` and `sortDate`, preserving creation time, the content-edit version, and moderation status.

Run plan, Bump concurrency, and paid-period regression checks with `pnpm exec node --test tests/plan-limits.test.mjs`, type checking with `pnpm exec tsc --noEmit --incremental false`, and lint with `pnpm lint`. These tests use isolated adapters and do not verify live Stripe, PostgreSQL, or Redis integrations.

---

## Database

Kalodeal uses **PostgreSQL** with **Prisma ORM**.

Generate the Prisma client:

```bash
pnpm prisma generate
```

Run database migrations:

```bash
pnpm prisma migrate dev
```

Open Prisma Studio:

```bash
pnpm prisma studio
```

---

## Development

Start the development server:

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000
```

---

## Production Build

Create a production build:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

---

## Authentication & Authorization

Authentication is implemented using **Better Auth**.

The application supports email/password authentication, email verification, session management, and role-based permissions.

Authorization is separated into three main roles:

```text
User
  └── Standard marketplace permissions

Moderator
  ├── User permissions
  └── Marketplace moderation permissions

Admin
  ├── Moderator permissions
  └── Full administrative permissions
```

Sensitive authorization checks are performed on the server.

---

## Performance

Kalodeal is built with performance in mind using features provided by Next.js and Vercel:

- Server-side rendering
- Server Components
- Optimized asset delivery
- Image optimization
- Route-level code splitting
- Vercel Analytics
- Vercel Speed Insights

---

## Responsive Design

The interface is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

The UI is built using **Tailwind CSS** and **shadcn/ui** components.

---

## Roadmap

```text
[x] Project architecture
[x] Database integration
[x] Authentication system
[x] Email verification
[x] Role-based access control
[x] Legal pages
[x] Cookie consent
[x] Dynamic sitemap

[ ] Listing creation
[ ] Listing management
[ ] Image uploads
[ ] Categories
[ ] Search & filters
[ ] Location / region search
[ ] Favorites
[ ] Real-time chat
[ ] Notifications
[ ] Admin dashboard
[ ] Moderator dashboard
[ ] Payments
[ ] Listing promotion
```

---

## Why I Built Kalodeal

Kalodeal is both a real-world product and a full-stack development project focused on building a production-style marketplace from the ground up.

The project covers more than UI development and includes:

- Database architecture
- Authentication
- Authorization
- Server-side application logic
- API design
- Marketplace functionality
- SEO
- Performance
- Responsive design
- Deployment
- Security considerations

It serves as a practical implementation of a modern **full-stack Next.js application**.

---

## Status

🚧 **Under active development**

New marketplace functionality and infrastructure are being added progressively.

---

## Author

Built by **Eugeniu Coloteniuc**

Frontend / Full-Stack Developer specializing in:

**Next.js · React · TypeScript · PostgreSQL · Prisma · Tailwind CSS**

---

## License

This project is private and proprietary unless otherwise stated.

© Kalodeal. All rights reserved.
