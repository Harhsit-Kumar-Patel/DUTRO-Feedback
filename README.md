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
  - **7 Pure Feedback Fields**:
    1. **Request Type \***: 3-option pill toggle (`Bug / Technical Issue`, `Feature Suggestion`, `General Feedback`)
    2. **Urgency Level \***: Dynamic slider (`Low`, `Medium`, `High / Urgent` - revealed when Bug is selected)
    3. **Request Title \***: Short text input
    4. **Category / Module \***: Dropdown (`Risk Landscape & Reports`, `Trust & Compliance`, `Discovery & RoPA`, `UI & Usability`, `Other`)
    5. **Description \***: Paragraph textarea with live character counter (`0 / 3000`)
    6. **Upload a Screenshot \***: Drag & drop zone, file browser, and direct clipboard image paste (`Ctrl/Cmd+V`) with canvas compression
    7. **Contact Email \***: Work email input with validation
  - Action buttons: `Clear` and `Submit Feedback` (with instant non-blocking background dispatch)
- **In-Page Confirmation State**:
  - Reference ticket code generation (e.g. `#DUT-6191`)
  - Full receipt summary
  - `Submit Another Request` action
- **Session Submissions Feed**:
  - Real-time logging of submissions completed during the user's active session

---

## 📊 Connected Google Spreadsheet & Webhook

- **Live Spreadsheet**: [DUTRO Feedbacks (Responses)](https://docs.google.com/spreadsheets/d/1MnCgjj6SRIufY-xm0ZJcGTblc1ygGvBMC7TizwRXXZQ/edit?gid=1229421619)
- **Google Apps Script Webhook Endpoint**:
  ```text
  https://script.google.com/macros/s/AKfycbx01XLd4B78f7WSmhKZ5lsk1BJdwoEt9oH5x9bwbaSTLXR2UlqUwvvtpiiStYe53Xp2/exec
  ```

---

## 🔗 Live Google Form Field & Entry Mapping

- **Connected Form**: `DUTRO Feedbacks`
- **Submission Action Endpoint**:
  ```text
  https://docs.google.com/forms/d/e/1FAIpQLSdMsHMk7VrC9x3g69zycRfnc_-C_tbXM0DDMDK2qvsZ1jk4JQ/formResponse
  ```

| Field on Portal | Question on Google Form | Form Entry ID |
| :--- | :--- | :--- |
| **Request Type** | `Request Type *` | `entry.252022971` |
| **Urgency Level** | `Urgency Level *` | `entry.887476383` |
| **Request Title** | `Request Title *` | `entry.420845531` |
| **Category / Module** | `Category / Module *` | `entry.2108787057` |
| **Description** | `Description *` | `entry.520592394` |
| **Upload a Screenshot** | `Upload a Screenshot *` | Custom Dropzone / Paste Uploader |
| **Contact Email** | `Contact Email *` | `entry.741137872` |

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
