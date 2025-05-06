import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  uploadedImage: string | null;
  handleSendMessage: () => void;
  handleRemoveImage: () => void;
  isLoading: boolean;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
   onImageUpload: (imageDataUri: string) => void;
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
  onImageUpload,
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
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <TooltipProvider>
    <div className="flex items-center space-x-2">
       <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                onClick={triggerFileInput}
                disabled={isLoading || !!uploadedImage}
                aria-label="Attach image"
                className="text-accent hover:text-accent-foreground hover:bg-accent/10" // Use accent color, subtle hover
            >
                <Paperclip className="h-5 w-5" />
            </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Attach Image</p>
        </TooltipContent>
      </Tooltip>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {uploadedImage && (
        <div className="relative group border border-accent rounded-md p-0.5"> {/* Added accent border and padding */}
          <Image
            src={uploadedImage}
            alt="Uploaded preview"
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
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
        placeholder={uploadedImage ? "Add a caption or question..." : "Ask Christian about AI..."}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex-1 bg-input border-border focus:border-primary focus:ring-primary/50" // Use theme input/border/focus colors
      />

      <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="default" // Use default ShadCN style which maps to primary
                onClick={handleSendMessage}
                disabled={isLoading || (!inputText.trim() && !uploadedImage)}
                aria-label="Send message"
                className={cn(
                    // No glow effect needed
                    isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground', // Use theme primary color
                    "border border-primary/30" // Add light border to send button
                )}
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
```