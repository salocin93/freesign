import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your signature has been successfully recorded. All parties will be notified when the document is fully signed.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 