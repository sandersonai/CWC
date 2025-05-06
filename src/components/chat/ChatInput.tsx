import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X, Loader2 } from 'lucide-react'; // Removed ImageIcon as preview shows image directly
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Keep for other buttons if needed

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  uploadedImage: string | null;
  handleSendMessage: () => void;
  handleRemoveImage: () => void;
  isLoading: boolean;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
   onImageUpload: (imageDataUri: string) => void; // Add this prop
}

export function ChatInput({
  inputText,
  setInputText,
  uploadedImage,
  handleSendMessage,
  handleRemoveImage,
  isLoading,
  triggerFileInput,
  fileInputRef,
  onImageUpload, // Destructure the prop
}: ChatInputProps) {

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    }
  };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string); // Use the passed handler
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <TooltipProvider> {/* Keep provider if other tooltips exist */}
    <div className="flex items-center space-x-2">
       <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                onClick={triggerFileInput}
                disabled={isLoading || !!uploadedImage}
                aria-label="Attach image"
            >
                <Paperclip className="h-5 w-5" />
            </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Attach Image</p>
        </TooltipContent>
      </Tooltip>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview */}
      {uploadedImage && (
        <div className="relative group">
          <Image
            src={uploadedImage}
            alt="Uploaded preview"
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Input
        type="text"
        placeholder={uploadedImage ? "Add a caption or question..." : "Type your message or drop an image..."}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex-1"
      />

      <Tooltip>
        <TooltipTrigger asChild>
            <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputText.trim() && !uploadedImage)}
                aria-label="Send message"
                 className={isLoading ? '' : 'text-black'} // Apply black color only when not loading
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
         </TooltipTrigger>
        <TooltipContent>
          <p>Send Message</p>
        </TooltipContent>
      </Tooltip>
    </div>
    </TooltipProvider>
  );
}
