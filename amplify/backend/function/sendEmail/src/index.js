// AWS Lambda function handler for email API (Amplify)
// This replaces the Express server for Amplify deployment

const https = require('https');

// Email API Configuration from environment variables
const API_KEY = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@theexcellenceservices.site';
const FROM_NAME = process.env.FROM_NAME || 'The Excellence Services';

// Detect API provider
const isBrevoKey = API_KEY && API_KEY.startsWith('xkeysib-');
const API_URL = isBrevoKey 
    ? 'https://api.brevo.com/v3/smtp/email'
    : (process.env.EMAIL_API_URL || process.env.SENDGRID_API_URL || 'https://api.sendgrid.com/v3/mail/send');

// Helper function to make HTTP requests
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: options.method || 'POST',
            headers: options.headers || {}
        };

        const req = https.request(requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Main Lambda handler for Amplify
exports.handler = async (event) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Handle both Amplify and API Gateway event formats
    const path = (event.requestContext && event.requestContext.http && event.requestContext.http.path) 
        || (event.path || '');
    const method = (event.requestContext && event.requestContext.http && event.requestContext.http.method)
        || (event.httpMethod || 'GET');
    const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};

    // Health check endpoint
    if ((path === '/api/health' || path === '/health') && method === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'ok', message: 'Email service is running' })
        };
    }

    // Send email endpoint
    if ((path === '/api/send-email' || path === '/send-email') && method === 'POST') {
        try {
            if (!API_KEY) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Email API key not configured. Please set EMAIL_API_KEY, SENDGRID_API_KEY, or BREVO_API_KEY environment variable.'
                    })
                };
            }

            const { toEmail, subject, body: emailBody } = body;

            // Validate input
            if (!toEmail || !subject || !emailBody) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Missing required fields: toEmail, subject, and body are required'
                    })
                };
            }

            let emailData;
            let requestHeaders;

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
                    htmlContent: emailBody
                };
                requestHeaders = {
                    'api-key': API_KEY,
                    'Content-Type': 'application/json'
                };
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
                        value: emailBody
                    }]
                };
                requestHeaders = {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                };
            }

            // Send email via API
            const response = await makeRequest(API_URL, {
                method: 'POST',
                headers: requestHeaders
            }, emailData);

            if (response.status >= 200 && response.status < 300) {
                const responseData = JSON.parse(response.body || '{}');
                const messageId = response.headers['x-message-id'] 
                    || responseData.messageId 
                    || `${isBrevoKey ? 'brevo' : 'sg'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        email: toEmail,
                        subject: subject,
                        sentAt: new Date().toISOString(),
                        messageId: messageId
                    })
                };
            } else {
                const errorData = JSON.parse(response.body || '{}');
                const errorMessage = errorData.message 
                    || errorData.errors?.[0]?.message 
                    || errorData.error 
                    || `HTTP ${response.status}`;
                
                return {
                    statusCode: response.status,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        email: toEmail,
                        subject: subject,
                        attemptedAt: new Date().toISOString(),
                        errorMessage: errorMessage,
                        errorCode: response.status.toString()
                    })
                };
            }
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    email: body.toEmail,
                    subject: body.subject,
                    attemptedAt: new Date().toISOString(),
                    errorMessage: error.message || 'Internal server error',
                    errorCode: 'SERVER_ERROR'
                })
            };
        }
    }

    // 404 for unknown routes
    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Not found', path: path })
    };
};
