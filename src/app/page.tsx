
"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Download, Video, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ImageUpload } from '@/components/chat/ImageUpload';
import { respondToAiQuery } from '@/ai/flows/respond-to-ai-query';
import { analyzeImageAndRespond } from '@/ai/flows/analyze-image-and-respond';
import { generateImageFromPrompt } from '@/ai/flows/generate-image-from-prompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
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
  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatedVideoImage, setGeneratedVideoImage] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("chat"); // State to track active tab

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === "chat" && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, activeTab]);


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
          question: inputText || 'Analyze this image and explain any relevant AI concepts.',
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

  const handleGenerateVideoImage = async () => {
    if (!videoPrompt.trim()) {
        toast({
            title: 'Empty Prompt',
            description: 'Please enter a description for the video concept.',
            variant: 'destructive',
        });
        return;
    }

    setIsVideoLoading(true);
    setGeneratedVideoImage(null);

    try {
        // Prompt asks for an image *representing* a 60-second training video.
        const fullPrompt = `Generate a single, high-quality image representing a concept for a 60-second educational training video about: "${videoPrompt}". Style: cinematic, educational, clear visuals. This image should serve as a placeholder thumbnail or concept art for the video.`;
        const response = await generateImageFromPrompt({ prompt: fullPrompt });
        setGeneratedVideoImage(response.imageDataUri);
        toast({
            title: 'Video Concept Image Generated',
            description: 'An image representing your video concept has been created. Actual video generation is not supported via free APIs currently.',
        });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Image Generation Error',
        description: `Failed to generate the concept image. ${error instanceof Error ? error.message : 'Please try again.'}`,
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
        fileInputRef.current.value = '';
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

      doc.setFontSize(18);
      doc.setTextColor('hsl(var(--primary))'); // Use primary color
      doc.text("Sanderson AI Learning Chat History", pageWidth / 2, y, { align: 'center' });
      y += 25;

      doc.setFontSize(10);
      doc.setTextColor('hsl(var(--muted-foreground))'); // Use muted foreground
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' });
      y += 30;


      doc.setFontSize(10);
      doc.setLineHeightFactor(1.4);

      messages.forEach((msg, index) => {
        const isUser = msg.role === 'user';
        const prefix = isUser ? 'You: ' : 'Christian: ';
        // Use theme colors directly (adjust if needed)
        const userColor = 'hsl(var(--primary))'; // User color is primary
        const assistantColor = 'hsl(var(--foreground))'; // Use general foreground for assistant
        const textColor = isUser ? userColor : assistantColor;

        let textToPrint = msg.content;
        if (msg.image) {
           textToPrint = "[User uploaded an image]\n" + textToPrint;
        }

        doc.setTextColor(textColor);

        // Calculate text lines with prefix
        const fullText = prefix + textToPrint;
        const lines = doc.splitTextToSize(fullText, pageWidth - margin * 2);
        const textHeight = lines.length * 10 * 1.4; // Estimate height based on line count, font size, and line height factor

        if (y + textHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
           // Re-add header to new page if desired
          doc.setFontSize(18);
          doc.setTextColor('hsl(var(--primary))');
          doc.text("Sanderson AI Learning Chat History (cont.)", pageWidth / 2, y, { align: 'center' });
          y += 25;
          doc.setFontSize(10);
           doc.setLineHeightFactor(1.4);
           doc.setTextColor(textColor); // Reset text color for the new page
        }

        // Print text line by line to handle wrapping correctly
         doc.text(lines, margin, y);


        y += textHeight + 15; // Move y position down for the next message + spacing

        // Add separator line if not the last message and there's space
        if (index < messages.length - 1 && y < pageHeight - margin - 10) {
           doc.setDrawColor('hsl(var(--border))'); // Use theme border color
           doc.setLineWidth(0.5);
           doc.line(margin, y, pageWidth - margin, y);
           y += 15; // Add space after the separator
        } else if (index < messages.length - 1) {
          // Handle case where separator doesn't fit, add new page before next message
           doc.addPage();
           y = margin;
            // Re-add header to new page
            doc.setFontSize(18);
            doc.setTextColor('hsl(var(--primary))');
            doc.text("Sanderson AI Learning Chat History (cont.)", pageWidth / 2, y, { align: 'center' });
            y += 25;
            doc.setFontSize(10);
            doc.setLineHeightFactor(1.4);
            // Ensure text color is reset for the message after page break
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
       <div className="flex h-screen flex-col bg-background text-foreground">
         <header className={cn(
            "flex h-auto items-center justify-between border-b border-border/50 bg-background px-4 py-3 shadow-lg shadow-primary/10",
             )}>
           <div className="flex flex-col">
             <h1 className="text-xl font-semibold text-primary leading-tight">Sanderson AI Learning</h1>
             <span className="text-sm text-foreground/80">Chat With Christian</span>
           </div>
           <div className="flex flex-col items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadPdf}
                    disabled={messages.length === 0 && activeTab === "chat"} // Disable if no messages *and* in chat tab
                    aria-label="Download Chat"
                    className="h-8 w-8 text-accent hover:text-accent-foreground hover:bg-accent/20 rounded-full transition-colors"
                >
                    <Download className="h-4 w-4" />
                </Button>
                 <span className="text-xs text-muted-foreground mt-0.5">Download Chat</span>
            </div>
        </header>

        {/* Main Content Area using Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 self-start bg-muted/50 border border-border/50 rounded-lg p-1">
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md">
                <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md">
                <Video className="h-4 w-4" /> Generate Concept
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
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

              <div className="border-t border-border/50 bg-background p-4 shadow-inner shadow-black/20">
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
          </TabsContent>

           <TabsContent value="generate" className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden">
             {/* Use a flex container for the whole tab content to allow the card to grow */}
             <div className="flex h-full">
                <Card className="w-full max-w-2xl mx-auto flex flex-col bg-card border-border/70 shadow-lg shadow-accent/10">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg text-primary">
                        <Video className="mr-2 h-5 w-5" />
                         Generate Training Video Concept (Image)
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter a topic to generate a representative image for a 60-second training video concept. (Note: Actual video generation is not available via free APIs at this time.)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4 p-4 pt-0 flex-grow"> {/* Use flex-grow here */}
                        <Textarea
                            placeholder="e.g., Explain the concept of neural networks briefly."
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            className="bg-input border-border focus:border-primary focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none" // Removed flex-grow
                            rows={4}
                            disabled={isVideoLoading}
                        />
                        <Button
                            onClick={handleGenerateVideoImage}
                            disabled={isVideoLoading || !videoPrompt.trim()}
                            className={cn(
                                "bg-accent hover:bg-accent/90 text-accent-foreground w-full transition-all duration-200 ease-in-out",
                            )}
                        >
                            {isVideoLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ImageIcon className="mr-2 h-4 w-4" />
                            )}
                            Generate Concept Image
                        </Button>

                        {/* Image container: Use aspect-ratio and relative positioning */}
                        <div className="relative w-full aspect-video mt-4 border border-dashed border-border/50 rounded-md bg-input/50 overflow-hidden flex items-center justify-center">
                            {isVideoLoading ? (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <p>Generating concept image...</p>
                                </div>
                            ) : generatedVideoImage ? (
                                <Image
                                    src={generatedVideoImage}
                                    alt="Generated video concept representation"
                                    layout="fill" // Use fill layout
                                    objectFit="contain" // Contain ensures the whole image is visible
                                    className="rounded-md"
                                    data-ai-hint="generated video concept" // Updated hint
                                />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-border/70" />
                                    <p>Generated video concept image will appear here.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            </TabsContent>
        </Tabs>
      </div>
    </ImageUpload>
  );
}
