# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Start development server with Convex backend
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Code Quality
```bash
# Run linter (Biome)
npm run lint

# Format code
npm run format
```

## Architecture Overview

This is a Next.js 15 application with the following key architectural components:

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Database/Backend**: Convex (real-time database with TypeScript functions)
- **Authentication**: Convex Auth with Password provider
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome for linting and formatting
- **TypeScript**: Strict mode enabled

### Project Structure

#### Frontend Architecture
- **App Router**: Located in `src/app/` using Next.js 15 App Router patterns
- **Provider Pattern**: `ConvexClientProvider` wraps the app for Convex integration
- **Authentication**: Server and client components use `@convex-dev/auth/nextjs` for auth state

#### Backend Architecture (Convex)
- **Schema**: Defined in `convex/schema.ts` with auth tables pre-configured
- **Auth System**: Password-based authentication configured in `convex/auth.ts`
- **HTTP Routes**: Auth routes exposed via `convex/http.ts`
- **Functions**: Convex functions run on the backend with TypeScript type safety

### Key Integration Points

1. **Convex + Next.js Integration**:
   - Server provider: `ConvexAuthNextjsServerProvider` in root layout
   - Client provider: `ConvexClientProvider` with auth support
   - Environment variable: `NEXT_PUBLIC_CONVEX_URL` required

2. **Type Safety**:
   - Convex generates types in `convex/_generated/`
   - Path alias `@/*` maps to `./src/*`
   - Strict TypeScript configuration

3. **Development Workflow**:
   - `npm run dev` starts both Next.js and Convex dev servers concurrently
   - Convex functions hot-reload automatically
   - Next.js uses Turbopack for faster builds

### Environment Configuration
Required environment variables:
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_SITE_URL`: Site URL for auth configuration (in Convex environment)