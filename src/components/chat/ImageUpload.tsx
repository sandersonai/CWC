"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';

interface ImageUploadProps {
  children: React.ReactNode;
  onImageUpload: (imageDataUri: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>; // Accept the ref
}

export function ImageUpload({ children, onImageUpload, fileInputRef }: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const { toast } = useToast();
  const dropRef = React.useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the leave event target is outside the dropzone
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
       setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
     e.dataTransfer.dropEffect = 'copy'; // Show copy cursor
     setIsDragging(true); // Ensure dragging state is true on over
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageUpload(reader.result as string);
           // Reset file input value if it exists
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
          toast({
            title: 'Error Reading File',
            description: 'Could not read the dropped image.',
            variant: 'destructive',
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please drop an image file.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div
      ref={dropRef}
      className={cn('relative h-full w-full', { 'bg-primary/10': isDragging })}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
           <UploadCloud className="h-16 w-16 text-primary mb-4" />
           <p className="text-lg font-semibold text-primary">Drop image here</p>
        </div>
      )}
      {children}
    </div>
  );
}
