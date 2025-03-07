import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Document } from '@/utils/types';
import { 
  FileText, 
  PenLine, 
  CheckCircle, 
  Clock, 
  Search,
  Upload
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listDocuments } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const Documents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch documents when filter changes
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const status = filter === 'all' ? undefined : filter as 'draft' | 'sent' | 'completed';
        const docs = await listDocuments(status);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [filter, toast]);

  // Update URL when filter changes
  useEffect(() => {
    if (filter === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', filter);
    }
    setSearchParams(searchParams);
  }, [filter, searchParams, setSearchParams]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Waiting for signature</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'draft':
        return <PenLine className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">All Documents</h1>
            <p className="text-muted-foreground">
              View and manage all your documents
            </p>
          </div>
          
          <Button asChild>
            <Link to="/upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('draft')}
                >
                  Drafts
                </Button>
                <Button
                  variant={filter === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('sent')}
                >
                  Awaiting
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          <span>{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(doc.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link to={`/editor?id=${doc.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Documents;
