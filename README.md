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

DOMAIN_URL="http://localhost:3000"
PROJECT_NAME="Kalodeal"
```

Additional environment variables may be required depending on the enabled services.

> Never commit production secrets or your `.env` file to Git.

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
