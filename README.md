# PAS Frontend

Frontend application for Prebunking at Scale (PAS) - a system for analyzing social media narratives.

## Quick Start

The application will start on http://localhost:3000 (or an alternative port if 3000 is in use).

**To test the application:**
1. Run `pnpm dev`
2. Navigate to the login page
3. Click "Continue without authentication (Demo)" to bypass login
4. Explore the dashboard and features with mock data

## Features Implemented

- **Authentication**: Login page with mock authentication and bypass option
- **Dashboard**: Overview of topics, entities, actors, and trending narratives
- **Narratives**: List view with filters and detailed narrative analysis pages
- **Alerts**: Configuration for narrative monitoring alerts
- **Profile**: User profile management
- **Internationalization**: Full support for English, German, Spanish, and French

## Project Structure

```
/pages          - Application pages (Nuxt file-based routing)
/components     - Reusable Vue components
/layouts        - Page layouts
/services       - API service layer
/types          - TypeScript type definitions
/i18n/locales   - Translation files
```

## Mock Data

The application currently uses mock data from the API service layer (`/services/api.ts`). When the real API is available, update the service methods to call actual endpoints instead of returning mock data.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
