const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const otpStorage = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/send-email-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.json({ success: false, message: "Please enter a valid email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = otp;

    const mailOptions = {
        from: '"NEXUS AI" <no-reply@nexus.ai>',
        to: email,
        subject: 'Your NEXUS AI Verification Code',
        text: `Your OTP for logging into NEXUS AI is: ${otp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        res.json({ success: false, message: "Failed to send email. Check Gmail credentials in .env" });
    }
});

app.post('/api/verify-otp', (req, res) => {
    const { identifier, otp } = req.body;
    if (otpStorage[identifier] && otpStorage[identifier] === otp) {
        delete otpStorage[identifier];
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Invalid or expired OTP!" });
    }
});

// AI Chat Route with latest Gemini 3.5 Flash model
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.json({ success: false, message: "Message is required." });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [message],
        });

        const replyText = response.text || "No response generated.";
        res.json({ success: true, reply: replyText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.json({ success: false, message: "Error communicating with AI server." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 NEXUS Server running on port ${PORT}`);
});