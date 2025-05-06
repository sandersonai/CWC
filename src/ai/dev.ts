import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-image-and-respond.ts';
import '@/ai/flows/respond-to-ai-query.ts';
import '@/ai/flows/summarize-ai-article.ts';
import '@/ai/flows/generate-image-from-prompt.ts'; // Add the new flow
```