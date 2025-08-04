# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (includes CODE_OF_CONDUCT.md copy to public/)
- `npm run build` - Production build (includes file copy and _redirects setup)
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint with TypeScript support
- `npm run preview` - Preview production build locally

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
- Mock authentication automatically enabled for localhost/127.0.0.1
- Mock user ID: `00000000-0000-0000-0000-000000000000`
- Supabase client includes development auth initialization

#### Component Organization
- `/components/ui/` - shadcn/ui components (button, dialog, etc.)
- `/components/pdf/` - PDF viewing and signing components
- `/components/signature/` - Signature creation components (draw, type, upload)
- `/components/recipient/` - Recipient management components
- `/pages/` - Route components with lazy loading

#### State Management Strategy
- AuthContext for user authentication state
- useEditorState custom hook for document editing state
- React Query for server state and caching
- Local state for UI interactions

#### Error Handling
- Comprehensive error system in `/utils/errorHandling.ts`
- Error boundaries for PDF components
- Error tracking utilities

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
- PDF.js worker configured in `/src/lib/pdf.ts`
- Custom PDF viewer with signing element overlay
- Signature placement with coordinate tracking
- Support for multi-page documents

### Development Environment Setup
- Automatic mock authentication for local development
- Environment variables for Supabase configuration (copy `.env.example` to `.env` and configure)
- Vite dev server on port 8080 with CORS headers for PDF.js

### Environment Configuration
1. Copy `.env.example` to `.env`
2. Configure Supabase credentials:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. Never commit `.env` files to version control