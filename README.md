Hello, my name is Skyy. Please add a sentence with your name below.

Bon dia! El meu nom és Sergi

Hello, Miha was here.

Wild Muktim appeared

David said hi from Beijing (travelling in Beijing) 

# UNO Trancendence

*This project has been create as part of the 42 curriculum by mcoskune, mtocu, smoore, srodrigo, and szhong.*

**Rules:**
- 2-10 players
-	Ages 7+
-	At the start, every player gets 7 cards dealt face down
	-	All other cards start in draw pile
	-	The top card is placed FACE UP on the Discard Pile before the game starts
-	Cards are placed on the Discard Pile when used
-	The first player is the player left of the dealer (or the youngest if voted for)
-	You can only discard (play) a card that MATCHES the face up card by NUMBER, COLOR, or SYMBOL/ACTION, or a wild card and you GET TO CHOOSE THE COLOR IN PLAY
-	The next player is always the player to the left
-	IF THE FIRST CARD IS AN ACTION CARD IT APPLIES TO THE FIRST PLAYER
-	IF THE FIRST CARD IS WILD IT GOES BACK INTO THE DESK AND THE DRAW DECK IS SHUFFLED
-	If a player has NO MATCHES or CHOOSES NOT TO PLAY A CARD (despite having a match), then they MUST DRAW a card
-	A player can only play one card at a time
-	The game continues until a player has ONE CARD LEFT and the player must yell “UNO!”
- IF another player catches some playing their last card and NOT saying "Uno!" the player must draw two cards as a PENALTY
-	Once a player has ZERO CARD, that player WINS THE GAME
-	If the draw deck is EMPTY, then the discard deck is RESHUFFLED
-	The top card of the draw deck remains the top card of the draw deck

### Module 

**Modules we are doing:**
-	Web: use frontend/backend framework (React/Express) **2 pts**
-	Web: WebSockets **2pts**
	-	Real-time updates across all clients
	-	Handle connection/disconnection gracefully
	-	Efficient message broadcasting
-	Web: User chat **2 pts**
	-	A basic chat system (send/receive messages)
	-	A profile system (view user info)
	-	A friend system (add/remove friends, see friends list)
-	Web: public API for interact with the database (PostGres) **2 pts**
	-	Secure API key
	-	Rate limiting
	-	Documentation
	-	At least 5 endpoints:
		-	GET /api/{something}
		-	POST …
		-	PUT …
		-	DELETE …
-	Web: use an Object-Relational Maper (ORM) for the database (PostGres) **1 pt**
-	Web: Search functionality with filter, sorting, and pagination **1pt**
-	Web: File upload and management system **1 pt**
-	User Management: Standard user management and authentication **2 pts**
	-	User can update their profile info
	-	Users can upload an avatar (or given a default avatar
	-	Users can add other users as friends and see their online status
	-	Users have a profile page displaying their info
-	AI: AI Opponent for games  **2 pts (MAYBE)**
	-	AI must be able to put up a fight
	-	AI should not be perfect
	-	If you implement game customization options, the AI must be able to use them
	-	You must be able to explain your AI during evaluation
-	Gaming: Users can play against each other in real time **2pt**
-	Gaming: Three or more players can play against each other **2pt**

**17-19 pts** Only 14 pts need to pass evaluation.

# Tools we are using

### We are using the PERN stack: Postgres + Express + React + Node

**This is the tenative diagram for the app:**

![Diagram Image](/assets/uno_pern_diagram.jpg)

**Containers:**

- [Podman](https://podman.io/docs)

**Reverse proxy:**

- [Nginx](https://nginx.org/)

- [Nginx JS](https://nginx.org/en/docs/njs/)

**Frontend:**

- [React](https://react.dev/?utm_source)

- [Vite](https://vite.dev/guide/why)

- [npm](https://docs.npmjs.com/about-npm)

- [Tailwind CSS](https://v2.tailwindcss.com/docs/installation)

**Backend:**
	
- [Node.js](https://nodejs.org/en)

- [npm](https://docs.npmjs.com/about-npm)

- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

- [Express](https://expressjs.com/)

- [WebSockets](https://www.npmjs.com/package/websockets)

**Database:**
	
- [Postgres](https://www.postgresql.org/)

- [Prisma (ORM)](https://www.prisma.io/docs/orm)

# Team Work

### Branches Policy

- Create a new branch for each ticket/feature/bug. Any one thing you work on should have it's own branch.
- Once the feature is finish, merge to dev, and then after a review by another team member, we will push from dev to main.

### GitHub Issues

**What each Scrum category means:**
- Backlog: This is a task that needs to be done, but is not ready to take on.
- Ready: This task is ready for some to begin work on, but no one has been aassigned or the task has been started yet.
- In Progress: This task has been assigned and someone is currently working on it.
- Done: This task has been finished and is ready for review, so it can be determined if the can be merged.
