// Backend Server for Email Service (Brevo/SendGrid compatible)
// This server acts as a proxy to avoid CORS issues

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Email API Configuration
// IMPORTANT: Set these as environment variables in production
const API_KEY = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@theexcellenceservices.site';
const FROM_NAME = process.env.FROM_NAME || 'The Excellence Services';

// Validate required environment variables
if (!API_KEY) {
    console.error('ERROR: EMAIL_API_KEY, SENDGRID_API_KEY, or BREVO_API_KEY environment variable is required');
    console.error('Please set one of these environment variables before starting the server');
    process.exit(1);
}

// Detect API provider based on API key format
const isBrevoKey = API_KEY.startsWith('xkeysib-');
const API_URL = isBrevoKey 
    ? 'https://api.brevo.com/v3/smtp/email'
    : (process.env.EMAIL_API_URL || process.env.SENDGRID_API_URL || 'https://api.sendgrid.com/v3/mail/send');

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { toEmail, subject, body } = req.body;

        // Validate input
        if (!toEmail || !subject || !body) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: toEmail, subject, and body are required'
            });
        }

        let emailData;
        let headers;

        if (isBrevoKey) {
            // Brevo API format
            emailData = {
                sender: {
                    email: FROM_EMAIL,
                    name: FROM_NAME
                },
                to: [{
                    email: toEmail
                }],
                subject: subject,
                htmlContent: body
            };
            headers = {
                'api-key': API_KEY,
                'Content-Type': 'application/json'
            };
            
            // Brevo API format
        } else {
            // SendGrid API format
            emailData = {
                personalizations: [{
                    to: [{ email: toEmail }]
                }],
                from: {
                    email: FROM_EMAIL,
                    name: FROM_NAME
                },
                subject: subject,
                content: [{
                    type: 'text/html',
                    value: body
                }]
            };
            headers = {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            };
        }

        // Send email via API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            const responseData = await response.json().catch(() => ({}));
            const messageId = response.headers.get('x-message-id') 
                || responseData.messageId 
                || `${isBrevoKey ? 'brevo' : 'sg'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            res.json({
                success: true,
                email: toEmail,
                subject: subject,
                sentAt: new Date().toISOString(),
                messageId: messageId
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message 
                || errorData.errors?.[0]?.message 
                || errorData.error 
                || `HTTP ${response.status}: ${response.statusText}`;
            
            res.status(response.status).json({
                success: false,
                email: toEmail,
                subject: subject,
                attemptedAt: new Date().toISOString(),
                errorMessage: errorMessage,
                errorCode: response.status.toString()
            });
        }
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            email: req.body.toEmail,
            subject: req.body.subject,
            attemptedAt: new Date().toISOString(),
            errorMessage: error.message || 'Internal server error',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Email service is running' });
});

// Start server
app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Email service API available at http://localhost:${PORT}/api/send-email`);
    }
});

