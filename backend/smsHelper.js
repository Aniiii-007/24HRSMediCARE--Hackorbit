const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendMedicineSMS(to, medicineName, dosage) {
    try {
        const message = await client.messages.create({
            body: `💊 Reminder: Take your medicine "${medicineName}" (Dosage: ${dosage}) now.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`✅ SMS sent to ${to}: ${message.sid}`);
    } catch (error) {
        console.error(`❌ Failed to send SMS to ${to}:`, error);
    }
}

module.exports = sendMedicineSMS;