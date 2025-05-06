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
        <Avatar className="h-8 w-8">
          {/* You can replace this with a specific bot avatar if desired */}
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg shadow-sm',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-card'
      )}>
        <CardContent className="p-3 space-y-2">
          {image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-2">
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
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
             content && <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          {/* You can replace this with user initials or a profile picture */}
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
