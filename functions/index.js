const functions = require('firebase-functions');
const OpenAI = require('openai');

// Initialize OpenAI with API key from Firebase environment
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY, // Fallback for local testing
});

// Cloud Function for AI card generation
exports.generateCard = functions.https.onCall(async (data, context) => {
  try {
    // Optional authentication check (commented out for testing)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const { prompt, cardType, useAssistant } = data;
    
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
    }

    console.log('Generating card with prompt:', prompt);
    
    if (useAssistant) {
      // Use OpenAI Assistant
      const assistant = await openai.beta.assistants.create({
        name: "GridStrike Card Generator",
        instructions: `You are an expert at creating balanced cards for the GridStrike tactical card game.

GRIDSTRIKE GAME RULES:
- Tactical card game on 24x24 grid
- Goal: Destroy enemy Obelisk
- 40-card decks + Commander + Obelisk
- Energy system: gain energy = round number
- Units have HP, AC, Move stats
- 2 actions per activation: Move, Strike, Use Ability

CRITICAL ACTION POINT RULES:
- Units have exactly 2 action points per activation
- Abilities cost 0, 1, or 2 action points MAX
- 0 AP abilities MUST be passive (passive: true)
- Active abilities cost 1 or 2 AP only
- No abilities should cost 3+ AP (impossible to use)

Always respond with valid JSON only. No additional text.`,
        model: "gpt-4o",
      });

      const thread = await openai.beta.threads.create();
      
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id
      });

      // Wait for completion and return result
      let runResult = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runResult.status === 'in_progress' || runResult.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runResult = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      if (runResult.status === 'failed') {
        throw new Error('Assistant run failed');
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const response = messages.data[0].content[0].text.value;
      
      // Clean up
      await openai.beta.assistants.del(assistant.id);
      
      return { success: true, content: response };
    } else {
      // Fallback to direct completion
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      return { success: true, content: completion.choices[0].message.content };
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new functions.https.HttpsError('internal', `AI generation failed: ${error.message}`);
  }
});

// Cloud Function for field-level generation
exports.generateField = functions.https.onCall(async (data, context) => {
  try {
    // Optional authentication check (commented out for testing)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const { fieldType, currentValue, cardContext } = data;
    
    if (!fieldType) {
      throw new functions.https.HttpsError('invalid-argument', 'Field type is required');
    }

    console.log('Generating field:', fieldType, 'Current:', currentValue);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Improve this ${fieldType} for a GridStrike card: "${currentValue}". Context: ${cardContext || 'No additional context'}`
      }],
      temperature: 0.7,
    });

    return { success: true, content: completion.choices[0].message.content };
  } catch (error) {
    console.error('Field Generation Error:', error);
    throw new functions.https.HttpsError('internal', `Field generation failed: ${error.message}`);
  }
});
