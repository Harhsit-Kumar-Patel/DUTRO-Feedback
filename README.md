# DUTRO Help, Feedback & Troubleshooting Portal

A clean, modern, and responsive single-page web portal designed to match the **DUTRO Platform** design system, connected directly to your Google Form (**DUTRO Feedbacks**) and its linked Google Spreadsheet.

---

## 📸 Clean & Focused Architecture

All unrelated dummy platform navigation and mock assessment cards have been removed, keeping **exclusively the feedback-related options**:

- **Top Navigation Bar**:
  - `dutro` brand mark with blue accent dot
  - `Help & Feedback Portal` badge
  - Theme Switcher (🌙 Dark Mode / ☀️ Light Mode)
- **Feedback & Troubleshooting Card**:
  - Focused, centered enterprise card layout (`max-width: 780px`)
  - **8 Pure Feedback Fields**:
    1. **Consultant Name \***: Short text input
    2. **Company Name \***: Short text input
    3. **Request Type \***: 3-option pill toggle (`Bug / Technical Issue`, `Feature Suggestion`, `General Feedback`)
    4. **Urgency Level \***: Dynamic selector (`Low`, `Medium`, `High / Urgent` - revealed when Bug is selected)
    5. **Request Title \***: Short text input
    6. **Category / Module \***: Dropdown with 14 module options (Company Profile, Global Framework, Dashboard, Data Lineage, Workspace, Discovery, Vendors, Evidence Bank, Gap Analysis, Reports, Compliance Log, Regulatory Intelligence, Cookie Consent, Universal Consent)
    7. **Description \***: Paragraph textarea with live character counter (`0 / 3000`)
    8. **Upload a Screenshot \***: Multi-file drag & drop zone, file browser, and direct clipboard image paste (`Ctrl/Cmd+V`) for **up to 10 screenshots** with individual remove controls and auto-compression
  - Action buttons: `Clear` and `Submit Feedback` (with instant non-blocking background dispatch)
- **In-Page Confirmation State**:
  - Reference ticket code generation (e.g. `#DUT-6191`)
  - Full receipt summary with Consultant Name, Company Name, and attached screenshot count
  - `Submit Another Request` action
- **Session Submissions Feed**:
  - Real-time logging of submissions completed during the user's active session

---

## 📊 Connected Google Spreadsheet & Webhook

- **Live Spreadsheet**: [DUTRO Feedbacks (Responses)](https://docs.google.com/spreadsheets/d/1MnCgjj6SRIufY-xm0ZJcGTblc1ygGvBMC7TizwRXXZQ/edit?gid=1229421619)
- **Google Apps Script Webhook Endpoint**:
  ```text
  https://script.google.com/macros/s/AKfycbxJtwoZh6mZ9AaQTfmuOYof09wFx-CRNR_lHJmXtt_yR0HHnmXJL8-Oyo1Tz7tstk3v/exec
  ```

---

## 🔗 Field & Column Mapping (Columns A through J)

| Column | Header on Sheet | Field on Portal | Format |
| :--- | :--- | :--- | :--- |
| **A** | `Timestamp` | Generated dynamically | Datetime |
| **B** | `Consultant Name` | `Consultant Name *` | Text |
| **C** | `Company Name` | `Company Name *` | Text |
| **D** | `Request Type` | `Request Type *` | Multiple choice |
| **E** | `Urgency Level` | `Urgency Level *` | Multiple choice (or N/A) |
| **F** | `Request Title` | `Request Title *` | Text |
| **G** | `Category / Module` | `Category / Module *` | 14 Module Dropdown |
| **H** | `Description` | `Description *` | Paragraph text |
| **I** | `Upload a Screenshot` | `Upload a Screenshot *` | Comma-separated Drive URLs (up to 10) |
| **J** | `Screenshot Preview` | Generated dynamically | `=IMAGE("https://drive.google.com/thumbnail?id=...&sz=w1000", 1)` |

---

## 🚀 How to Run Locally

You can open `index.html` directly in any web browser:
```bash
open index.html
```
Or serve it via local HTTP server:
```bash
python3 -m http.server 4242
```
And navigate to `http://localhost:4242`.
