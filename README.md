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
Proxy - NGINX  
Container - Podman containers (if too much of a hassle, we can return back to Docker, but Podman should be faster)

### Branches Policy

Moving forward create a new branch for each ticket/feature/bug. Any one thing you work on should have it's own branch. Once the feature is finish, merge to dev, and then we will push from dev to main.

### How to run it
Clone the repository and install dependencies
```
git clone git@github.com:Trackscendence/trackscendence.git
cd trackscendence
npm run install:all
```

Build the frontend
```
npm run build
```

Run the backend
```
npm start
```

go to localhost:3001

alternatively you can ping the API at localhost:3001/api/ping

To run the project in developement mode:
```
npm run dev
```

go to localhost:5173