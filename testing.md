# Jak uruchomić testy

## Baza testowa

```bash
cd app && docker compose -f docker-compose.test.yml up -d
```

## Polecenia

```bash
cd app
npm run test             # wszystkie testy
npm run test:unit        # tylko testy jednostkowe
npm run test:integration # tylko testy integracyjne
```
