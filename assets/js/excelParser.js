// Excel Parser Module - Handles Excel file parsing and data extraction

const ExcelParser = {
    workbook: null,
    currentSheet: null,
    sheetData: null,
    
    /**
     * Parse Excel file
     * @param {File} file - Excel file object
     * @returns {Promise<Object>} Parsed workbook data
     */
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    resolve(this.workbook);
                } catch (error) {
                    reject(new Error('Failed to parse Excel file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    },
    
    /**
     * Get list of sheet names
     * @returns {Array<string>} Array of sheet names
     */
    getSheets() {
        if (!this.workbook) {
            return [];
        }
        return this.workbook.SheetNames;
    },
    
    /**
     * Get data from a specific sheet
     * @param {string} sheetName - Name of the sheet
     * @returns {Object} Sheet data
     */
    getSheetData(sheetName) {
        if (!this.workbook || !sheetName) {
            return null;
        }
        
        const worksheet = this.workbook.Sheets[sheetName];
        if (!worksheet) {
            return null;
        }
        
        this.currentSheet = sheetName;
        this.sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        return this.sheetData;
    },
    
    /**
     * Extract column headers (first row)
     * @param {Array} sheetData - Sheet data array
     * @returns {Array<string>} Column headers
     */
    getColumns(sheetData) {
        if (!sheetData || sheetData.length === 0) {
            return [];
        }
        
        // First row contains headers
        const headers = sheetData[0];
        return headers.filter(header => header && header.toString().trim() !== '');
    },
    
    /**
     * Get data from a specific column
     * @param {string} columnName - Name of the column
     * @returns {Array} Column data (excluding header)
     */
    getColumnData(columnName) {
        if (!this.sheetData || !columnName) {
            return [];
        }
        
        const headers = this.sheetData[0];
        const columnIndex = headers.findIndex(h => h === columnName);
        
        if (columnIndex === -1) {
            return [];
        }
        
        // Extract column data (skip header row)
        const columnData = [];
        for (let i = 1; i < this.sheetData.length; i++) {
            const value = this.sheetData[i][columnIndex];
            if (value !== undefined && value !== null && value !== '') {
                columnData.push(value.toString().trim());
            }
        }
        
        return columnData;
    },
    
    /**
     * Validate email addresses
     * @param {Array<string>} emails - Array of email addresses
     * @returns {Object} Validation result with valid and invalid emails
     */
    validateEmails(emails) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = [];
        const invalid = [];
        
        emails.forEach((email, index) => {
            if (emailRegex.test(email)) {
                valid.push(email);
            } else {
                invalid.push({
                    email: email,
                    row: index + 2, // +2 because index starts at 0 and we skip header
                    reason: 'Invalid email format'
                });
            }
        });
        
        // Remove duplicates
        const uniqueValid = [...new Set(valid)];
        
        return {
            valid: uniqueValid,
            invalid: invalid,
            total: emails.length,
            validCount: uniqueValid.length,
            invalidCount: invalid.length
        };
    },
    
    /**
     * Reset parser state
     */
    reset() {
        this.workbook = null;
        this.currentSheet = null;
        this.sheetData = null;
    }
};

