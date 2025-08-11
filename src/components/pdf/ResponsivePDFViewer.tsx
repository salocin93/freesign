/**
 * ResponsivePDFViewer Component
 * 
 * A responsive PDF viewer component that automatically switches between desktop
 * and mobile versions based on screen size and device capabilities. This component
 * provides the best user experience for each device type.
 * 
 * Features:
 * - Automatic switching between desktop and mobile views
 * - Touch device detection
 * - Responsive layout adaptation
 * - Device orientation handling
 * - Performance optimization for different devices
 * 
 * Props:
 * @param {string} url - URL of the PDF document to display
 * @param {SigningElement[]} signingElements - Array of signing elements to overlay
 * @param {Recipient[]} recipients - Array of recipients
 * @param {(elementId: string) => void} [onElementClick] - Callback when element is clicked
 * @param {(type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void} [onAddElement] - Callback when adding new element
 * @param {SigningElement['type'] | null} [activeElementType] - Currently active element type
 * @param {(elementId: string) => void} [onRemoveElement] - Callback when element is removed
 * @param {string | null} [selectedRecipientId] - Currently selected recipient ID
 * @param {() => void} [onOpenAddRecipient] - Callback to open add recipient modal
 */

import { useIsMobile, useIsTouchDevice, useDeviceOrientation, useViewportSize } from '@/hooks/use-mobile';
import { PDFViewer } from './PDFViewer';
import { MobilePDFViewer } from './MobilePDFViewer';
import { SigningElement, Recipient } from '@/utils/types';

interface ResponsivePDFViewerProps {
  url: string;
  signingElements: SigningElement[];
  recipients: Recipient[];
  onElementClick?: (elementId: string) => void;
  onAddElement?: (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void;
  activeElementType?: SigningElement['type'] | null;
  onRemoveElement?: (elementId: string) => void;
  selectedRecipientId?: string | null;
  onOpenAddRecipient?: () => void;
}

export function ResponsivePDFViewer(props: ResponsivePDFViewerProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const orientation = useDeviceOrientation();
  const viewportSize = useViewportSize();

  // Determine which viewer to use based on device characteristics
  const shouldUseMobileViewer = isMobile || (isTouchDevice && viewportSize.width < 1024);

  // Show loading state while determining device type
  if (isMobile === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use mobile viewer for mobile devices or touch devices with small screens
  if (shouldUseMobileViewer) {
    return <MobilePDFViewer {...props} />;
  }

  // Use desktop viewer for larger screens
  return <PDFViewer {...props} />;
}
