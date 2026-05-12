# Instalacija — Pametna pozornica

## Preduvjeti

| Alat | Minimalna verzija | Provjera |
|------|-------------------|----------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |

Preuzmite Node.js s [nodejs.org](https://nodejs.org/) (LTS verzija uključuje npm).

---

## Korak 1 — Preuzimanje projekta

```bash
git clone <url-repozitorija>
cd smart-stage
```

Ili raspakirati ZIP arhivu i otvoriti direktorij u terminalu.

---

## Korak 2 — Instalacija serverskih ovisnosti

```bash
cd server
npm install
```

Instalira: `express`, `socket.io`, `aedes`, `aedes-server-factory`, `mqtt`, `dotenv`.

### Opcionalna konfiguracija

```bash
cp .env.example .env
```

Zadane vrijednosti rade bez izmjena. Uredite `.env` samo ako su portovi 3001 ili 1883 zauzeti:

```
PORT=3001
MQTT_PORT=1883
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

---

## Korak 3 — Instalacija klijentskih ovisnosti

```bash
cd ../client
npm install
```

Instalira: `react`, `react-dom`, `socket.io-client`, `vite`, `@vitejs/plugin-react`.

### Opcionalna konfiguracija

```bash
cp .env.example .env
```

Uredite samo ako server radi na drugoj adresi:

```
VITE_SERVER_URL=http://localhost:3001
```

---

## Korak 4 — Pokretanje (razvoj)

Otvorite **dva terminala**:

**Terminal 1 — Server:**
```bash
cd server
npm run dev
```

Očekivani ispis:
```
[INFO] MQTT broker pokrenut na portu 1883
[INFO] Server pokrenut na http://localhost:3001
[INFO] DeviceManager spojen na MQTT broker
```

**Terminal 2 — Klijent:**
```bash
cd client
npm run dev
```

Očekivani ispis:
```
  VITE v8.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Otvorite [http://localhost:5173](http://localhost:5173) u pregledniku.

---

## Pokretanje testova

Server mora biti pokrenut. U novom terminalu:

```bash
cd server
npm test
```

Ili direktno:
```bash
node tests/test-flow.js
```

---

## Produkcijska izgradnja

```bash
cd client
npm run build
```

Izlaz je u `client/dist/`. Servira se kao statički sadržaj putem bilo kojeg web servera.

---

## Rješavanje čestih problema

### `EADDRINUSE: address already in use :::3001`
Port 3001 je zauzet. Pronađite i ugasite proces:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill
```
Ili promijenite `PORT=3002` u `server/.env`.

### `EADDRINUSE: address already in use :::1883`
MQTT port zauzet (možda je pokrenut Mosquitto). Promijenite `MQTT_PORT=1884` u `server/.env`.

### Klijent ne vidi server ("Nije spojeno")
- Provjerite da server radi (`http://localhost:3001` treba vratiti JSON odgovor)
- Provjerite `VITE_SERVER_URL` u `client/.env`
- Provjerite vatrozid — portovi 3001 i 5173 moraju biti otvoreni

### `Cannot find module 'socket.io-client'` u testovima
```bash
cd server
npm install
```

### Izgubili se podaci nakon restarta
Podaci se čuvaju u `server/data/*.json`. Ako ti fajlovi ne postoje, koriste se defaultni podaci. Koristite **Izvezi** gumb u aplikaciji za backup prije restarta.
