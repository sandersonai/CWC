"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Download, Image as ImageIcon, MessageSquare, BrainCircuit, ChevronDown, XCircle, Brain, BarChart3, Lightbulb, Link as LinkIcon, Trash2, PartyPopper, Frown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { QuizData } from '@/components/chat/QuizDisplay';
import { ImageUpload } from '@/components/chat/ImageUpload';
import { respondToAiQuery, RespondToAiQueryOutput } from '@/ai/flows/respond-to-ai-query';
import { analyzeImageAndRespond } from '@/ai/flows/analyze-image-and-respond';
import { generateImageFromPrompt } from '@/ai/flows/generate-image-from-prompt';
import { generateMultiQuestionQuiz, GenerateMultiQuestionQuizOutput } from '@/ai/flows/generate-multi-question-quiz-flow';
import { MultiQuizDisplay } from '@/components/quiz/MultiQuizDisplay';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
  DialogClose,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/dialog";
import Image from 'next/image';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

const initialAiTools = [
  {
    name: "TensorFlow Playground",
    url: "https://playground.tensorflow.org/",
    description: "Visualize and experiment with neural networks in your browser.",
    icon: <BrainCircuit className="h-4 w-4 text-primary" />,
    addedDate: '2024-01-01', // Example: Added long ago
  },
  {
    name: "Leonardo.Ai",
    url: "https://leonardo.ai/",
    description: "Free tier for AI image generation and creative tools.",
    icon: <ImageIcon className="h-4 w-4 text-primary" />,
    addedDate: '2024-02-15', // Example: Added some time ago
  },
  {
    name: "Hugging Face - Spaces",
    url: "https://huggingface.co/spaces",
    description: "Explore and run various AI models and demos.",
    icon: <Brain className="h-4 w-4 text-primary" />,
    addedDate: '2024-03-10', // Example
  },
  {
    name: "Perplexity AI",
    url: "https://www.perplexity.ai/",
    description: "Conversational AI search engine with cited sources.",
    icon: <MessageSquare className="h-4 w-4 text-primary" />,
    addedDate: '2024-04-01', // Example
  },
  {
    name: "Kaggle",
    url: "https://www.kaggle.com/",
    description: "Platform for data science, ML competitions, datasets, and notebooks.",
    icon: <BarChart3 className="h-4 w-4 text-primary" />,
    addedDate: '2024-05-20', // Example
  },
  {
    name: "Google Colab",
    url: "https://colab.research.google.com/",
    description: "Free Jupyter notebook environment in the cloud.",
    icon: <Brain className="h-4 w-4 text-primary" />,
    addedDate: '2024-06-01', // Example
  },
  {
    name: "Google Cloud AI (Free Tier)",
    url: "https://cloud.google.com/free/docs/free-cloud-features#ai_and_machine_learning",
    description: "Access various Google Cloud AI services with free tier limits.",
    icon: <BrainCircuit className="h-4 w-4 text-primary" />,
    // To test the "NEW" badge, set this date to something within the last 7 days
    // For example, if today is 2024-07-23, '2024-07-20' would show NEW.
    // Defaulting to an older date for now. User can update this when adding a "new" tool.
    addedDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], // Example: Added 3 days ago
  },
  // Example of more tools if the list were to grow (not displayed due to slice(0,7))
  // {
  //   name: "Another New Tool",
  //   url: "https://example.com/another-tool",
  //   description: "This tool would be shown if the list expands.",
  //   icon: <Lightbulb className="h-4 w-4 text-primary" />,
  //   addedDate: new Date().toISOString().split('T')[0], // Added today
  // }
];


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

  const [multiQuizQuestions, setMultiQuizQuestions] = useState<QuizData[]>([]);
  const [isMultiQuizLoading, setIsMultiQuizLoading] = useState(false);
  const [showMultiQuizDialog, setShowMultiQuizDialog] = useState(false);
  const [multiQuizDifficulty, setMultiQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  const [aiTools, setAiTools] = useState(initialAiTools); // Manage aiTools in state if they need to be dynamic in future


  useEffect(() => {
    if (activeTab === "chat" && scrollAreaRef.current && !showMultiQuizDialog) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, activeTab, showMultiQuizDialog]);


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
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      let response: RespondToAiQueryOutput;
      if (uploadedImage) {
        const analysisResponse = await analyzeImageAndRespond({
          imageDataUri: uploadedImage,
          question: inputText || 'Analyze this image and explain any relevant AI concepts.',
        });
        response = { response: analysisResponse.answer, suggestedResources: [], nlpAnalysis: undefined };
      } else {
        response = await respondToAiQuery({
          query: inputText,
        });
      }
      const botMessage: Message = {
        id: `${userMessageId}-bot`,
        role: 'assistant',
        content: response.response,
        suggestedResources: response.suggestedResources || [],
        nlpAnalysis: response.nlpAnalysis,
      };
      setMessages((prev) => [...prev, botMessage]);

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
    // setGeneratedImage(null); // Keep previous image visible during loading of new one

    try {
      const response = await generateImageFromPrompt({ prompt: imagePrompt });
      if (!response?.imageDataUri) {
        throw new Error('Image generation failed: No image data returned.');
      }
      setGeneratedImage(response.imageDataUri); // Image stays visible
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
         if (msg.nlpAnalysis) {
          textToPrint += "\n\nQuery NLP Analysis:\n";
          if(msg.nlpAnalysis.sentiment) textToPrint += `- Sentiment: ${msg.nlpAnalysis.sentiment}\n`;
          if(msg.nlpAnalysis.prominentEntities && msg.nlpAnalysis.prominentEntities.length > 0){
            textToPrint += `- Entities: ${msg.nlpAnalysis.prominentEntities.map(e => `${e.name} (${e.type})`).join(', ')}\n`;
          }
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

  const handleStartMultiQuiz = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    setMultiQuizDifficulty(difficulty);
    setIsMultiQuizLoading(true);
    setMultiQuizQuestions([]);
    setShowMultiQuizDialog(true);
    try {
      const response: GenerateMultiQuestionQuizOutput = await generateMultiQuestionQuiz({ difficulty, numberOfQuestions: 7 });
      if (response.questions && response.questions.length > 0) {
        setMultiQuizQuestions(response.questions);
      } else {
        throw new Error("No questions were generated by the AI.");
      }
    } catch (error) {
      console.error('Error generating multi-question quiz:', error);
      toast({
        title: 'Quiz Generation Error',
        description: `Failed to generate a ${difficulty.toLowerCase()} quiz. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: 'destructive',
      });
      setShowMultiQuizDialog(false);
    } finally {
      setIsMultiQuizLoading(false);
    }
  };

  const handleMultiQuizComplete = (score: number, totalQuestions: number) => {
    const percentageScore = (score / totalQuestions) * 100;
    const passed = percentageScore >= 70;

    toast({
      title: passed ? 'Quiz Passed!' : 'Quiz Complete!',
      description: `You scored ${score} out of ${totalQuestions}. (${percentageScore.toFixed(0)}%)`,
      className: passed ? 'bg-green-500/10 border-green-500 text-green-300' : 'bg-blue-500/10 border-blue-500 text-blue-300',
    });
  };

  const handleClearChatAndData = () => {
    setMessages([]);
    setInputText('');
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImagePrompt('');
    setGeneratedImage(null);
    setMultiQuizQuestions([]);
    toast({
      title: "Chat Cleared",
      description: "All messages, images, and generated content have been cleared.",
    });
  };

  const isToolNew = (addedDateString: string) => {
    if (!addedDateString) return false; // Handle undefined or null dates
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const addedDate = new Date(addedDateString);
        return addedDate >= sevenDaysAgo;
    } catch (error) {
        console.error("Error parsing date for isToolNew:", addedDateString, error);
        return false; // Treat invalid dates as not new
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
            <span className="text-sm text-accent-foreground">Chat With Christian</span>
          </div>
          
          <div className="flex-grow flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 text-accent-foreground bg-accent border-accent hover:bg-accent/90">
                  <Lightbulb className="mr-2 h-4 w-4" /> AI Tool Kit <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-80 bg-popover border-border">
                <DropdownMenuLabel className="text-center text-sm font-medium text-foreground">Free AI Tools for Beginners</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {aiTools.slice(0, 7).map((tool) => (
                  <DropdownMenuItem key={tool.name} onSelect={() => window.open(tool.url, '_blank', 'noopener,noreferrer')} className="hover:bg-accent/20 focus:bg-accent/20 flex items-start p-2 space-x-2">
                    <div className="flex-shrink-0 mt-0.5">{tool.icon}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-foreground">{tool.name}</span>
                        {isToolNew(tool.addedDate) && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    </div>
                     <LinkIcon className="h-3 w-3 text-muted-foreground/70 ml-auto self-center" />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === "chat" && !showMultiQuizDialog && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={messages.length === 0}
                  aria-label="Download Chat"
                  className="h-8 text-accent-foreground bg-accent border-accent hover:bg-accent/90 transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Chat
                </Button>
            )}
             {activeTab === "chat" && !showMultiQuizDialog && ( 
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 text-accent-foreground bg-accent border-accent hover:bg-accent/90">
                        Take a Quiz <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => handleStartMultiQuiz('Easy')} className="hover:bg-accent/20 focus:bg-accent/20">Easy</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartMultiQuiz('Medium')} className="hover:bg-accent/20 focus:bg-accent/20">Medium</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartMultiQuiz('Hard')} className="hover:bg-accent/20 focus:bg-accent/20">Hard</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
             {activeTab === "chat" && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        aria-label="Clear Chat and Data"
                        className="h-8"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Chat
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete all chat messages, uploaded images, generated images, and any active quiz data. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChatAndData}>
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}
          </div>
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
                    messageId="welcome-msg"
                  />
                )}
                {messages.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <ChatMessage
                      {...msg}
                      nlpAnalysis={msg.nlpAnalysis}
                      messageId={msg.id}
                    />
                  </React.Fragment>
                ))}
                {isLoading && (
                  <ChatMessage role="assistant" content="" isLoading={true} suggestedResources={[]} messageId="loading-msg" />
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
                      disabled={!generatedImage || isImageLoading}
                      className="w-full sm:w-auto text-accent-foreground bg-accent border-accent hover:bg-accent/90"
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

        <Dialog open={showMultiQuizDialog} onOpenChange={setShowMultiQuizDialog}>
            <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col bg-background border-border shadow-2xl">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-xl text-primary">AI Knowledge Quiz</DialogTitle>
                    <DialogDescriptionComponent>
                        Test your understanding of AI/ML concepts. Difficulty: {multiQuizDifficulty}
                    </DialogDescriptionComponent>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto p-1 md:p-4">
                    {isMultiQuizLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                            <p className="text-lg text-muted-foreground">Generating your {multiQuizDifficulty.toLowerCase()} quiz...</p>
                        </div>
                    ) : multiQuizQuestions.length > 0 ? (
                        <MultiQuizDisplay
                            questions={multiQuizQuestions}
                            onQuizComplete={handleMultiQuizComplete}
                            difficulty={multiQuizDifficulty}
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full">
                            <Frown className="h-16 w-16 text-destructive mb-4" /> {/* Changed from XCircle to Frown */}
                            <p className="text-lg text-muted-foreground">Could not load quiz questions.</p>
                            <p className="text-sm text-muted-foreground">Please try again or select a different difficulty.</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="p-4 border-t border-border">
                    <DialogClose asChild>
                        <Button variant="outline">Close Quiz</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </ImageUpload>
  );
}


