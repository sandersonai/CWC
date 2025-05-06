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
        <Avatar className="h-8 w-8 border border-accent glow-accent"> {/* Added border and glow to bot avatar */}
          <AvatarFallback className="bg-accent text-accent-foreground"> {/* Styled fallback */}
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl shadow-lg', // Increased shadow
        'rounded-md', // Slightly reduced rounding
        isUser ? 'bg-primary/80 text-primary-foreground glow-primary' : 'bg-card text-card-foreground' // Use primary with opacity for user, add glow
      )}>
        <CardContent className="p-3 space-y-2">
          {image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-sm mb-2 border border-border"> {/* Reduced rounding, added border */}
              <Image
                src={image}
                alt="User uploaded image"
                layout="fill"
                objectFit="contain"
                data-ai-hint="message image"
              />
            </div>
          )}
           {isLoading ? (
            <div className="flex items-center justify-center p-2 space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
               <span className="text-xs text-muted-foreground">Christian is thinking...</span>
            </div>
          ) : (
             content && <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 border border-primary glow-primary"> {/* Added border and glow to user avatar */}
          <AvatarFallback className="bg-primary text-primary-foreground"> {/* Styled fallback */}
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
