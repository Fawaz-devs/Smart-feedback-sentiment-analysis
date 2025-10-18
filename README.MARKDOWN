# 📊 Smart Feedback Collection and Analysis System

A full-stack web application that allows users to submit feedback, automatically analyzes sentiment, stores data, and visualizes results using interactive charts.

---

## 🧭 Project Objective

Design and develop a full-stack platform with:
- Feedback collection (text input)
- Real-time sentiment analysis (Positive, Negative, Neutral)
- Admin moderation tools
- Data visualization (Chart.js, D3.js)

---

## 🧩 Features

### 👤 User Roles
- **Guest**: Submit feedback anonymously
- **Registered User**: Submit and track feedback
- **Admin**: Moderate and analyze feedback data

### 📝 Feedback
- Text-only input
- Real-time validation (profanity filtering, character limit)

### 🧠 Sentiment Analysis
- Enabled with:
  - `TextBlob`
  - `VADER`
  - Optional: external APIs (e.g., Google NLP)
- Output:
  - Positive
  - Negative
  - Neutral

### 📈 Visualization
- Tools: `Chart.js`, `D3.js`
- Metrics:
  - Overall sentiment breakdown
  - Trends over time
  - Key statistics and summaries

---

## 🗃️ Database Design

### Supported DBs:
- `MongoDB` (NoSQL)
- `MySQL` / `SQLite` (Relational)

### Core Entities:
- `users` – authentication, roles
- `feedback` – feedback text, user ID
- `sentiment_results` – sentiment score/output
- `timestamps` – date/time tracking

---

## 🔧 Tech Stack

| Layer      | Tools                                      |
|------------|--------------------------------------------|
| Frontend   | React, HTML, CSS, JavaScript               |
| Backend    | Flask / Django / Node.js                   |
| Database   | MongoDB / MySQL / SQLite                   |
| Sentiment  | TextBlob, VADER                            |
| Charts     | Chart.js, D3.js                            |
| Testing    | Postman, automated tests (Jest, PyTest)    |
| Docs       | Wireframes, architecture diagrams, test plans |
| VCS        | Git + GitHub                               |

---

## 🚀 Functional Requirements

- ✅ Responsive frontend UI
- ✅ RESTful API for frontend-backend communication
- ✅ Authentication (JWT or session-based)
- ✅ Role-based access control
- ✅ Admin panel for managing and viewing feedback
- ✅ Realtime sentiment analysis and dynamic charting

---

## 📦 Non-Functional Requirements

- ⚡ **Performance**: Real-time updates
- 🔐 **Security**: Input validation, auth, DB protection
- 📈 **Scalability**: Modular backend & DB indexing
- 🔧 **Maintainability**: Clean architecture, readable code

---

## 📁 Folder Structure

