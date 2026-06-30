# Project Implementation Plan: Pick N Go - Smart Parcel Locker System

**Author:** Erma Sofia Farani Binti Rasidi (Universiti Selangor)
**Objective:** To develop an IoT-enabled smart parcel locker system that automates the parcel collection process, provides 24/7 accessibility for students via a secure web-based PIN system, and includes late-pickup management.
**Methodology:** Waterfall Model (Requirement Gathering, System Design, Implementation, Testing, Deployment, Maintenance).

---

## 1. Understanding Summary & Decisions
- **Core Workflow:** Students initiate a request for locker usage via the Student Portal. The Campus Admin reviews and approves/rejects the requests via the Master Admin Dashboard. Upon approval, a parcel and physical locker are assigned.
- **PIN Generation & Automated Emailing:** The backend auto-generates a single-use 4-digit PIN upon parcel assignment. Using **Nodemailer via SMTP**, the system securely and automatically emails the PIN and locker details directly to the student's registered email. The admin also has the ability to **Regenerate PINs** if a student loses their access code.
- **Emergency Requests:** Students can log emergency issues (e.g., lost PIN, locker jammed). Admins can view these reports on their dashboard, review the student's details in a dynamic modal, and remotely "Unlock" the physical locker to resolve the issue.
- **Admin Accountability & Tracking:** The system dynamically tracks the "Staff in Charge" who approved each request, logging their username and timestamp for complete operational transparency.
- **Late Pickup (72-hour limit):** If a parcel is not picked up within 72 hours, the system auto-flags the parcel with a penalty. The Admin can physically remove the parcel to free up locker space, and the system transitions the status to "Overdue" or "Removed".
- **Dynamic Locker Management:** The system logic dynamically handles locker allocations and states, supporting an arbitrary number of physical lockers without hardcoded limitations.

---

## 2. System Architecture & Technical Stack

The system relies on a modern, event-driven, three-tier architecture:

### A. User Interface Layer (Frontend)
- **Responsive Web Application:** Built with HTML, JS, and styled with Custom CSS (glassmorphism dark themes) for modern, responsive layouts.
- **Student Portal:** Students log in to request lockers, check their parcel status, submit emergency reports, and use the virtual keypad to retrieve parcels via PIN. Enhanced with engaging UI animations.
- **Master Admin Dashboard:** A comprehensive, professional dark-themed command center featuring:
  - **Locker Overview:** Real-time physical status of all lockers.
  - **Manage Requests/Parcels:** Streamlined data tables to approve requests, track parcel life cycles, and view Staff in Charge history.
  - **Master Analytics:** A two-tab dashboard showing historical student logs (with instant search filtering) and System Statistics containing KPIs and visual charts (powered by **Chart.js**).

### B. Application Server & Database Layer (Backend)
- **Web Framework:** Built with Python's **FastAPI** to provide rapid, asynchronous REST APIs.
- **Database (SQLite with SQLAlchemy ORM):**
  - `User` & `Customer`: Manages student profiles and authentication.
  - `Locker`: Tracks the physical status (`Available`, `Occupied`) of the hardware.
  - `Parcel`: Stores generated PINs and tracks the 72-hour storage time.
  - `Request`: Manages the state machine workflow (`Pending`, `Approved`, `Stored`, `Collected`, `Removed`).
  - `EmergencyReportDB`: Archives all submitted student emergency logs.
- **Email Microservice:** A Node.js `mailer.js` script interfaces with Google SMTP via `nodemailer` and `dotenv`, triggered securely by the Python backend via subprocesses.

### C. Deployment & Infrastructure
- **Containerization:** The backend API and frontend assets are containerized using **Docker** for consistent, reproducible environments.
- **Cloud Hosting:** The application is configured for deployment on **Fly.io**, providing scalable cloud-native hosting for the FastAPI server.

### D. Hardware Control Layer (IoT)
- **Communication (WebSockets):** Eliminates polling overhead. Maintains an open bi-directional tunnel between the FastAPI server and the ESP32 for instant remote unlocking.
- **Hardware Integration:**
  - ESP32 Microcontroller connects to the backend on startup.
  - 12V Solenoid Locks to open specific locker doors.
  - Sensors and buzzers for physical security and alarms.

---

## 3. Edge Cases & Safeguards
- **Single-Use PINs:** The verification logic strictly checks if the parcel is currently physically seated in the locker. Once the locker is opened, the PIN is immediately invalidated to prevent unauthorized re-entry.
- **Ghost Parcel Cleanup:** The backend dynamically sanitizes database history to ensure that old or overwritten parcels do not falsely appear as "Stored" on the admin dashboard once the physical locker has been vacated.
- **Secure Credentials:** Email authentication and master credentials are removed from hardcoded scripts and strictly handled via encrypted `.env` environment variables.

---

## 4. Hardware & Budget Plan
- **Constraint:** Strict budget under RM 250.
- **Components:**
  - Physical Locker (Space-saving steel): RM 70.00
  - Solenoid Lock (12V): RM 30.00
  - ESP32 Microcontroller: RM 60.00
  - Power Supply & Wiring: RM 30.00
  - Miscellaneous Hardware (Relays, cases): RM 25.00
  - Timed Wireless Alarm Sensor / Magnetic Switch: RM 20.00
- **Total Hardware Cost:** RM 235.00
- **Software Cost:** RM 0.00 (Open-source web stack, FastAPI, SQLite, Nodemailer).

---

## 5. Project Timeline (28-Week Schedule)
*Based on the Waterfall methodology*

| Phase | Task / Activity | Scheduled Weeks | Description |
|---|---|---|---|
| 1 | Requirement Analysis | Week 1 - 4 | Gather survey data, analyze gaps, define requirements. |
| 2 | System / Product Design | Week 5 - 8 | UML diagrams, Database schema, UI Mockups, circuit diagrams. |
| 3 | Development (Part 1) | Week 9 - 14 | Setup SQLite, develop FastAPI backend, configure SQLAlchemy ORM. |
| 4 | Development (Part 2) | Week 15 - 20 | Develop Tailwind Web App, integrate Nodemailer, build Chart.js Analytics. |
| 5 | Testing & Evaluation | Week 21 - 23 | Unit Testing, Hardware Simulation, Ghost Parcel/PIN Security Testing. |
| 6 | Final Enhancements | Week 24 - 25 | Bug fixes, UI improvements, finalizing 72-hour functionality. |
| 7 | Documentation | Week 1 - 28 | Continuous drafting of final year project report. |
| 8 | Presentation & Submission| Week 26 - 28 | Final deployment review and presentation. |
