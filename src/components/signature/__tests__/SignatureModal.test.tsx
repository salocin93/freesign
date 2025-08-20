import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { SignatureModal } from '../SignatureModal'

// Mock react-signature-canvas
vi.mock('react-signature-canvas', () => ({
  default: vi.fn(({ onEnd, ref }) => (
    <canvas
      data-testid="signature-canvas"
      ref={ref}
      onMouseUp={onEnd}
      width="400"
      height="200"
    />
  ))
}))

// Mock child components
vi.mock('../TypeSignature', () => ({
  TypeSignature: vi.fn(({ onSignatureChange }) => (
    <div data-testid="type-signature">
      <input
        data-testid="type-input"
        onChange={(e) => onSignatureChange?.(e.target.value)}
        placeholder="Type your signature"
      />
    </div>
  ))
}))

vi.mock('../UploadSignature', () => ({
  UploadSignature: vi.fn(({ onSignatureChange }) => (
    <div data-testid="upload-signature">
      <input
        data-testid="file-input"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onSignatureChange?.('data:image/png;base64,mockuploadedimage')
          }
        }}
      />
    </div>
  ))
}))

// Mock accessibility utilities
vi.mock('@/utils/accessibility', () => ({
  AriaLabelGenerator: {},
  FocusManagement: {},
  ScreenReaderSupport: {},
  useFocusTrap: vi.fn(),
  useKeyboardNavigation: vi.fn(),
  useScreenReaderAnnouncement: vi.fn(() => vi.fn())
}))

describe('SignatureModal', () => {
  const mockOnClose = vi.fn()
  const mockOnComplete = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onComplete: mockOnComplete
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(<SignatureModal {...defaultProps} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Create Your Signature')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<SignatureModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display all signature tabs', () => {
    render(<SignatureModal {...defaultProps} />)
    
    expect(screen.getByText('Draw')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Upload')).toBeInTheDocument()
  })

  it('should show draw tab by default', () => {
    render(<SignatureModal {...defaultProps} />)
    
    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument()
  })

  it('should switch to type tab when clicked', async () => {
    render(<SignatureModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Type'))
    
    await waitFor(() => {
      expect(screen.getByTestId('type-signature')).toBeInTheDocument()
    })
  })

  it('should switch to upload tab when clicked', async () => {
    render(<SignatureModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Upload'))
    
    await waitFor(() => {
      expect(screen.getByTestId('upload-signature')).toBeInTheDocument()
    })
  })

  it('should show terms agreement checkbox', () => {
    render(<SignatureModal {...defaultProps} />)
    
    expect(screen.getByLabelText(/I agree to the terms/i)).toBeInTheDocument()
  })

  it('should disable complete button when terms not agreed', () => {
    render(<SignatureModal {...defaultProps} />)
    
    const completeButton = screen.getByRole('button', { name: /complete signature/i })
    expect(completeButton).toBeDisabled()
  })

  it('should enable complete button when terms agreed and signature exists', async () => {
    render(<SignatureModal {...defaultProps} />)
    
    // Create a signature on canvas
    const canvas = screen.getByTestId('signature-canvas')
    fireEvent.mouseUp(canvas)
    
    // Agree to terms
    const termsCheckbox = screen.getByLabelText(/I agree to the terms/i)
    fireEvent.click(termsCheckbox)
    
    await waitFor(() => {
      const completeButton = screen.getByRole('button', { name: /complete signature/i })
      expect(completeButton).not.toBeDisabled()
    })
  })

  it('should call onComplete when complete button clicked', async () => {
    render(<SignatureModal {...defaultProps} />)
    
    // Create a signature
    const canvas = screen.getByTestId('signature-canvas')
    fireEvent.mouseUp(canvas)
    
    // Agree to terms
    const termsCheckbox = screen.getByLabelText(/I agree to the terms/i)
    fireEvent.click(termsCheckbox)
    
    // Click complete
    await waitFor(() => {
      const completeButton = screen.getByRole('button', { name: /complete signature/i })
      fireEvent.click(completeButton)
    })
    
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.any(String), // signature data
      expect.any(Date),    // date
      true                 // agreed to terms
    )
  })

  it('should call onClose when cancel button clicked', () => {
    render(<SignatureModal {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should clear signature when clear button clicked', async () => {
    render(<SignatureModal {...defaultProps} />)
    
    // Create a signature
    const canvas = screen.getByTestId('signature-canvas')
    fireEvent.mouseUp(canvas)
    
    // Clear signature
    const clearButton = screen.getByRole('button', { name: /clear/i })
    fireEvent.click(clearButton)
    
    // Complete button should be disabled again
    await waitFor(() => {
      const completeButton = screen.getByRole('button', { name: /complete signature/i })
      expect(completeButton).toBeDisabled()
    })
  })

  describe('Type Signature Tab', () => {
    it('should handle typed signature', async () => {
      render(<SignatureModal {...defaultProps} />)
      
      // Switch to type tab
      fireEvent.click(screen.getByText('Type'))
      
      await waitFor(() => {
        const typeInput = screen.getByTestId('type-input')
        fireEvent.change(typeInput, { target: { value: 'John Doe' } })
      })
      
      // Agree to terms
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i)
      fireEvent.click(termsCheckbox)
      
      // Complete signature
      await waitFor(() => {
        const completeButton = screen.getByRole('button', { name: /complete signature/i })
        fireEvent.click(completeButton)
      })
      
      expect(mockOnComplete).toHaveBeenCalledWith(
        'John Doe',
        expect.any(Date),
        true
      )
    })
  })

  describe('Upload Signature Tab', () => {
    it('should handle uploaded signature', async () => {
      render(<SignatureModal {...defaultProps} />)
      
      // Switch to upload tab
      fireEvent.click(screen.getByText('Upload'))
      
      await waitFor(() => {
        // Simulate file upload
        const fileInput = screen.getByTestId('file-input')
        const mockFile = new File(['mock'], 'signature.png', { type: 'image/png' })
        fireEvent.change(fileInput, { target: { files: [mockFile] } })
      })
      
      // Agree to terms
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i)
      fireEvent.click(termsCheckbox)
      
      // Complete signature
      await waitFor(() => {
        const completeButton = screen.getByRole('button', { name: /complete signature/i })
        fireEvent.click(completeButton)
      })
      
      expect(mockOnComplete).toHaveBeenCalledWith(
        'data:image/png;base64,mockuploadedimage',
        expect.any(Date),
        true
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SignatureModal {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    })

    it('should support keyboard navigation', () => {
      render(<SignatureModal {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle signature canvas errors gracefully', () => {
      // Mock console.error to verify error handling
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<SignatureModal {...defaultProps} />)
      
      // Simulate an error in signature canvas
      const canvas = screen.getByTestId('signature-canvas')
      fireEvent.error(canvas)
      
      // Component should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      consoleError.mockRestore()
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<SignatureModal {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('signature-canvas')).toBeInTheDocument()
    })
  })
})