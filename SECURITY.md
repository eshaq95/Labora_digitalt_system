# Sikkerhetsguide for Labora Digitalt System

## Implementerte sikkerhetsforbedringer

### 1. Database-credentials ut av versjonskontroll ✅
- **Problem:** Sensitive database-credentials var hardkodet i `.env` filer
- **Løsning:** 
  - Opprettet `env.example` med placeholder-verdier
  - Alle sensitive verdier må nå settes i miljøvariabler
  - `.env` filer er ekskludert fra Git via `.gitignore`

### 2. Sikker passordhåndtering ✅
- **Problem:** Alle passord ble akseptert med hardkodet streng
- **Løsning:**
  - Implementert bcrypt-hashing for alle passord
  - Per-bruker passordverifisering
  - Sikker passordlagring i database

### 3. Sterk JWT secret-håndtering ✅
- **Problem:** Fallback til 'labora-secret-key' hvis JWT_SECRET ikke var satt
- **Løsning:**
  - Påkrevd JWT_SECRET miljøvariabel
  - Server feiler hvis JWT_SECRET ikke er satt
  - Ingen fallback til usikre standardverdier

### 4. API-rute autentisering ✅
- **Problem:** Kritiske API-ruter manglet autentisering
- **Løsning:**
  - Opprettet `lib/auth-middleware.ts` med JWT-basert autentisering
  - Alle kritiske API-ruter krever nå autentisering
  - Rolle-baserte tilgangskontroller implementert

## Autentiserte API-ruter

### Krever kun innlogging:
- `GET /api/items` - Hent varekartotek
- `GET /api/suppliers` - Hent leverandører
- `GET /api/inventory` - Hent lagerstatus
- `GET /api/orders` - Hent bestillinger
- `GET /api/receipts` - Hent mottak

### Krever ADMIN eller PURCHASER rolle:
- `POST /api/items` - Opprett vare
- `POST /api/suppliers` - Opprett leverandør
- `POST /api/orders` - Opprett bestilling
- `POST /api/import/excel` - Importer Excel-filer

### Krever ADMIN, PURCHASER eller LAB_USER rolle:
- `POST /api/receipts` - Registrer varemottak

## Miljøvariabler som kreves

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/labora_digit"

# JWT Secret (MÅ være minst 32 tegn)
JWT_SECRET="your-super-secret-jwt-key-here-minimum-32-characters"

# Environment
NODE_ENV="production"
```

## Sikkerhetsanbefalinger for produksjon

1. **Generer sterk JWT_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Bruk HTTPS i produksjon:**
   - Sett `NODE_ENV=production`
   - Konfigurer SSL-sertifikater

3. **Database-sikkerhet:**
   - Bruk separate database-brukere for applikasjon
   - Begrens database-tilgang til kun nødvendige operasjoner
   - Regelmessige sikkerhetsbackups

4. **Overvåkning:**
   - Logg alle autentiseringsforsøk
   - Overvåk mislykkede innloggingsforsøk
   - Spor alle kritiske operasjoner

## Brukerroller og tilganger

- **ADMIN:** Full tilgang til alle funksjoner
- **PURCHASER:** Kan administrere varer, leverandører og bestillinger
- **LAB_USER:** Kan registrere mottak og bruke systemet
- **VIEWER:** Kun lesetilgang (ikke implementert ennå)

## Sikkerhetstesting

For å teste sikkerhetsimplementasjonen:

1. **Test uten autentisering:**
   ```bash
   curl http://localhost:3000/api/items
   # Skal returnere 401 Unauthorized
   ```

2. **Test med ugyldig token:**
   ```bash
   curl -H "Cookie: auth-token=invalid" http://localhost:3000/api/items
   # Skal returnere 401 Unauthorized
   ```

3. **Test rolle-basert tilgang:**
   ```bash
   # Logg inn som LAB_USER og prøv å opprette vare
   # Skal returnere 403 Forbidden
   ```

## Oppfølging

- [ ] Implementer rate limiting for API-ruter
- [ ] Legg til CSRF-beskyttelse
- [ ] Implementer session timeout
- [ ] Legg til to-faktor autentisering
- [ ] Implementer audit logging
