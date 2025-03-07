import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Upload, Clock, CheckCircle, PenLine } from 'lucide-react';
import { DocumentActivity } from '@/utils/types';
import { format } from 'date-fns';
import { listDocuments, getRecentActivity } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [draftCount, setDraftCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<DocumentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch document counts
        const [drafts, pending, completed, activity] = await Promise.all([
          listDocuments('draft'),
          listDocuments('sent'),
          listDocuments('completed'),
          getRecentActivity()
        ]);

        setDraftCount(drafts.length);
        setPendingCount(pending.length);
        setCompletedCount(completed.length);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getActivityIcon = (action: DocumentActivity['action']) => {
    switch (action) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'viewed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: DocumentActivity) => {
    switch (activity.action) {
      case 'signed':
        return `${activity.actorName} signed ${activity.documentName}`;
      case 'sent':
        return `You sent ${activity.documentName} to ${activity.actorName}`;
      case 'viewed':
        return `${activity.actorName} viewed ${activity.documentName}`;
      case 'created':
        return `You created ${activity.documentName}`;
      default:
        return `Activity on ${activity.documentName}`;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button asChild>
            <Link to="/upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Draft Documents</h2>
              <span className="text-2xl font-bold text-yellow-600">{draftCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Documents in draft state
            </p>
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link to="/documents?filter=draft">
                <PenLine className="h-4 w-4 mr-2" />
                View Drafts
              </Link>
            </Button>
          </div>

          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Pending Signatures</h2>
              <span className="text-2xl font-bold text-primary">{pendingCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Documents waiting for signatures
            </p>
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link to="/documents?filter=sent">
                <Clock className="h-4 w-4 mr-2" />
                View Pending
              </Link>
            </Button>
          </div>

          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Completed Documents</h2>
              <span className="text-2xl font-bold text-green-600">{completedCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Documents with all signatures collected
            </p>
            <Button variant="outline" asChild className="mt-4 w-full">
              <Link to="/documents?filter=completed">
                <CheckCircle className="h-4 w-4 mr-2" />
                View Completed
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.action)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getActivityMessage(activity)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(activity.timestamp, 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
