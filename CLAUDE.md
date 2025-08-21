# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

This project uses **Bun** as the package manager. Use `bun` or `bunx` commands instead of `npm` or `npx`.

## Development Commands

### Running the Application

```bash
# Start development server with Convex backend
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

### Code Quality

```bash
# Run linter (Biome)
bun run lint

# Format code
bun run format
```

### Installing Dependencies

```bash
# Install a package
bun add [package-name]

# Install a dev dependency
bun add -d [package-name]

# Install all dependencies
bun install

# Run a package binary (e.g., shadcn)
bunx shadcn@latest add [component-name]
```

## Architecture Overview

This is a Next.js 15 application with the following key architectural components:

### Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Database/Backend**: Convex (real-time database with TypeScript functions)
- **Authentication**: Convex Auth with Password provider
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (component library built on Radix UI and Tailwind CSS)
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
   - `bun run dev` starts both Next.js and Convex dev servers concurrently
   - Convex functions hot-reload automatically
   - Next.js uses Turbopack for faster builds

### Environment Configuration

Required environment variables:

- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_SITE_URL`: Site URL for auth configuration (in Convex environment)

### Error Handling

When handling Convex errors, avoid unnecessary type assertions:

```typescript
// ❌ Don't use type assertion
if (error instanceof ConvexError) {
  const data = error.data as { code?: string; message?: string };
}

// ✅ Use the data property directly
if (error instanceof ConvexError) {
  const data = error.data; // Type is already inferred correctly
}
```

### UI Component Guidelines

When using the Button component with icons, the component automatically handles spacing:

```tsx
// ❌ Don't add manual margin classes
<Button>
  <IconPlus className="mr-2 h-4 w-4" />
  Add Address
</Button>

// ✅ Button component handles spacing automatically
<Button>
  <IconPlus className="h-4 w-4" />
  Add Address
</Button>
```

## Important Instructions

- **Never automatically start the development server** - always let the user start it manually when they're ready
- Do what has been asked; nothing more, nothing less
- Never create files unless they're absolutely necessary for achieving your goal
- Always prefer editing an existing file to creating a new one
- Never proactively create documentation files (\*.md) or README files unless explicitly requested
