
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Upload, Wand2, Save } from 'lucide-react';
import { generateFootnoteIllustrationAction, generateMainIllustrationAction } from '../actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FootnoteImageModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  prompt: string;
  onSave: (imageUri: string) => void;
  isMainIllustration?: boolean;
}

export function FootnoteImageModal({
  isOpen,
  onOpenChange,
  prompt,
  onSave,
  isMainIllustration = false,
}: FootnoteImageModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finalImage = generatedImage || uploadedImage;
  
  useEffect(() => {
    setGeneratedImage(null);
    setUploadedImage(null);
    setError(null);
  }, [prompt]);


  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    toast({ title: 'Prompt copied to clipboard!' });
  };

  const handleGenerateImage = () => {
    startGeneratingTransition(async () => {
      setError(null);
      setUploadedImage(null);
      setGeneratedImage(null);
      
      const generationFunction = isMainIllustration ? generateMainIllustrationAction : generateFootnoteIllustrationAction;
      const result = await generationFunction(prompt);

      if (result.error) {
        setError(result.error);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error,
        });
      } else if (result.data) {
        setGeneratedImage(result.data.illustrationUri);
        toast({ title: 'Illustration generated successfully!' });
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: 'Please upload an image smaller than 2MB.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        setError(null);
        setGeneratedImage(null);
        setUploadedImage(result);
    };
    reader.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleSave = () => {
      if (finalImage) {
          onSave(finalImage);
          setGeneratedImage(null);
          setUploadedImage(null);
          setError(null);
      }
  }

  const handleOpenChange = (open: boolean) => {
    if (open === false) {
      setGeneratedImage(null);
      setUploadedImage(null);
      setError(null);
    }
    onOpenChange(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isMainIllustration ? 'Page Illustration' : 'Footnote Illustration'}</DialogTitle>
          <DialogDescription>
            Generate or upload an image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Illustration Prompt</label>
            <div className="relative mt-1">
              <Textarea
                readOnly
                value={prompt}
                className="pr-10 bg-muted"
                rows={isMainIllustration ? 4 : 3}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy prompt</span>
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleGenerateImage} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </Button>
            <Button variant="outline" onClick={handleUploadClick} className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Upload Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>

          <div className="mt-4 h-48 flex items-center justify-center border border-dashed rounded-md bg-muted/50">
            {isGenerating ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : finalImage ? (
                <img src={finalImage} alt="Illustration preview" className="max-h-full max-w-full object-contain rounded-md" />
            ) : (
                <p className="text-sm text-muted-foreground">Preview will appear here</p>
            )}
          </div>
          
          {error && (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!finalImage}>
             <Save className="mr-2 h-4 w-4" />
             Save Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
