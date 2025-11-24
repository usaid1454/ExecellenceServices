// Email Service Module - Handles SendGrid API integration

const EmailService = {
    results: {
        success: [],
        failure: []
    },
    
    /**
     * Send single email via backend API (which proxies to SendGrid)
     * @param {string} toEmail - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} body - Email body (HTML)
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(toEmail, subject, body) {
        // Use backend API endpoint to avoid CORS issues
        // The backend will proxy the request to SendGrid
        // Ensure no trailing slash to prevent 301 redirects
        let backendApiUrl = Config.backend?.apiUrl || '/api/send-email';
        // Remove trailing slash if present
        backendApiUrl = backendApiUrl.replace(/\/$/, '');
        
        try {
            const response = await fetch(backendApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    toEmail: toEmail,
                    subject: subject,
                    body: body
                })
            });
            
            const result = await response.json();
            
            // Convert sentAt/attemptedAt strings back to Date objects if needed
            if (result.sentAt) {
                result.sentAt = new Date(result.sentAt);
            }
            if (result.attemptedAt) {
                result.attemptedAt = new Date(result.attemptedAt);
            }
            
            return result;
        } catch (error) {
            return {
                success: false,
                email: toEmail,
                subject: subject,
                attemptedAt: new Date(),
                errorMessage: error.message || 'Network error or API connection failed',
                errorCode: 'NETWORK_ERROR'
            };
        }
    },
    
    /**
     * Send bulk emails with batching and progress tracking
     * @param {Array<string>} emailList - Array of email addresses
     * @param {string} subject - Email subject
     * @param {string} body - Email body (HTML)
     * @param {Function} progressCallback - Callback function for progress updates
     * @returns {Promise<Object>} Complete results
     */
    async sendBulkEmails(emailList, subject, body, progressCallback) {
        this.results = {
            success: [],
            failure: []
        };
        
        const total = emailList.length;
        const batchSize = Config.email.batchSize || 10;
        const delay = Config.email.delayBetweenBatches || 1000;
        
        // Process emails in batches
        for (let i = 0; i < emailList.length; i += batchSize) {
            const batch = emailList.slice(i, i + batchSize);
            const batchPromises = batch.map(email => this.sendEmail(email, subject, body));
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Categorize results
            batchResults.forEach(result => {
                if (result.success) {
                    this.results.success.push(result);
                } else {
                    this.results.failure.push(result);
                }
            });
            
            // Update progress
            const processed = Math.min(i + batchSize, total);
            if (progressCallback) {
                progressCallback({
                    processed: processed,
                    total: total,
                    success: this.results.success.length,
                    failure: this.results.failure.length
                });
            }
            
            // Delay between batches (except for last batch)
            if (i + batchSize < emailList.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return {
            success: this.results.success,
            failure: this.results.failure,
            total: total,
            successCount: this.results.success.length,
            failureCount: this.results.failure.length
        };
    },
    
    /**
     * Get success list
     * @returns {Array} Array of successful email results
     */
    getSuccessList() {
        return this.results.success;
    },
    
    /**
     * Get failure list
     * @returns {Array} Array of failed email results
     */
    getFailureList() {
        return this.results.failure;
    },
    
    /**
     * Get summary statistics
     * @returns {Object} Summary object
     */
    getSummary() {
        return {
            total: this.results.success.length + this.results.failure.length,
            success: this.results.success.length,
            failure: this.results.failure.length,
            successRate: this.results.success.length / (this.results.success.length + this.results.failure.length) * 100 || 0
        };
    },
    
    /**
     * Reset results
     */
    reset() {
        this.results = {
            success: [],
            failure: []
        };
    }
};

