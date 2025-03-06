
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FileUp, FileCheck, FileText } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout className="px-4 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Simple Document Signing.
            <span className="block text-primary">Effortless Workflow.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, sign, and send documents securely. No complications, just signatures.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="text-md px-8 py-6 transition-all duration-300 animate-slide-in"
              style={{ animationDelay: '200ms' }}
              onClick={() => navigate('/editor')}
            >
              <FileUp className="mr-2 h-5 w-5" />
              Upload a Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="flex flex-col items-center text-center p-6 rounded-lg neo-morphism"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const features = [
  {
    title: 'Upload Documents',
    description: 'Easily upload PDF documents for signing. Our platform accepts all standard PDF files.',
    icon: FileUp,
  },
  {
    title: 'Sign & Annotate',
    description: 'Add signatures, text fields, checkboxes, and dates exactly where they need to go.',
    icon: FileCheck,
  },
  {
    title: 'Share & Track',
    description: 'Send documents to multiple recipients and track their signing status in real time.',
    icon: FileText,
  },
];

export default Index;
