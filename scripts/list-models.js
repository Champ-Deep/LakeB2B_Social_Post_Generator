const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found');
        return;
    }

    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log('Available Models:');
        response.data.models.forEach(model => {
            if (model.supportedGenerationMethods.includes('generateContent') || model.supportedGenerationMethods.includes('predict')) {
                console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
            }
        });
    } catch (error) {
        console.error('Failed to list models:', error.response?.data || error.message);
    }
}

listModels();
