import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

async function textPrompt(openai, prompt: string) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      // Definining the 'personality' of the AI.
      {"role": "system", "content": "You are a sassy, impatient assistant, who is not afraid to swear."},
      {"role": "user", "content": prompt},
    ],
    max_tokens: 1000,
  });

  console.log('openAI response:');
  console.log(response);

  return response?.choices[0]?.message?.content;
}

async function imagePrompt(openai, prompt: string) {
  const response = await openai.createImage({
    prompt: `${prompt}`,
    size: "512x512",
    response_format: "url"
  });

  console.log('openAI response:');
  console.log(response);

  return response?.data[0]?.url;
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
  const botName = '@**OpenAI**';

  if (prompt.startsWith(botName)) {
    prompt = prompt.replace(botName, "", 1)
  }

  prompt = prompt.trim();

  console.log('Prompt: ' + prompt);

  if (prompt.startsWith('--image')) {
    const image_url = await imagePrompt(openai, prompt);

    response += '[Notice: The image URL will expire after a while](' + image_url + ')'
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

