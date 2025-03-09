import { SignDocument } from './SignDocument';
import { useTestDocument } from '@/hooks/useTestDocument';

export function TestSignDocument() {
  const { document, recipient } = useTestDocument();

  if (!document || !recipient) {
    return <div>Loading test document...</div>;
  }

  // Pre-fill the URL parameters
  const searchParams = new URLSearchParams();
  searchParams.set('recipient', recipient.email);
  
  return (
    <SignDocument 
      documentId={document.id} 
      recipientEmail={recipient.email}
      testMode={true} // Add this prop to bypass certain checks in development
    />
  );
} 