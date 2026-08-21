# First Pacific Bank - Sovereign Banking Platform

A high-performance banking portal and sovereign wealth management platform built with React, Vite, Express, TypeScript, and Firebase.

- **Repository:** `https://github.com/igwenababa1/First-Pacific-Bank.git`
- **Target Deployments:** Vercel & GitHub Actions CI/CD

---

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Motion, Lucide Icons, Recharts, Leaflet
- **Backend:** Node.js, Express, TypeScript, Firebase Admin, Stripe, Resend, Twilio
- **Database & Auth:** Firebase Firestore & Firebase Authentication

---

## 🚀 Quick Start (Local Development)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/igwenababa1/First-Pacific-Bank.git
   cd First-Pacific-Bank
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Deployment Guides

### 1. Deploying to Vercel
1. Import your GitHub repository (`igwenababa1/First-Pacific-Bank`) in your [Vercel Dashboard](https://vercel.com/new).
2. Framework preset will automatically detect **Vite** using `vercel.json`.
3. Set your **Environment Variables** in the Vercel Project Settings:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
   - `BANK_DATA_API_KEY`
   - `SIMBOSS_API_KEY`
   - `SIMBOSS_SENDER_ID`
   - `VITE_OTP_KEY`
4. Click **Deploy**. Vercel will build the frontend into `dist` and deploy `/api/*` serverless functions.

### 2. GitHub Actions CI/CD
The repository includes `.github/workflows/deploy.yml` which validates and builds the project on every push to `main` / `master`.
Add the same environment variables under **Settings > Secrets and variables > Actions** in your GitHub repository.

---

## 📄 License
This project is licensed under the MIT License.

