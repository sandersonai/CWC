
"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Download, Video, Image as ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ImageUpload } from '@/components/chat/ImageUpload';
import { respondToAiQuery } from '@/ai/flows/respond-to-ai-query';
import { analyzeImageAndRespond } from '@/ai/flows/analyze-image-and-respond';
import { generateImageFromPrompt } from '@/ai/flows/generate-image-from-prompt'; // Import the new flow
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components
import Image from 'next/image'; // Import next/image
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

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
  const [videoPrompt, setVideoPrompt] = useState(''); // State for video prompt
  const [generatedVideoImage, setGeneratedVideoImage] = useState<string | null>(null); // State for generated image URL
  const [isVideoLoading, setIsVideoLoading] = useState(false); // State for video generation loading
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
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
        // If image exists, call analyzeImageAndRespond
        response = await analyzeImageAndRespond({
          imageDataUri: uploadedImage,
          question: inputText || 'Analyze this image and explain any relevant AI concepts.',
        });
        const botMessage: Message = {
          id: `${userMessageId}-bot`,
          role: 'assistant',
          content: response.answer,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
         // If no image, call respondToAiQuery
        response = await respondToAiQuery({
          query: inputText,
          // No imageUri needed here as we checked uploadedImage already
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

  // Function to handle video generation (placeholder using image generation)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
        toast({
            title: 'Empty Prompt',
            description: 'Please enter a description for the video.',
            variant: 'destructive',
        });
        return;
    }

    setIsVideoLoading(true);
    setGeneratedVideoImage(null); // Clear previous image

    try {
        // **Note:** We are generating an IMAGE as a placeholder for the video.
        // The current Genkit setup doesn't directly support video generation APIs
        // like Pika or Runway ML without complex integration.
        // We'll use the image generation flow instead.
        const response = await generateImageFromPrompt({ prompt: `Generate an image representing a video about: ${videoPrompt}. Style: cinematic, educational.` });
        setGeneratedVideoImage(response.imageDataUri);
        toast({
            title: 'Image Generated',
            description: 'An image representing your video concept has been created.',
        });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation Error',
        description: 'Failed to generate the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVideoLoading(false);
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
        unit: 'pt',
        format: 'a4'
      });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 40;
      let y = margin;

      // Header - Use theme colors (e.g., primary or foreground)
      doc.setFontSize(18);
      doc.setTextColor(180, 100, 50); // Example using HSL for primary (adjust as needed)
      doc.text("Sanderson AI Learning Chat History", pageWidth / 2, y, { align: 'center' });
      y += 25;

      // Subtitle (Date) - Use muted foreground
      doc.setFontSize(10);
      doc.setTextColor(150); // Lighter gray - adjust based on theme
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' });
      y += 30;


      doc.setFontSize(10);
      doc.setLineHeightFactor(1.4);

      messages.forEach((msg, index) => {
        const isUser = msg.role === 'user';
        // Define colors based on role (using theme concepts)
        const prefix = isUser ? 'You: ' : 'Christian: ';
        // Use hex/rgb values corresponding to your theme's primary and foreground/card-foreground
        const userColor = '#00FFFF'; // Example: Cyan (adjust to match theme)
        const assistantColor = '#E0E0E0'; // Example: Light Gray (adjust to match theme)
        const textColor = isUser ? userColor : assistantColor;

        let textToPrint = msg.content;

        // Indicate if an image was uploaded by the user
        if (msg.image) {
           textToPrint = "[User uploaded an image]\n" + textToPrint;
        }

        doc.setTextColor(textColor);

        // Use splitTextToSize for automatic wrapping
        const lines = doc.splitTextToSize(prefix + textToPrint, pageWidth - margin * 2);
        const textHeight = lines.length * 10 * 1.4; // Estimate text height

        // Check if content exceeds page height, add new page if needed
        if (y + textHeight > pageHeight - margin) {
          doc.addPage();
          y = margin; // Reset y position for new page
        }

        // Print Prefix Bold
        doc.setFont(undefined, 'bold');
        doc.text(prefix, margin, y);
        const prefixWidth = doc.getTextWidth(prefix);

        // Print Message Content
        doc.setFont(undefined, 'normal');
        doc.text(lines.map((line, i) => i === 0 ? line.substring(prefix.length) : line), margin + prefixWidth, y);


        y += textHeight + 15; // Add spacing after message

        // Add separator line between messages - use border color concept
        if (index < messages.length - 1 && y < pageHeight - margin - 10) {
           doc.setDrawColor(60, 70, 90); // Example: Dark Muted Blue/Gray (adjust to match theme border)
           doc.setLineWidth(0.5);
           doc.line(margin, y, pageWidth - margin, y);
           y += 15; // Add spacing after separator
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
       {/* Main container with futuristic background and text colors */}
       <div className="flex h-screen flex-col bg-background text-foreground">
        {/* Header with futuristic styling */}
         <header className={cn(
            "flex h-auto items-center justify-between border-b border-border/50 bg-background px-4 py-3 shadow-lg shadow-primary/10", // Use background, slightly transparent border, primary glow shadow
             )}>
           <div className="flex flex-col">
             <h1 className="text-xl font-semibold text-primary leading-tight">Sanderson AI Learning</h1>
             <span className="text-sm text-foreground/80">Chat With Christian</span> {/* Slightly muted foreground */}
           </div>
           <div className="flex flex-col items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadPdf}
                    disabled={messages.length === 0}
                    aria-label="Download Chat"
                    className="h-8 w-8 text-accent hover:text-accent-foreground hover:bg-accent/20 rounded-full transition-colors" // Use accent color, subtle hover
                >
                    <Download className="h-4 w-4" />
                </Button>
                 <span className="text-xs text-muted-foreground mt-0.5">Download Chat</span>
            </div>
        </header>

        {/* Main Content Area (Chat + Video) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex flex-1 flex-col border-r border-border/50"> {/* Slightly transparent border */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4">
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

              {/* Chat Input Area with futuristic style */}
              <div className="border-t border-border/50 bg-background p-4 shadow-inner shadow-black/20"> {/* Use background, transparent border, inner shadow */}
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

           {/* Video Generation Area with futuristic style */}
            <div className="w-1/3 flex-shrink-0 border-l border-border/50 bg-background p-4 flex flex-col space-y-4 shadow-inner shadow-black/20"> {/* Consistent futuristic styling */}
                <Card className="flex-1 flex flex-col bg-card border-border/70 shadow-lg shadow-accent/10"> {/* Use card bg, slightly stronger border, accent glow shadow */}
                 <CardHeader>
                    <CardTitle className="flex items-center text-lg text-primary">
                      <Video className="mr-2 h-5 w-5" />
                      Generate Training Video (Image)
                    </CardTitle>
                     <CardDescription className="text-muted-foreground">
                        Enter a topic to generate a representative image (video generation placeholder).
                    </CardDescription>
                  </CardHeader>
                   <CardContent className="flex-1 flex flex-col space-y-4">
                      <Textarea
                        placeholder="e.g., What is supervised learning?"
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        className="flex-1 resize-none bg-input border-border focus:border-primary focus:ring-primary/50 text-foreground placeholder:text-muted-foreground" // Use theme colors
                        rows={4}
                        disabled={isVideoLoading}
                      />
                       <Button
                          onClick={handleGenerateVideo}
                          disabled={isVideoLoading || !videoPrompt.trim()}
                           className={cn(
                              "bg-accent hover:bg-accent/90 text-accent-foreground w-full transition-all duration-200 ease-in-out", // Use accent color
                              // Optional glow effect on hover/focus
                              // "hover:shadow-accent/40 hover:shadow-md focus:shadow-accent/40 focus:shadow-md"
                          )}
                        >
                          {isVideoLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                             <ImageIcon className="mr-2 h-4 w-4" />
                          )}
                          Generate Image
                        </Button>

                       {/* Display Area for Generated Image or Loading State */}
                        <div className="mt-4 flex-1 flex items-center justify-center border border-dashed border-border/50 rounded-md bg-input/50"> {/* Use input background, dashed border */}
                            {isVideoLoading ? (
                                <div className="flex flex-col items-center text-muted-foreground">
                                     <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /> {/* Primary loader color */}
                                     <p>Generating image...</p>
                                </div>
                            ) : generatedVideoImage ? (
                                <div className="relative w-full h-full aspect-video">
                                    <Image
                                        src={generatedVideoImage}
                                        alt="Generated video representation"
                                        layout="fill"
                                        objectFit="contain"
                                        className="rounded-md"
                                        data-ai-hint="generated video"
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-border/70" /> {/* Muted placeholder icon */}
                                    <p>Generated image will appear here.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ImageUpload>
  );
}
