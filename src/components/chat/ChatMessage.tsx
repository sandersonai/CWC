
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardHeader, CardTitle, CardDescription
import { cn } from '@/lib/utils';
import { User, Bot, Loader2, Link as LinkIcon, BrainCircuit, BarChart3, Brain } from 'lucide-react'; // Added BarChart3, Brain
import { Button } from '@/components/ui/button'; // Added import for Button

interface SuggestedResource {
  title: string;
  url: string;
}

export interface NlpAnalysisData {
  sentiment?: string;
  prominentEntities?: Array<{ name: string; type: string }>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isLoading?: boolean;
  suggestedResources?: SuggestedResource[];
  nlpAnalysis?: NlpAnalysisData; // New: To store NLP analysis results
  canHaveQuiz?: boolean;
}

interface ChatMessageProps extends Message {
  onGenerateQuiz?: (messageId: string, topic: string) => void;
  isQuizLoading?: boolean;
  messageId: string;
}

export function ChatMessage({
  role,
  content,
  image,
  isLoading = false,
  suggestedResources = [],
  nlpAnalysis, // Added nlpAnalysis prop
  canHaveQuiz = false,
  onGenerateQuiz,
  isQuizLoading = false,
  messageId,
}: ChatMessageProps) {
  const isUser = role === 'user';

  const handleQuizButtonClick = () => {
    if (onGenerateQuiz && content) {
      const topic = content.substring(0, 100);
      onGenerateQuiz(messageId, topic);
    }
  };

  return (
    <div className={cn('flex items-start space-x-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 border border-border bg-background">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot className="h-5 w-5" />
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
          {nlpAnalysis && (nlpAnalysis.sentiment || (nlpAnalysis.prominentEntities && nlpAnalysis.prominentEntities.length > 0)) && !isLoading && (
            <Card className="mt-3 bg-muted/50 border-border/70">
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-semibold flex items-center text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Query Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 text-xs space-y-0.5">
                {nlpAnalysis.sentiment && (
                  <p><span className="font-medium">Sentiment:</span> {nlpAnalysis.sentiment}</p>
                )}
                {nlpAnalysis.prominentEntities && nlpAnalysis.prominentEntities.length > 0 && (
                  <div>
                    <span className="font-medium">Key Entities:</span>
                    <ul className="list-disc list-inside pl-1">
                      {nlpAnalysis.prominentEntities.slice(0, 3).map((entity, idx) => (
                        <li key={idx} className="text-xs">
                          {entity.name} <span className="text-muted-foreground/80">({entity.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {suggestedResources && suggestedResources.length > 0 && !isLoading && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Learn More:</h4>
              <ul className="space-y-1">
                {suggestedResources.map((resource, index) => (
                  <li key={index}>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-accent hover:text-accent-foreground justify-start text-left break-words"
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
          {!isUser && !isLoading && canHaveQuiz && onGenerateQuiz && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuizButtonClick}
                disabled={isQuizLoading}
                className="w-full text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground"
              >
                {isQuizLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                Test Your Knowledge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 border border-border bg-background">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

