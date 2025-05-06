import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage as it's not used
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface SuggestedResource {
  title: string;
  url: string;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Optional image data URI
  isLoading?: boolean; // Optional loading state for assistant messages
  suggestedResources?: SuggestedResource[];
}

export function ChatMessage({ role, content, image, isLoading = false, suggestedResources = [] }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex items-start space-x-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
         <Avatar className="h-8 w-8 border border-border bg-background">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        'max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl shadow-lg',
        'rounded-lg border',
         isUser
           ? 'bg-primary/80 text-primary-foreground border-primary/50'
           : 'bg-card text-card-foreground border-border'
      )}>
        <CardContent className="p-3 space-y-2">
          {image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-2 border border-border/50">
              <Image
                src={image}
                alt="User uploaded image"
                layout="fill"
                objectFit="contain"
                data-ai-hint="message image"
                className="rounded-md"
              />
            </div>
          )}
           {isLoading ? (
            <div className="flex items-center justify-center p-2 space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
               <span className="text-xs text-muted-foreground">Christian is thinking...</span>
            </div>
          ) : (
             content && <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
          )}
          {suggestedResources && suggestedResources.length > 0 && !isLoading && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Learn More:</h4>
              <ul className="space-y-1">
                {suggestedResources.map((resource, index) => (
                  <li key={index}>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-accent hover:text-accent-foreground justify-start text-left break-words" // Ensure text wraps
                      onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                      title={`Open: ${resource.url}`}
                    >
                      <LinkIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      {resource.title}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      {isUser && (
         <Avatar className="h-8 w-8 border border-border bg-background">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
             <User className="h-5 w-5"/>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
