# Customisable Chess Engine Game
This project provides a story-based game where the player goes up against different attackers in a game of chess modelled as battles, with different playing styles, skills, and positioning. This is provided by my own customisable chess engine which runs in the browser in TypeScript. The site is run with Vite + React with TypeScript and the backend is a Flask app over nginx with a SQLite database.  
  
The program uses the secp256r1 elliptic curve to run the ECDSA algorithm with my own implementation of the curve and algorithm used which follows the RFC 6979 standard.  
The project is split into 3 docker containers  
## To run
Simply clone the repository, install docker and docker-compose and add tokens to a tokens.txt file. To start run
```
docker-compose up
``` 
which will host the app on port 8000 of the local machine.