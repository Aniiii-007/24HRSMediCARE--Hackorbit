// server.js
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z, number } = require('zod');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connection (){
   await mongoose.connect(process.env.MONGODB_URI);
console.log(process.env.MONGODB_URI);}

connection();


// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// User Info Schema
const userInfoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientAge:{type : Number , required:true},
    medicineName1:{ type : String, required:true},
    medicineName2:{type : String, required:true},
    medicineName3:{type : String, required:true},
    medicineName4:{type : String, required:true},
    treatmentSection:{ type : String, required:true},
    doctorName: { type: String, required: true },
    reminderTimeformedicine1: { type: String, required: true },
    reminderTimeformedicine2: { type: String, required: true },
    reminderTimeformedicine3: { type: String, required: true },
    reminderTimeformedicine4: { type: String, required: true },
    dosage: { type: String, required: true },
    breakfastTime: { type: String },
    lunchTime: { type: String },
    dinnerTime: { type: String },
    phoneNumber: { type: String, required: true },
    previousMedicines: { type: String },
    medicalConditions: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const UserInfo = mongoose.model('UserInfo', userInfoSchema);

// Zod Schemas for validation
const signupSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

const signinSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6)
});

const userInfoSchema_validation = z.object({
    patientName: z.string().min(1),
     phoneNumber: z.preprocess(
        (val) => (typeof val === "string" ? val.trim() : val),
        z.string().min(10)
    ),
    patientAge: z.preprocess(
    (val) => {
        if (typeof val === "string" && /^\d+$/.test(val.trim())) {
            return Number(val.trim());
        }
        if (typeof val === "number" && !isNaN(val)) {
            return val;
        }
        return undefined; // Reject invalid input
    },
    z.number().min(1, "Age must be at least 1").max(150, "Age must be less than 150")
),
    medicineName1: z.string().min(1),
    medicineName2: z.string().min(1),
    medicineName3: z.string().min(1),
    medicineName4: z.string().min(1),
    treatmentSection: z.string().min(1),
    doctorName: z.string().min(1),
    reminderTimeformedicine1: z.string(),
    reminderTimeformedicine2: z.string(),
    reminderTimeformedicine3: z.string(),
    reminderTimeformedicine4: z.string(),
    dosage: z.string().min(1),
    breakfastTime: z.string().optional(),
    lunchTime: z.string().optional(),
    dinnerTime: z.string().optional(),
    phoneNumber: z.string().min(10),
    previousMedicines: z.string().optional(),
    medicalConditions: z.string().optional()
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const validatedData = signupSchema.parse(req.body);
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { username: validatedData.username },
                { email: validatedData.email }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create user
        const user = new User({
            username: validatedData.username,
            email: validatedData.email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/auth/signin', async (req, res) => {
    try {
        const validatedData = signinSchema.parse(req.body);

        // Find user
        const user = await User.findOne({ username: validatedData.username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, message: 'Login successful' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// User Info Routes
app.post('/api/user/info', authenticateToken, async (req, res) => {
    try {
        const validatedData = userInfoSchema_validation.parse(req.body);

        // Check if user info already exists
        let userInfo = await UserInfo.findOne({ userId: req.user.userId });

        if (userInfo) {
            // Update existing info
            Object.assign(userInfo, validatedData);
            userInfo.updatedAt = new Date();
        } else {
            // Create new info
            userInfo = new UserInfo({
                userId: req.user.userId,
                ...validatedData
            });
        }

        await userInfo.save();

        res.json({ message: 'User information saved successfully', data: userInfo });
    } catch (error) {
        console.log(error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/user/info', authenticateToken, async (req, res) => {
    try {
        const userInfo = await UserInfo.findOne({ userId: req.user.userId });
        
        if (!userInfo) {
            return res.json({ message: 'No user information found', data: null });
        }

        res.json({ data: userInfo });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// AI Recommendation Route
app.get('/api/ai/recommendation', authenticateToken, async (req, res) => {
    try {
        const userInfo = await UserInfo.findOne({ userId: req.user.userId });
        
        if (!userInfo) {
            return res.status(400).json({ message: 'Please fill your medical information first' });
        }

        // Mock AI recommendation (replace with actual Gemini API call)
        const recommendation = generateMockRecommendation(userInfo);

        res.json({ recommendation });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mock AI recommendation function (replace with actual Gemini API)
function generateMockRecommendation(userInfo) {
    return `
        <h4>Personalized Health Recommendations for ${userInfo.patientName}</h4>
        <p><strong>Based on your medication:</strong> ${userInfo.medicineName1}</p>
        <p><strong>Based on your medication:</strong> ${userInfo.medicineName2}</p>
        <p><strong>Based on your medication:</strong> ${userInfo.medicineName3}</p>
        <p><strong>Based on your medication:</strong> ${userInfo.medicineName4}</p>
         ${userInfo.treatmentSection}
        <h5>💊 Medication Tips:</h5>
        <ul>
            <li>Take your medication at ${userInfo.reminderTimeformedicine1} consistently every day</li>
            <li>Take your medication at ${userInfo.reminderTimeformedicine2} consistently every day</li>
            <li>Take your medication at ${userInfo.reminderTimeformedicine3} consistently every day</li>
            <li>Take your medication at ${userInfo.reminderTimeformedicine4} consistently every day</li>
            <li>Follow the prescribed dosage: ${userInfo.dosage}</li>
            <li>Set up reminders to avoid missing doses</li>
        </ul>

        <h5>🍽️ Meal Timing Recommendations:</h5>
        <ul>
            <li>Breakfast: ${userInfo.breakfastTime || 'Not specified'}</li>
            <li>Lunch: ${userInfo.lunchTime || 'Not specified'}</li>
            <li>Dinner: ${userInfo.dinnerTime || 'Not specified'}</li>
        </ul>

        <h5>🏥 General Health Tips:</h5>
        <ul>
            <li>Maintain regular contact with Dr. ${userInfo.doctorName}</li>
            <li>Keep a medication diary to track effectiveness</li>
            <li>Stay hydrated and maintain a balanced diet</li>
            <li>Report any side effects to your healthcare provider</li>
        </ul>

        <h5>Important Reminders:</h5>
        <ul>
            <li>Never stop or change medication without consulting your doctor</li>
            <li>Keep emergency contact information readily available</li>
            <li>Schedule regular check-ups as recommended</li>
        </ul>
    `;
}

// SMS Notification Route (Mock implementation)
app.post('/api/notifications/sms', authenticateToken, async (req, res) => {
    try {
        const userInfo = await UserInfo.findOne({ userId: req.user.userId });
        
        if (!userInfo) {
            return res.status(400).json({ message: 'User information not found' });
        }

        // Mock SMS sending (implement with Twilio or similar service)
        console.log(`Reminder SMS to ${userInfo.phoneNumber}: 
Take ${userInfo.medicineName1}, ${userInfo.medicineName2}, ${userInfo.medicineName3}, ${userInfo.medicineName4}`);

        res.json({ message: 'SMS notification sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Cron job for medication reminders (implement with node-cron)
const cron = require('node-cron');

// Schedule task to run every minute to check for medication reminders
cron.schedule('* * * * *', async () => {
    try {
        const currentTime = new Date().toTimeString().slice(0, 5);
        
        // Find all users with reminder time matching current time
        const usersWithReminders = await UserInfo.find({
    $or: [
        { reminderTimeformedicine1: currentTime },
        { reminderTimeformedicine2: currentTime },
        { reminderTimeformedicine3: currentTime },
        { reminderTimeformedicine4: currentTime }
    ]
});

        for (const userInfo of usersWithReminders) {
            // Send SMS reminder (mock implementation)
            console.log(`Reminder: ${userInfo.patientName} should take ${userInfo.medicineName} (${userInfo.dosage})`);
            // Implement actual SMS sending here
        }
    } catch (error) {
        console.error('Error in medication reminder cron job:', error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = app;