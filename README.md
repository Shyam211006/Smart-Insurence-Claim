# 🛡️ SmartClaim AI - Insurance Claim Processing System

SmartClaim AI is a full-stack insurance claim processing application developed for a college hackathon.

The system allows customers to submit insurance claims with supporting documents, performs OCR on uploaded documents, generates a SHA-256 document hash, calculates a rule-based fraud score, and allows administrators to review, approve, or reject claims.

---

## 🌐 Project

**GitHub Repository:**  
https://github.com/Shyam211006/Smart-Insurence-Claim

---

## 📌 About the Project

SmartClaim AI simplifies the insurance claim process by providing a digital platform for customers and administrators.

Customers can register, verify their email using OTP, log in, submit insurance claims with supporting documents, and track their claim status.

Administrators can view submitted claims, review claim information, check fraud scores, and approve or reject claims.

The system also uses OCR to extract text from uploaded documents and generates a SHA-256 hash as a simulated blockchain-style document fingerprint.

---

## ✨ Features

- 👤 Customer Registration and Login
- 📧 Gmail OTP Email Verification
- 🔐 JWT-Based Authentication
- 📄 Insurance Claim Submission
- 📤 Document Upload
- 🔎 OCR Text Extraction
- 🔗 SHA-256 Document Hash
- 🚨 Rule-Based Fraud Score
- 📊 Customer Dashboard
- 👨‍💼 Admin Dashboard
- ✅ Approve Claims
- ❌ Reject Claims
- ↩️ Withdraw Pending Claims
- 📈 Claim Status Tracking
- 📥 CSV Claim Export
- 🌙 Dark Mode
- 👁️ Show/Hide Password
- 🗄️ MongoDB Database

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Frontend Structure |
| CSS3 | Styling and Responsive Design |
| JavaScript | Frontend Functionality |
| Node.js | Backend Runtime |
| Express.js | Backend Framework |
| MongoDB | Database |
| Mongoose | MongoDB Integration |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Multer | File Upload |
| Tesseract.js | OCR Processing |
| Nodemailer | OTP Email |
| Node.js Crypto | SHA-256 Hashing |
| GitHub | Source Code Management |

---

## 📂 Project Structure

```text
smart ai/
│
├── client/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── verify-otp.html
│   ├── dashboard.html
│   ├── upload.html
│   ├── status.html
│   ├── admin.html
│   ├── css/
│   └── js/
│
├── server/
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
