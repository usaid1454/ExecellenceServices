// Report Generator Module - Generates Excel reports for success and failure

const ReportGenerator = {
    /**
     * Generate Success Report Excel file
     * @param {Array} successfulEmails - Array of successful email objects
     * @returns {Blob} Excel file blob
     */
    generateSuccessReport(successfulEmails) {
        const reportData = successfulEmails.map(email => ({
            'Email Address': email.email,
            'Subject': email.subject,
            'Sent Date/Time': this.formatTimestamp(email.sentAt),
            'Status': 'Success',
            'Message ID': email.messageId || 'N/A'
        }));
        
        return this.createExcelFile(reportData, 'Success Report');
    },
    
    /**
     * Generate Failure Report Excel file
     * @param {Array} failedEmails - Array of failed email objects
     * @returns {Blob} Excel file blob
     */
    generateFailureReport(failedEmails) {
        const reportData = failedEmails.map(email => ({
            'Email Address': email.email,
            'Subject': email.subject,
            'Attempt Date/Time': this.formatTimestamp(email.attemptedAt),
            'Status': 'Failed',
            'Error Message': email.errorMessage || 'Unknown error',
            'Error Code': email.errorCode || 'N/A'
        }));
        
        return this.createExcelFile(reportData, 'Failure Report');
    },
    
    /**
     * Create Excel file from data
     * @param {Array} data - Array of objects to convert to Excel
     * @param {string} sheetName - Name of the Excel sheet
     * @returns {Blob} Excel file blob
     */
    createExcelFile(data, sheetName) {
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert JSON to worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, 20)
        }));
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },
    
    /**
     * Download Excel file
     * @param {Blob} blob - Excel file blob
     * @param {string} filename - Filename for download
     */
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.sanitizeFilename(filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
    
    /**
     * Format timestamp for reports
     * @param {Date|string} date - Date object or string
     * @returns {string} Formatted date string
     */
    formatTimestamp(date) {
        if (!date) {
            return new Date().toLocaleString();
        }
        
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return new Date().toLocaleString();
        }
        
        // Format: YYYY-MM-DD HH:mm:ss
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    /**
     * Sanitize filename to ensure it's valid
     * @param {string} filename - Original filename
     * @returns {string} Sanitized filename
     */
    sanitizeFilename(filename) {
        // Remove invalid characters and add timestamp if needed
        let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        // Add timestamp if configured
        if (Config && Config.report && Config.report.includeTimestamp) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const extension = sanitized.includes('.') ? sanitized.split('.').pop() : 'xlsx';
            const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, '');
            sanitized = `${nameWithoutExt}_${timestamp}.${extension}`;
        }
        
        // Ensure .xlsx extension
        if (!sanitized.endsWith('.xlsx')) {
            sanitized += '.xlsx';
        }
        
        return sanitized;
    },
    
    /**
     * Generate and download success report
     * @param {Array} successfulEmails - Array of successful email objects
     */
    downloadSuccessReport(successfulEmails) {
        if (!successfulEmails || successfulEmails.length === 0) {
            this.showNotification('No successful emails to download', 'warning');
            return;
        }
        
        const blob = this.generateSuccessReport(successfulEmails);
        const filename = 'email_success_report';
        this.downloadFile(blob, filename);
        this.showNotification(`Success report downloaded (${successfulEmails.length} emails)`, 'success');
    },
    
    /**
     * Generate and download failure report
     * @param {Array} failedEmails - Array of failed email objects
     */
    downloadFailureReport(failedEmails) {
        if (!failedEmails || failedEmails.length === 0) {
            this.showNotification('No failed emails to download', 'warning');
            return;
        }
        
        const blob = this.generateFailureReport(failedEmails);
        const filename = 'email_failure_report';
        this.downloadFile(blob, filename);
        this.showNotification(`Failure report downloaded (${failedEmails.length} emails)`, 'success');
    },
    
    /**
     * Show notification toast
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // This will be handled by the main app.js
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(message, type);
        }
    }
};

