Using docker for postgres.
Start database with `docker compose up`
Database available with `DATABASE_URL=postgres://postgres:postgres@localhost:54325/database`

## Migrations

On first launch:
```bash
npm run db:setup
```

## Tests

```bash
docker compose -f docker-compose.test.yml up -d
npm run test

# only unit or integration:
npm run test:unit
npm run test:integration
```
