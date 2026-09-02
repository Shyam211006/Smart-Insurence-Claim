# SmartClaim AI – Insurance Claim Processing System

A beginner-friendly full-stack project built for a college hackathon.
Customers submit insurance claims with a document; the system runs OCR on the document,
generates a SHA-256 hash (simulated blockchain proof), assigns a rule-based fraud score,
and lets an admin approve or reject each claim.

**Stack:** HTML/CSS/JS (frontend) · Node.js + Express (backend) · MongoDB (database) ·
JWT (auth) · Multer (file upload) · Tesseract.js (OCR) · Node `crypto` (SHA-256 hashing)

---

## 1. Folder Structure

```
smart ai/
├── client/                  # Frontend (plain HTML/CSS/JS, no build step)
│   ├── index.html           # Landing page
│   ├── login.html
│   ├── register.html
│   ├── verify-otp.html      # Enter the emailed OTP to activate the account
│   ├── dashboard.html       # Customer dashboard
│   ├── upload.html          # Submit a new claim
│   ├── status.html          # Track claim status
│   ├── admin.html           # Admin: approve/reject claims
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── login.js
│       ├── register.js
│       ├── verify-otp.js
│       ├── dashboard.js
│       ├── upload.js
│       ├── status.js
│       ├── admin.js
│       └── theme.js         # Dark mode toggle (shared across all pages)
│
├── server/                  # Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   └── Claim.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── claimController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── claimRoutes.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification + admin check
│   │   └── upload.js        # Multer file upload config
│   ├── utils/
│   │   ├── hash.js          # SHA-256 hash generator
│   │   └── mailer.js        # Nodemailer setup + OTP email sender
│   ├── uploads/              # Uploaded claim documents get stored here
│   ├── server.js            # App entry point
│   ├── package.json
│   └── .env.example         # Copy to .env and fill in values
│
├── .gitignore
└── README.md
```

---

## 2. Installation

### Prerequisites
- Node.js (v18 or higher recommended) – https://nodejs.org
- MongoDB running locally, OR a free MongoDB Atlas cluster

### Steps

```bash
# 1. Move into the server folder
cd "smart ai/server"

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# then open .env and set MONGO_URI, JWT_SECRET, PORT
```

---

## 3. MongoDB Setup

**Option A – Local MongoDB**
1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Start it (it usually runs on `mongodb://127.0.0.1:27017` by default)
3. In `.env`, set:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/smartclaim
   ```

**Option B – MongoDB Atlas (cloud, free tier)**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Click "Connect" → "Connect your application" and copy the connection string
3. In `.env`, set:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartclaim
   ```

No manual collection creation is needed — Mongoose creates the `users` and `claims`
collections automatically the first time data is saved.

---

## 4. Setting up Gmail OTP Verification

Since registration now sends a real verification email, you need to give the backend
a Gmail account it can send FROM (this is separate from the accounts your users register with).

### Step 1: Turn on 2-Step Verification on your Gmail account
1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google," turn on **2-Step Verification** (required before you can create an App Password)

### Step 2: Generate an App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in again if prompted
3. Under "App name," type something like `SmartClaim AI` and click **Create**
4. Google shows you a **16-character password** (e.g. `abcd efgh ijkl mnop`) — copy it (spaces don't matter, you can remove them)

### Step 3: Add it to your `.env`
```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=abcdefghijklmnop
```
Use the Gmail address itself for `EMAIL_USER`, and the 16-character App Password (not your normal Gmail login password) for `EMAIL_PASS`.

That's it — the backend will now send real OTP emails whenever someone registers.

## 5. npm Commands

Run these from inside the `server/` folder:

| Command         | What it does                                  |
|------------------|------------------------------------------------|
| `npm install`    | Installs all backend dependencies              |
| `npm start`      | Starts the server with plain Node.js           |
| `npm run dev`    | Starts the server with nodemon (auto-restarts) |

The server runs at: **http://localhost:5000**
It also serves the frontend, so once it's running, just open **http://localhost:5000** in your browser — no separate frontend server needed.

---

## 6. Running the Project

```bash
cd "smart ai/server"
npm install
cp .env.example .env   # then edit values
npm run dev
```

Then open your browser at:
```
http://localhost:5000
```

**Typical demo flow:**
1. Register a **customer** account on the Register page
2. Log in → land on the Dashboard
3. Click "Upload New Claim" → fill the form and attach a PDF/image → Submit
4. Go to "Claim Status" to see the claim, its fraud score, and its SHA-256 hash
5. Register a second account and choose **Admin** as the account type
6. Log in as admin → land on the Admin Dashboard → Approve or Reject the claim
7. Log back in as the customer → refresh Claim Status → see the updated status

---

## 7. API Testing (e.g. with Postman or curl)

| Method | Endpoint              | Auth Required | Description                     |
|--------|------------------------|:--------------:|----------------------------------|
| POST   | `/api/register`       | No             | Create a new user (unverified), sends OTP email |
| POST   | `/api/verify-otp`     | No             | Confirm the emailed 6-digit code, activates the account |
| POST   | `/api/resend-otp`     | No             | Re-sends a fresh OTP if the first one expired or never arrived |
| POST   | `/api/login`          | No             | Log in (blocked until email is verified), returns a JWT token |
| POST   | `/api/uploadClaim`    | Yes            | Submit a claim (multipart/form-data, field name `document`) |
| GET    | `/api/claims`         | Yes            | List claims (own claims for customers, all for admins) |
| GET    | `/api/claim/:id`      | Yes            | Get a single claim by ID          |
| PUT    | `/api/approve/:id`    | Yes (admin)    | Approve a claim                   |
| PUT    | `/api/reject/:id`     | Yes (admin)    | Reject a claim                    |
| DELETE | `/api/claim/:id`      | Yes            | Withdraw a claim (customer: own claims only, while Pending; admin: any claim) |
| GET    | `/api/claims/export`  | Yes (admin)    | Download all claims as a CSV file |

Example curl for login:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

Example curl for uploading a claim (replace `<TOKEN>`):
```bash
curl -X POST http://localhost:5000/api/uploadClaim \
  -H "Authorization: Bearer <TOKEN>" \
  -F "customerName=John Doe" \
  -F "policyNumber=POL12345" \
  -F "claimAmount=45000" \
  -F "document=@/path/to/file.jpg"
```

---

## 8. Screenshots Description

*(Take these screenshots after running the app for your hackathon submission)*

1. **Home Page** – Hero section with title, description, and Login/Register buttons.
2. **Register Page** – Simple form with name, email, password, and role selector.
3. **Login Page** – Email + password form.
4. **Customer Dashboard** – Four stat cards (Total/Approved/Pending/Rejected) + claims table.
5. **Upload Claim Page** – Form with customer name, policy number, claim amount, file input.
6. **Claim Status Page** – Cards showing claim details, fraud score badge, and SHA-256 hash box.
7. **Admin Dashboard** – Stat cards, search/filter toolbar, full claims table with Approve/Reject buttons.

---

## 9. Additional Features

Beyond the original spec, this version also includes:

- **Real Gmail verification (OTP)** — registration no longer just checks the email *looks* like Gmail. A 6-digit one-time code is emailed to the address; the account stays inactive until that code is entered back on a Verify Email page. This proves the address is real and actually belongs to the person registering — something a format check alone can never guarantee. Login is blocked for unverified accounts, with an automatic redirect to the verification page and a "Resend code" option.
- **Gmail-only registration (format check)** — before an OTP is even sent, the Register form checks the address matches Gmail's real formatting rules (checked both in the browser and again on the server), so obviously wrong addresses are rejected instantly without wasting an email send.
- **OCR text display** — the text extracted from uploaded images is now shown on the Claim Status page (previously only stored in the database).
- **Withdraw claim** — customers can delete their own claim while it's still Pending (via a "Withdraw Claim" button on Claim Status). Admins can delete any claim.
- **CSV export** — admins can download all claims as a `.csv` file from the Admin Dashboard ("⬇ Export CSV" button), useful for reporting or spreadsheets.
- **Dark mode** — every page has a "🌙 Dark Mode" toggle in the navbar. The choice is remembered for the current browser tab (via `sessionStorage`).
- **Show/Hide password** — Login and Register password fields have a toggle button to reveal the typed password.

## 10. Fraud Score Logic (Rule-Based, No ML)

| Claim Amount        | Fraud Score |
|----------------------|:-----------:|
| < ₹50,000            | Low         |
| ₹50,000 – ₹100,000    | Medium      |
| > ₹100,000            | High        |

---

## 11. Security Notes

- Passwords are hashed with **bcrypt** before being stored (never stored as plain text).
- Sessions are managed with **JWT** tokens (1-day expiry).
- Every uploaded document gets a **SHA-256 hash** (via Node's `crypto` module), simulating
  a blockchain-style tamper-proof fingerprint — if the file is altered later, the hash
  will no longer match, revealing tampering.

---

## 12. Future Improvements

- Replace the rule-based fraud score with a real Machine Learning model trained on historical claims data.
- Add real blockchain storage (e.g. Hyperledger Fabric) instead of a simulated SHA-256 hash.
- Add email notifications when a claim is approved or rejected.
- Add pagination for the claims table when claim volume grows large.
- Add role-based route protection on the frontend (currently relies on localStorage + backend checks).
- Add automated tests (Jest/Supertest) for backend routes.
- Support multi-file uploads per claim (e.g. multiple photos of damage).
- Add a password-reset flow via email.
- Deploy to a live host (Render/Railway for backend, MongoDB Atlas for database).

---

## Troubleshooting

- **"MongoDB connection failed"** → Check that MongoDB is running locally, or that your Atlas
  connection string, username, and password in `.env` are correct.
- **"No token provided"** → Make sure you're logged in; the token is saved in `localStorage`
  after login and must be present to access claims.
- **CORS errors** → The backend already has `cors()` enabled; make sure you're accessing the
  app via `http://localhost:5000` (served by Express) rather than opening the HTML files directly.
- **OCR seems slow on first run** → Tesseract.js downloads its language data the first time
  it runs; this is normal and only happens once.
