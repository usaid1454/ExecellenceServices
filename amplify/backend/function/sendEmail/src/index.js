// AWS Lambda function for sending emails via Brevo/SendGrid
// This replaces the Express server endpoint for Amplify deployment

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    const method = event.requestContext?.http?.method || event.httpMethod || event.requestContext?.httpMethod;
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: ''
        };
    }

    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { toEmail, subject, body: emailBody } = body;

        // Validate input
        if (!toEmail || !subject || !emailBody) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: toEmail, subject, and body are required'
                })
            };
        }

        // Get environment variables
        const API_KEY = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || process.env.BREVO_API_KEY;
        const FROM_EMAIL = process.env.FROM_EMAIL || 'info@theexcellenceservices.site';
        const FROM_NAME = process.env.FROM_NAME || 'The Excellence Services';

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Email API key not configured'
                })
            };
        }

        // Detect API provider
        const isBrevoKey = API_KEY.startsWith('xkeysib-');
        const API_URL = isBrevoKey 
            ? 'https://api.brevo.com/v3/smtp/email'
            : 'https://api.sendgrid.com/v3/mail/send';

        let emailData;
        let apiHeaders;

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
            apiHeaders = {
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
            apiHeaders = {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            };
        }

        // Send email via API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            const responseData = await response.json().catch(() => ({}));
            const messageId = response.headers.get('x-message-id') 
                || responseData.messageId 
                || `${isBrevoKey ? 'brevo' : 'sg'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    email: toEmail,
                    subject: subject,
                    sentAt: new Date().toISOString(),
                    messageId: messageId
                })
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message 
                || errorData.errors?.[0]?.message 
                || errorData.error 
                || `HTTP ${response.status}: ${response.statusText}`;
            
            return {
                statusCode: response.status,
                headers: headers,
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
            headers: headers,
            body: JSON.stringify({
                success: false,
                email: event.body?.toEmail || 'unknown',
                subject: event.body?.subject || 'unknown',
                attemptedAt: new Date().toISOString(),
                errorMessage: error.message || 'Internal server error',
                errorCode: 'SERVER_ERROR'
            })
        };
    }
};

