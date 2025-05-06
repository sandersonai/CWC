
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-image-and-respond.ts';
import '@/ai/flows/respond-to-ai-query.ts';
import '@/ai/flows/summarize-ai-article.ts';
import '@/ai/flows/generate-image-from-prompt.ts';
import '@/ai/flows/generate-quiz-flow.ts';
import '@/ai/flows/generate-multi-question-quiz-flow.ts'; // Added new multi-question quiz flow
import '@/ai/tools/find-relevant-resources-tool.ts';
import '@/ai/tools/generate-quiz-tool.ts';
import '@/ai/tools/google-cloud-nlp-tool.ts'; // Added new Google Cloud NLP tool

