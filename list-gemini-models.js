const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!API_KEY) {
        console.error('GEMINI_API_KEY is not set. Copy .env.example to .env.local and set GEMINI_API_KEY.');
        process.exit(1);
    }

    console.log('🔍 Listing available models...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Error:', JSON.stringify(data, null, 2));
            return;
        }

        console.log('📦 Available models:');
        data.models.forEach(model => {
            console.log(`- ${model.name} (${model.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

listModels();
