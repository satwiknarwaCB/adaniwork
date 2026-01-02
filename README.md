# AGEL Commissioning Execution Tracker

A chairman-level executive dashboard designed to visualize and track the AGEL FY 2025–26 Commissioning Status. This portal provides real-time insights into technology splits, regional deployment, and project-level performance achievement.

---

## 🏗️ Architecture Overview

- **Frontend**: Built with **Next.js 16**, **React 19**, and **Tailwind CSS**. It uses **Recharts** for premium data visualization and **Framer Motion** for sleek animations.
- **Backend**: **FastAPI** (Python) handling data logic, business metric calculations, and authentication.
- **Database**: SQLite used for persistent storage of project statuses and derived analytics.

---

## 🚀 Getting Started

To run this project locally, you will need to start both the **Backend API** and the **Frontend Dashboard**.

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **Python** (v3.10.x or later)

---

### 2. Backend Setup & Run

The backend handles all the math logic and data serving.

1. **Navigate to the backend folder**:
   ```powershell
   cd backend
   ```

2. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

3. **Start the Backend Server**:
   ```powershell
   python main.py
   ```
   *The backend will run at `http://localhost:8000`.*

---

### 3. Frontend Setup & Run

The frontend provides the user interface for the dashboard.

1. **Navigate to the root directory (CEO-tracker)**.

2. **Install Node dependencies**:
   ```powershell
   npm install
   ```

3. **Start the Development Server**:
   ```powershell
   npm run dev
   ```
   *The dashboard will be available at `http://localhost:3000/application`.*

---

## 📊 Key Features for Executives

- **Executive Insights**: High-level overview of annual targets vs. actual commissioning (MW).
- **Technology Mix**: Interactive donut chart showing Solar vs. Wind distribution with "Target Portfolio" context.
- **Geographic Deployment**: Regional breakdown for Khavda, Rajasthan, and Mundra sites.
- **Cumulative Flow**: A line analysis comparing PPA Plan targets vs. Cumulative Actuals over time.
- **Responsive Slicers**: Dynamic filters for Fiscal Year, Site, Project, and Business Model (PPA/Merchant/Group).

---

## 🛠️ Tech Stack Specifics

- **State Management**: React Query (TanStack)
- **Styling**: Tailwind CSS (Glassmorphism & Dark Mode)
- **Charts**: Recharts (with custom premium themes)
- **Animations**: Framer Motion (Micro-interactions & Page Transitions)
