import { config } from '@/config';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function DevTools() {
  const navigate = useNavigate();

  if (!config.isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <h3 className="text-sm font-bold mb-2">Dev Tools</h3>
      <div className="space-y-2">
        <Button 
          size="sm"
          onClick={() => navigate('/test-sign')}
        >
          Test Signing
        </Button>
      </div>
    </div>
  );
} 