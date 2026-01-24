const fs = require('fs');

const API_KEY = 'AIzaSyDGpes7OqpMAvCHz0Gz51jOFgkF-yce29Q';
const MODEL = 'imagen-4.0-generate-001';
const PROMPT = 'A beautiful sunset over a calm ocean with a sailboat in the distance, cinematic lighting, high resolution';

async function testImageGeneration() {
    console.log(`🚀 Testing image generation with model: ${MODEL}`);
    console.log(`📝 Prompt: ${PROMPT}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict`;

    try {
        const response = await fetch(url + `?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [
                    { prompt: PROMPT }
                ],
                parameters: {
                    sampleCount: 1
                }
            })
        });

        const data = await response.json();

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            console.error('❌ API Error:', JSON.stringify(data, null, 2));
            return;
        }

        if (data.predictions && data.predictions.length > 0) {
            console.log('✅ Image generated successfully!');
            const prediction = data.predictions[0];

            if (prediction.bytesBase64Encoded) {
                const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, 'base64');
                const fileName = 'test-output-imagen4.png';
                fs.writeFileSync(fileName, imageBuffer);
                console.log(`💾 Image saved to ${fileName}`);
            } else if (prediction.inlineData) {
                const imageBuffer = Buffer.from(prediction.inlineData.data, 'base64');
                const fileName = 'test-output-imagen4.png';
                fs.writeFileSync(fileName, imageBuffer);
                console.log(`💾 Image saved to ${fileName}`);
            } else {
                console.log('⚠️ No image data found in prediction:', JSON.stringify(prediction).substring(0, 500));
            }
        } else {
            console.log('⚠️ No predictions returned:', data);
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

testImageGeneration();
