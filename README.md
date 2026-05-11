# Automated Personnel Requisition System (PRF)
### Enderun Colleges — Human Resources Department

An end-to-end **Personnel Requisition Form (PRF)** automation built on **Google Apps Script**, **Google Sheets**, **Google Docs**, and **Google Drive** — designed to digitize the entire hiring requisition lifecycle at Enderun Colleges.

The system replaces manual, paper-based requisition workflows with a fully automated solution that captures hiring needs, routes multi-level approvals via email, generates official Talent Requisition Form (TRF) documents, and centralizes attachments — all within the Enderun Google Workspace.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Approval Workflow](#approval-workflow)
- [Tech Stack](#tech-stack)
- [System Screenshots](#system-screenshots)
- [Project Structure](#project-structure)
- [Deployment Guide](#deployment-guide)
- [Configuration](#configuration)
- [License](#license)

---

## Overview

The **Automated Personnel Requisition System** streamlines how department heads request new hires at Enderun Colleges. Instead of routing paper forms through multiple desks, the system lets requestors fill out a clean, multi-step web form. On submission, the request is automatically:

1. Logged into a **central Google Sheets tracker**
2. Used to generate an official **TRF Google Doc** from a template
3. Stored alongside its **uploaded attachment** in a dedicated Google Drive folder
4. Routed via email to the **Department Head** and then the **COO** for approval
5. Tracked through every status change until final disposition

The result is a faster, fully traceable hiring requisition pipeline — improving HR operational efficiency and reducing time-to-hire.

---

## How It Works

```
┌──────────────────┐    ┌────────────────────┐    ┌──────────────────────┐
│  Requestor fills │──▶ │  Google Apps Script│──▶ │  Google Sheets       │
│  Personnel       │    │  doPost handler    │    │  (PRF Tracker)       │
│  Requisition Form│    │                    │    └──────────────────────┘
└──────────────────┘    │                    │              │
                        │                    │              ▼
                        │                    │    ┌──────────────────────┐
                        │                    │──▶ │  Google Docs         │
                        │                    │    │  (Generated TRF)     │
                        │                    │    └──────────────────────┘
                        │                    │              │
                        │                    │              ▼
                        │                    │    ┌──────────────────────┐
                        │                    │──▶ │  Google Drive        │
                        │                    │    │  (TRF + Attachments) │
                        │                    │    └──────────────────────┘
                        │                    │              │
                        │                    │              ▼
                        │                    │    ┌──────────────────────┐
                        │                    │──▶ │  Email Notifications │
                        │                    │    │  (Dept Head → COO)   │
                        └────────────────────┘    └──────────────────────┘
                                                            │
                                                            ▼
                                                  ┌──────────────────────┐
                                                  │  Approve / Reject    │
                                                  │  via Email Link      │
                                                  └──────────────────────┘
```

---

## Key Features

### Requisition Form
- **Multi-step web form** (3 progressive steps) with smooth animations
- **Step 1 — Department Information**: department, location, head name & email
- **Step 2 — Job Details**: headcount, employment type, salary range, target start date, work schedule, replacement details
- **Step 3 — Requirements & Attachments**: academic qualifications, experience, skills, additional arrangements, supporting file
- **Real-time field validation** with toast notifications
- **Mobile-responsive** Plus Jakarta Sans design with light-blue Enderun theme
- **File upload** (up to 5 MB) directly to Google Drive
- **Welcome screen** and **success confirmation** with Request ID display
- **Tooltip help** on complex fields (e.g. replacement details, special arrangements)

### Automated Document Generation
- **Auto-generated TRF Google Doc** from a master template
- Each request gets a **unique Request ID**
- Generated docs are stored in a dedicated **TRF subfolder** in Drive
- Uploaded attachments are stored in a dedicated **Attachments subfolder**
- Subfolders are organized for easy retrieval

### Approval Workflow
- **Two-tier approval**: Department Head → COO
- **Email-based approvals** — approvers click links directly from their inbox
- **Stateful tracking** in Google Sheets:
  - **Column W** — Department Head status
  - **Column Y** — COO status
- **Strict Request ID matching** prevents row mismatches when sheets are sorted
- **Audit trail** — every state change is recorded with timestamps

### Notifications
- **Submission acknowledgement** to the requestor
- **Approval request emails** to Department Head and COO
- **Status update emails** on each approval/rejection
- **Branded HTML email templates** in a consistent Enderun light-blue palette

### Locations Supported
- Main Campus
- Venice
- Podium
- Estancia
- Other (custom input)

### Employment Types Supported
- Full Time
- Part Time
- Project Based (with duration field)

---

## Approval Workflow

| Stage | Actor | Action | Sheet Column |
|-------|-------|--------|--------------|
| 1 | Requestor | Submits PRF via web form | Row created |
| 2 | System | Generates TRF doc, stores attachment, emails Dept Head | — |
| 3 | Department Head | Approves / Rejects via email link | **Column W** |
| 4 | System | If approved, notifies COO via email | — |
| 5 | COO | Approves / Rejects via email link | **Column Y** |
| 6 | System | Notifies requestor & HR Workflows of final status | — |

---

## Tech Stack

- **Google Apps Script** — backend logic, web app hosting, email delivery
- **HTML5 + CSS3 + Vanilla JavaScript** — frontend form UI
- **Plus Jakarta Sans** (Google Fonts) — typography
- **SVG icons** — inline for performance
- **Google Sheets** — central data store ("Personnel Requisition Tracker")
- **Google Docs** — TRF template + auto-generated documents
- **Google Drive** — file storage (TRFs + attachments)
- **Gmail (via GAS MailApp)** — automated transactional emails
- **HtmlService** — serves the web form as a Google Apps Script web app

---

## System Screenshots

<p align="center">
  <img src="PRF%20SYSTEM%20SCREENSHOTS/Screenshot%202026-05-09%20163127.png" alt="Personnel Requisition Form — Welcome Screen" width="100%"/>
</p>

<p align="center">
  <img src="PRF%20SYSTEM%20SCREENSHOTS/Screenshot%202026-05-09%20163156.png" alt="Personnel Requisition Form — Department Info Step" width="100%"/>
</p>

<p align="center">
  <img src="PRF%20SYSTEM%20SCREENSHOTS/Screenshot%202026-05-09%20163436.png" alt="Personnel Requisition Form — Job Details Step" width="100%"/>
</p>

<p align="center">
  <img src="PRF%20SYSTEM%20SCREENSHOTS/Screenshot%202026-05-09%20163517.png" alt="Personnel Requisition Form — Requirements & Attachments" width="100%"/>
</p>

<p align="center">
  <img src="PRF%20SYSTEM%20SCREENSHOTS/Screenshot%202026-05-09%20163546.png" alt="Personnel Requisition Form — Submission Success" width="100%"/>
</p>

---

## Project Structure

```
Automated-Personnel-Requisition-System/
├── Email Notification.gs        # Google Apps Script backend
│                                #   - doGet/doPost handlers
│                                #   - Form submission processing
│                                #   - TRF document generation
│                                #   - Approval routing & email logic
│                                #   - Sheet status tracking
├── Index.html                   # Multi-step PRF web form (HTML/CSS/JS)
├── PRF SYSTEM SCREENSHOTS/      # System screenshots used in this README
└── README.md
```

---

## Deployment Guide

This project lives entirely inside **Google Workspace** — there is nothing to install on your local machine. To deploy your own copy:

### 1. Create the Tracker Spreadsheet
- Create a new Google Sheet titled **`Personnel Requisition Tracker`** (or any name, as long as the script's `getSheetByName(...)` matches)
- Add column headers matching the fields captured by the form (Request ID in **Column C**, Dept status in **Column W**, COO status in **Column Y**)

### 2. Create the TRF Template
- Create a Google Doc that acts as your **TRF template**
- Use placeholders like `{{requestId}}`, `{{department}}`, `{{position}}`, etc. that the script will replace
- Note the **Document ID** from the URL

### 3. Create Drive Folders
- Create a folder where **generated TRF docs** will be stored — note the Folder ID
- Create a folder where **uploaded attachments** will be stored — note the Folder ID

### 4. Set Up the Apps Script Project
- From your Google Sheet, open **Extensions → Apps Script**
- Replace the default `Code.gs` with the contents of `Email Notification.gs`
- Add a new HTML file named `Index` and paste the contents of `Index.html`

### 5. Configure the Script
Edit the constants at the top of `Email Notification.gs`:

```javascript
var COO_EMAIL      = "<coo-email-1>, <coo-email-2>";
var ADMIN_EMAIL    = "<hr-admin-email>";
var TEMPLATE_ID    = "<your-google-doc-template-id>";
var TRF_FOLDER_ID  = "<your-trf-folder-id>";
var ATTACHMENT_FOLDER_ID = "<your-attachments-folder-id>";
```

### 6. Deploy as a Web App
- In the Apps Script editor, click **Deploy → New deployment**
- Choose type **Web app**
- Set **Execute as:** `Me`
- Set **Who has access:** `Anyone within Enderun Colleges` (or as appropriate)
- Copy the deployed web app URL — this is the link you share with department heads

### 7. Grant Required Scopes
On first run, Apps Script will prompt for permission to:
- Read/write to Sheets
- Read/write to Drive (for TRF docs and attachments)
- Send email via Gmail / MailApp
- Serve the HTML web app

Approve these scopes with an authorized account.

---

## Configuration

| Constant | Purpose |
|----------|---------|
| `COO_EMAIL` | Comma-separated emails of COO-level approvers |
| `ADMIN_EMAIL` | HR workflow inbox for system notifications |
| `TEMPLATE_ID` | Google Doc ID used as the TRF template |
| `TRF_FOLDER_ID` | Drive folder for generated TRF docs |
| `ATTACHMENT_FOLDER_ID` | Drive folder for uploaded attachments |
| `COLORS` | Theme palette for HTML emails (light-blue Enderun) |

---

## License

This project is developed for internal use by the **Enderun Colleges Human Resources Department**.
All rights reserved © Enderun Colleges.

---

### Acknowledgements

- Built with **[Google Apps Script](https://developers.google.com/apps-script)** on Google Workspace
- Typography by **[Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)** via Google Fonts
- Designed for and used by the **Human Resources Department, Enderun Colleges**
