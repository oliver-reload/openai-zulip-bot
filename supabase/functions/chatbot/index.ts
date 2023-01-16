import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai_mini/mod.ts";

async function textPrompt(openai, prompt: string) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${prompt}`,
    max_tokens: 500,
  });

  console.log('openAI response:');
  console.log(response);

  return response?.choices[0]?.text;
}

async function imagePrompt(openai, prompt: string) {
  const response = await openai.createImage({
    prompt: `${prompt}`,
    n: 1,
    size: "512x512",
    response_format: "url"
  });

  console.log('openAI response:');
  console.log(response);

  return response;
}

async function returnError(message) {
  console.error(message);

  return new Response(
    JSON.stringify({
      'content': message,
    }),
    { headers: { "Content-Type": "application/json" }, status: 400 },
  )
} 

serve(async (req) => {
  const openAIAPIKey = Deno.env.get('OPENAI_API_KEY')

  if (!openAIAPIKey) {
    return returnError('Missing API key for OpenAI.');
  }
  
  const openai = new OpenAI(openAIAPIKey);
  const { data } = await req.json()

  let prompt = data.toString();
  let response = '';

  console.log('Original prompt: ' + prompt);

  if (!prompt) {
    return returnError('No prompt detected.'); 
  }

  // If the bot has been initialized by calling it's name,
  // we'll remove it from the prompt.
  const botName = '@**OpenAi**';

  if (prompt.startsWith(botName)) {
    prompt = prompt.replace(botName, "", 1)
  }

  console.log('Prompt: ' + prompt);

  if (prompt.startsWith('--image')) {
    response = await imagePrompt(openai, prompt);

    response += '\r\n (The image URL will expire after a while)'
  }
  else {
    response = await textPrompt(openai, prompt);
  }

  console.log('Response: ' + response);

  return new Response(
    JSON.stringify({
      'content': response,
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

