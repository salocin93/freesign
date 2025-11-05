# FreeSign - Repository Fix Action Plan

> **Generated:** 2025-11-05
> **Total Issues:** 16 (1 Critical, 7 High, 5 Medium, 3 Low)
> **Estimated Total Time:** 4-6 weeks

---

## 🎯 EXECUTIVE SUMMARY

This action plan addresses 16 code quality issues identified in the FreeSign codebase. Issues are prioritized by severity and organized into 4 phases:

1. **Phase 1 - Critical Fixes** (Day 1): Fix the instanceof bug and type safety
2. **Phase 2 - High Priority** (Week 1-2): Remove duplicates, consolidate PDF viewers
3. **Phase 3 - Medium Priority** (Week 3-4): Standardize patterns, improve architecture
4. **Phase 4 - Polish** (Week 5-6): Code organization and minor improvements

**Expected Outcomes:**
- 🐛 1 critical bug fixed
- 📉 ~1,500 lines of code removed
- 🎯 ~50 more type errors caught at compile time
- 🏗️ Simplified architecture (5 error patterns → 3)
- ⚡ Better performance (no dev code in production)
- 🧪 Easier testing (focused hooks, fewer mocks)

---

## 📅 PHASE 1: CRITICAL FIXES (Day 1)

**Goal:** Fix bugs that could cause production failures
**Time Estimate:** 3-4 hours
**Priority:** CRITICAL

### Task 1.1: Fix instanceof Check in useErrorHandling

**Issue:** [#1 - Incorrect instanceof Check](repository_fix.md#issue-1-incorrect-instanceof-check-in-error-handling)
**File:** [src/hooks/useErrorHandling.ts:42](src/hooks/useErrorHandling.ts#L42)
**Time:** 10 minutes

**Steps:**
1. Open `src/hooks/useErrorHandling.ts`
2. Find line 42
3. Change:
   ```typescript
   if (autoRecover && error instanceof (NetworkError || ApiError)) {
   ```
   To:
   ```typescript
   if (autoRecover && (error instanceof NetworkError || error instanceof ApiError)) {
   ```
4. Add test case to verify both error types trigger recovery
5. Run full test suite: `npm run test:run`

**Verification:**
```bash
# Test should pass for both error types
npm run test:run -- useErrorHandling
```

---

### Task 1.2: Improve Type Safety in useApi Hook

**Issue:** [#4 - Weak Type Safety in useApi](repository_fix.md#issue-4-weak-type-safety-in-useapi-hook)
**File:** [src/hooks/useApi.ts](src/hooks/useApi.ts)
**Time:** 1-2 hours

**Steps:**
1. Update hook signature:
   ```typescript
   // Before:
   export function useApi<T>(
     operation: (...args: unknown[]) => Promise<T>,
     context: string,
     options: UseApiOptions = {}
   ): UseApiReturn<T>

   // After:
   export function useApi<T, Args extends unknown[]>(
     operation: (...args: Args) => Promise<T>,
     context: string,
     options: UseApiOptions = {}
   ): UseApiReturn<T, Args>
   ```

2. Update return type:
   ```typescript
   interface UseApiReturn<T, Args extends unknown[]> {
     data: T | null;
     error: AppError | null;
     isLoading: boolean;
     execute: (...args: Args) => Promise<void>;
     reset: () => void;
   }
   ```

3. Update execute callback:
   ```typescript
   const execute = useCallback(async (...args: Args) => {
     // implementation
   }, [operation, context, onSuccess, onError]);
   ```

4. Fix all TypeScript errors in files that use useApi
5. Add type tests

**Files to Update:**
```bash
# Find all usages
grep -r "useApi" src/ --include="*.ts" --include="*.tsx"
```

**Verification:**
```bash
# Should show type errors for incorrect usage
npm run lint
npx tsc --noEmit
```

---

### Task 1.3: Create Debug Utility

**Issue:** [#9 - Excessive Console Logging](repository_fix.md#issue-9-excessive-console-logging-in-production)
**Time:** 30 minutes

**Steps:**
1. Create `src/utils/debug.ts`:
   ```typescript
   interface DebugLogger {
     log(...args: unknown[]): void;
     warn(...args: unknown[]): void;
     error(...args: unknown[]): void;
     info(...args: unknown[]): void;
   }

   class ProductionLogger implements DebugLogger {
     log() {} // No-op
     warn() {} // No-op
     info() {} // No-op
     error(...args: unknown[]): void {
       console.error(...args);
     }
   }

   class DevelopmentLogger implements DebugLogger {
     log(...args: unknown[]): void { console.log(...args); }
     warn(...args: unknown[]): void { console.warn(...args); }
     error(...args: unknown[]): void { console.error(...args); }
     info(...args: unknown[]): void { console.info(...args); }
   }

   export const debug = import.meta.env.DEV
     ? new DevelopmentLogger()
     : new ProductionLogger();
   ```

2. No need to migrate all console statements yet (Phase 3)
3. Document usage in CLAUDE.md

**Verification:**
```bash
# Build production and check console statements are removed
npm run build
# Check dist/assets/*.js - should have minimal console.log
```

---

## 📅 PHASE 2: HIGH PRIORITY (Week 1-2)

**Goal:** Remove code duplication and architectural issues
**Time Estimate:** 1-2 weeks
**Priority:** HIGH

### Task 2.1: Remove Duplicate AddRecipientModal

**Issue:** [#2 - Duplicate AddRecipientModal](repository_fix.md#issue-2-duplicate-addrecipientmodal-components)
**Time:** 1 hour

**Steps:**
1. Identify which version to keep:
   ```bash
   wc -l src/components/AddRecipientModal.tsx
   wc -l src/components/recipient/AddRecipientModal.tsx
   # Keep the longer one (more features)
   ```

2. Find all imports:
   ```bash
   grep -r "import.*AddRecipientModal" src/
   ```

3. Update imports:
   ```bash
   # Replace in all files
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
     's|from.*@/components/AddRecipientModal|from "@/components/recipient/AddRecipientModal"|g' {} +
   ```

4. Delete old file:
   ```bash
   rm src/components/AddRecipientModal.tsx
   ```

5. Run tests:
   ```bash
   npm run test:run
   ```

6. Commit:
   ```bash
   git add .
   git commit -m "refactor: remove duplicate AddRecipientModal component"
   ```

**Verification:**
- No build errors
- All tests pass
- No references to old file path

---

### Task 2.2: Consolidate PDF Viewer Components

**Issue:** [#3 - Five PDF Viewer Components](repository_fix.md#issue-3-five-pdf-viewer-components-with-overlapping-functionality)
**Time:** 3-5 days
**Complexity:** HIGH

**Subtask 2.2.1: Extract PDF Hooks (Day 1-2)**

Create shared hooks:

```bash
# Create hooks directory
mkdir -p src/components/pdf/hooks
```

**Files to create:**
1. `src/components/pdf/hooks/usePDFDocument.ts`
   ```typescript
   export function usePDFDocument(url: string) {
     const [document, setDocument] = useState(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState(null);

     useEffect(() => {
       // Document loading logic
     }, [url]);

     return { document, isLoading, error };
   }
   ```

2. `src/components/pdf/hooks/usePDFNavigation.ts`
   ```typescript
   export function usePDFNavigation(totalPages: number) {
     const [currentPage, setCurrentPage] = useState(1);

     const nextPage = useCallback(() => {
       setCurrentPage(p => Math.min(p + 1, totalPages));
     }, [totalPages]);

     const prevPage = useCallback(() => {
       setCurrentPage(p => Math.max(p - 1, 1));
     }, []);

     const goToPage = useCallback((page: number) => {
       setCurrentPage(Math.max(1, Math.min(page, totalPages)));
     }, [totalPages]);

     return { currentPage, nextPage, prevPage, goToPage };
   }
   ```

3. `src/components/pdf/hooks/usePDFZoom.ts`
   ```typescript
   export function usePDFZoom(config?: { min?: number; max?: number; step?: number }) {
     const [scale, setScale] = useState(1.0);

     const zoomIn = useCallback(() => {
       setScale(s => Math.min(s + (config?.step || 0.2), config?.max || 3));
     }, [config]);

     const zoomOut = useCallback(() => {
       setScale(s => Math.max(s - (config?.step || 0.2), config?.min || 0.5));
     }, [config]);

     const resetZoom = useCallback(() => {
       setScale(1.0);
     }, []);

     return { scale, zoomIn, zoomOut, resetZoom };
   }
   ```

**Subtask 2.2.2: Create PDFRenderer Core (Day 2-3)**

```bash
mkdir -p src/components/pdf/core
```

Create `src/components/pdf/core/PDFRenderer.tsx`:
```typescript
export interface PDFRendererProps {
  document: PDFDocumentProxy;
  page: number;
  scale: number;
  onRenderSuccess?: () => void;
  onRenderError?: (error: Error) => void;
}

export function PDFRenderer({ document, page, scale, onRenderSuccess, onRenderError }: PDFRendererProps) {
  // Shared canvas rendering logic
}
```

**Subtask 2.2.3: Build UnifiedPDFViewer (Day 3-4)**

Create `src/components/pdf/UnifiedPDFViewer.tsx`:
```typescript
export interface PDFViewerConfig {
  enableMobileOptimizations?: boolean;
  enablePerformanceMode?: boolean;
  enableSigningElements?: boolean;
  enableZoom?: boolean;
  enableNavigation?: boolean;
  enableTouchGestures?: boolean;
}

export interface UnifiedPDFViewerProps {
  url: string;
  config?: PDFViewerConfig;
  onDocumentLoad?: (doc: PDFDocumentProxy) => void;
}

export function UnifiedPDFViewer({ url, config = {}, onDocumentLoad }: UnifiedPDFViewerProps) {
  const { document, isLoading, error } = usePDFDocument(url);
  const { currentPage, nextPage, prevPage, goToPage } = usePDFNavigation(document?.numPages || 1);
  const { scale, zoomIn, zoomOut, resetZoom } = usePDFZoom();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!document) return null;

  return (
    <div className="pdf-viewer">
      {config.enableZoom && (
        <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
      )}

      {config.enableNavigation && (
        <NavigationControls
          currentPage={currentPage}
          totalPages={document.numPages}
          onNext={nextPage}
          onPrev={prevPage}
          onGoTo={goToPage}
        />
      )}

      <PDFRenderer
        document={document}
        page={currentPage}
        scale={scale}
      />

      {config.enableSigningElements && (
        <SigningElementOverlay />
      )}
    </div>
  );
}
```

**Subtask 2.2.4: Update ResponsivePDFViewer (Day 4)**

Update `src/components/pdf/ResponsivePDFViewer.tsx`:
```typescript
export function ResponsivePDFViewer({ url }: { url: string }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <UnifiedPDFViewer
      url={url}
      config={{
        enableMobileOptimizations: isMobile,
        enableTouchGestures: isMobile,
        enableZoom: true,
        enableNavigation: true,
      }}
    />
  );
}
```

**Subtask 2.2.5: Migrate Usages (Day 5)**

Find all PDF viewer usages:
```bash
grep -r "PDFViewer\|MobilePDFViewer\|PerformancePDFViewer\|SigningPDFViewer" src/ \
  --include="*.tsx" --include="*.ts"
```

Update imports and props in:
- `src/pages/Editor.tsx`
- `src/pages/SignDocument.tsx`
- Other files using PDF viewers

**Subtask 2.2.6: Remove Old Files (Day 5)**

After all migrations:
```bash
# Keep only these:
# - src/components/pdf/UnifiedPDFViewer.tsx
# - src/components/pdf/ResponsivePDFViewer.tsx
# - src/components/pdf/core/PDFRenderer.tsx
# - src/components/pdf/hooks/*.ts
# - src/components/pdf/PDFErrorBoundary.tsx

# Delete:
rm src/components/pdf/PDFViewer.tsx
rm src/components/pdf/MobilePDFViewer.tsx
rm src/components/pdf/PerformancePDFViewer.tsx
rm src/components/pdf/SigningPDFViewer.tsx
rm src/components/pdf/PerformancePDFViewer.tsx
```

**Verification:**
```bash
npm run build
npm run test:run
npm run lint

# Check bundle size reduction
npm run build -- --mode production
ls -lh dist/assets/*.js
```

**Expected Outcome:**
- 1,685 lines → ~500 lines (70% reduction)
- Single source of truth for PDF viewing
- Smaller bundle size

---

### Task 2.3: Standardize Error Handling

**Issue:** [#5 - Inconsistent Error Handling](repository_fix.md#issue-5-inconsistent-error-handling-architecture)
**Time:** 3-4 days

**Subtask 2.3.1: Document Strategy (Day 1)**

Update `CLAUDE.md` with error handling guidelines:
```markdown
## Error Handling Strategy

### When to Use Each Pattern

1. **Data Fetching & Mutations** → `useApi()` hook
   - Any async operation that fetches/modifies data
   - Automatic retry and recovery
   - Consistent loading states

2. **Event Handlers** → `handleError()` function
   - onClick handlers
   - Form submissions
   - One-off operations

3. **Component Errors** → `<ErrorBoundary>`
   - Wrap risky components (PDF viewers, third-party)
   - Prevent app crashes

4. **Silent Logging** → `trackError()` directly
   - Analytics errors
   - Non-critical warnings

### Migration Guide

| Old Pattern | New Pattern | When |
|-------------|-------------|------|
| `handleApiError()` | `useApi()` | Always for async ops |
| `useErrorHandling()` | `useApi()` | Always for async ops |
| Manual try/catch | `handleError()` | Event handlers only |
```

**Subtask 2.3.2: Deprecate handleApiError (Day 2)**

1. Add deprecation notice:
   ```typescript
   /**
    * @deprecated Use useApi() hook instead
    * This will be removed in v2.0
    */
   export async function handleApiError<T>(
     operation: () => Promise<T>,
     context: string
   ): Promise<T> {
     console.warn('handleApiError is deprecated. Use useApi() hook instead.');
     // Keep implementation for backward compatibility
   }
   ```

2. Find usages:
   ```bash
   grep -r "handleApiError" src/
   ```

**Subtask 2.3.3: Migrate to useApi (Day 2-3)**

For each usage of `handleApiError`, replace with `useApi`:

```typescript
// Before:
const [loading, setLoading] = useState(false);
const handleSubmit = async () => {
  setLoading(true);
  try {
    const result = await handleApiError(
      () => uploadDocument(file),
      'upload'
    );
    toast.success('Success!');
  } catch (error) {
    // Error already handled
  } finally {
    setLoading(false);
  }
};

// After:
const { execute, isLoading } = useApi(
  (file: File) => uploadDocument(file),
  'uploadDocument',
  {
    onSuccess: () => toast.success('Success!'),
  }
);

const handleSubmit = () => execute(file);
```

**Subtask 2.3.4: Fix SignDocument Error Recovery (Day 3)**

Update `src/pages/SignDocument.tsx`:
```typescript
const { execute: loadDocumentUrl, isLoading, error } = useApi(
  async (storagePath: string) => {
    const url = await getDocumentUrl(storagePath);
    if (!url) throw new Error('Failed to generate document URL');
    return url;
  },
  'loadDocumentUrl',
  {
    maxRetries: 3,
    onSuccess: (url) => setDocumentUrl(url),
  }
);

useEffect(() => {
  if (documentData?.storage_path) {
    loadDocumentUrl(documentData.storage_path);
  }
}, [documentData?.storage_path]);

// Add error UI
if (error) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={() => loadDocumentUrl(documentData.storage_path)}
    />
  );
}
```

**Verification:**
```bash
npm run test:run
npm run lint
```

---

### Task 2.4: Add Type Safety for Status Fields

**Issue:** [#10 - Weak Type for Recipient Status](repository_fix.md#issue-10-weak-type-for-recipient-status)
**Time:** 2-3 hours

**Steps:**

1. Update `src/utils/types.ts`:
   ```typescript
   // Add union types
   export type DocumentStatus = 'draft' | 'sent' | 'completed' | 'cancelled';
   export type RecipientStatus = 'pending' | 'sent' | 'opened' | 'signed' | 'declined';
   export type SigningElementType = 'signature' | 'initials' | 'text' | 'date' | 'checkbox';

   // Update interfaces
   export interface Document {
     // ... other fields
     status: DocumentStatus;  // Changed from string
   }

   export interface Recipient {
     // ... other fields
     status: RecipientStatus;  // Changed from string
   }

   export interface SigningElement {
     // ... other fields
     type: SigningElementType;  // Changed from string
   }
   ```

2. Fix TypeScript errors:
   ```bash
   npx tsc --noEmit
   # Fix all type errors in components
   ```

3. Update database types in `src/types/supabase.ts`

4. Create Supabase migration (optional):
   ```sql
   -- supabase/migrations/add_status_enums.sql
   CREATE TYPE recipient_status AS ENUM ('pending', 'sent', 'opened', 'signed', 'declined');
   CREATE TYPE document_status AS ENUM ('draft', 'sent', 'completed', 'cancelled');
   CREATE TYPE signing_element_type AS ENUM ('signature', 'initials', 'text', 'date', 'checkbox');

   ALTER TABLE recipients
     ALTER COLUMN status TYPE recipient_status
     USING status::recipient_status;
   ```

**Verification:**
```bash
npx tsc --noEmit  # Should show errors for invalid status values
npm run test:run
```

---

## 📅 PHASE 3: MEDIUM PRIORITY (Week 3-4)

**Goal:** Standardize patterns and improve architecture
**Time Estimate:** 1-2 weeks
**Priority:** MEDIUM

### Task 3.1: Centralize Email Validation

**Issue:** [#7 - Email Validation Duplication](repository_fix.md#issue-7-email-validation-duplication)
**Time:** 1-2 hours

**Steps:**

1. Find all email validation:
   ```bash
   grep -rn "test.*email\|includes.*@" src/components/ --include="*.tsx"
   ```

2. Replace inline validation:
   ```typescript
   // Before:
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     setError('Invalid email');
   }

   // After:
   import { ValidationHelpers } from '@/utils/validation';

   if (!ValidationHelpers.isValidEmail(email)) {
     setError('Invalid email');
   }
   ```

3. For Zod schemas, create shared schema:
   ```typescript
   // Add to src/utils/validation.ts
   export const emailSchema = z
     .string()
     .min(1, 'Email is required')
     .refine(
       val => ValidationHelpers.isValidEmail(val),
       'Please enter a valid email address'
     );
   ```

4. Update components using Zod:
   ```typescript
   import { emailSchema } from '@/utils/validation';

   const formSchema = z.object({
     email: emailSchema,
     // ... other fields
   });
   ```

**Files to Update:**
- `src/components/EmailForm.tsx`
- `src/components/RecipientModal.tsx`
- `src/components/AddRecipientModal.tsx` (if not deleted)

**Verification:**
```bash
npm run test:run -- validation
```

---

### Task 3.2: Extract Development Mocks

**Issue:** [#8 - Development Mode Bypass Code](repository_fix.md#issue-8-development-mode-bypass-code-mixed-with-production)
**Time:** 1-2 days

**Steps:**

1. Create mock client structure:
   ```bash
   mkdir -p src/lib/supabase/mock
   ```

2. Create files:
   - `src/lib/supabase/types.ts` - Shared types
   - `src/lib/supabase/production.ts` - Production client
   - `src/lib/supabase/mock/client.ts` - Mock client
   - `src/lib/supabase/mock/storage.ts` - Mock storage
   - `src/lib/supabase/mock/database.ts` - Mock database
   - `src/lib/supabase/index.ts` - Exports correct client

3. Implement mock client:
   ```typescript
   // src/lib/supabase/mock/client.ts
   export function createMockClient(): SupabaseClient {
     return {
       auth: createMockAuth(),
       storage: createMockStorage(),
       from: createMockDatabase,
     };
   }
   ```

4. Update main export:
   ```typescript
   // src/lib/supabase/index.ts
   import { createProductionClient } from './production';
   import { createMockClient } from './mock/client';
   import { env } from '@/utils/env';

   export const supabase = env.isDevelopment
     ? createMockClient()
     : createProductionClient();
   ```

5. Clean up production functions:
   ```typescript
   // Remove all if (isDevelopment) checks
   export async function uploadDocument(file: File, path: string) {
     const session = await supabase.auth.getSession();

     const { data, error } = await supabase.storage
       .from(STORAGE_BUCKET)
       .upload(path, file, {
         cacheControl: '3600',
         upsert: true
       });

     if (error) throw error;
     return data;
   }
   ```

**Verification:**
```bash
# Dev mode should still work
npm run dev

# Production build should be smaller
npm run build
ls -lh dist/assets/*.js
```

---

### Task 3.3: Migrate Console Statements to Debug Utility

**Issue:** [#9 - Excessive Console Logging](repository_fix.md#issue-9-excessive-console-logging-in-production)
**Time:** 2-3 hours

**Steps:**

1. Find all console statements:
   ```bash
   grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l
   ```

2. Auto-replace (carefully):
   ```bash
   # Dry run first
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\." {} \;

   # Replace console.log with debug.log
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
     -e 's/console\.log/debug.log/g' \
     -e 's/console\.warn/debug.warn/g' \
     -e 's/console\.info/debug.info/g' \
     {} +
   ```

3. Add imports:
   ```bash
   # For each file that uses debug
   # Add at top:
   import { debug } from '@/utils/debug';
   ```

4. Keep console.error or convert to debug.error:
   ```bash
   # Optional: convert error logging too
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
     's/console\.error/debug.error/g' {} +
   ```

**Verification:**
```bash
# Dev mode - should see logs
npm run dev

# Production build - should not see debug logs
npm run build
npm run preview
# Open console - should see minimal logs
```

---

### Task 3.4: Refactor useEditorState Hook

**Issue:** [#11 - useEditorState Complexity](repository_fix.md#issue-11-useeditorstate-hook-complexity)
**Time:** 2-3 days
**Complexity:** HIGH

**Subtask 3.4.1: Install React Query (if not already)**

```bash
npm install @tanstack/react-query
```

**Subtask 3.4.2: Create Focused Hooks (Day 1)**

Create separate hooks:

1. `src/hooks/useDocumentData.ts`:
   ```typescript
   export function useDocumentData(documentId: string) {
     return useQuery({
       queryKey: ['document', documentId],
       queryFn: () => getDocument(documentId),
       staleTime: 1000 * 60 * 5, // 5 minutes
       enabled: !!documentId,
     });
   }
   ```

2. `src/hooks/useDocumentSync.ts`:
   ```typescript
   export function useDocumentSync(documentId: string) {
     const queryClient = useQueryClient();

     useEffect(() => {
       if (!documentId || import.meta.env.DEV) return;

       const subscription = supabase
         .channel(`recipients:${documentId}`)
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: 'recipients',
           filter: `document_id=eq.${documentId}`,
         }, () => {
           queryClient.invalidateQueries(['document', documentId]);
         })
         .subscribe();

       return () => subscription.unsubscribe();
     }, [documentId, queryClient]);
   }
   ```

3. `src/hooks/useSigningElements.ts`:
   ```typescript
   export function useSigningElements(documentId: string) {
     const queryClient = useQueryClient();

     const addElement = useMutation({
       mutationFn: (element: SigningElement) => createSigningElement(element),
       onSuccess: () => {
         queryClient.invalidateQueries(['document', documentId]);
         toast.success('Element added');
       },
     });

     const removeElement = useMutation({
       mutationFn: (elementId: string) => deleteSigningElement(elementId, documentId),
       onSuccess: () => {
         queryClient.invalidateQueries(['document', documentId]);
         toast.success('Element removed');
       },
     });

     return { addElement, removeElement };
   }
   ```

4. `src/hooks/useEditorUI.ts`:
   ```typescript
   export function useEditorUI() {
     const [activeElementType, setActiveElementType] = useState(null);
     const [selectedRecipientId, setSelectedRecipientId] = useState(null);
     const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
     const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

     // ... UI state logic

     return {
       activeElementType,
       selectedRecipientId,
       isRecipientModalOpen,
       isEmailModalOpen,
       setActiveElementType,
       setSelectedRecipientId,
       setIsRecipientModalOpen,
       setIsEmailModalOpen,
     };
   }
   ```

**Subtask 3.4.3: Compose New useEditorState (Day 2)**

Update `src/hooks/useEditorState.ts`:
```typescript
export function useEditorState(documentId: string) {
  const { data: document, isLoading, error } = useDocumentData(documentId);
  useDocumentSync(documentId);
  const { addElement, removeElement } = useSigningElements(documentId);
  const ui = useEditorUI();

  return {
    document,
    recipients: document?.recipients || [],
    signingElements: document?.signing_elements || [],
    isLoading,
    error: error?.message || null,
    addSigningElement: addElement.mutate,
    removeSigningElement: removeElement.mutate,
    ...ui,
  };
}
```

**Subtask 3.4.4: Update Components (Day 3)**

Update components using useEditorState to handle new return values.

**Verification:**
```bash
npm run test:run
npm run dev
# Test document editing flow
```

**Expected Outcome:**
- 268 lines → ~150 lines (40% reduction)
- No refs needed
- Easier to test each hook in isolation
- React Query handles caching automatically

---

## 📅 PHASE 4: POLISH (Week 5-6)

**Goal:** Code organization and minor improvements
**Time Estimate:** 1-2 weeks
**Priority:** LOW

### Task 4.1: Standardize Import Ordering

**Issue:** [#12 - Import Organization](repository_fix.md#issue-12-import-organization-inconsistency)
**Time:** 1-2 hours

**Steps:**

1. Install ESLint plugin:
   ```bash
   npm install --save-dev eslint-plugin-import
   ```

2. Update `.eslintrc.json`:
   ```json
   {
     "plugins": ["import"],
     "rules": {
       "import/order": ["error", {
         "groups": [
           "builtin",
           "external",
           "internal",
           "parent",
           "sibling",
           "index",
           "type"
         ],
         "pathGroups": [
           {
             "pattern": "react",
             "group": "external",
             "position": "before"
           },
           {
             "pattern": "@/components/ui/**",
             "group": "internal",
             "position": "before"
           }
         ],
         "newlines-between": "always",
         "alphabetize": {
           "order": "asc",
           "caseInsensitive": true
         }
       }]
     }
   }
   ```

3. Auto-fix:
   ```bash
   npx eslint --fix "src/**/*.{ts,tsx}"
   ```

4. Commit:
   ```bash
   git add .
   git commit -m "style: standardize import ordering"
   ```

---

### Task 4.2: Migrate to Named Exports

**Issue:** [#13 - Mixed Export Patterns](repository_fix.md#issue-13-mixed-export-patterns)
**Time:** 2-3 hours

**Steps:**

1. Find default exports:
   ```bash
   grep -r "export default" src/ --include="*.tsx" --include="*.ts"
   ```

2. For each file, add named export alongside default:
   ```typescript
   // Before:
   export default function RecipientModal() { }

   // During migration:
   export function RecipientModal() { }
   export default RecipientModal;  // Keep for compatibility
   ```

3. Update imports gradually:
   ```typescript
   // From:
   import RecipientModal from '@/components/RecipientModal';

   // To:
   import { RecipientModal } from '@/components/RecipientModal';
   ```

4. Once all imports updated, remove default export

**Verification:**
```bash
npm run build
npm run test:run
```

---

### Task 4.3: Minor Optimization - Email Validation Order

**Issue:** [#14 - Email Validation Order](repository_fix.md#issue-14-email-validation-refinement-order)
**Time:** 5 minutes

**Steps:**

1. Open `src/utils/validation.ts`

2. Find line 58, reorder:
   ```typescript
   // Before:
   .refine(val => PATTERNS.EMAIL.test(val) && !val.includes('..'), ...)

   // After:
   .refine(val => !val.includes('..') && PATTERNS.EMAIL.test(val), ...)
   ```

3. Run tests:
   ```bash
   npm run test:run -- validation
   ```

---

### Task 4.4: Update Documentation

**Time:** 1-2 hours

**Steps:**

1. Update `CLAUDE.md` with all architectural changes

2. Add sections:
   - Error handling strategy
   - PDF viewer usage
   - Type-safe patterns
   - Development vs production

3. Update `README.md` if needed

4. Add code examples for common patterns

**Files to Update:**
- `CLAUDE.md`
- `README.md`
- Add `CONTRIBUTING.md` with code style guide

---

## 📊 PROGRESS TRACKING

Use this checklist to track progress:

### Phase 1: Critical Fixes ☐
- [ ] Task 1.1: Fix instanceof check (10 min)
- [ ] Task 1.2: Improve useApi types (1-2 hrs)
- [ ] Task 1.3: Create debug utility (30 min)

### Phase 2: High Priority ☐
- [ ] Task 2.1: Remove duplicate modal (1 hr)
- [ ] Task 2.2: Consolidate PDF viewers (3-5 days)
  - [ ] 2.2.1: Extract PDF hooks
  - [ ] 2.2.2: Create PDFRenderer
  - [ ] 2.2.3: Build UnifiedPDFViewer
  - [ ] 2.2.4: Update ResponsivePDFViewer
  - [ ] 2.2.5: Migrate usages
  - [ ] 2.2.6: Remove old files
- [ ] Task 2.3: Standardize error handling (3-4 days)
  - [ ] 2.3.1: Document strategy
  - [ ] 2.3.2: Deprecate handleApiError
  - [ ] 2.3.3: Migrate to useApi
  - [ ] 2.3.4: Fix SignDocument errors
- [ ] Task 2.4: Add status type safety (2-3 hrs)

### Phase 3: Medium Priority ☐
- [ ] Task 3.1: Centralize email validation (1-2 hrs)
- [ ] Task 3.2: Extract dev mocks (1-2 days)
- [ ] Task 3.3: Migrate console statements (2-3 hrs)
- [ ] Task 3.4: Refactor useEditorState (2-3 days)
  - [ ] 3.4.1: Install React Query
  - [ ] 3.4.2: Create focused hooks
  - [ ] 3.4.3: Compose new useEditorState
  - [ ] 3.4.4: Update components

### Phase 4: Polish ☐
- [ ] Task 4.1: Standardize imports (1-2 hrs)
- [ ] Task 4.2: Migrate to named exports (2-3 hrs)
- [ ] Task 4.3: Email validation order (5 min)
- [ ] Task 4.4: Update documentation (1-2 hrs)

---

## 🎯 SUCCESS METRICS

Track these metrics to measure improvement:

### Code Quality
- [ ] Lines of code reduced by ~1,500
- [ ] Bundle size reduction: Target -15%
- [ ] TypeScript strict mode enabled (optional)
- [ ] Zero ESLint errors
- [ ] All tests passing

### Type Safety
- [ ] No `any` types in business logic
- [ ] Status fields use union types
- [ ] useApi with proper generics
- [ ] Full type coverage for API calls

### Architecture
- [ ] PDF viewers: 5 files → 1 configurable file
- [ ] Error patterns: 5 → 3
- [ ] Dev mode: Separated from production
- [ ] Hooks: Focused and composable

### Performance
- [ ] Production console logs: ~0
- [ ] Bundle size smaller
- [ ] Faster build times
- [ ] Better tree-shaking

---

## 🔄 TESTING STRATEGY

### After Each Phase

1. **Unit Tests:**
   ```bash
   npm run test:run
   ```

2. **Type Checking:**
   ```bash
   npx tsc --noEmit
   ```

3. **Linting:**
   ```bash
   npm run lint
   ```

4. **Build:**
   ```bash
   npm run build
   ```

5. **Manual Testing:**
   - Upload document
   - Edit PDF with signing elements
   - Send for signature
   - Sign document
   - Check all flows work

### Before Production Deploy

1. **Full Test Suite:**
   ```bash
   npm run test:coverage
   ```

2. **Production Build:**
   ```bash
   npm run build
   npm run preview
   ```

3. **Bundle Analysis:**
   ```bash
   npm run build -- --analyze
   ```

4. **Performance Check:**
   - Lighthouse audit
   - Check bundle sizes
   - Test on slow connection

---

## 📝 COMMIT STRATEGY

### Commit Message Format
```
type(scope): description

[optional body]
[optional footer]
```

**Types:**
- `fix:` Bug fixes (patches)
- `feat:` New features (minor)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `style:` Code style changes
- `test:` Test additions/changes
- `docs:` Documentation changes
- `chore:` Build process, dependencies

**Examples:**
```bash
git commit -m "fix(error-handling): correct instanceof check in useErrorHandling"
git commit -m "refactor(pdf): consolidate PDF viewers into UnifiedPDFViewer"
git commit -m "feat(types): add union types for status fields"
git commit -m "perf(logging): replace console with debug utility"
```

### Branch Strategy

**Option 1: Feature Branches**
```bash
git checkout -b fix/instanceof-check
git checkout -b refactor/pdf-viewers
git checkout -b feat/type-safety
```

**Option 2: Phase Branches**
```bash
git checkout -b phase-1-critical-fixes
git checkout -b phase-2-high-priority
git checkout -b phase-3-medium-priority
git checkout -b phase-4-polish
```

---

## 🚀 DEPLOYMENT PLAN

### After Phase 1 (Critical Fixes)
- Can deploy immediately
- Low risk changes
- Direct bug fixes

### After Phase 2 (High Priority)
- Major refactoring complete
- Thorough testing required
- Consider beta deployment first

### After Phase 3 (Medium Priority)
- Architecture improvements stable
- Full regression testing
- Production deployment

### After Phase 4 (Polish)
- Final release
- Update changelog
- Announce improvements

---

## 📞 SUPPORT & ROLLBACK

### If Issues Arise

1. **Rollback Strategy:**
   ```bash
   git revert <commit-hash>
   # Or
   git reset --hard <previous-commit>
   ```

2. **Debug Steps:**
   - Check error logs
   - Run tests in isolation
   - Compare with previous version
   - Check TypeScript errors

3. **Getting Help:**
   - Review detailed issue documentation
   - Check Git history for context
   - Use Git bisect to find breaking commit

---

## ✅ COMPLETION CHECKLIST

After completing all phases:

- [ ] All 16 issues resolved
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size reduced
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Production deployment successful
- [ ] No regressions reported

---

**End of Action Plan**

*For detailed issue descriptions, see [repository_fix.md](repository_fix.md)*
