
import React, { useEffect, useState } from 'react';
import { SignatureVerification } from '@/utils/types';
import { Shield, ShieldAlert, Clock } from 'lucide-react';
import { SignatureVerificationUtil } from '@/utils/signatureVerification';

interface SignatureVerificationProps {
  signatureId: string;
  documentId: string;
}

export const SignatureVerificationDisplay: React.FC<SignatureVerificationProps> = ({
  signatureId,
  documentId,
}) => {
  const [verification, setVerification] = useState<SignatureVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySignature = async () => {
      try {
        const verificationInfo = await SignatureVerificationUtil.getVerificationInfo(
          signatureId,
          documentId
        );
        setVerification(verificationInfo);
      } catch (error) {
        console.error('Error verifying signature:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySignature();
  }, [signatureId, documentId]);

  if (loading) {
    return <div>Verifying signature...</div>;
  }

  if (!verification) {
    return (
      <div className="flex items-center text-red-500">
        <ShieldAlert className="w-4 h-4 mr-2" />
        Unable to verify signature
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {verification.isValid ? (
          <div className="flex items-center text-green-500">
            <Shield className="w-4 h-4 mr-2" />
            Signature verified
          </div>
        ) : (
          <div className="flex items-center text-red-500">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Invalid signature
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Signed on {new Date(verification.timestamp).toLocaleString()}
        </div>
        <div>by {verification.signedBy.name} ({verification.signedBy.email})</div>
      </div>
    </div>
  );
};
