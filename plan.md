# Project Implementation Plan: Pick N Go - Smart Parcel Locker System

**Author:** Erma Sofia Farani Binti Rasidi (Universiti Selangor)
**Objective:** To develop an IoT-enabled smart parcel locker system that automates the parcel collection process, provides 24/7 accessibility for students via a secure web-based PIN system, and includes late-pickup management.
**Methodology:** Waterfall Model (Requirement Gathering, System Design, Implementation, Testing, Deployment, Maintenance).

---

## 1. Understanding Summary & Decisions
- **Core Workflow:** The Campus Admin acts as the central point of control. Admins receive parcels and manually load them into the lockers via the Admin Portal.
- **PIN Generation:** The system auto-generates a 4-digit PIN upon parcel assignment and sends it directly to the student via SMS.
- **Late Pickup (72-hour limit):** If a parcel is not picked up within 72 hours, the PIN expires. The Admin physically removes the parcel to free up locker space. The student must retrieve the parcel from the Admin and pay any penalty in person.
- **Architecture Shift:** The project uses a self-hosted server with **WebSockets** and **SQLite**, replacing the originally planned Firebase cloud backend.

---

## 2. System Architecture & Technical Plan

The system relies on a three-tier, event-driven IoT architecture:

### A. User Interface Layer (Frontend)
- **Responsive Web Application:** Built with modern, open-source web technologies.
- **Customer Portal:** Students log in to view parcel status and input their 4-digit PIN for retrieval.
- **Admin Portal:** Admins manage parcels, load lockers, authorize requests, handle overdue parcels, and perform emergency locker overrides.

### B. Self-Hosted Server Layer (Backend & Database)
- **Database (SQLite):** Serves as the single source of truth. Data remains on the local server, ensuring data sovereignty.
  - `Lockers` table: Tracks physical status (locker_id, status, last_opened).
  - `Parcels` table: Stores delivery data (parcel_id, locker_id, student_id, entry_timestamp).
  - `Security` table: Manages access (parcel_id, generated_pin, is_active).
- **Communication (WebSockets):** Eliminates polling overhead. Maintains an open bi-directional tunnel to the ESP32 for instant command execution (`{"action": "OPEN"}`).

### C. Hardware Control Layer (IoT)
- **ESP32 Microcontroller:** Initiates WebSocket connection to the server on startup. Triggers solenoid locks based on server commands.
- **12V Solenoid Locks:** Opens specific locker doors.
- **Security & Alarms:** Magnetic door sensors trigger a physical buzzer and send an `ALARM_TRIGGERED` WebSocket message to the server if a door remains open beyond 3 minutes.

---

## 3. Edge Cases & Safeguards
- **Device Identification:** During the WebSocket handshake, the ESP32 sends `{"action": "REGISTER", "device_id": "MAC_ADDRESS"}` to map the hardware to the logical database lockers.
- **Auto-Reconnection:** The ESP32 is programmed to attempt reconnection every 5 seconds if the WebSocket drops.
- **State Recovery:** On server reboot, the system queries the `Parcels` table. Any parcel exceeding `entry_timestamp + 72 hours` is flagged as expired automatically.
- **Networking:** The server uses a static IP or mDNS (e.g., `pickngo.local`) so the ESP32 can reliably connect over campus Wi-Fi.

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
- **Software Cost:** RM 0.00 (Open-source web stack, SQLite, Twilio free tier / similar).

---

## 5. Project Timeline (28-Week Schedule)
*Based on the Waterfall methodology*

| Phase | Task / Activity | Scheduled Weeks | Description |
|---|---|---|---|
| 1 | Requirement Analysis | Week 1 - 4 | Gather survey data, analyze gaps, define requirements. |
| 2 | System / Product Design | Week 5 - 8 | UML diagrams, Database schema, UI Mockups, circuit diagrams. |
| 3 | Development (Part 1) | Week 9 - 14 | Setup SQLite, develop backend WebSocket server, program ESP32 firmware. |
| 4 | Development (Part 2) | Week 15 - 20 | Develop Web App frontend, integrate hardware, physical assembly. |
| 5 | Testing & Evaluation | Week 21 - 23 | Unit Testing, Integration Testing, Logic/Penalty Testing. |
| 6 | Final Enhancements | Week 24 - 25 | Bug fixes, UI improvements, finalizing 72-hour functionality. |
| 7 | Documentation | Week 1 - 28 | Continuous drafting of final year project report. |
| 8 | Presentation & Submission| Week 26 - 28 | Final deployment review and presentation. |
