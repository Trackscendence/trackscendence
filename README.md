Hello, my name is Skyy. Please add a sentence with your name below.

Bon dia! El meu nom és Sergi

Hello, Miha was here.

Wild Muktim appeared

David said hi from Beijing (travelling in Beijing) 


# UNO Trancendence
### Modules we are doing


### Tools we are using
Frontend - React  
Backend - Express  
CSS - Tailwind  
ORM - Prisma  
Database - PostgreSQL  
Proxy - NGINX (production only — serves static frontend and proxies API requests to Express)  
Container - Docker (we evaluated Podman but chose Docker for better macOS stability, mature compose tooling, and smoother developer experience — file formats are identical so switching later is low-cost)

### Branches Policy

Moving forward create a new branch for each ticket/feature/bug. Any one thing you work on should have it's own branch. Once the feature is finish, merge to dev, and then we will push from dev to main.

### How to run it

#### Production mode (with containers)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

1. Clone the repository
```
git clone git@github.com:Trackscendence/trackscendence.git
cd trackscendence
```

2. Copy the environment file and adjust values if needed
```
cp .env.example .env
```

3. Start all services (database, server, client)
```
npm run compose:up
```

4. Open the app at `localhost:8080`

In production, nginx serves the built React frontend and proxies `/api/*` requests to Express, so everything is accessible through a single port (8080).

Other useful commands:
```
npm run compose:logs     # Follow logs from all services
npm run compose:down     # Stop all services
npm run compose:clean    # Stop and remove all data (volumes)
npm run db:shell         # Open a psql shell in the database
```

#### Development mode (with containers + hot reload)

```
npm run compose:dev
```

This starts all three services with hot reload enabled. Nginx is not used in dev mode — you access the frontend and backend directly:
- Frontend: `localhost:5173` (Vite dev server)
- Backend: `localhost:3001` (Node --watch)
- Database: `localhost:5432` (PostgreSQL)

#### Development mode (without containers)

```
npm run install:all
npm run dev
```

- Frontend: `localhost:5173`
- Backend: `localhost:3001`

#### API endpoints

- `localhost:3001/api/ping` — health check (returns pong + timestamp)
- `localhost:3001/api/health` — database connection check

In production mode, these are also accessible via nginx at `localhost:8080/api/...`
