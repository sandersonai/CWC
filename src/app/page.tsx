
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
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils'; // Import cn

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
          question: inputText || 'Analyze this image and explain any relevant AI concepts.', // Updated default question
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
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt', // Use points for easier calculations with font sizes
        format: 'a4'
      });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 40; // Increased margin
      let y = margin; // Vertical position tracker

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40); // Dark Gray
      doc.text("Sanderson AI Learning Chat History", pageWidth / 2, y, { align: 'center' });
      y += 25;

      // Subtitle (Date)
      doc.setFontSize(10);
      doc.setTextColor(100); // Medium Gray
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' });
      y += 30;


      doc.setFontSize(10); // Reset font size for messages
      doc.setLineHeightFactor(1.4); // Increase line spacing

      messages.forEach((msg, index) => {
        const isUser = msg.role === 'user';
        const prefix = isUser ? 'You: ' : 'Christian: ';
        const textColor = isUser ? '#007bff' : '#333333'; // Blue for user, Dark Gray for bot
        let textToPrint = msg.content;

        // Add placeholder for images
        if (msg.image) {
           textToPrint = "[User uploaded an image]\n" + textToPrint;
        }

        // Set text color
        doc.setTextColor(textColor);

        // Calculate text block dimensions
        const lines = doc.splitTextToSize(prefix + textToPrint, pageWidth - margin * 2);
        // Estimate height: number of lines * font size * line height factor
        const textHeight = lines.length * 10 * 1.4;

        // Check page break
        if (y + textHeight > pageHeight - margin) {
          doc.addPage();
          y = margin; // Reset y to top margin on new page
        }

        // Add message prefix (bold)
        doc.setFont(undefined, 'bold');
        doc.text(prefix, margin, y);
        // Calculate prefix width
        const prefixWidth = doc.getTextWidth(prefix);

        // Add message content (normal)
        doc.setFont(undefined, 'normal');
        // doc.text(textToPrint, margin + prefixWidth, y); // This doesn't handle line breaks well
        doc.text(lines.map((line, i) => i === 0 ? line.substring(prefix.length) : line), margin + prefixWidth, y); // More robust line handling


        y += textHeight + 15; // Move y down for the next message, adding spacing

        // Optional: Add separator
        if (index < messages.length - 1 && y < pageHeight - margin - 10) { // Check space for separator
           doc.setDrawColor(220, 220, 220); // Light gray separator
           doc.setLineWidth(0.5);
           doc.line(margin, y, pageWidth - margin, y);
           y += 15; // Space after separator
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
      <div className="flex h-screen flex-col bg-background"> {/* Use theme background */}
        {/* Header */}
        <header className={cn(
            "flex h-auto items-center justify-between border-b border-border/50 bg-card px-4 py-3 shadow-lg", // Use card bg, adjust border, shadow
             "glow-accent" // Add subtle glow to header
             )}>
           <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-primary leading-tight glow-primary">Sanderson AI Learning</h1> {/* Use primary color, add glow */}
            <span className="text-sm text-accent">Chat With Christian</span> {/* Use accent color */}
          </div>
           <div className="flex flex-col items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadPdf}
                    disabled={messages.length === 0}
                    aria-label="Download Chat"
                    className="h-8 w-8 text-accent hover:text-accent-foreground hover:bg-accent/20 rounded-full" // Style download button
                >
                    <Download className="h-4 w-4" />
                </Button>
                 <span className="text-xs text-muted-foreground mt-0.5">Download Chat</span>
            </div>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4"> {/* Added padding bottom */}
           {/* Welcome Message */}
            {messages.length === 0 && !isLoading && (
              <ChatMessage
                role="assistant"
                content="Welcome to Sanderson AI Learning! I'm Christian, your AI guide. Ask me anything about AI and machine learning, or upload an image for analysis."
              />
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} />
            ))}
            {isLoading && (
              <ChatMessage role="assistant" content="" isLoading={true} />
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-card p-4 shadow-inner"> {/* Use card bg, adjust border, shadow */}
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            uploadedImage={uploadedImage}
            handleSendMessage={handleSendMessage}
            handleRemoveImage={handleRemoveImage}
            isLoading={isLoading}
            triggerFileInput={triggerFileInput}
            fileInputRef={fileInputRef}
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>
    </ImageUpload>
  );
}
