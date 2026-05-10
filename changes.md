changes

compose.dev yaml

  adminer:
    image: adminer
    ports:
      - "8081:8080"
    depends_on:
      - database

root package.json
"compose:dev_down": "docker compose -f compose.yaml -f compose.dev.yaml down",
"prisma:migrate": "docker compose exec server npm run prisma:migrate"
