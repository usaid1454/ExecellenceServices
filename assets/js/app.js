// Main Application - Coordinates all modules and handles UI interactions

const App = {
    emailEditor: null,
    
    /**
     * Initialize application
     */
    init() {
        this.initializeEmailEditor();
        this.setupEventListeners();
        FormManager.init();
        this.showToast('Application loaded successfully', 'success');
    },
    
    /**
     * Initialize Quill rich text editor
     */
    initializeEmailEditor() {
        this.emailEditor = new Quill('#emailEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link'],
                    ['clean']
                ]
            }
        });
    },
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // File upload
        const excelFileInput = document.getElementById('excelFile');
        const uploadArea = document.getElementById('uploadArea');
        
        excelFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: files } });
            }
        });
        
        // Navigation buttons
        document.getElementById('nextToCompose')?.addEventListener('click', () => {
            if (FormManager.validateStep(2)) {
                FormManager.showStep(3);
                this.updateRecipientCount();
            }
        });
        
        document.getElementById('backToUpload')?.addEventListener('click', () => {
            FormManager.showStep(1);
        });
        
        document.getElementById('backToColumn')?.addEventListener('click', () => {
            FormManager.showStep(2);
        });
        
        // Send emails
        document.getElementById('sendEmails')?.addEventListener('click', () => {
            this.handleSendEmails();
        });
        
        // Sheet selection
        document.getElementById('sheetSelect')?.addEventListener('change', (e) => {
            this.handleSheetSelect(e.target.value);
        });
        
        // Start over
        document.getElementById('startOver')?.addEventListener('click', () => {
            FormManager.resetForm();
            EmailService.reset();
            this.showToast('Form reset. You can start a new batch.', 'info');
        });
        
        // Download reports
        document.getElementById('downloadSuccess')?.addEventListener('click', () => {
            const successList = EmailService.getSuccessList();
            ReportGenerator.downloadSuccessReport(successList);
        });
        
        document.getElementById('downloadFailure')?.addEventListener('click', () => {
            const failureList = EmailService.getFailureList();
            ReportGenerator.downloadFailureReport(failureList);
        });
    },
    
    /**
     * Handle file selection
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }
        
        try {
            this.showToast('Parsing Excel file...', 'info');
            
            // Store file info
            FormManager.storeData('file', file);
            FormManager.storeData('fileName', file.name);
            FormManager.storeData('fileSize', file.size);
            
            // Display file info
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
            document.getElementById('fileInfo').classList.remove('d-none');
            
            // Parse Excel
            await ExcelParser.parseExcelFile(file);
            
            // Get sheets
            const sheets = ExcelParser.getSheets();
            
            if (sheets.length === 0) {
                throw new Error('No sheets found in Excel file');
            }
            
            // If multiple sheets, show sheet selector
            if (sheets.length > 1) {
                const sheetSelect = document.getElementById('sheetSelect');
                sheetSelect.innerHTML = '<option value="">-- Select Sheet --</option>';
                sheets.forEach(sheet => {
                    const option = document.createElement('option');
                    option.value = sheet;
                    option.textContent = sheet;
                    sheetSelect.appendChild(option);
                });
                document.getElementById('sheetSelection').classList.remove('d-none');
                FormManager.storeData('selectedSheet', sheets[0]);
                this.handleSheetSelect(sheets[0]);
            } else {
                // Single sheet, proceed directly
                FormManager.storeData('selectedSheet', sheets[0]);
                this.handleSheetSelect(sheets[0]);
            }
            
            // Move to step 2
            FormManager.showStep(2);
            this.showToast('Excel file parsed successfully', 'success');
            
        } catch (error) {
            this.showToast('Error parsing file: ' + error.message, 'error');
            console.error('File parsing error:', error);
        }
    },
    
    /**
     * Validate uploaded file
     */
    validateFile(file) {
        // Check file size
        if (file.size > Config.upload.maxFileSize) {
            this.showToast(`File too large. Maximum size: ${this.formatFileSize(Config.upload.maxFileSize)}`, 'error');
            return false;
        }
        
        // Check file extension
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!Config.upload.allowedTypes.includes(extension)) {
            this.showToast('Invalid file type. Please upload .xlsx or .xls files', 'error');
            return false;
        }
        
        return true;
    },
    
    /**
     * Handle sheet selection
     */
    handleSheetSelect(sheetName) {
        if (!sheetName) return;
        
        FormManager.storeData('selectedSheet', sheetName);
        const sheetData = ExcelParser.getSheetData(sheetName);
        
        if (!sheetData || sheetData.length === 0) {
            this.showToast('Selected sheet is empty', 'error');
            return;
        }
        
        // Get columns
        const columns = ExcelParser.getColumns(sheetData);
        
        // Display columns
        const columnList = document.getElementById('columnList');
        columnList.innerHTML = '';
        
        columns.forEach(column => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = column;
            item.addEventListener('click', () => this.handleColumnSelect(column));
            columnList.appendChild(item);
        });
        
        if (columns.length === 0) {
            columnList.innerHTML = '<div class="alert alert-warning">No columns found in this sheet</div>';
        }
    },
    
    /**
     * Handle column selection
     */
    handleColumnSelect(columnName) {
        // Remove previous selection
        document.querySelectorAll('#columnList .list-group-item').forEach(item => {
            item.classList.remove('selected');
            if (item.textContent === columnName) {
                item.classList.add('selected');
            }
        });
        
        FormManager.storeData('selectedColumn', columnName);
        
        // Get column data
        const columnData = ExcelParser.getColumnData(columnName);
        
        // Validate emails
        const validation = ExcelParser.validateEmails(columnData);
        FormManager.storeData('emailList', validation.valid);
        FormManager.storeData('emailValidation', validation);
        
        // Display validation results
        const emailPreview = document.getElementById('emailPreview');
        const emailCount = document.getElementById('emailCount');
        const emailSample = document.getElementById('emailSample');
        const nextButton = document.getElementById('nextToCompose');
        
        if (validation.validCount > 0) {
            emailCount.textContent = `${validation.validCount} valid email address${validation.validCount !== 1 ? 'es' : ''} found`;
            emailSample.textContent = validation.valid.slice(0, 10).join(', ') + 
                (validation.valid.length > 10 ? ` ... and ${validation.valid.length - 10} more` : '');
            emailPreview.classList.remove('d-none');
            nextButton.disabled = false;
            
            if (validation.invalidCount > 0) {
                this.showToast(`${validation.invalidCount} invalid email${validation.invalidCount !== 1 ? 's' : ''} will be skipped`, 'warning');
            }
        } else {
            emailPreview.classList.add('d-none');
            nextButton.disabled = true;
            this.showToast('No valid email addresses found in selected column', 'error');
        }
    },
    
    /**
     * Update recipient count display
     */
    updateRecipientCount() {
        const emailList = FormManager.getData('emailList');
        const count = emailList ? emailList.length : 0;
        document.getElementById('recipientCount').textContent = count;
    },
    
    /**
     * Handle send emails
     */
    async handleSendEmails() {
        // Validate form
        const subject = document.getElementById('emailSubject').value.trim();
        const body = this.emailEditor.root.innerHTML;
        
        if (!subject) {
            this.showToast('Please enter email subject', 'error');
            return;
        }
        
        if (!body || body === '<p><br></p>') {
            this.showToast('Please enter email body', 'error');
            return;
        }
        
        // Store form data
        FormManager.storeData('subject', subject);
        FormManager.storeData('body', body);
        
        // Get email list
        const emailList = FormManager.getData('emailList');
        
        if (!emailList || emailList.length === 0) {
            this.showToast('No email addresses to send', 'error');
            return;
        }
        
        // Confirm before sending
        if (!confirm(`Are you sure you want to send ${emailList.length} email(s)?`)) {
            return;
        }
        
        // Move to step 4
        FormManager.showStep(4);
        
        // Initialize progress
        this.updateProgress(0, emailList.length, 0, 0);
        document.getElementById('progressSection').classList.remove('d-none');
        document.getElementById('resultsSection').classList.add('d-none');
        
        // Disable send button
        const sendButton = document.getElementById('sendEmails');
        sendButton.disabled = true;
        sendButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
        
        try {
            // Send emails
            const results = await EmailService.sendBulkEmails(
                emailList,
                subject,
                body,
                (progress) => {
                    this.updateProgress(
                        progress.processed,
                        progress.total,
                        progress.success,
                        progress.failure
                    );
                }
            );
            
            // Store results
            FormManager.storeData('emailResults', results);
            
            // Show results
            this.showResults(results);
            
            this.showToast(`Email sending complete! ${results.successCount} successful, ${results.failureCount} failed`, 'success');
            
        } catch (error) {
            this.showToast('Error sending emails: ' + error.message, 'error');
            console.error('Send error:', error);
        } finally {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Emails';
        }
    },
    
    /**
     * Update progress display
     */
    updateProgress(processed, total, success, failure) {
        const percentage = total > 0 ? (processed / total) * 100 : 0;
        
        document.getElementById('progressText').textContent = `${processed} / ${total}`;
        document.getElementById('progressBar').style.width = `${percentage}%`;
        document.getElementById('progressBar').textContent = `${Math.round(percentage)}%`;
        
        document.getElementById('successCount').textContent = success;
        document.getElementById('failureCount').textContent = failure;
        document.getElementById('totalCount').textContent = total;
    },
    
    /**
     * Show results
     */
    showResults(results) {
        document.getElementById('progressSection').classList.add('d-none');
        document.getElementById('resultsSection').classList.remove('d-none');
        
        document.getElementById('finalSuccessCount').textContent = results.successCount;
        document.getElementById('finalFailureCount').textContent = results.failureCount;
        
        // Enable/disable download buttons
        document.getElementById('downloadSuccess').disabled = results.successCount === 0;
        document.getElementById('downloadFailure').disabled = results.failureCount === 0;
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toastTitle');
        const toastBody = document.getElementById('toastBody');
        
        // Set icon and color based on type
        const icons = {
            success: 'fa-check-circle text-success',
            error: 'fa-exclamation-circle text-danger',
            warning: 'fa-exclamation-triangle text-warning',
            info: 'fa-info-circle text-info'
        };
        
        toastTitle.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        toastBody.textContent = message;
        
        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

