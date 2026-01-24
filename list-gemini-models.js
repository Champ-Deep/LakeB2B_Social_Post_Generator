const API_KEY = 'AIzaSyDGpes7OqpMAvCHz0Gz51jOFgkF-yce29Q';

async function listModels() {
    console.log(`🔍 Listing available models...`);

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
