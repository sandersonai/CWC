import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Optional image data URI
  isLoading?: boolean; // Optional loading state for assistant messages
}

export function ChatMessage({ role, content, image, isLoading = false }: ChatMessageProps) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex items-start space-x-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
         <Avatar className="h-8 w-8 border border-border bg-background"> {/* Use theme border and background */}
          {/* Use a more "AI" looking fallback or image if available */}
          {/* <AvatarImage src="/path/to/ai-avatar.png" alt="Christian AI" /> */}
          <AvatarFallback className="bg-accent text-accent-foreground"> {/* Use accent for bot fallback */}
            <Bot className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl shadow-lg', // Slightly stronger shadow
        'rounded-lg border', // Added explicit border using theme color
         isUser
           ? 'bg-primary/80 text-primary-foreground border-primary/50' // User message: Slightly transparent primary, primary foreground text, primary border
           : 'bg-card text-card-foreground border-border' // Assistant message: Card background, card foreground text, default border
        // Optional: Add subtle glow on hover if desired
        // 'hover:shadow-primary/20 hover:shadow-md transition-shadow'
      )}>
        <CardContent className="p-3 space-y-2">
          {image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-2 border border-border/50"> {/* Slightly lighter border for image */}
              <Image
                src={image}
                alt="User uploaded image"
                layout="fill"
                objectFit="contain"
                data-ai-hint="message image"
                className="rounded-md" // Ensure image itself is rounded
              />
            </div>
          )}
           {isLoading ? (
            <div className="flex items-center justify-center p-2 space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> {/* Use primary color for loader */}
               <span className="text-xs text-muted-foreground">Christian is thinking...</span>
            </div>
          ) : (
             content && <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
          )}
        </CardContent>
      </Card>
      {isUser && (
         <Avatar className="h-8 w-8 border border-border bg-background"> {/* Use theme border and background */}
          <AvatarFallback className="bg-secondary text-secondary-foreground"> {/* Use secondary for user fallback */}
             <User className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
