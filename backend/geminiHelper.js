const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getGeminiRecommendation(userInfo) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a medical assistant. Provide detailed health recommendations based on this user information:

Patient Name: ${userInfo.patientName}
Age: ${userInfo.patientAge}
Medication: ${userInfo.medicineName}
Dosage: ${userInfo.dosage}
Reminder Time: ${userInfo.reminderTime}
Doctor Name: ${userInfo.doctorName}
Treatment Section: ${userInfo.treatmentSection}
Meal Timings:
- Breakfast: ${userInfo.breakfastTime || 'Not specified'}
- Lunch: ${userInfo.lunchTime || 'Not specified'}
- Dinner: ${userInfo.dinnerTime || 'Not specified'}

Include:
1. 💊 Medication tips
2. 🍽️ Meal timing recommendations
3. 🏥 General health tips
4. ⚠️ Important reminders

Respond in HTML format for display on a webpage.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API error:", error);
        return `<p>⚠️ Sorry, I couldn’t fetch recommendations right now. Please try again later.</p>`;
    }
}

module.exports = getGeminiRecommendation;