require('dotenv').config();
const express = require('express');
const path = require('path');
// const fetch = require('node-fetch'); // REMOVED THIS LINE - IT'S NOT NEEDED

const app = express();
const port = 3001;

// Serve static files from your 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing large JSON payloads
app.use(express.json({ limit: '10mb' }));

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint for Photo Verification
app.post('/api/verify-photo', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image data provided.' });
        }
        console.log("Received image, sending to OpenRouter for verification...");

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            throw new Error("OPENROUTER_API_KEY not found in .env file.");
        }

        const prompt = `
            You are an AI image verification expert for an environmental app called EcoQuest.
            Your task is to determine if the provided image successfully completes the challenge 'Plant a Sapling'.
            Look for a clear image of a small tree, a sapling, a sprout, a seedling, or someone's hands planting something in soil or a pot. The image must contain a real plant. Also check if it is an AI generated image or not.
            If the image meets these criteria, respond with the single word: YES.
            If the image does not show a plant or the act of planting (e.g., it's a person's face, an AI generated plant image, a car, a book, or just a blurry picture), respond with the single word: NO.
        `;

        const payload = {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: image
                        }
                    }
                ]
            }]
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'EcoQuest App'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        const aiResponseText = result.choices[0].message.content.trim().toUpperCase();
        console.log("OpenRouter Response:", aiResponseText);

        res.json({ verified: aiResponseText === 'YES' });

    } catch (error) {
        console.error("Error during AI verification:", error.message);
        res.status(500).json({ error: 'Failed to verify image with AI.' });
    }
});

// Endpoint for Quiz Generation
app.post('/api/generate-quiz', async (req, res) => {
    try {
        const { prompt, videoTitle } = req.body;
        if (!prompt || !videoTitle) {
            return res.status(400).json({ error: 'Missing prompt or video title for quiz generation.' });
        }
        console.log(`Received quiz generation request for video: ${videoTitle}`);

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            throw new Error("OPENROUTER_API_KEY not found in .env file.");
        }

        const payload = {
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{
                role: "user",
                content: prompt
            }]
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'EcoQuest App - Quiz'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter API Error (Quiz): ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        let responseText = result.choices[0].message.content;

        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        }

        const quizObject = JSON.parse(responseText);

        res.json(quizObject);

    } catch (error) {
        console.error("Error during AI quiz generation:", error.message);
        res.status(500).json({ error: 'Failed to generate quiz with AI.' });
    }
});

app.listen(port, () => {
    console.log(`EcoQuest server running on http://localhost:${port}`);
});