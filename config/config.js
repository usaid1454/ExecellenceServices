// Configuration for SendGrid Email Service

const Config = {
    // SendGrid API Configuration
    sendGrid: {
        // API Key - IMPORTANT: Never expose API keys in frontend code
        // API key is handled by backend server using environment variables
        apiKey: '', // Not used in frontend - handled by backend
        
        // SendGrid API Endpoint
        apiUrl: 'https://api.sendgrid.com/v3/mail/send',
        
        // From email (must be verified in SendGrid/Brevo)
        fromEmail: 'info@theexcellenceservices.site',
        fromName: 'The Excellence Services'
    },
    
    // File Upload Configuration
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
        allowedTypes: ['.xlsx', '.xls'],
        allowedMimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ]
    },
    
    // Email Configuration
    email: {
        batchSize: 10, // Number of emails to send per batch (to avoid rate limits)
        delayBetweenBatches: 1000 // Delay in milliseconds between batches
    },
    
    // Report Configuration
    report: {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        includeTimestamp: true
    },
    
    // Backend API Configuration (for CORS-free email sending)
    backend: {
        // Backend API URL - defaults to relative path when served from same server
        // For production, set this to your deployed backend URL
        apiUrl: '/api/send-email' // Change to full URL if backend is on different domain
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}

