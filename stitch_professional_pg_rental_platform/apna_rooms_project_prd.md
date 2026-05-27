# 🏠 Apna Rooms - Product Requirements Document (PRD)

## 1. Executive Summary
**Apna Rooms** is a professional, high-performance PG (Paying Guest) rental management platform designed for modern professionals and property managers. The platform moves away from "vibe-coded" consumer apps toward a developer-grade, data-dense interface that prioritizes efficiency, transparency, and reliability.

## 2. Target Audience
*   **Tenants:** Modern professionals seeking high-quality, verified living spaces.
*   **Admins/Property Managers:** Power users managing multiple properties, finances, and maintenance teams.
*   **Service Workers:** Maintenance staff (Plumbers, Electricians, HVAC) managing on-site repairs.

## 3. Visual Identity (Precision Living System)
*   **Aesthetic:** Professional, technical, and high-density.
*   **Typography:** Inter (for clarity and readability).
*   **Themes:** 
    *   **Light Mode:** High-contrast slate and indigo (Logo: `apna_light.jpg`).
    *   **Dark Mode:** Deep navy and dark slate (Logo: `apna_dark.jpg`).
*   **Design Principles:** Rigid grids, functional status badges, and systematic whitespace.

## 4. Key Functional Modules

### 4.1 Discovery & Onboarding
*   **Public Landing Page:** Featured PGs, market occupancy stats, and verified listing counts.
*   **Search & Discovery:** Location, budget, and PG type filtering.
*   **Authentication:** Secure Login/Signup with session persistence and Google integration.

### 4.2 Tenant Dashboard
*   **Financial Management:** Monthly rent tracking, electricity bill breakdown with consumption charts, and Razorpay-integrated payments.
*   **Maintenance Requests:** Ticket creation for plumbing, wifi, carpentry, and HVAC.
*   **Property Details:** View room configurations, amenities, and property photos.

### 4.3 Admin Management Portal (7-Core Views)
1.  **Users & Tenants:** Comprehensive database of residents, occupancy rates, and payment statuses.
2.  **Manage PGs:** Inventory management, room allocation, and occupancy trends.
3.  **Manage Bills:** Portfolio-wide billing dashboard for rent and electricity.
4.  **Manage Complaints:** Centralized ticket pipeline (Registered → In Progress → Resolved).
5.  **Contact Queries:** Management of public inquiries and lead tracking.
6.  **Manage Workers:** Directory of maintenance staff, specialization tracking, and real-time status.
7.  **Manage Team:** Role-based access control (RBAC) for sub-admins and staff.

### 4.4 Service Worker Portal
*   **Work Queue:** Active task management with urgency labels (Urgent, Medium, Low).
*   **Task Lifecycle:** "Start Job" to "In Progress" to "Complete" status transitions.
*   **Activity Tracking:** Recent history and daily progress efficiency metrics.

## 5. Technical Requirements
*   **Frontend:** React-based architecture with Tailwind CSS for utility-first styling.
*   **State Management:** Context API for authentication and global app state.
*   **Animations:** Precision transitions using Anime.js or similar libraries.
*   **Integrations:** Firebase (Auth), Supabase (Database), and Razorpay (Payments).

## 6. Success Metrics
*   **Operational Efficiency:** Reduced time-to-resolution for tenant complaints.
*   **Financial Accuracy:** 100% transparency in utility billing and rent collection.
*   **User Satisfaction:** Professional UI that builds trust with high-value tenants.

---
**Version:** 1.0.0  
**Status:** Design Baseline Complete
