# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Buyers and browsers in Cyprus** need to narrow the market quickly by item, category, location and price, compare listings on a phone, and reach the seller through a clear contact method.
- **Personal sellers** need to create an occasional listing, understand when it will go live, and manage messages, photos and listing status from their account.
- **Business sellers** need to represent a company, maintain a public profile and multiple listings, track visibility and understand which benefits come with each paid plan.
- **Moderators and support staff** need review queues, actionable feedback, and access scoped to their role.

## Product Purpose

**Vision.** Make Kalodeal a dependable place to discover and advertise goods, services, vehicles and property across Cyprus.

**Mission.** Help people find relevant local listings, publish clear ads with minimal effort, and contact one another safely. Kalodeal is a classifieds marketplace. Buyers and sellers arrange their own item transactions, and Stripe handles Kalodeal subscription billing.

**Success criteria.** A buyer can reach relevant listings, interpret the price and location, and contact a seller on mobile. A seller can submit a listing, understand its review status and next action, and manage it after publication. A business can understand profile branding and paid entitlements before upgrading. Reviewers can resolve queues with clear feedback. Validate these journeys with representative content, keyboard navigation and narrow screens. Numeric goals and baselines remain open.

## Positioning

Kalodeal combines Cyprus district and area discovery, category-specific listing details, private messaging and public seller profiles in a single classifieds service. The free tier serves occasional sellers. Paid tiers serve higher-volume sellers who need more listing capacity, analytics, promotions or approved business branding. The intended experience is fast, mobile-friendly and transparent about pricing and visibility.

## Operating Context

### Buyer journey

Browse the homepage and category index, then search or filter listings. Open a result for photos, price, location, category attributes and seller information. Signed-in eligible users can save favorites, reveal a masked phone number or start a private conversation tied to the listing and buyer/seller pair. Listings can show validated Facebook and WhatsApp links, and unchanged legacy Messenger links are supported. The inbox shows unread state and uses Ably for realtime updates. In-conversation reporting and the public support form provide escalation paths. [Listing detail](src/app/(localized)/%5Blocale%5D/listings/%5Bid%5D/page.tsx) · [Messaging](src/features/messages) · [Phone reveal](src/features/reveal-listing-phone)

### Seller journey

Register as Personal or Business using email and password, and verify the email. On Sell, choose an active category and Cyprus district and area, add a title, description and contact phone, complete applicable category fields and add optional photos. An ad may show a price in EUR or USD, a negotiable price or price on request. Applicable priced rentals specify a period. The optional YouTube link is stored and reviewable by staff. Public listing detail currently displays the photo gallery. JPEG, PNG and WebP uploads are capped at 5 MiB per image and 50 MiB per upload, with a plan-specific photo count. [Listing creation](src/features/create-listing) · [Attribute rules](src/features/listing-attributes/rules.ts) · [Image validation](src/lib/image-validation.ts)

Submission enters moderation. My Listings shows review feedback and available actions. Depending on the listing's state, an owner can edit, reorder or remove photos, hide or reactivate an ad, mark it sold, resubmit corrections or delete the ad. Content changes can trigger a new review. Only eligible, active listings appear publicly. Plan slots and downgrade rules also affect visibility. [Listing lifecycle](src/entities/listing/lifecycle.ts) · [Owner actions](src/features/account/listing-actions.ts) · [Moderation](src/features/moderation/listings)

### Business seller experience

Personal and Business are account types. A Personal account can convert to Business from settings. A Business account can have a public profile on any plan, with approved name and logo, company description, address, website, hours and category-filtered listings. Both seller types have a public seller route with eligible listings and posting tenure. The paid Business plan additionally enables eligible approved branding in listing seller presentation. [Account settings](src/features/account/settings) · [Public seller](src/entities/user/get-public-seller.ts) · [Seller page](src/app/(public)/sellers/%5Bid%5D/page.tsx)

## Capabilities and Constraints

### Search, categories and locations

- The homepage combines category cards, keyword and location search, a filter sidebar or mobile sheet, and recent or matching results. The category index exposes the active database-backed hierarchy. Search covers title and description, descendant categories, district and area, seller type, price and currency, price period where relevant, and sorting. Filters and pagination are URL-backed. Price comparison stays in the selected currency and period. [Search parameters](src/features/listing-search/model/search-params.ts) · [Listing queries](src/entities/listing/get-listings.ts)
- The location catalog covers Nicosia, Limassol, Larnaca, Paphos and Famagusta with dependent areas. New or edited listings require a valid pair. Legacy listings can have missing location or rental-period data. [Location catalog](src/entities/location/catalog.ts)
- Property forms and filters use configured sale and rent category profiles, including property type, rooms and applicable size, amenities or energy fields. Vehicle forms and filters cover recognized car, motorcycle and van profiles with make, model and applicable mileage, fuel, transmission and condition fields. Rules vary with the category and related selections. [Listing attributes](src/features/listing-attributes)
- English is the default for the homepage and search, category index and listing detail. Greek versions of those routes use the `/el` prefix. Pricing, account, authentication, selling, seller pages and help sit outside the localized route group. Some listing notices still use English strings. [Locale routing](src/i18n/routing.ts)

### Trust, safety and moderation

Verified accounts, listing review, status-based visibility, masked contact information and privacy-aware public seller labels support safer exchanges. Moderator workflows cover listing approval, corrections, requests for changes, rejection and hiding, as well as avatar and profile review, account bans, chat reports and authorized lookups, category icons, legal documents, support tickets and access grants. Contact support from the public form. The general admin route currently displays the profile moderation queue. [Moderation](src/features/moderation) · [Access grants](src/features/access-grants) · [Auth](src/lib/auth.ts)

### Subscription plans

The repository defines the following catalog in EUR per month. Checkout depends on matching active Stripe Prices in the configured mode and the availability of the relevant billing configuration. [Plan catalog](src/lib/plan-limits.ts) · [Billing configuration](src/features/billing/config.ts)

| Plan | Monthly price | Listing slots | Photos per listing | Monthly Boosts | Analytics | Featured slots | Branding in listings |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| Free | €0 | 1 | 5 | 0 | None | 0 | No |
| Plus | €4.99 | 3 | 8 | 2 | Views | 0 | No |
| Pro | €9.99 | 10 | 10 | 4 | Advanced | 0 | No |
| Business | €19.99 | 20 | 20 | 4 | Advanced | 10 | Approved business branding |

- Pending, changes-requested and active listings reserve capacity. A downgrade preserves records and gives the oldest reserved listings priority for the remaining slots. Out-of-allowance active ads are visible to their owner.
- A Boost consumes one credit and moves an eligible listing up by recency. Plan credits follow eligible periods, with separate rules for granted credits and complimentary Pro. Featured is a bounded Business-plan selection that can receive priority in relevant results. Placement depends on the query and sort.
- Basic analytics includes views with all-time, 7-day and 30-day views filters. Advanced adds current favorites and all-time phone reveals. The seller analytics dashboard also shows current status counts.
- Stripe Checkout starts subscriptions and the Billing Portal manages them under verified configuration. Cancellation may be scheduled for the end of a paid period. The server reconciles eligibility from confirmed billing state. Orders contains subscription payments and invoices. [Billing](src/features/billing) · [Orders](src/features/orders) · [Analytics](src/features/analytics) · [Listing slots](src/lib/listing-slots.ts)

### Product terminology

| Term | Meaning |
| --- | --- |
| Listing | A seller's classified ad. Published is the user-facing state for eligible active ads. |
| District and area | A Cyprus district and an area belonging to it. |
| Favorite | A listing saved by a buyer in their account. |
| Personal account / Business account | Seller identity type. The Business plan is a separate paid tier. |
| Listing slot | Capacity for a pending, changes-requested or active listing. |
| Boost / Featured | A one-use recency action / an ongoing Business-plan placement selection. |
| Orders | Subscription payments and invoices. |

### Current MVP and direction

The implemented scope includes browsing and contact, seller accounts, moderated publishing, favorites, messaging, public profiles, paid plans, promotions, seller analytics and staff workflows. The historical README's direction of fast, simple local classifieds still fits the current product. Future work can deepen local discovery and seller tools around those journeys. The repository provides no committed release sequence or delivery dates.

The [taxonomy proposal](src/entities/category/taxonomy-proposal.ts) is offline and requires review against live category inventory. Preserve compatibility with existing category identities and legacy slugs when evaluating it. Homepage category feeds have source components and are currently unmounted. Public review or rating workflows, buyer checkout, escrow, shipping, saved searches and a direct listing report control have no implemented surface identified in this review.

Open facts include live category and listing inventory, production Stripe availability and portal settings, moderation turnaround targets, user and seller success baselines, further localization scope, and the owner-approved roadmap. The older README is available in Git history before commit `19facd5`. The current routes, schemas and plan catalog govern behavior.

## Brand Commitments

Use **Kalodeal** as the project and product name, preserve its existing wordmark and identity, and use straightforward language about location, prices, eligibility and review status. [Brand asset](public/logo.svg) · [Design system](DESIGN.md)

## Evidence on Hand

The primary evidence is the checked-in routes, domain and feature modules, Prisma models and migrations, localized copy, and logo. [Repository map](AGENTS.md) · [Database models](prisma/models) · [Localized messages](src/i18n/messages)

How It Works describes phone registration and instant publication. The implemented flows use verified email and listing review. Safety refers to seller reviews, an unsupported public feature. [How It Works copy](src/app/(public)/how-it-works/mocks/mocks.ts) · [Safety copy](src/app/(public)/safety/mocks/mocks.ts)

## Product Principles

1. **Make local relevance obvious.** Keep category, location, price and contact options easy to scan and refine.
2. **Make publishing predictable.** Ask for category-specific detail when it helps discovery. Explain the review, status, plan limits and next action at the point of need.
3. **Keep trust visible.** Protect private data, use approved identity details, and give people clear ways to reach sellers or report trouble.
4. **Make paid value explicit.** Show comparable monthly prices and entitlements. Explain what happens when billing or listing eligibility changes.
5. **Design for mobile use and access.** Make browsing, posting and contact work with touch, a keyboard, zoom, assistive technology and real Greek and English content where supported.

## Accessibility & Inclusion

Use readable contrast and text sizing, visible focus, accessible labels, clear field errors, useful image alternatives and reduced-motion support. Treat these as delivery criteria and avoid claims of certification without an audit. [Design system](DESIGN.md)
