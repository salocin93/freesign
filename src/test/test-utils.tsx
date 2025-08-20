import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock user for testing
const mockUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Create a wrapper with all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Render with specific route
export const renderWithRoute = (
  ui: ReactElement,
  { route = '/', ...renderOptions }: { route?: string } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <AllTheProviders>{children}</AllTheProviders>
    </MemoryRouter>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock document data for tests
export const mockDocument = {
  id: 'mock-doc-id',
  title: 'Test Document',
  status: 'draft' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: mockUser.id,
  file_path: 'documents/test.pdf'
}

// Mock recipient data for tests
export const mockRecipient = {
  id: 'mock-recipient-id',
  document_id: mockDocument.id,
  email: 'recipient@example.com',
  name: 'Test Recipient',
  status: 'pending' as const,
  access_token: 'mock-token',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock signing element data for tests
export const mockSigningElement = {
  id: 'mock-element-id',
  document_id: mockDocument.id,
  recipient_id: mockRecipient.id,
  type: 'signature' as const,
  x: 100,
  y: 100,
  width: 200,
  height: 50,
  page_number: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { mockUser }