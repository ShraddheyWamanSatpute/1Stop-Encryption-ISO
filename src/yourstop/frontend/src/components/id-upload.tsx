import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAgeVerification } from '@/hooks/use-age-verification';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Camera, 
  FileImage, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Eye
} from 'lucide-react';

const documentSchema = z.object({
  documentType: z.enum(['drivers_license', 'passport', 'state_id', 'military_id']),
  documentNumber: z.string().min(5, 'Document number must be at least 5 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const documentTypes = [
  { value: 'drivers_license', label: 'Driver\'s License', description: 'State-issued driver\'s license' },
  { value: 'passport', label: 'Passport', description: 'U.S. or international passport' },
  { value: 'state_id', label: 'State ID', description: 'State-issued identification card' },
  { value: 'military_id', label: 'Military ID', description: 'Military identification card' },
];

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadedFile?: File;
  type: 'document' | 'selfie';
}

function UploadArea({ onFileSelect, isUploading, uploadedFile, type }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <div>
            <p className="text-lg font-semibold">Uploading {type === 'document' ? 'Document' : 'Selfie'}...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your image</p>
          </div>
          <Progress value={75} className="w-full max-w-xs mx-auto" />
        </div>
      ) : uploadedFile ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={URL.createObjectURL(uploadedFile)}
                alt={type === 'document' ? 'Uploaded document' : 'Uploaded selfie'}
                className="h-32 w-48 object-cover rounded-lg border"
              />
              <div className="absolute -top-2 -right-2">
                <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-600">
              {type === 'document' ? 'Document' : 'Selfie'} Uploaded Successfully
            </p>
            <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            {type === 'document' ? (
              <FileImage className="h-12 w-12 text-muted-foreground" />
            ) : (
              <Camera className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold">
              {type === 'document' ? 'Upload ID Document' : 'Take a Selfie'}
            </p>
            <p className="text-sm text-muted-foreground">
              {type === 'document' 
                ? 'Drag and drop your ID document here, or click to browse'
                : 'Drag and drop your selfie here, or click to take a photo'
              }
            </p>
          </div>
          <Button onClick={openFileDialog} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </div>
      )}
    </div>
  );
}

export function IDUpload() {
  const { verification, isVerifying, uploadDocument, uploadSelfie, submitVerification } = useAgeVerification();
  const { toast } = useToast();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<'document' | 'selfie' | 'review' | 'submitted'>('document');

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentType: 'drivers_license',
      documentNumber: '',
      dateOfBirth: '',
    },
  });

  const handleDocumentUpload = async (file: File) => {
    setDocumentFile(file);
    setCurrentStep('selfie');
  };

  const handleSelfieUpload = async (file: File) => {
    setSelfieFile(file);
    setCurrentStep('review');
  };

  const handleDocumentSubmit = async (data: DocumentFormValues) => {
    if (!documentFile) return;

    try {
      await uploadDocument(documentFile, data.documentType, data.documentNumber, data.dateOfBirth);
      toast({
        title: 'Document Uploaded',
        description: 'Your ID document has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
      });
    }
  };

  const handleSelfieSubmit = async () => {
    if (!selfieFile) return;

    try {
      await uploadSelfie(selfieFile);
      toast({
        title: 'Selfie Uploaded',
        description: 'Your selfie has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload selfie. Please try again.',
      });
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await submitVerification();
      setCurrentStep('submitted');
      toast({
        title: 'Verification Submitted',
        description: 'Your age verification has been submitted for review.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit verification. Please try again.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pending Review</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  if (verification && verification.status !== 'not_verified') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Age Verification Status
          </CardTitle>
          <CardDescription>
            Your age verification status and document information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">Verification Status:</span>
            {getStatusBadge(verification.status)}
          </div>
          
          {verification.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Verification Complete</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You can now access age-restricted restaurants and order alcohol.
              </p>
            </div>
          )}

          {verification.status === 'rejected' && verification.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Verification Rejected</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {verification.rejectionReason}
              </p>
              <Button 
                className="mt-3" 
                onClick={() => {
                  setCurrentStep('document');
                  setDocumentFile(null);
                  setSelfieFile(null);
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {verification.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Under Review</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Your documents are being reviewed. This usually takes 1-2 business days.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Document Type:</span>
              <p className="text-muted-foreground capitalize">
                {verification.documentType.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="font-medium">Document Number:</span>
              <p className="text-muted-foreground">
                {verification.documentNumber.replace(/(.{4})/g, '$1 ').trim()}
              </p>
            </div>
            <div>
              <span className="font-medium">Date of Birth:</span>
              <p className="text-muted-foreground">
                {new Date(verification.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium">Submitted:</span>
              <p className="text-muted-foreground">
                {new Date(verification.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Age Verification
        </CardTitle>
        <CardDescription>
          Verify your age to access age-restricted restaurants and order alcohol.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {['Document', 'Selfie', 'Review'].map((step, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === ['document', 'selfie', 'review'][index];
            const isCompleted = 
              (stepNumber === 1 && currentStep !== 'document') ||
              (stepNumber === 2 && currentStep === 'review') ||
              (stepNumber === 3 && currentStep === 'submitted');
            
            return (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground/25'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Document Upload */}
        {currentStep === 'document' && (
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDocumentSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-muted-foreground">{type.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            
            <UploadArea
              onFileSelect={handleDocumentUpload}
              isUploading={isVerifying}
              type="document"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Document Requirements</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Document must be clearly visible and well-lit</li>
                    <li>• All text must be readable</li>
                    <li>• Document must be valid and not expired</li>
                    <li>• Supported formats: JPG, PNG, PDF</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Selfie Upload */}
        {currentStep === 'selfie' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Take a Selfie</h3>
              <p className="text-muted-foreground">
                Please take a clear selfie to verify your identity matches the document.
              </p>
            </div>
            
            <UploadArea
              onFileSelect={handleSelfieUpload}
              isUploading={isVerifying}
              type="selfie"
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Selfie Requirements</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    <li>• Look directly at the camera</li>
                    <li>• Ensure good lighting on your face</li>
                    <li>• Remove glasses and hats if possible</li>
                    <li>• Make sure your face is clearly visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review and Submit */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review Your Information</h3>
              <p className="text-muted-foreground">
                Please review your documents before submitting for verification.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Document</h4>
                {documentFile && (
                  <div className="border rounded-lg p-4">
                    <img
                      src={URL.createObjectURL(documentFile)}
                      alt="Document preview"
                      className="w-full h-32 object-cover rounded"
                    />
                    <p className="text-sm text-muted-foreground mt-2">{documentFile.name}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Selfie</h4>
                {selfieFile && (
                  <div className="border rounded-lg p-4">
                    <img
                      src={URL.createObjectURL(selfieFile)}
                      alt="Selfie preview"
                      className="w-full h-32 object-cover rounded"
                    />
                    <p className="text-sm text-muted-foreground mt-2">{selfieFile.name}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCurrentStep('document')}>
                Back to Edit
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Submit for Verification
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitted */}
        {currentStep === 'submitted' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verification Submitted</h3>
            <p className="text-muted-foreground mb-4">
              Your age verification has been submitted for review. You'll receive an email notification once the review is complete.
            </p>
            <Button onClick={() => setCurrentStep('document')}>
              Submit Another Verification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}