# 🎓 Student Management System

A full-stack **Student Management System** designed to simplify academic management by bringing student records, attendance, marks, fees, analytics, and AI-powered academic assistance into one platform.

The system provides separate role-based access for **Students, Teachers, and Administrators**, allowing each user to access the features relevant to their role.

The project combines **Web Development, SQL Database Management, Data Analytics, and Generative AI** to create a practical education-focused solution aligned with **UN Sustainable Development Goal 4 – Quality Education**.

---

## 🎯 Problem Statement

Students' academic information is often scattered across attendance records, examination marks, fee records, and different administrative systems. This can make it difficult for students and educators to obtain a complete and timely understanding of academic performance.

Traditional student management systems primarily focus on storing and displaying information, but they often provide limited personalized academic guidance. Students may know their marks or attendance percentage, but they may not clearly understand which subjects require more attention, how their academic performance is progressing, or how to organize their study time effectively.

Educators and administrators also need better tools to monitor academic trends, identify areas requiring attention, and make data-driven decisions.

This creates a gap between **academic data and actionable educational support**.

Our project addresses this gap by combining **student management, academic analytics, and AI-powered personalized assistance** in one platform.

---

## 💡 Our Solution

**Student Management System** is a full-stack academic platform that brings student information, academic monitoring, analytics, and AI-powered assistance together in one system.

The platform provides separate role-based experiences for students, teachers, and administrators. It manages student records, attendance, marks, fees, and teacher information while providing analytical reports and dashboards for academic monitoring.

For students, the platform goes beyond simply displaying academic data. Its AI-powered features use the student's available academic information, including marks and attendance, to provide personalized academic assistance, identify areas that may require attention, and generate customized study plans.

This transforms raw academic data into **personalized and actionable educational guidance**, helping students better understand their academic progress and make informed decisions about their studies.

---

## 🎯 Project Objective

The objective of this project is to provide a centralized platform where academic records can be managed efficiently while giving students, teachers, and administrators access to role-specific features and analytics.

The system aims to:

* Centralize important academic information.
* Simplify student, teacher, attendance, marks, and fee management.
* Help educators monitor academic performance.
* Provide meaningful academic analytics and reports.
* Give students personalized AI-powered academic guidance.
* Convert academic data into actionable learning support.

---

## ✨ Key Features

### 👨‍🎓 Student Portal

* Secure student login
* View personal profile and academic information
* Check attendance records and attendance percentage
* View subject-wise marks and academic performance
* Track fee status and payment details
* Access personalized AI Academic Assistant
* Generate personalized study plans

### 👨‍🏫 Teacher Portal

* Secure teacher login
* View student records
* Manage attendance
* Enter and update student marks
* View student fee information
* Access academic analytics and reports

### 👨‍💼 Admin Portal

* Secure administrator login
* Add, edit, and manage students
* Add, edit, and manage teachers
* Manage academic records
* Manage fees
* Access institutional reports and analytics

---

## 🤖 AI-Powered Academic Features

The system includes **Gemini-powered AI features designed specifically for students**.

### 🧠 AI Academic Assistant

The AI Academic Assistant allows students to ask academic questions and receive personalized guidance based on their available academic information.

The system can use:

* Student information
* Attendance data
* Marks
* Subject-wise performance
* Overall academic performance

The assistant can provide:

* Academic performance insights
* Identification of stronger and weaker subjects
* Academic risk-related insights
* Study recommendations
* Attendance-aware guidance
* Examination preparation suggestions
* Learning strategies
* Personalized academic support

The assistant is designed to use the student's available academic data and avoid inventing marks, attendance records, or subjects that are not present in the system.

### 📚 Personalized Study Planner

The Personalized Study Planner generates a structured, day-by-day study plan based on the student's academic information.

It can:

* Consider the student's marks and attendance
* Identify subjects requiring greater attention
* Prioritize weaker subjects
* Include revision of stronger subjects
* Generate a study plan for the requested duration
* Provide practical and actionable study guidance

Together, these AI features transform academic information into **personalized educational support and actionable study guidance**.

---

## 📊 Analytics Dashboard

The project includes **Power BI dashboards** that transform academic records into meaningful insights.

The analytics section includes:

* Institution Overview
* Attendance Analytics
* Fees Analytics
* Marks Analytics

These dashboards help monitor student performance, attendance trends, fee status, and institutional academic information.

---

## 💡 Innovation

Unlike a conventional student management system that primarily stores and displays academic records, this platform connects:

**Academic Management → Analytics → AI Assistance → Personalized Study Support**

The system does not only provide access to academic data. It uses available academic information to help students understand their performance and take more informed actions.

Key innovative aspects include:

* AI-powered academic assistance based on available student data
* Personalized study planning
* Subject-wise performance analysis
* Attendance-aware academic guidance
* Role-based academic management
* Institutional analytics and visualization
* Integration of academic management with Generative AI

The core idea is to transform **raw academic data into actionable educational support**.

---

## 🌍 UN SDG 4 – Quality Education

This project supports **UN Sustainable Development Goal 4 (Quality Education)** by helping educational institutions manage academic information, monitor student performance, analyze attendance and fees, and provide students with personalized AI-based academic guidance.

The project contributes to this goal by:

* Helping students understand their academic performance.
* Providing personalized academic support.
* Identifying areas requiring additional attention.
* Supporting structured study planning.
* Helping educators monitor academic trends.
* Enabling data-driven educational decisions.

The overall goal is to make academic information easier to **manage, understand, and use for better educational outcomes**.

---

## 🛠️ Technology Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* Microsoft SQL Server

### Analytics

* Microsoft Power BI

### Artificial Intelligence

* Google Gemini API

### Authentication & Security

* JSON Web Token (JWT)
* Role-based authorization
* Environment variables using `.env`

### Version Control & Deployment

* Git
* GitHub
* GitHub Pages
* Render

---

## 🏗️ System Architecture

```text
                    Student Management System
                              │
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
     Student Portal      Teacher Portal      Admin Portal
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                    Node.js + Express
                              │
                 ┌────────────┴────────────┐
                 ↓                         ↓
          Microsoft SQL Server        Gemini API
                 │                         │
                 ↓                         ↓
           Academic Data              AI Processing
                 │                         │
                 └────────────┬────────────┘
                              ↓
                     Personalized Support
                              │
                              ↓
                           Student
```

---

## 🗄️ Database Tables

The system uses a relational **Microsoft SQL Server** database with the following core tables:

* Student
* Teacher
* Admin
* Attendence
* Marks
* Fees

The database stores academic and administrative information required by the different modules of the system.

---

## 🔐 Security Features

* JWT-based authentication
* Role-based authorization
* Separate Student, Teacher, and Admin access
* Protected API routes
* Authenticated access to academic data
* Environment variable protection using `.env`
* Sensitive configuration excluded from GitHub using `.gitignore`

---

## 📸 Project Screenshots

### 🔐 Login Page

![Login Page](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/sms%20login.png)

### 📊 Admin Dashboard

![Admin Dashboard](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Dashboard.png)

### 👨‍🎓 Student Management

![Student Management](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Students.png)

### 👨‍🏫 Teacher Management

![Teacher Management](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Teachers.png)

### 📅 Attendance Management

![Attendance Management](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Attendance.png)

### 📝 Marks Management

![Marks Management](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Marks.png)

### 💰 Fees Management

![Fees Management](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Fees.png)

### 📑 Reports

![Reports](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Reports.png)

### 📈 Analytics

![Analytics](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/Admin%20Analytics.png)

### 🤖 AI Academic Assistant

![AI Academic Assistant](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/ask%20ai.png)

### 📚 Personalized Study Planner

![Personalized Study Planner](https://github.com/prarthanamaheshwari1-wq/student-management-analytics/blob/main/study%20planner.png)

---

## 🚀 Deployment

### Frontend

The frontend is deployed using **GitHub Pages**.

**Live Website:**
https://prarthanamaheshwari1-wq.github.io/student-management-analytics/

### Backend

The Node.js/Express backend is deployed using **Render**.

**Backend Service:**
https://student-management-analytics-1.onrender.com

### Database

The application uses **Microsoft SQL Server** for relational data storage and management.

---

## 🧪 Project Testing

The system has been tested across the major application modules, including:

* Role-based login
* Student management
* Teacher management
* Attendance management
* Marks management
* Fee management
* Reports
* Analytics
* AI Academic Assistant
* Personalized Study Planner
* Protected API access

The major implemented features are functioning as intended in the current project version.

---

## 🌟 Project Highlights

* Full-stack academic management platform
* Role-based Student, Teacher, and Admin portals
* Microsoft SQL Server database integration
* JWT authentication and protected APIs
* AI-powered academic assistance using Google Gemini
* Personalized AI study planning
* Academic performance analysis
* Attendance-aware recommendations
* Interactive Power BI analytics
* Attendance, marks, and fee management
* Deployed frontend and backend
* Education-focused solution aligned with **UN SDG 4**

---

## 🔮 Future Scope

Future development can expand the platform with:

* Advanced academic risk prediction
* Automated academic alerts
* Multilingual AI assistance
* Voice-based academic interaction
* Mobile application support
* Parent/guardian dashboard
* Advanced predictive analytics
* Cloud-based institutional deployment
* Integration with learning-management systems
* Additional AI-powered educational services

---

## 👩‍💻 Contributor

**Prarthana Maheshwari**
