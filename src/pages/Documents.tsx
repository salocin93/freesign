import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Document } from '@/utils/types';
import { 
  FileText, 
  PenLine, 
  CheckCircle, 
  Clock, 
  Search,
  Upload,
  MoreVertical,
  Mail,
  Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listDocuments } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { supabase, initializeAuth, clearSupabaseCache } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';

const Documents = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize auth and fetch documents
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await clearSupabaseCache(); // Add this line
        await initializeAuth(); // Wait for auth to initialize
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

    loadData();
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

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleSeedTestData = async () => {
    try {
      // Use mock development user ID when in development mode
      const userId = process.env.NODE_ENV === 'development' 
        ? '00000000-0000-0000-0000-000000000000'
        : currentUser?.id;

      console.log('Development mode:', process.env.NODE_ENV === 'development');
      console.log('Using user ID:', userId);

      if (!userId) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add test documents',
          variant: 'destructive',
        });
        return;
      }

      const testDocuments = [
        {
          id: uuidv4(),
          name: 'Employment Contract.pdf',
          status: 'draft',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: userId,
          storage_path: 'test/employment-contract.pdf'
        },
        {
          id: uuidv4(),
          name: 'Rental Agreement.pdf',
          status: 'sent',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: userId,
          storage_path: 'test/rental-agreement.pdf'
        },
        {
          id: uuidv4(),
          name: 'NDA Document.pdf',
          status: 'completed',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: userId,
          storage_path: 'test/nda-document.pdf'
        }
      ];

      console.log('Attempting to insert test document:', testDocuments[0]);

      const { data, error } = await supabase
        .from('documents')
        .insert(testDocuments[0])
        .select()
        .single();

      if (error) {
        console.error('Error inserting document:', error);
        throw error;
      }

      console.log('Successfully inserted document:', data);

      toast({
        title: 'Success',
        description: 'Test document added successfully',
      });

      // Refresh the documents list
      const status = filter === 'all' ? undefined : filter as 'draft' | 'sent' | 'completed';
      const docs = await listDocuments(status);
      setDocuments(docs);
    } catch (error) {
      console.error('Error seeding test data:', error);
      toast({
        title: 'Error',
        description: 'Failed to add test documents. Please make sure you are logged in.',
        variant: 'destructive',
      });
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
          
          <div className="flex gap-2">
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                onClick={handleSeedTestData}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Seed Test Data
              </Button>
            )}
            <Button asChild>
              <Link to="/upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Link>
            </Button>
          </div>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link to={`/editor/${doc.id}`}>
                              View
                            </Link>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        onClick={() => doc.status === 'draft' && navigate(`/editor/${doc.id}`)}
                                        className="gap-2"
                                        disabled={doc.status !== 'draft'}
                                      >
                                        <Mail className="h-4 w-4" />
                                        Send for signature
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  {doc.status !== 'draft' && (
                                    <TooltipContent>
                                      <p>Only draft documents can be sent for signature</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <DropdownMenuItem
                                        onClick={() => doc.status === 'draft' && handleDeleteDocument(doc.id)}
                                        className="gap-2 text-red-600 data-[disabled]:text-red-300"
                                        disabled={doc.status !== 'draft'}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </div>
                                  </TooltipTrigger>
                                  {doc.status !== 'draft' && (
                                    <TooltipContent>
                                      <p>Only draft documents can be deleted</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                <DropdownMenuItem
                                  onClick={() => navigate(`/editor/${doc.id}`)}
                                  className="gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                              </TooltipProvider>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
