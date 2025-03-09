import { useNavigate } from 'react-router-dom';
import { useTestDocument } from '@/hooks/useTestDocument';

export function TestSignDocument() {
  const navigate = useNavigate();
  const { document, recipient } = useTestDocument();

  if (!document || !recipient) {
    return <div>Loading test document...</div>;
  }

  // Redirect to the sign page with the correct parameters
  navigate(`/sign/${document.id}?recipient=${recipient.email}`);
  
  return null;
} 