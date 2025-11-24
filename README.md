# SendGrid Email Service Frontend

A modern, user-friendly web application for sending bulk emails using SendGrid API. Upload an Excel file, select email column, compose your email, and send to multiple recipients with detailed success/failure reports.

## Features

- 📊 **Excel File Upload** - Support for .xlsx and .xls files with drag & drop
- 📧 **Email Column Selection** - Automatically detect and select email columns
- ✉️ **Rich Text Editor** - Compose beautiful HTML emails with Quill.js
- 📈 **Progress Tracking** - Real-time progress bar and statistics
- 📥 **Excel Reports** - Download success and failure reports as Excel files
- 🎨 **Modern UI** - Beautiful Bootstrap 5 interface with smooth animations
- ✅ **Email Validation** - Automatic validation of email addresses
- 🔄 **Batch Processing** - Smart batching to avoid API rate limits

## Project Structure

```
SendGrid/
├── index.html                 # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css         # Custom styles
│   └── js/
│       ├── app.js             # Main application logic
│       ├── excelParser.js     # Excel file parsing
│       ├── emailService.js    # SendGrid API integration
│       ├── formManager.js     # Form state management
│       └── reportGenerator.js # Excel report generation
├── config/
│   └── config.js              # Configuration file
└── README.md
```

## Setup Instructions

### 1. Get Email API Key

**Option A: SendGrid**
1. Sign up for a free SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Navigate to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key (you'll only see it once!)

**Option B: Brevo (formerly Sendinblue)**
1. Sign up for a free Brevo account at [brevo.com](https://brevo.com)
2. Navigate to Settings → SMTP & API
3. Create a new API key
4. Copy the API key (starts with `xkeysib-`)

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Email API Key (Brevo or SendGrid)
EMAIL_API_KEY=your_api_key_here

# From Email Address (must be verified in your email service)
FROM_EMAIL=info@theexcellenceservices.site

# From Name
FROM_NAME=The Excellence Services

# Server Port (optional, defaults to 3000)
PORT=3000
```

**Important:** 
- The `FROM_EMAIL` must be verified in your email service account
- Never commit the `.env` file to git (it's already in `.gitignore`)
- For production, use environment variables provided by your hosting platform

### 3. Run the Application Locally

You have several options to run the application:

#### Option 1: Using Python (Recommended - Easiest)

If you have Python installed:

1. Open terminal/command prompt in the project directory
2. Run one of these commands:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

3. Open your browser and go to: `http://localhost:8000`

#### Option 2: Using Node.js (npx serve)

If you have Node.js installed:

1. Open terminal/command prompt in the project directory
2. Run:
```bash
npx serve
```

3. The server will start and show you the URL (usually `http://localhost:3000`)

#### Option 3: Using PHP

If you have PHP installed:

1. Open terminal/command prompt in the project directory
2. Run:
```bash
php -S localhost:8000
```

3. Open your browser and go to: `http://localhost:8000`

#### Option 4: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The app will open automatically in your browser

#### Option 5: Direct File Open (May have limitations)

Simply double-click `index.html` to open in your browser.

**⚠️ Note:** Opening directly may have CORS issues when reading Excel files. Using a local server (Options 1-4) is recommended.

#### Quick Start Commands

**Windows (PowerShell):**
```powershell
cd D:\USIAD\SendGrid
python -m http.server 8000
```

**Mac/Linux:**
```bash
cd /path/to/SendGrid
python3 -m http.server 8000
```

Then open: **http://localhost:8000** in your browser

## Usage Guide

### Step 1: Upload Excel File
1. Click "Browse Files" or drag & drop an Excel file
2. Supported formats: .xlsx, .xls (Max 10MB)
3. The system will automatically parse the file

### Step 2: Select Email Column
1. If multiple sheets exist, select the desired sheet
2. Click on the column that contains email addresses
3. The system validates emails and shows a preview
4. Click "Next: Compose Email"

### Step 3: Compose Email
1. Enter the email subject
2. Use the rich text editor to compose your email body
3. Review the recipient count
4. Click "Send Emails"

### Step 4: Send & Download Reports
1. Watch the progress bar as emails are sent
2. View real-time success/failure statistics
3. After completion, download:
   - **Success Report** - Excel file with all successful sends
   - **Failure Report** - Excel file with all failed attempts and error details

## Excel File Format

Your Excel file should have:
- First row as headers (column names)
- At least one column containing email addresses
- Example structure:

| Name | Email | Company |
|------|-------|---------|
| John | john@example.com | ABC Corp |
| Jane | jane@example.com | XYZ Inc |

## Report Format

### Success Report Columns:
- Email Address
- Subject
- Sent Date/Time
- Status
- Message ID

### Failure Report Columns:
- Email Address
- Subject
- Attempt Date/Time
- Status
- Error Message
- Error Code

## Configuration Options

Edit `config/config.js` to customize:

- **Batch Size**: Number of emails per batch (default: 10)
- **Delay Between Batches**: Milliseconds (default: 1000)
- **Max File Size**: Maximum upload size (default: 10MB)
- **Date Format**: Report timestamp format

## Deployment to Vercel

### Prerequisites
- A Vercel account ([vercel.com](https://vercel.com))
- Your email API key (SendGrid or Brevo)
- Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect the project settings

3. **Configure Environment Variables**
   - In your Vercel project dashboard, go to Settings → Environment Variables
   - Add the following variables:
     ```
     EMAIL_API_KEY=your_api_key_here
     FROM_EMAIL=info@theexcellenceservices.site
     FROM_NAME=The Excellence Services
     ```
   - Make sure to add them for **Production**, **Preview**, and **Development** environments

4. **Deploy**
   - Click "Deploy" (or push to your main branch to trigger auto-deployment)
   - Wait for the deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

### Vercel Configuration

The project includes a `vercel.json` file that configures:
- API routes to use the Node.js server
- Static file serving for the frontend
- Production environment settings

### Post-Deployment

After deployment, test your API endpoint:
- Health check: `https://your-project.vercel.app/api/health`
- Email API: `https://your-project.vercel.app/api/send-email`

## Security Note

✅ **Secure Implementation:**

This application uses a secure backend proxy pattern:
- API keys are stored as environment variables (never in code)
- Frontend calls the backend API endpoint
- Backend securely handles the email service API calls
- No API keys are exposed to the client

**For Production:**
- Always use environment variables for sensitive data
- Never commit `.env` files to git
- Use your hosting platform's environment variable management

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari
- Opera

## Dependencies (Loaded via CDN)

- Bootstrap 5.3.2
- Quill.js 1.3.6 (Rich text editor)
- SheetJS (xlsx.js) 0.18.5
- Font Awesome 6.4.0

## Troubleshooting

### "Failed to parse Excel file"
- Ensure the file is a valid .xlsx or .xls format
- Check that the file is not corrupted
- Try opening it in Excel first

### "No valid email addresses found"
- Check that the selected column contains email addresses
- Ensure emails are in valid format (user@domain.com)
- Remove any empty rows

### "API connection failed"
- Verify your SendGrid API key is correct
- Check that the `fromEmail` is verified in SendGrid
- Ensure you have internet connectivity
- Check browser console for CORS errors (may need backend proxy)

### "Rate limit exceeded"
- Reduce batch size in config
- Increase delay between batches
- Wait a few minutes and try again

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify SendGrid API key and configuration
3. Ensure all dependencies are loaded correctly

---

**Happy Emailing! 📧**

