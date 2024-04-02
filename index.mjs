import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
const app = express();
const port = 3001;

const USER_API_KEYS_FILE = __dirname + '/user-api-keys.json';
const OPENROUTER_API_KEY = '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'; // Replace with your OpenRouter API key

// Load user API keys from the JSON file
let userApiKeys;
try {
  const data = await fs.readFile(USER_API_KEYS_FILE, 'utf8');
  userApiKeys = JSON.parse(data);
} catch (error) {
  console.error('Error loading user API keys:', error);
  process.exit(1);
}

// Middleware to block direct IP access
app.use((req, res, next) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden - Direct IP access is not allowed' });
  }
});

app.use(express.json());

// Middleware to check for a valid user API key and increment request counter
app.post('/v1/chat/completion', (req, res, next) => {
  const { message, model, apikey } = req.body; // Assuming the API key is in the request body

  if (!apikey || !userApiKeys[apikey]) {
    res.status(401).json({ error: 'Unauthorized - Invalid user API key' });
  } else {
    // Increment the request counter for the API key
    userApiKeys[apikey].requests = (userApiKeys[apikey].requests || 0) + 1;
    next();
  }
}, async (req, res) => {
  try {
    const { message, model, apikey } = req.body;

    // Check for required parameters
    if (!message || !model || !apikey) {
      res.status(400).json({ error: 'Bad Request - Missing required parameters' });
      return;
    }

    // Validate the user API key
    if (!userApiKeys[apikey]) {
      res.status(401).json({ error: 'Unauthorized - Invalid user API key' });
      return;
    }

    // Map model names to actual models
    const modelMappings = {
      "mistral": "mistralai/mistral-7b-instruct:free",
      "zephyr": "huggingfaceh4/zephyr-7b-beta",
      "mythomist": "gryphe/mythomist-7b:free",
      "nous-capybara-7b": "gryphe/mythomist-7b:free",
      "openchat": "openchat/openchat-7b",
      "cinematika": "openrouter/cinematika-7b",
      "toppy":"undi95/toppy-m-7b:free",
      "gemma":"google/gemma-7b-it:free",
      "cenimatika":"openrouter/cinematika-7b:free",
    };

    const selectedModel = modelMappings[model];

    if (!selectedModel) {
      res.status(400).json({ error: "Invalid AI Model" });
      return;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": 'https://ai.ea-sy.tech/',
        "X-Title": 'EASY API',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "You are a helpful assistant, note: only answer using English if they don't ask you the response in other language" },
          { role: "user", content: message },
        ],
      }),
    });

    const result = await response.json();
    const content = result.choices[0].message.content;

    // Save the updated user API keys to the file
    await saveUserApiKeysToFile();

    res.json({
      status: 200,
      maintain_by: "ISOY DEV",
      content: content,
      requests_count: userApiKeys[apikey].requests, // Include the request count in the response
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred.' });
    console.error(error);
  }
});

// Function to save user API keys to the file
async function saveUserApiKeysToFile() {
  try {
    await fs.writeFile(USER_API_KEYS_FILE, JSON.stringify(userApiKeys, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving user API keys to file:', error);
  }
}

// Endpoint for generating a new user API key
app.post('/generate', (req, res) => {
  const user = req.body.user;
  if (!user) {
    res.status(400).json({ error: 'Bad Request - Missing user information' });
    return;
  }

  const newUserApiKey =`zie-ai-v1-${uuidv4()}`; // Generate a new UUID as the user API key
  userApiKeys[newUserApiKey] = { user: user, requests: 0 }; // Initialize requests count to 0

  saveUserApiKeysToFile();

  res.json({ userApiKey: newUserApiKey, user });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
