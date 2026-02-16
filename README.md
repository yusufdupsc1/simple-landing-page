# 🎓 School ERM Pro - Advanced School Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A high-performance, production-ready School Management System built with **Next.js 15**, **Prisma 7**, and **Recharts**. Inspired by the premium eSkooly dashboard, this application provides a centralized hub for managing students, employees, classes, curricula, and financial operations with real-time analytics.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=Premium+School+Management+Dashboard)

## 🚀 Key Features

- **📊 Dynamic Dashboard**: Real-time stats cards, performance charts (Expenses vs Income), and interactive widgets for daily operations.
- **🙋 Student Directory**: Comprehensive student lifecycle management including admissions, attendance, and guardian details.
- **👨‍🏫 Staff Management**: Employee directory with designation tracking, department grouping, and payroll insights.
- **🏛️ Academic Infrastructure**: Manage classes, sections, subjects, and curriculum assignments with ease.
- **💰 Financial Control**: Automated fee structure generation and collection tracking with visual progress indicators.
- **📝 Examination Hub**: Schedule terms, class tests, and quizzes. Track performance metrics across different classes.
- **⚙️ Deep Integration**: Built on **Prisma 7** with a robust driver adapter for maximum SQLite performance.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Database**: SQLite (via Prisma 7 & `@prisma/adapter-better-sqlite3`)
- **State & Logic**: Zustand, server actions, and server components for optimal data fetching.
- **Visuals**: Recharts for data visualization, Lucide React for iconography.
- **Styling**: Modern, premium CSS with a focus on high-fidelity dashboard aesthetics (glassmorphism, vibrant palettes).

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yusufdupsc1/school-management-system.git
   cd school-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   ```bash
   # Sync schema and generate client
   npx prisma db push
   
   # Populate with realistic demo data (160+ students, employees, etc.)
   npx npm run db:seed
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.
   **Admin Credentials**: `admin@eskooly.com` / `admin123`

## 📈 Roadmap (Next Modules)

- [ ] **Billing Automation**: Automated invoice generation based on fee structures.
- [ ] **SMS/Email Gateway**: Real-time notifications for parents on attendance and fee status.
- [ ] **Live Class Integration**: WebRTC powered virtual classrooms.
- [ ] **Report Card Generator**: Export professional grade sheets to PDF.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any feature additions or fixes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with passion for the education sector. Focused on performance, aesthetics, and user experience.*
