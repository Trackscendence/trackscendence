_This project has been created as part of the 42 curriculum by smoore, srodrigo, szhong, ogrativ, and dmelnyk._

<div align="center">
  <h1>🎮 Trackscendence</h1>
  <p>A modern, real-time multiplayer online web application featuring the classic UNO card game.</p>

  <!-- Tech Stack Badges -->

<a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=flat-square&logo=react" alt="React" /></a>
<a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Backend-Express%20%7C%20Node.js-green?style=flat-square&logo=node.js" alt="Express" /></a>
<a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql" alt="PostgreSQL" /></a>
<a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/ORM-Prisma-black?style=flat-square&logo=prisma" alt="Prisma" /></a>
<a href="https://socket.io/"><img src="https://img.shields.io/badge/RealTime-Socket.io-black?style=flat-square&logo=socket.io" alt="Socket.io" /></a>
<a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Container-Docker-blue?style=flat-square&logo=docker" alt="Docker" /></a>

</div>

<br />

---

## Table of Contents

1. [Description & Key Features](#1-description--key-features)
2. [UNO Game Rules](#2-uno-game-rules)
3. [Security & Authentication](#3-security--authentication)
4. [System & Database Architecture](#4-system--database-architecture)
5. [Target Modules (19 Points Target)](#5-target-modules-19-points-target)
6. [Getting Started](#6-getting-started)
7. [Developer Documentation](#7-developer-documentation)
8. [Team Information](#8-team-information)
9. [Resources & AI Usage](#9-resources--ai-usage)

---

## 1. Description & Key Features

**Trackscendence** is a full-stack, secure, and highly performant web application built from scratch to deliver a seamless online multiplayer gaming experience. The platform synchronizes game sessions, handles real-time peer interactions, and ensures robust account security.

### Key Features

- **Real-Time Gameplay**: Live multiplayer matching and an advanced UNO game engine logic via WebSockets.
- **Secure Authentication**: JWT-based auth, anonymous guest login, and 2FA support.
- **User Ecosystem**: Customizable user profiles, statistics, peer friendships, and relationship status tracking.
- **Live Interaction**: Real-time messaging, chat lobbies, and secure WebSocket authentication.

---

## 2. UNO Game Rules

Our multiplayer engine implements the classic rules of UNO:

- **Players & Age**: Supports **2 to 6 players**, recommended for ages 7+.
- **Setup**: Every player is dealt **7 cards** face down. Remaining cards form the _Draw Pile_. The top card is flipped face up to form the _Discard Pile_.
- **Gameplay**:
  - The player to the left of the dealer starts.
  - Players must match the top card of the Discard Pile by **Color, Number, or Action/Symbol**.
  - **Wild Cards** can be played at any time, allowing the player to select the active color.
  - If a player has no matches (or chooses not to play), they must **draw one card** from the Draw Pile.
  - If the first card flipped from the Draw Pile is an Action card, its effect applies to the first player.
- **Yelling "UNO!"**: When a player has exactly **1 card** remaining, they must yell **"UNO!"**. If caught by another player before the next turn begins, they must draw 2 penalty cards.
- **Winning**: The first player to discard all of their cards wins the game.
- **Reshuffling**: If the Draw Pile is exhausted, the Discard Pile is reshuffled (leaving the top card) to rebuild the Draw Pile.

---

## 3. Security & Authentication

Our platform enforces robust security mechanisms to protect user accounts and game history:

- **Password Policies**: Strong password strength validation and secure authenticated password change procedures.
- **Password Reset**: Expiring password reset tokens delivered securely via Mailpit or configured SMTP server.
- **Identifier Login**: The standard login form accepts either the account email address or username, normalizes the identifier, and sends the same generic failure message for invalid credentials.
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with backup recovery codes. Managed directly via the authenticated User Settings page.
- **Account Protection**: Automated failed login lockout thresholds and session security features.
- **42 OAuth Login**: "Continue with 42" signs users in through the 42 intra (authorization-code flow, `public` scope). A first login provisions an account from the intra profile; an intra email that matches an existing account links the 42 identity to it instead, still gated by 2FA when enabled. The server exchanges the code, issues the platform's own JWT, and never stores intra tokens.

42 login is optional per environment: set `FORTYTWO_CLIENT_ID`, `FORTYTWO_CLIENT_SECRET`, and `FORTYTWO_REDIRECT_URI` (see `.env.example`) and register the redirect URI on the intra application. The login button enables itself wherever the server reports credentials via `GET /api/v1/auth/providers`; without them it stays a disabled "Soon" placeholder.

For detailed configurations, endpoints, flowcharts, and Postman setups:

- 📖 **[Two-Factor Authentication Guide](docs/two-factor-auth.md)**
- 🚀 **[Postman Auth & 2FA Flow Setup](docs/postman/README.md)**

---

## 4. System & Database Architecture

### System Architecture

The platform is orchestrated using Docker Compose, decoupling services into distinct containers managed under a shared virtual network:

- **Nginx (Reverse Proxy)**: Acts as the single entry point on port `8080`, routing traffic to the frontend or API gateway.
- **Frontend (Client)**: A React SPA served via Vite in development, and built/served through Nginx in production.
- **Backend (Server)**: An Express API handling REST endpoints and real-time state synchronization via Socket.IO.
- **Database**: PostgreSQL database managed through Prisma ORM migrations.

For the system topology and dependency layer diagrams, see
**[System Architecture](docs/architecture.md)**.

### Database Schema

Our database relational schema is defined in Prisma and is automatically kept up-to-date. You can view the live entity-relationship diagram here:

👉 **[Live Database ERD Diagram](docs/ERD.md)**

_Note: Regenerate the ERD diagram inside the `/docs` folder with `npm run docs:erd --prefix server`._

## 5. Target Modules (21 Points Target)

To exceed the mandatory 14 points required for evaluation, our project implements the following modules (targeting a total of 21 points):

<details>
<summary><strong>Click to expand target modules status</strong></summary>
<br>

| Category     | Module                         | Type         | Status         | Justification                                                                               |
| ------------ | ------------------------------ | ------------ | -------------- | ------------------------------------------------------------------------------------------- |
| **Web**      | Framework for Frontend/Backend | Major (2pts) | 🟢 Implemented | Used React for the frontend and Express for the backend.                                    |
| **Web**      | WebSockets                     | Major (2pts) | 🟢 Implemented | Real-time updates, graceful disconnections, and efficient broadcasting via Socket.IO.       |
| **Web**      | User Chat                      | Major (2pts) | 🟢 Implemented | Direct messages, chat channels, and social notifications fully functional.                  |
| **Web**      | Public API                     | Major (2pts) | 🟢 Implemented | API-key-secured `/api/v1/public` endpoints with per-key rate limiting and Swagger docs.     |
| **Web**      | Use an ORM                     | Minor (1pt)  | 🟢 Implemented | Used Prisma for type-safe relational mapping and migrations.                                |
| **Web**      | Search Functionality           | Minor (1pt)  | 🟢 Implemented | Leaderboard search, multi-criteria filters, sorting, pagination, and user directory search. |
| **Web**      | File Upload                    | Minor (1pt)  | 🟢 Implemented | Profile avatar uploads with byte-signature checks and storage limits via Multer.            |
| **User Mgt** | Standard User Management       | Major (2pts) | 🟢 Implemented | Credentials signup, secure login, account freeze policies, password recovery, and TOTP 2FA. |
| **User Mgt** | Remote Authentication (42)     | Major (2pts) | 🟢 Implemented | "Continue with 42" OAuth login with account provisioning and email-based account linking.   |
| **Gaming**   | Web-based Game                 | Major (2pts) | 🟢 Implemented | Fully functional UNO game engine with card logic, drawing deck, and "UNO" catching rules.   |
| **Gaming**   | Multiplayer 3+                 | Major (2pts) | 🟢 Implemented | Multiplayer lobby and game loop supporting up to 10 players at a table.                     |
| **Gaming**   | AI Opponent / Bot Player       | Major (2pts) | 🟢 Implemented | Backend bot service implementing multiple strategy profiles for solo play (Bonus Module).   |

</details>

---

## 6. Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine
- [Node.js](https://nodejs.org/en) & npm (if running locally without Docker)

### Installation & Configuration

1. **Clone the repository**
   ```bash
   git clone git@github.com:Trackscendence/trackscendence.git
   cd trackscendence
   ```
2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   > **Note:** The `.env.example` file is heavily documented inline. Review it to understand port configurations, database credentials, and security keys. Make sure ports `3001` (Backend API), `5173` (Frontend), and `5432` (PostgreSQL) are free on your host machine.

### Execution

We use Docker to guarantee environment parity across development and production deployments.

**Development Mode (Hot-reloading enabled):**

```bash
npm run compose:dev
```

- Frontend Application: `http://localhost:5173`
- Backend API: `http://localhost:3001`

**Production Mode (Nginx Reverse Proxy):**

```bash
npm run compose:up
```

- Consolidated Web Application: `https://localhost:8443`

The production stack terminates HTTPS in nginx with a self-signed certificate
generated at container start, so browser-to-backend traffic (including the
websocket, which upgrades to `wss://`) is encrypted. The first visit shows a
one-time "your connection is not private" warning; accept it to proceed, which
is expected for a locally-run project. Plain `http://localhost:8080` redirects
to the HTTPS origin. Set `CLIENT_HTTPS_PORT` in `.env` to change the port.

**Local Mode (no Docker):**

```bash
npm run dev
```

Requires a running PostgreSQL and a filled `.env`. The browser talks only to
the Vite origin (`http://localhost:5173`); API and websocket traffic is
proxied to the backend, which the `dev` script assumes is on
`http://localhost:3001`. If your backend runs elsewhere, set
`VITE_API_PROXY_TARGET` accordingly.

---

## 7. Developer Documentation

For details on database migrations, project directory structures, lints/spelling tools, and git contribution workflows, please check out our dedicated **[Developer & Contribution Guide](docs/DEVELOPER_GUIDE.md)**.

For how the app is deployed and how the CD pipeline ships to Railway, see the **[Deployment Runbook](docs/deployment-railway.md)**.

---

## 8. Team Information

_(Note: As per 42 evaluation guidelines, only active team members participating in the final evaluation are listed)._

| GitHub Login | Intra 42 Login | Assigned Role(s)    | Responsibilities                                                                          |
| ------------ | -------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `adshz`      | `szhong`       | Tech Lead & PO      | Product vision, technical decisions, core UNO engine, frontend, and overall architecture. |
| `skyy`       | `smoore`       | Scrum Master & Dev  | Team organization, meeting facilitation, auth lockout thresholds, and Swagger schemas.    |
| `olehov`     | `ogrativ`      | Security Lead & Dev | TOTP 2FA engine, secure Friendship API limits, and SMTP password reset configuration.     |
| `sergi`      | `srodrigo`     | Frontend Dev        | Real-time WebSocket connection lifecycle, basic chat flow, and frontend integration.      |
| `demm05`     | `dmelnyk`      | Developer & QA      | QA validation, deck generation rules, Privacy & Terms screens, and miscellaneous tasks.   |

<details>
<summary><strong>Click to view detailed individual contributions</strong></summary>
<br>

> [!NOTE]
> **Workflow Note:** Contributions were managed collaboratively through GitHub Pull Requests. The team peer-reviewed each other's code (with automated assistance from CodeRabbit and GitHub Copilot) and utilized squash-and-merge integration. Thus, individual branch histories are consolidated into main-branch PR merge commits.

### `smoore` (skyy)

- **Contributions**: Implemented login credential normalization, secured account credentials database structures, defined initial API specs in Swagger comments, and implemented failed login lockout safety bounds.
- **Challenges Faced**: Resolving edge cases with normalized usernames vs emails during sign-ups and setting appropriate thresholds to avoid locking out legitimate users.

### `srodrigo` (sergi)

- **Contributions**: Initialized the React and Express project skeletons, designed the initial Socket.IO backend service adapters, built the basic chat UI, and handled initial player seating coordinates in game rooms.
- **Challenges Faced**: Handling concurrent connection interruptions in Socket.IO without dropping client session credentials.

### `szhong` (adshz)

- **Contributions**: Architected the frontend design and refactoring, introduced Zustand for robust client-side state management, authored the full 2-to-10 player UNO card turn-management engine, engineered socket-enforced turn/penalty timers, and resolved key database query bottlenecks.
- **Challenges Faced**: Implementing concurrent state locking to resolve race conditions on simultaneous button-clicks by multiple players at the end of turn boundaries, and managing complex UI state syncs.

### `ogrativ` (olehov)

- **Contributions**: Implemented user setting controls for TOTP 2FA secret generation, confirmed recovery-code encryption wrappers, designed the friendship acceptance/blocking REST controller routes, and configured production-grade nodemailer transactional reset mail flows.
- **Challenges Faced**: Managing asymmetric encryption schemes for recovery-code storage safely within the Postgres schema context.

### `dmelnyk` (demm05)

- **Contributions**: Developed baseline deck models and color-action-type lookup rules, implemented socket connection authentication layers, created the responsive Privacy Policy and Terms of Service screen layouts, and coordinated general QA validations.
- **Challenges Faced**: Sanitizing rich text layouts for legal compliances while keeping structural rendering highly responsive across desktop and mobile browsers.

</details>

---

## 9. Resources & AI Usage

- **Core Documentation**: [React Docs](https://react.dev/), [Zustand](https://zustand-demo.pmnd.rs/), [Prisma](https://www.prisma.io/docs), [Socket.io](https://socket.io/docs/v4/).
- **AI Usage**:
  - **Pull Request Reviews**: Utilized AI assistants (primarily CodeRabbit, and GitHub Copilot reviews when not restricted by personal usage limits) to review Pull Requests and inspect code changes.
  - **Research & Learning**: Used AI tools to research framework APIs, look up configurations, and learn new technical concepts, with exact usage varying by team member.
