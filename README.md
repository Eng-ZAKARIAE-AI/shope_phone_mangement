# Tech Shop Stockroom Manager

A production-grade, containerized full-stack stock management application for a retail electronics shop. Specialized for tracking **Tecno devices**, smartwatches, and accessories with real-time synchronization and enterprise security.

---

## Key Features

- **Real-time Inventory Sync**: Instant updates across all clients using Firestore's reactive listeners.
- **Advanced Analytics**: Visual distribution of stock categories and pricing using Recharts.
- **Enterprise Security**: RBAC (Role-Based Access Control) and "Dirty Dozen" vulnerability protection.
- **Audit Ledger**: Immutable history of every stock adjustment, creation, and deletion.
- **Sandbox Mode**: LocalStorage-driven demo mode for testing without Firebase credentials.
- **Adaptive UI**: Responsive design with full Dark/Light mode support via Tailwind CSS 4.
- **Containerized**: Fully Dockerized environment for seamless deployment and development.

---

## Technology Stack

| Layer | Technologies |
|--- |--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| **Backend** | Node.js, Express, Firebase Admin SDK |
| **Database** | Google Cloud Firestore (NoSQL) |
| **Auth** | Firebase Authentication |
| **DevOps** | Docker, Nginx, GitHub Actions |
| **UI/UX** | Lucide React, Framer Motion (Motion), Recharts |

---

## Architecture Layout

```text
├── /frontend               # React Single-Page Application
│   ├── /src
│   │   ├── /context       # Auth & Theme State Providers
│   │   ├── /dashboard     # Analytics Widgets & Recharts Logic
│   │   ├── /hooks         # Reusable Logic (Debounce, etc.)
│   │   ├── /inventory     # Stock Tables & Product Modals
│   │   ├── /layout        # Header & Sidebar Navigation
│   │   ├── /pages         # Audit Logs & Staff Management Views
│   │   ├── /services      # Firebase & API Client Wrappers
│   │   ├── /ui            # Atomic Components (Modals, Toasts)
│   │   └── types.ts       # TypeScript Domain Interfaces
│   ├── index.html         
│   ├── vite.config.ts     
│   └── tailwind.config.ts  
│
├── /backend                # Node.js Microservice
│   ├── index.js           # Express API Controllers
│   └── package.json       
│
├── /docker                 # Infrastructure as Code
│   ├── docker-compose.yml 
│   └── .dockerignore      
│
├── firestore.rules        # Security-first Database Validation
├── firebase-blueprint.json # Schema Definition & Seed Data
└── metadata.json          # System Permissions Manifest



## how to Run this : => MVP :
# Install dependencies (Root)
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build


## Sys Design :

![plot](./dist/assets/architecture/system_designe.png)

