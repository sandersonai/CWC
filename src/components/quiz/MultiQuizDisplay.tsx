
'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw, Trophy, Award, HelpCircle } from 'lucide-react';
import type { QuizData } from '@/components/chat/QuizDisplay'; // Re-use QuizData interface
import { Progress } from '@/components/ui/progress';

interface MultiQuizDisplayProps {
  questions: QuizData[];
  onQuizComplete: (score: number, totalQuestions: number) => void;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function MultiQuizDisplay({ questions, onQuizComplete, difficulty }: MultiQuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = parseInt(value);
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    setShowResults(true);
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctOptionIndex) {
        score++;
      }
    });
    onQuizComplete(score, questions.length);
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers(new Array(questions.length).fill(null));
    setSubmitted(false);
    setShowResults(false);
  };
  
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (showResults) {
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctOptionIndex) {
        score++;
      }
    });
    const percentageScore = (score / questions.length) * 100;
    const passed = percentageScore >= 80;

    return (
      <Card className="w-full max-w-2xl mx-auto my-4 bg-card border-border/70 shadow-lg">
        <CardHeader className="pb-4 pt-6 text-center">
          <CardTitle className="text-xl text-primary flex items-center justify-center">
            <Trophy className="mr-2 h-6 w-6 text-yellow-400" />
            Quiz Results ({difficulty})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex flex-col items-center space-y-4">
            {passed ? (
              <>
                <Image
                  src="https://firestuff-prod.imgix.net/ai-generated/JD-P-ai-learning-app/images/congratulations-you-passed-700x1000.jpg?w=300&h=200&fit=crop&auto=format"
                  alt="Passing Grade AI Bot"
                  width={300}
                  height={200}
                  className="rounded-md shadow-lg"
                  data-ai-hint="futuristic robot trophy"
                />
                <p className="text-2xl font-bold text-green-400">Congratulations! You Passed!</p>
                <Award className="h-12 w-12 text-yellow-400" />
              </>
            ) : (
              <>
                <Image
                  src="https://firestuff-prod.imgix.net/ai-generated/JD-P-ai-learning-app/images/wow-you-did-ok-700x1000.jpg?w=300&h=200&fit=crop&auto=format"
                  alt="Encouraging AI Bot"
                  width={300}
                  height={200}
                  className="rounded-md shadow-lg"
                  data-ai-hint="robot encouraging sad"
                />
                <p className="text-xl font-semibold text-blue-300">Wow, you did good!</p>
                <p className="text-lg text-muted-foreground">A little more training is needed.</p>
                <HelpCircle className="h-12 w-12 text-blue-400" />
              </>
            )}
          </div>
          <p className="text-xl font-semibold mt-4">
            You scored {score} out of {questions.length}! ({percentageScore.toFixed(0)}%)
          </p>
          <Progress value={percentageScore} className="w-full h-3" 
            indicatorClassName={passed ? 'bg-green-500' : 'bg-blue-500'}
          />
          <div className="max-h-60 overflow-y-auto space-y-3 p-1 mt-4 border-t border-border pt-4">
            <h3 className="text-md font-semibold text-left text-muted-foreground mb-2">Review Your Answers:</h3>
            {questions.map((q, idx) => (
              <div key={idx} 
                   className={cn("p-3 rounded-md border text-left text-sm", 
                                answers[idx] === q.correctOptionIndex ? "border-green-600 bg-green-500/10" : "border-red-600 bg-red-500/10")}>
                <p className="font-medium">{idx + 1}. {q.questionText}</p>
                <p className="text-xs mt-1">Your answer: <span className={answers[idx] === q.correctOptionIndex ? "text-green-500" : "text-red-500"}>{answers[idx] !== null ? q.options[answers[idx]!].text : "Not answered"}</span></p>
                {answers[idx] !== q.correctOptionIndex && <p className="text-xs text-green-600 dark:text-green-400">Correct answer: {q.options[q.correctOptionIndex].text}</p>}
                {q.explanation && <p className="text-xs mt-1 italic text-muted-foreground/80">Explanation: {q.explanation}</p>}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4 pb-6">
          <Button onClick={handleRestartQuiz} variant="outline" className="text-accent border-accent hover:bg-accent/10">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Same Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-2xl mx-auto my-4 bg-card border-border/70 shadow-lg">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-primary">AI Quiz ({difficulty})</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
         <Progress value={progressPercentage} className="w-full h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4 pt-2 pb-4 min-h-[200px]">
        {currentQuestion && (
          <>
            <p className="text-md font-medium text-foreground">{currentQuestion.questionText}</p>
            <RadioGroup
              onValueChange={handleOptionChange}
              value={answers[currentQuestionIndex]?.toString() ?? ""}
              className="space-y-2"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`q${currentQuestionIndex}-option-${index}`}
                    className="border-primary text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`q${currentQuestionIndex}-option-${index}`} className="text-sm font-normal cursor-pointer flex-1">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-4">
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNextQuestion} variant="outline" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmitQuiz} disabled={answers.some(a => a === null)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Submit Quiz
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

