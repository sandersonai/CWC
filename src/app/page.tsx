
"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ImageUpload } from '@/components/chat/ImageUpload';
import { respondToAiQuery } from '@/ai/flows/respond-to-ai-query';
import { analyzeImageAndRespond } from '@/ai/flows/analyze-image-and-respond';
import { Button } from '@/components/ui/button'; // Import Button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Data URI for image
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (!inputText.trim() && !uploadedImage) return;

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: inputText,
      image: uploadedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      let response;
      if (uploadedImage) {
        response = await analyzeImageAndRespond({
          imageDataUri: uploadedImage,
          question: inputText || 'Analyze this image.', // Use default question if text is empty
        });
        const botMessage: Message = {
          id: `${userMessageId}-bot`,
          role: 'assistant',
          content: response.answer,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        response = await respondToAiQuery({
          query: inputText,
        });
        const botMessage: Message = {
           id: `${userMessageId}-bot`,
          role: 'assistant',
          content: response.response,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from Christian. Please try again.',
        variant: 'destructive',
      });
       // Add error message to chat
       const errorMessage: Message = {
         id: `${userMessageId}-error`,
         role: 'assistant',
         content: "Sorry, I encountered an error trying to process your request. Please try again.",
       };
       setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (imageDataUri: string) => {
    setUploadedImage(imageDataUri);
    toast({
      title: 'Image Ready',
      description: 'Image selected. Add text or send.',
    });
  };

   const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
    }
     toast({
      title: 'Image Removed',
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadPdf = () => {
    if (messages.length === 0) {
      toast({
        title: 'No Messages',
        description: 'There are no messages to download.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      let y = margin; // Vertical position tracker

      doc.setFontSize(16);
      doc.text("Sanderson AI Learning Chat History", pageWidth / 2, y, { align: 'center' });
      y += 15; // Move down after title

      doc.setFontSize(10); // Reset font size for messages

      messages.forEach((msg, index) => {
        const prefix = msg.role === 'user' ? 'You: ' : 'Christian: ';
        let textToPrint = prefix + msg.content;

        if (msg.image) {
           // Add placeholder text for images instead of embedding them
           textToPrint += "\n[User uploaded an image]";
        }

        // Calculate text dimensions and split if necessary
        const lines = doc.splitTextToSize(textToPrint, pageWidth - margin * 2);
        const textHeight = lines.length * doc.getTextDimensions('M').h * 1.2; // Estimate height with line spacing

        // Check if content fits on the current page, add new page if not
        if (y + textHeight > pageHeight - margin) {
          doc.addPage();
          y = margin; // Reset y to top margin on new page
        }

        // Add the text to the PDF
        doc.text(lines, margin, y);
        y += textHeight + 5; // Move y down for the next message, adding some spacing

        // Optional: Add a separator line between messages
        if (index < messages.length - 1 && y < pageHeight - margin - 5) { // Check space for separator
          doc.setDrawColor(200, 200, 200); // Light gray separator
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;
        }
      });

      doc.save('sanderson-ai-chat.pdf');
      toast({
        title: 'Download Started',
        description: 'Your chat history PDF is downloading.',
      });
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: 'PDF Generation Failed',
            description: 'Could not generate the PDF. Please try again.',
            variant: 'destructive',
        });
    }
  };


  return (
    <ImageUpload onImageUpload={handleImageUpload} fileInputRef={fileInputRef}>
      <div className="flex h-screen flex-col bg-secondary">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Sanderson AI Learning - Chat with Christian</h1>
           <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownloadPdf}
                        disabled={messages.length === 0}
                        aria-label="Download chat as PDF"
                    >
                        <Download className="h-5 w-5 text-foreground" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Chat (PDF)</p>
                </TooltipContent>
              </Tooltip>
           </TooltipProvider>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} />
            ))}
            {isLoading && (
              <ChatMessage role="assistant" content="" isLoading={true} />
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            uploadedImage={uploadedImage}
            handleSendMessage={handleSendMessage}
            handleRemoveImage={handleRemoveImage}
            isLoading={isLoading}
            triggerFileInput={triggerFileInput}
            fileInputRef={fileInputRef}
            onImageUpload={handleImageUpload} // Pass down the handler
          />
        </div>
      </div>
    </ImageUpload>
  );
}

