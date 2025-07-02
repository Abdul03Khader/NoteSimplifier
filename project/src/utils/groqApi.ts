const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Array of API keys - will be loaded from environment variables
const GROQ_API_KEYS = [
  import.meta.env.VITE_GROQ_API_KEY_1,
  import.meta.env.VITE_GROQ_API_KEY_2,
  import.meta.env.VITE_GROQ_API_KEY_3,
  import.meta.env.VITE_GROQ_API_KEY_4,
  import.meta.env.VITE_GROQ_API_KEY_5,
  import.meta.env.VITE_GROQ_API_KEY_6,
  import.meta.env.VITE_GROQ_API_KEY_7,
  import.meta.env.VITE_GROQ_API_KEY_8,
  import.meta.env.VITE_GROQ_API_KEY_9,
  import.meta.env.VITE_GROQ_API_KEY_10,
].filter(key => key && key !== 'your_actual_groq_api_key_here');

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function makeGroqRequest(text: string, apiKey: string): Promise<string> {
  const prompt = `Simplify the following academic notes while retaining all details, headings, examples, and structure. Explain complex terms in simpler language, do not shorten or remove any content. Use clear, student-friendly language while preserving completeness. Maintain all formatting and organization:\n\n${text}`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    } else if (response.status === 401) {
      throw new Error('INVALID_KEY');
    } else {
      throw new Error(`API_ERROR_${response.status}`);
    }
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content || text;
}

export async function simplifyTextWithGroq(text: string): Promise<string> {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error('No valid Groq API keys configured. Please add your API keys to the .env file (VITE_GROQ_API_KEY_1 through VITE_GROQ_API_KEY_10).');
  }

  // Try with the first available API key, with retry logic
  for (const apiKey of GROQ_API_KEYS) {
    try {
      const result = await makeGroqRequest(text, apiKey);
      return result;
    } catch (error) {
      const err = error as Error;
      if (err.message === 'RATE_LIMIT') {
        console.log(`Rate limit hit with key, trying next...`);
        continue;
      } else if (err.message === 'INVALID_KEY') {
        console.log(`Invalid API key, trying next...`);
        continue;
      } else {
        console.log(`API error: ${err.message}, trying next key...`);
        continue;
      }
    }
  }

  throw new Error('All API keys failed. Please check your configuration and try again.');
}

// New function for parallel processing of multiple chunks
export async function simplifyTextChunksInParallel(
  chunks: string[], 
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error('No valid Groq API keys configured. Please add your API keys to the .env file (VITE_GROQ_API_KEY_1 through VITE_GROQ_API_KEY_10).');
  }

  const results: string[] = new Array(chunks.length);
  const processingQueue: Array<{ chunk: string; index: number }> = chunks.map((chunk, index) => ({ chunk, index }));
  let completedCount = 0;

  // Create worker functions for each API key
  const workers = GROQ_API_KEYS.map(async (apiKey) => {
    while (processingQueue.length > 0) {
      const task = processingQueue.shift();
      if (!task) break;

      const { chunk, index } = task;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const result = await makeGroqRequest(chunk, apiKey);
          results[index] = result;
          completedCount++;
          
          if (onProgress) {
            onProgress(completedCount, chunks.length);
          }
          
          break; // Success, move to next task
        } catch (error) {
          const err = error as Error;
          retryCount++;
          
          if (err.message === 'RATE_LIMIT') {
            // If rate limited, wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            if (retryCount >= maxRetries) {
              // Put the task back in the queue for another worker to try
              processingQueue.push(task);
              break;
            }
          } else if (err.message === 'INVALID_KEY') {
            // Invalid key, this worker should stop
            console.log(`Invalid API key detected, worker stopping`);
            return;
          } else {
            // Other error, wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            if (retryCount >= maxRetries) {
              // Put the task back in the queue for another worker to try
              processingQueue.push(task);
              break;
            }
          }
        }
      }
    }
  });

  // Wait for all workers to complete
  await Promise.all(workers);

  // Check if all chunks were processed
  if (results.some(result => result === undefined)) {
    throw new Error('Some chunks failed to process. Please try again.');
  }

  return results;
}

export function chunkText(text: string, maxChunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Handle very long sentences
        chunks.push(sentence);
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}