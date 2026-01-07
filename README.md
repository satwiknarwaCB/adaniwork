# AGEL Commissioning Execution Tracker

A chairman-level executive dashboard designed to visualize and track the AGEL FY 2025–26 Commissioning Status. This portal provides real-time insights into technology splits, regional deployment, and project-level performance achievement.

---

## 🏗️ Architecture Overview

- **Frontend & Backend**: Unified **Next.js 16** (App Router) using **React 19** and **Tailwind CSS**. 
- **Database**: **PostgreSQL** (via Docker) managed by **Prisma ORM**.
- **Calculations**: All business metric calculations are handled within Next.js API routes.

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **Docker Desktop** (for PostgreSQL)

---

### 2. Setup & Run

1. **Start the Database**:
   ```powershell
   docker-compose up -d
   ```

2. **Install Dependencies**:
   ```powershell
   npm install
   ```

3. **Setup Database Schema**:
   ```powershell
   npx prisma db push
   ```

4. **Start the Development Server**:
   ```powershell
   npm run dev
   ```
   *The dashboard will be available at `http://localhost:3000/application`.*

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
