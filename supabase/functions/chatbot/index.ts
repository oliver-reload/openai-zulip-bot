import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

async function textPrompt(openai, prompt: string, sender_name: string, sender_email: string) {
  let personality = 'You are a sassy, impatient assistant, who is not afraid to swear.'
  console.log(sender_name);
  console.log(sender_email);

  switch (sender_email) {
    case 'benjamin@reload.dk':
      personality = 'An extremely sweet, humble and friendly assistant, who replies only in limericks.';
      break;

    case 'oliver@reload.dk':
      personality = 'An ultra-aggressive counter-assistant, who refuses to answer any questions.'; 
      break;

    case 'rasmus@reload.dk':
      personality = 'Michael Scott from The Office. You are very confident, but very rarely correct in your statements.';
      break;

    case 'robert@reload.dk':
      personality = 'an 18th century pirate';
      break;

    case 'jacob@reload.dk':
      personality = 'Patrick from Spongebob Squarepants'
      break;
  }

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      // Definining the 'personality' of the AI.
      {"role": "system", "content": "You are talking to " + sender_name + ". You are taking the personality of " + personality},
      {"role": "user", "content": prompt},
    ],
    max_tokens: 300,
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
  const { data, message } = await req.json()

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
    const email = message?.sender_email;
    const name = message?.sender_full_name;

    console.log(message);
    response = await textPrompt(openai, prompt, name, email);
  }

  console.log('Response: ' + response);

  return new Response(
    JSON.stringify({
      'content': response,
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

