# Chunav AI — Bharat ka Civic Compass

> A non-partisan AI-powered civic assistant that helps every Indian 
> citizen understand the election process, political history, and 
> democratic rights - in simple, clear language.

## 🚀 Live Demo
https://chunavai.vercel.app/

## ✨ Features
- 🗳️ Complete Indian election process guidance
- 🏛️ Info on ECI, EVMs, VVPAT, political parties
- 📜 Current & past government history 
- 🎙️ Voice input in English & Hindi
- 🌗 2 themes: Dark, Tiranga
- ♿ Font size accessibility controls
- 📱 Fully responsive for all devices

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI | Groq API (Llama 3.3 70B) |
| Voice | Web Speech API |
| Hosting | Vercel + Railway |

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- Groq API key (free at console.groq.com)

### Backend
cd backend
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev

### Frontend
cd frontend
npm install
npm run dev

## 🔑 Environment Variables
Create backend/.env:
GROQ_API_KEY=your_groq_api_key_here
PORT=5000

## 📂 Project Structure

```text
Voting/
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   └── index.css        # Global styles
│   └── index.html
├── backend/                 # Express server
│   ├── server.js            # API + Groq integration
│   └── .env                 # Never commit this!
└── README.md
```

## 📄 License
MIT

---
Built by Tanmay Patil for BHARAT &#x1f1ee;&#x1f1f3;