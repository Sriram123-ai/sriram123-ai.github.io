# 🌐 Nexora IoT Solutions — Full Stack Website

> *Innovating Smart IoT Systems* — A complete, production-ready company website with React frontend and Node.js/Express backend.

---

## 📁 Project Structure

```
nexora/
├── client/
│   └── index.html          ← Complete React-like SPA (HTML + CSS + JS)
│
├── server/
│   ├── index.js            ← Express server entry point
│   ├── package.json
│   ├── routes/
│   │   ├── contact.js      ← POST /contact
│   │   ├── support.js      ← POST /support
│   │   └── career.js       ← POST /career
│   └── controllers/
│       ├── contactController.js
│       ├── supportController.js
│       └── careerController.js
│
├── package.json            ← Root scripts
└── README.md
```

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install

# Start server (port 5000)
npm start

# OR with auto-reload during development
npm run dev
```

You should see:
```
🚀 Nexora IoT Server running on http://localhost:5000
```

### 2. Open the Frontend

Simply open `client/index.html` in your browser:

```bash
# macOS
open client/index.html

# Linux
xdg-open client/index.html

# Windows
start client/index.html
```

**OR** serve it with a simple HTTP server:

```bash
# Using Python (no install needed)
cd client && python3 -m http.server 3000
# Then visit http://localhost:3000

# Using Node.js npx
cd client && npx serve .
```

---

## 🔌 API Endpoints

| Method | Endpoint   | Description           |
|--------|------------|-----------------------|
| POST   | /contact   | Submit contact form   |
| GET    | /contact   | List messages (admin) |
| POST   | /support   | Submit support ticket |
| GET    | /support   | List tickets (admin)  |
| POST   | /career    | Submit job application|
| GET    | /career    | List applications     |
| GET    | /          | Health check          |

### Example API Calls

**Contact Form:**
```bash
curl -X POST http://localhost:5000/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","message":"Hello Nexora!"}'
```

**Support Ticket:**
```bash
curl -X POST http://localhost:5000/support \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","productIssue":"Smart Home Hub","description":"Device not connecting"}'
```

**Job Application:**
```bash
curl -X POST http://localhost:5000/career \
  -H "Content-Type: application/json" \
  -d '{"name":"Dev","email":"dev@example.com","position":"IoT Engineer","resumeFileName":"resume.pdf"}'
```

---

## 📦 Dependencies

### Backend (`server/`)
- **express** — Web framework
- **cors** — Cross-origin resource sharing
- **body-parser** — Request body parsing
- **nodemon** *(dev)* — Auto-reload on file changes

### Frontend (`client/`)
All loaded via CDN — **no build step required!**
- Bootstrap 5.3
- Font Awesome 6.5
- Google Fonts (Syne + DM Sans)

---

## 🗄️ MongoDB Integration (Future)

The controllers are pre-structured for MongoDB. To enable:

1. Install Mongoose:
```bash
cd server && npm install mongoose
```

2. Add to `server/index.js`:
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexora')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
```

3. Create models in `server/models/`:
```javascript
// models/Contact.js
const mongoose = require('mongoose');
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  submittedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Contact', ContactSchema);
```

4. Replace `messages.push(entry)` in controllers with:
```javascript
const Contact = require('../models/Contact');
await Contact.create(entry);
```

---

## 🌐 Pages Overview

| Page      | Route      | Features                                        |
|-----------|------------|-------------------------------------------------|
| Home      | `#home`    | Hero, Features, Highlights, Why Choose Us, CTA  |
| About     | `#about`   | Story, Vision/Mission, Tech Stack, Team         |
| Services  | `#services`| 6 Service Cards, Process Steps, Consultation CTA|
| Support   | `#support` | FAQ Accordion, Support Ticket Form, Channels    |
| Contact   | `#contact` | Company Info, Feedback Form → POST /contact     |
| Careers   | `#careers` | Benefits, 4 Job Listings, Application Form      |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#00d4ff` (Cyan) |
| Accent | `#7b2fff` (Purple) |
| Accent 2 | `#ff6b35` (Orange) |
| Background | `#020b18` (Deep Navy) |
| Card | `#061425` |
| Font Display | Syne |
| Font Body | DM Sans |

---

## ⚙️ Environment Variables

Create `server/.env` for production:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexora
NODE_ENV=production
```

---

## 📱 Responsive Breakpoints

- **Mobile:** < 576px
- **Tablet:** 576px – 768px  
- **Desktop:** > 768px

All pages are fully responsive with mobile-first navigation.

---

## 🔒 Demo Mode

When the backend server is not running, all forms automatically fall back to **demo mode** — displaying a success message without an API call. This is handled gracefully in the JavaScript catch blocks.

---

## 📄 License

MIT — Free to use and modify.

---

*Built with ❤️ for Nexora IoT Solutions — Connecting the world, one device at a time.*
