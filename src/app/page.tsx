"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Download, Image as ImageIcon, MessageSquare, Film, Link as LinkIcon } from 'lucide-react';
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

interface SuggestedResource {
  title: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Data URI for image
  suggestedResources?: SuggestedResource[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("chat");

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
        // Analyze image flow doesn't currently support suggested resources,
        // but we can adapt it or keep it simpler. For now, no suggested resources.
        const analysisResponse = await analyzeImageAndRespond({
          imageDataUri: uploadedImage,
          question: inputText || 'Analyze this image and explain any relevant AI concepts.',
        });
        const botMessage: Message = {
          id: `${userMessageId}-bot`,
          role: 'assistant',
          content: analysisResponse.answer,
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
          suggestedResources: response.suggestedResources || [],
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

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
        toast({
            title: 'Empty Prompt',
            description: 'Please enter a description for the image.',
            variant: 'destructive',
        });
        return;
    }

    setIsImageLoading(true);
    // setGeneratedImage(null); // Keep previous image visible while loading new one

    try {
        console.log("Calling generateImageFromPrompt with prompt:", imagePrompt);
        const response = await generateImageFromPrompt({ prompt: imagePrompt });
        console.log("Received response from generateImageFromPrompt:", response);

        if (!response?.imageDataUri) {
             throw new Error('Image generation failed: No image data returned.');
        }

        setGeneratedImage(response.imageDataUri);
        console.log("Generated image URI set:", response.imageDataUri);
        toast({
            title: 'Image Generated',
            description: 'Your image has been generated successfully.',
        });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Image Generation Error',
        description: `Failed to generate the image. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) {
      toast({
        title: 'No Image',
        description: 'No image has been generated yet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = generatedImage;
      const mimeType = generatedImage.split(';')[0].split(':')[1];
      const extension = mimeType?.split('/')[1] || 'png';
      link.download = `sanderson-ai-generated-image.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Download Started',
        description: 'The generated image is downloading.',
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the image. Please try again.',
        variant: 'destructive',
      });
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
      doc.setTextColor('hsl(var(--primary))');
      doc.text("Sanderson AI Learning Chat History", pageWidth / 2, y, { align: 'center' });
      y += 25;

      doc.setFontSize(10);
      doc.setTextColor('hsl(var(--muted-foreground))');
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, y, { align: 'center' });
      y += 30;


      doc.setFontSize(10);
      doc.setLineHeightFactor(1.4);

      messages.forEach((msg, index) => {
        const isUser = msg.role === 'user';
        const prefix = isUser ? 'You: ' : 'Christian: ';
        const userColor = 'hsl(var(--primary))';
        const assistantColor = 'hsl(var(--foreground))';
        const textColor = isUser ? userColor : assistantColor;

        let textToPrint = msg.content;
        if (msg.image) {
           textToPrint = "[User uploaded an image]\n" + textToPrint;
        }
        if (msg.suggestedResources && msg.suggestedResources.length > 0) {
          textToPrint += "\n\nLearn More:\n";
          msg.suggestedResources.forEach(res => {
            textToPrint += `- ${res.title}: ${res.url}\n`;
          });
        }


        doc.setTextColor(textColor);

        const fullText = prefix + textToPrint;
        const lines = doc.splitTextToSize(fullText, pageWidth - margin * 2);
        const textHeight = lines.length * 10 * 1.4; 

        if (y + textHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          doc.setFontSize(18);
          doc.setTextColor('hsl(var(--primary))');
          doc.text("Sanderson AI Learning Chat History (cont.)", pageWidth / 2, y, { align: 'center' });
          y += 25;
          doc.setFontSize(10);
          doc.setLineHeightFactor(1.4);
          doc.setTextColor(textColor);
        }
        
        doc.text(lines, margin, y);
        y += textHeight + 15;

        if (index < messages.length - 1 && y < pageHeight - margin - 10) {
           doc.setDrawColor('hsl(var(--border))'); 
           doc.setLineWidth(0.5);
           doc.line(margin, y, pageWidth - margin, y);
           y += 15; 
        } else if (index < messages.length - 1) {
           doc.addPage();
           y = margin;
            doc.setFontSize(18);
            doc.setTextColor('hsl(var(--primary))');
            doc.text("Sanderson AI Learning Chat History (cont.)", pageWidth / 2, y, { align: 'center' });
            y += 25;
            doc.setFontSize(10);
            doc.setLineHeightFactor(1.4);
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
           {activeTab === "chat" && (
            <div className="flex flex-col items-center">
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownloadPdf}
                      disabled={messages.length === 0}
                      aria-label="Download Chat"
                      className="h-8 w-8 text-accent hover:text-accent-foreground hover:bg-accent/20 rounded-full transition-colors"
                  >
                      <Download className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground mt-0.5">Download Chat</span>
              </div>
            )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 self-start bg-muted/50 border border-border/50 rounded-lg p-1">
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md">
                <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md">
                <ImageIcon className="h-4 w-4" /> Generate Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4">
                {messages.length === 0 && !isLoading && (
                  <ChatMessage
                    role="assistant"
                    content="Welcome to Sanderson AI Learning! I'm Christian, your AI guide. Ask me anything about AI and machine learning (including ethics, neural networks, generative AI, and XAI), or upload an image for analysis."
                    suggestedResources={[]}
                  />
                )}
                {messages.map((msg, index) => (
                  <ChatMessage key={msg.id} {...msg} />
                ))}
                {isLoading && (
                  <ChatMessage role="assistant" content="" isLoading={true} suggestedResources={[]} />
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
             <div className="flex h-full items-center justify-center">
                <Card className="w-full max-w-3xl lg:max-w-4xl min-h-[70vh] mx-auto flex flex-col bg-card border-border/70 shadow-lg shadow-accent/10 overflow-hidden">
                    <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3">
                        <CardTitle className="flex items-center text-lg text-primary">
                        <ImageIcon className="mr-2 h-5 w-5" />
                         Generate Image from Prompt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4 px-4 pb-4 md:px-6 md:pb-6 flex-grow">
                        <Textarea
                            placeholder="e.g., A futuristic cityscape at sunset."
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            className="bg-input border-border focus:border-primary focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none mt-4"
                            rows={3}
                            disabled={isImageLoading}
                        />
                         <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={handleGenerateImage}
                                disabled={isImageLoading || !imagePrompt.trim()}
                                className={cn(
                                    "bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto transition-all duration-200 ease-in-out",
                                )}
                            >
                                {isImageLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                )}
                                Generate Image
                            </Button>
                             <Button
                                variant="outline"
                                onClick={handleDownloadImage}
                                disabled={!generatedImage} 
                                className="w-full sm:w-auto"
                                aria-label="Download Generated Image"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Image
                            </Button>
                        </div>

                        <div className="relative flex-grow w-full border border-dashed border-border/50 rounded-md bg-input/50 overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                            {isImageLoading && !generatedImage && ( 
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                                    <p>Generating image...</p>
                                </div>
                            )}
                            {generatedImage && ( 
                                <Image
                                    src={generatedImage}
                                    alt="Generated image"
                                    layout="fill"
                                    objectFit="contain"
                                    className="rounded-md"
                                    data-ai-hint="generated art"
                                />
                            )}
                            {!isImageLoading && !generatedImage && ( 
                                <div className="text-center text-muted-foreground p-4">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-3 text-border/70" />
                                    <p>Generated image will appear here.</p>
                                </div>
                            )}
                            {isImageLoading && generatedImage && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
