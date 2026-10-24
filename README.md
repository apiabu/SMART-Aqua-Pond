# SMART Aqua Pond

**Marine Ecosystem Monitoring and Control System**

SMART Aqua Pond is a prototype fishpond monitoring and control system developed for **CC106 – Application Development & Emerging Technologies** at the **University of Eastern Philippines**.

The system is designed to monitor important water-quality parameters, provide fish habitat monitoring, manage feeding and pond equipment, record historical data, generate alerts, and eventually support automated pond management and fish abnormal-behavior detection.

> **Current Status:** The software and database prototype is functional. Physical sensors, Arduino-controlled equipment, ESP32-CAM live monitoring, and computer-vision detection are planned for the hardware integration phase.

---

## Core Functions

The SMART Aqua Pond project is designed around the following 10 core functions:

1. **Real-Time Water Quality Monitoring**
   - Temperature
   - pH level
   - Dissolved oxygen
   - Turbidity
   - Water level

2. **Fish Camera Monitoring**
   - Planned live pond monitoring using ESP32-CAM.

3. **Fish Stress / Abnormal Behavior Detection**
   - Planned computer-vision analysis for possible abnormal fish behavior or stress indicators.

4. **Water Quality Alert System**
   - Generates and stores alerts for water-quality conditions.

5. **Automatic Aeration**
   - Planned automatic control of the pond aerator based on configured conditions.

6. **Automatic Partial Water Change**
   - Planned controlled 10–25% partial water change when required.

7. **Automatic Fish Feeder**
   - Feeding schedule management and planned physical feeder control.

8. **Manual Equipment Controls**
   - Software controls for aeration, water pump, and feeder.
   - Currently operating in prototype/simulation mode.

9. **Monitoring Dashboard**
   - Central interface for viewing pond information and system status.

10. **Data Logging and History**
    - MySQL storage for water-quality readings, alerts, feeding records, equipment activity, settings, and fish-behavior records.

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express.js
- MySQL2
- CORS
- dotenv

### Database

- MySQL Server
- MySQL Workbench

### Planned Hardware

- Arduino Mega 2560
- ESP32-CAM
- pH sensor
- DS18B20 waterproof temperature sensor
- Dissolved oxygen sensor
- Turbidity sensor
- Water-level sensors
- Relay module
- Aerator / air pump
- Water pump
- Solenoid valves
- Servo motor
- Automatic feeder mechanism

---

## System Architecture

The planned system architecture is:

```text
Water Quality Sensors
        |
        v
 Arduino Mega 2560
        |
        v
Node.js + Express API
        |
        v
     MySQL
        |
        v
Next.js Monitoring Dashboard
```

Fish monitoring is planned through:

```text
ESP32-CAM
    |
    v
Camera Stream
    |
    v
Computer Vision Processing
    |
    v
Fish Behavior / Possible Stress Indicator
    |
    v
Backend + MySQL + Dashboard
```

Equipment control is planned through:

```text
Dashboard / Automation Logic
          |
          v
      Backend API
          |
          v
   Arduino Mega 2560
          |
          v
 Relay / Driver Modules
          |
          v
Aerator / Pump / Valves / Feeder
```

---

## Current Prototype Status

| Module | Status |
|---|---|
| Dashboard | Software + MySQL/API Complete |
| Live Monitoring | Software + MySQL/API Complete |
| Water Quality History | Software + MySQL/API Complete |
| Alerts | Software + MySQL/API Complete |
| Alert Acknowledgement | Complete |
| Feeding Schedule | Software + MySQL/API Complete |
| Feeding History | Software + MySQL/API Complete |
| Equipment Activity Logging | Software + MySQL/API Complete |
| Equipment Controls | Simulation / Database Logging Complete |
| Settings | Software + MySQL/API Complete |
| Fish Behavior Records | Software + MySQL/API Complete |
| Arduino Sensor Integration | Pending Hardware |
| Physical Equipment Control | Pending Hardware |
| ESP32-CAM Live Feed | Pending Hardware |
| Computer-Vision Fish Detection | Pending Hardware / AI Integration |

### Important Prototype Note

Water-quality values currently displayed by the application are **prototype/test database records** and should not be interpreted as live physical sensor measurements.

Equipment controls currently demonstrate the software control flow and MySQL activity logging. They do **not yet activate physical pumps, aerators, valves, or feeders**.

Fish-behavior records are also prototype/database data. Live AI-based fish behavior analysis has not yet been integrated.

---

## Project Structure

```text
smart-aqua-pond/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── routes/
│   │   │   ├── alertRoutes.js
│   │   │   ├── equipmentRoutes.js
│   │   │   ├── feedingRoutes.js
│   │   │   ├── fishBehaviorRoutes.js
│   │   │   ├── settingsRoutes.js
│   │   │   └── waterQualityRoutes.js
│   │   └── server.js
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── public/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
│       └── api.ts
│
├── .gitignore
├── package.json
└── README.md
```

---

## Running the Project

### 1. Clone the Repository

```bash
git clone https://github.com/apiabu/SMART-Aqua-Pond.git
cd SMART-Aqua-Pond
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure the Backend Environment

Create:

```text
backend/.env
```

Add the following configuration:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=smart_aqua_pond
```

> Never commit the `.env` file or database password to the repository.

### 5. Start the Backend

From the `backend` directory:

```bash
node src/server.js
```

The backend runs on:

```text
http://localhost:5000
```

### 6. Start the Frontend

Open another terminal from the main project directory:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## Database

The project uses a MySQL database named:

```sql
smart_aqua_pond
```

Current tables include:

```text
water_quality_readings
alerts
feeding_schedules
feeding_history
equipment_logs
system_settings
fish_behavior_logs
```

The database stores monitoring records and prototype system activity used by the dashboard.

---

## Safety and Hardware Notes

- Pumps, aerators, and solenoid valves must **not** be powered directly from Arduino pins.
- Relay modules or suitable driver circuits and external power supplies must be used.
- Water-exposed electrical components should be properly insulated and protected.
- Hardware automation should include appropriate safety and failure handling.
- Ammonia, nitrite, and nitrate should be measured using manual test kits unless suitable electronic probes are actually installed.
- Fish-behavior analysis should be treated as an indicator of possible abnormal behavior or stress, not as a medical diagnosis.

---

## Development Phases

### Phase 1 — Software Prototype

- Monitoring dashboard
- Water-quality records
- Alerts
- Feeding management
- Equipment controls and activity logs
- Settings
- Fish-behavior database records
- MySQL integration

**Status: Completed**

### Phase 2 — Hardware Integration

- Arduino Mega 2560
- Water-quality sensors
- Aeration control
- Water pump
- Solenoid valves
- Automatic feeder

**Status: Pending**

### Phase 3 — Camera and Computer Vision

- ESP32-CAM live monitoring
- Fish activity analysis
- Possible abnormal-behavior/stress indicators
- Dashboard integration

**Status: Pending**

---

## Development Team

### Group Leaders

- **Alpio E. Abuyog**
- **Alejandra S. Recare**

### Members

- Margiel P. Balanday
- Chares T. Brences
- Allen Marc M. Cabahug
- Ralph Yrol C. Mabini
- Elcy D. Moyar
- Bea Jean Tordecilla
- Sandara Joyce C. Surio
- Jiro Theo C. Vacunawa

**BSIT 4 – A**

University of Eastern Philippines  
College of Science  
CC106 – Application Development & Emerging Technologies

---

## Academic Project

SMART Aqua Pond is being developed as an academic prototype for **CC106 – Application Development & Emerging Technologies**.

The project demonstrates the integration of web application development, database management, IoT concepts, automation, and planned computer-vision technology for fishpond monitoring and management.