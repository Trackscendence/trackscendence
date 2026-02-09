# Trackscendence

Where frames are sparse, and frustration is high

## About
This project has been created as part of the 42 curriculum.



## Instructions

### Installation

In the folder where you would like to install this project, run;  

``` sh
git clone https://github.com/Trackscendence/trackscendence.git
cd ./trackscendence
```
For git clone:
 - git clone repo
 - Make to `cp srcs/.env.example srcs/.env` and adjust the vars for your system. 
 - You need to assign the LOGIN value to the whatever you call the git repo, such as `trackscendence`
 - run `make`
 - make sure `etc/hosts/` has this line: `127.0.0.1 trackscendence.42.fr`
 - Visit: `trackscendence.42.fr` (Only works in Firefox or browswer that accept self sign certificates, this well be changed ASAP to work with Chrome)

### Building and Running

After the project is installed, running the following command will start the server
``` sh
make fclean
make all
```



<!-- ## Frameworks

Frontend Framework: React
Backend Framework: Fastify with Node.js
CSS Framework: Tailwind with CSS
-->



## Team
| Name | Role | 42 Username | Github Profile |
| - | - | - | - |
| Muktim Coskuner | Project Manager(PM) / Scrum Master | mcoskune | [Muktim] |
| Mihaela Tocu | Database | mtocu | [mihaellatocu] |
| Skyy Moore | Technical Lead / Architect | smoore | [mooreApps22] |
| Sergio Rodrigo De Los Rios | Product Owner (PO) | srodrigo | [sroderic]

[Muktim]: https://github.com/Muktim
[mihaellatocu]: https://github.com/mihaellatocu
[mooreApps22]: https://github.com/mooreApps22
[sroderic]: https://github.com/sroderic
