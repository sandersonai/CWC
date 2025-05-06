
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react'; // Removed Info as it was not used

interface QuizOption {
  text: string;
}

export interface QuizData {
  questionText: string;
  options: QuizOption[];
  correctOptionIndex: number;
  explanation?: string;
}

interface QuizDisplayProps {
  quiz: QuizData;
  onQuizSubmit: (isCorrect: boolean) => void;
}

export function QuizDisplay({ quiz, onQuizSubmit }: QuizDisplayProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === quiz.correctOptionIndex;
    setIsCorrect(correct);
    setSubmitted(true);
    onQuizSubmit(correct);
  };

  return (
    <Card className="w-full max-w-md my-4 ml-11 bg-card border-border/70 shadow-md"> {/* Added ml-11 to align with assistant message */}
      <CardHeader className="pb-2 pt-4"> {/* Adjusted padding */}
        <CardTitle className="text-base text-primary">Test Your Knowledge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2 pb-4"> {/* Adjusted padding */}
        <p className="text-sm font-medium text-foreground">{quiz.questionText}</p>
        <RadioGroup
          onValueChange={(value) => setSelectedOption(parseInt(value))}
          disabled={submitted}
          className="space-y-2"
        >
          {quiz.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem
                value={index.toString()}
                id={`option-${quiz.questionText.slice(0,10)}-${index}`} // More unique ID
                className={cn(
                  submitted && index === quiz.correctOptionIndex && 'border-green-500 text-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600',
                  submitted && index === selectedOption && index !== quiz.correctOptionIndex && 'border-red-500 text-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600',
                  // Ensure checked styles apply correctly when submitted
                  submitted && index === selectedOption && 'ring-2',
                  submitted && index === quiz.correctOptionIndex && 'ring-green-500',
                  submitted && index === selectedOption && index !== quiz.correctOptionIndex && 'ring-red-500',
                )}
              />
              <Label
                htmlFor={`option-${quiz.questionText.slice(0,10)}-${index}`}
                className={cn(
                  'text-sm cursor-pointer', // Ensure label is clickable
                  submitted && index === quiz.correctOptionIndex && 'text-green-600 dark:text-green-400',
                  submitted && index === selectedOption && index !== quiz.correctOptionIndex && 'text-red-600 dark:text-red-400'
                )}
              >
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-3 pt-0 pb-4"> {/* Adjusted padding */}
        {!submitted && (
          <Button onClick={handleSubmit} disabled={selectedOption === null} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Submit Answer
          </Button>
        )}
        {submitted && isCorrect !== null && (
          <div
            className={cn(
              'w-full p-3 rounded-md text-sm flex items-start space-x-2',
              isCorrect ? 'bg-green-500/20 border border-green-600 text-green-700 dark:text-green-300' : 'bg-red-500/20 border border-red-600 text-red-700 dark:text-red-300'
            )}
          >
            {isCorrect ? <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />}
            <div>
                <p className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
                {quiz.explanation && <p className="mt-1 text-xs">{quiz.explanation}</p>}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
