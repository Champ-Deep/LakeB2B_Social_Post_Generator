const fs = require('fs');

const API_KEY = 'AIzaSyDGpes7OqpMAvCHz0Gz51jOFgkF-yce29Q';
const MODEL = 'gemini-2.0-flash-exp-image-generation';
const PROMPT = 'A beautiful sunset over a calm ocean with a sailboat in the distance, cinematic lighting, high resolution';

async function testImageGeneration() {
    console.log(`🚀 Testing image generation with model: ${MODEL}`);
    console.log(`📝 Prompt: ${PROMPT}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: PROMPT }]
                }]
            })
        });

        const data = await response.json();

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            console.error('❌ API Error:', JSON.stringify(data, null, 2));
            return;
        }

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const parts = data.candidates[0].content.parts;
            let foundImage = false;

            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    console.log('✅ Found base64 image data!');
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    const fileName = 'test-output-gemini2-image.png';
                    fs.writeFileSync(fileName, imageBuffer);
                    console.log(`💾 Image saved to ${fileName}`);
                    foundImage = true;
                } else if (part.text) {
                    console.log('📝 Text part found:', part.text);
                }
            }

            if (!foundImage) {
                console.log('⚠️ No image data found in response parts.');
            }
        } else {
            console.log('⚠️ No candidates returned:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

testImageGeneration();
