// Form Manager Module - Handles multi-step form state and navigation

const FormManager = {
    currentStep: 1,
    totalSteps: 4,
    formData: {
        file: null,
        fileName: '',
        fileSize: 0,
        selectedSheet: null,
        selectedColumn: null,
        emailList: [],
        emailValidation: null,
        subject: '',
        body: '',
        emailResults: {
            success: [],
            failure: []
        }
    },
    
    /**
     * Initialize form manager
     */
    init() {
        this.currentStep = 1;
        this.updateStepIndicator();
    },
    
    /**
     * Show specific step
     * @param {number} step - Step number (1-4)
     */
    showStep(step) {
        if (step < 1 || step > this.totalSteps) {
            return;
        }
        
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.classList.add('d-none');
            }
        }
        
        // Show current step
        const currentStepElement = document.getElementById(`step${step}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('d-none');
        }
        
        this.currentStep = step;
        this.updateStepIndicator();
    },
    
    /**
     * Update step indicator in UI
     */
    updateStepIndicator() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });
    },
    
    /**
     * Store form data
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    storeData(key, value) {
        this.formData[key] = value;
        // Optionally save to localStorage for persistence
        try {
            localStorage.setItem('emailServiceData', JSON.stringify(this.formData));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    },
    
    /**
     * Get stored form data
     * @param {string} key - Data key
     * @returns {*} Stored value
     */
    getData(key) {
        return this.formData[key];
    },
    
    /**
     * Get all form data
     * @returns {Object} Complete form data
     */
    getAllData() {
        return this.formData;
    },
    
    /**
     * Validate current step
     * @param {number} step - Step number to validate
     * @returns {boolean} Validation result
     */
    validateStep(step) {
        switch (step) {
            case 1:
                return this.formData.file !== null;
            case 2:
                return this.formData.selectedColumn !== null && 
                       this.formData.emailValidation &&
                       this.formData.emailValidation.validCount > 0;
            case 3:
                return this.formData.subject.trim() !== '' && 
                       this.formData.body.trim() !== '';
            case 4:
                return true; // No validation needed for results step
            default:
                return false;
        }
    },
    
    /**
     * Reset form to initial state
     */
    resetForm() {
        this.formData = {
            file: null,
            fileName: '',
            fileSize: 0,
            selectedSheet: null,
            selectedColumn: null,
            emailList: [],
            emailValidation: null,
            subject: '',
            body: '',
            emailResults: {
                success: [],
                failure: []
            }
        };
        
        // Clear localStorage
        try {
            localStorage.removeItem('emailServiceData');
        } catch (e) {
            console.warn('Could not clear localStorage:', e);
        }
        
        // Reset UI elements (with null checks)
        const excelFile = document.getElementById('excelFile');
        if (excelFile) excelFile.value = '';
        
        const emailSubject = document.getElementById('emailSubject');
        if (emailSubject) emailSubject.value = '';
        
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) fileInfo.classList.add('d-none');
        
        const emailPreview = document.getElementById('emailPreview');
        if (emailPreview) emailPreview.classList.add('d-none');
        
        const columnList = document.getElementById('columnList');
        if (columnList) columnList.innerHTML = '';
        
        const sheetSelection = document.getElementById('sheetSelection');
        if (sheetSelection) sheetSelection.classList.add('d-none');
        
        const sheetSelect = document.getElementById('sheetSelect');
        if (sheetSelect) sheetSelect.innerHTML = '<option value="">-- Select Sheet --</option>';
        
        const nextToCompose = document.getElementById('nextToCompose');
        if (nextToCompose) nextToCompose.disabled = true;
        
        // Reset progress and results sections
        const progressSection = document.getElementById('progressSection');
        if (progressSection) progressSection.classList.remove('d-none');
        
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) resultsSection.classList.add('d-none');
        
        const progressText = document.getElementById('progressText');
        if (progressText) progressText.textContent = '0 / 0';
        
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }
        
        const successCount = document.getElementById('successCount');
        if (successCount) successCount.textContent = '0';
        
        const failureCount = document.getElementById('failureCount');
        if (failureCount) failureCount.textContent = '0';
        
        const totalCount = document.getElementById('totalCount');
        if (totalCount) totalCount.textContent = '0';
        
        // Reset Excel parser
        if (typeof ExcelParser !== 'undefined') {
            ExcelParser.reset();
        }
        
        // Reset email editor - use App.emailEditor
        if (typeof App !== 'undefined' && App.emailEditor) {
            App.emailEditor.setContents([]);
        }
        
        this.currentStep = 1;
        this.showStep(1);
    },
    
    /**
     * Go to next step
     */
    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < this.totalSteps) {
                this.showStep(this.currentStep + 1);
            }
        }
    },
    
    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }
};

