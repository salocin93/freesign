# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on port 8080 (includes CODE_OF_CONDUCT.md copy to public/)
- `npm run build` - Production build (includes file copy and _redirects setup)
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint with TypeScript support
- `npm run preview` - Preview production build locally

### Testing Commands
- `npm test` - Run tests in watch mode with Vitest
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface
- Test setup file: [src/test/setup.ts](src/test/setup.ts)
- Test environment: jsdom with globals enabled

### Additional Commands
- `npm run clean` - Remove dist and node_modules
- `npm run clean:start` - Clean install and start development

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components + Tailwind CSS + Radix UI primitives
- **Authentication**: Supabase Auth with Google OAuth (includes dev mode with mock user)
- **Database/Storage**: Supabase (PostgreSQL + file storage)
- **PDF Handling**: PDF.js + react-pdf for document viewing and editing
- **State Management**: React Query (@tanstack/react-query) + Context API
- **Routing**: React Router v6 with lazy loading
- **Deployment**: Netlify

### Core Application Flow
1. **Authentication**: AuthContext provides mock user in development (`dev@example.com`), Google OAuth in production
2. **Document Lifecycle**: Upload → Edit (add recipients/signing elements) → Send → Sign → Complete
3. **PDF Editor**: SigningPDFViewer allows placing draggable signing elements on PDF pages
4. **Recipient Management**: Support for multiple recipients with different signing element assignments

### Key Architectural Patterns

#### Development Mode Support
- **Automatic mock authentication** when `import.meta.env.DEV` is true
  - Mock user: `dev@example.com` with ID `00000000-0000-0000-0000-000000000000`
  - Implemented in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
  - All Supabase operations return mock data in dev mode (see [src/lib/supabase.ts](src/lib/supabase.ts))
  - Real-time subscriptions are automatically disabled in dev mode
- **Production validation** runs on startup in production environments
  - Validates environment variables and Supabase configuration
  - Can be bypassed with "Continue Anyway" button if needed
  - Implemented in [src/App.tsx](src/App.tsx) using `validateProductionEnvironment()`

#### Path Aliases
- `@/` resolves to `src/` directory (configured in vite.config.ts and vitest.config.ts)
- Always use `@/` imports instead of relative paths for consistency
- Example: `import { Button } from '@/components/ui/button'`

#### Component Organization
- `/components/ui/` - shadcn/ui components (button, dialog, etc.)
- `/components/pdf/` - PDF viewing and signing components
  - [PDFViewer.tsx](src/components/pdf/PDFViewer.tsx) - Standard PDF viewer
  - [SigningPDFViewer.tsx](src/components/pdf/SigningPDFViewer.tsx) - PDF viewer with signing element overlay
  - [PDFErrorBoundary.tsx](src/components/pdf/PDFErrorBoundary.tsx) - Error boundary for PDF components
  - [MobilePDFViewer.tsx](src/components/pdf/MobilePDFViewer.tsx) - Mobile-optimized viewer
- `/components/signature/` - Signature creation components (draw, type, upload)
- `/components/recipient/` - Recipient management components
- `/pages/` - Route components with lazy loading (Index, Dashboard, NotFound are lazy-loaded)
- `/contexts/` - React context providers (AuthContext, AnalyticsContext)
- `/hooks/` - Custom React hooks (useEditorState for document editing state)
- `/utils/` - Utility functions and helpers
- `/types/` - TypeScript type definitions

#### State Management Strategy
- **AuthContext** ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)) for user authentication state
- **useEditorState** ([src/hooks/useEditorState.ts](src/hooks/useEditorState.ts)) custom hook for document editing state
  - Manages document, recipients, and signing elements
  - Handles real-time subscriptions to Supabase (disabled in dev mode)
  - Provides methods for adding/removing signing elements
- **React Query** (@tanstack/react-query) for server state and caching
- **Local state** for UI interactions

#### Error Handling
- **Comprehensive error system** in [src/utils/errorHandling.ts](src/utils/errorHandling.ts)
  - Custom error classes: `AppError`, `DatabaseError`, `ConfigurationError`
  - Error tracking via [src/utils/errorTracking.ts](src/utils/errorTracking.ts)
  - Error recovery utilities in [src/utils/errorRecovery.ts](src/utils/errorRecovery.ts)
- **Error boundaries** wrapping major app sections
  - Multiple nested error boundaries in App.tsx (App, QueryClient, Auth, Router, Analytics)
  - PDF-specific error boundary in [src/components/pdf/PDFErrorBoundary.tsx](src/components/pdf/PDFErrorBoundary.tsx)
- **Helper functions**: `handleError()`, `handleApiError()` for consistent error handling

### Database Schema (Supabase)
- `documents` - Document metadata and status
- `recipients` - Document recipient information
- `signatures` - Captured signature data
- `signing_elements` - Positioning data for signature fields on PDFs
- Storage bucket: `documents` for PDF files

### Routing Structure
- `/` - Public landing page
- `/login` - Authentication page
- `/dashboard` - User dashboard (protected)
- `/upload` - Document upload (protected)
- `/documents` - Document management (protected)
- `/editor/:id` - PDF editor (protected)
- `/sign/:documentId` - Public signing interface
- `/thank-you` - Post-signing confirmation

### PDF Integration Details
- **PDF.js worker** configured in [src/config/pdf.ts](src/config/pdf.ts)
- **PDF.js version**: 4.8.69 (pdfjs-dist)
- **Worker path**: `/pdf.worker.min.mjs` (must be in public directory for production)
- **Build optimization**: PDF.js is split into separate chunk (`pdfjs`) via Rollup manual chunks
- **CORS headers**: Required for PDF.js worker (configured in vite.config.ts)
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- **PDF Viewer Components**:
  - Standard viewer with zoom and navigation
  - Signing viewer with draggable/resizable signing elements overlay
  - Mobile-optimized viewer for smaller screens
  - Performance-optimized viewer for large documents
- **Signature placement**: Coordinate tracking with page index, position (x, y), and size (width, height)
- **Multi-page support**: Full support for multi-page PDFs with per-page element positioning

### Development Environment Setup
- **Mock authentication** automatically enabled for local development
  - No Supabase credentials required for development
  - All Supabase operations return mock data when `import.meta.env.DEV === true`
  - Mock PDFs are generated in-memory for document viewing
- **Environment variables** for Supabase configuration (only required for production)
  - Copy `.env.example` to `.env` for production builds
  - Development mode works without any environment variables
- **Vite dev server** on port 8080 with CORS headers for PDF.js
- **Development user**: `dev@example.com` (ID: `00000000-0000-0000-0000-000000000000`)

### Environment Configuration
#### Development (No Setup Required)
- Run `npm run dev` - works immediately with mock data
- No Supabase credentials needed
- No `.env` file required

#### Production
1. Copy `.env.example` to `.env`
2. Configure Supabase credentials:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. Never commit `.env` files to version control
4. Production validation will run on app startup to verify configuration

### Debugging and Logging

**Debug Utility** - Use instead of console statements
- Location: [src/utils/debug.ts](src/utils/debug.ts)
- **Development mode**: All debug methods work (log, warn, info, debug, etc.)
- **Production mode**: Only `error()` logs, all others are no-ops
- **Performance**: Zero overhead in production (tree-shaken)

**Usage:**
```typescript
import { debug } from '@/utils/debug';

// Development only - stripped in production
debug.log('Loading document:', documentId);
debug.warn('Using mock authentication');
debug.info('User action:', action);

// Always logged (dev and production)
debug.error('Critical error:', error);

// Performance timing (dev only)
debug.time('upload');
await uploadDocument(file);
debug.timeEnd('upload');

// Grouped logs (dev only)
debug.group('PDF Loading');
debug.log('Fetching URL...');
debug.log('Loading document...');
debug.groupEnd();
```

**Do NOT use:**
- `console.log()` - Use `debug.log()` instead
- `console.warn()` - Use `debug.warn()` instead
- `console.info()` - Use `debug.info()` instead
- `console.error()` - Use `debug.error()` instead (or keep console.error for critical errors)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
