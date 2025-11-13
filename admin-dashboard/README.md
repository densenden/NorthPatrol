# NorthPatrol Admin Dashboard

Admin Dashboard für das NorthPatrol Security Checkpoint System.

## Tech Stack

- React 19 mit Vite
- Clerk für Authentifizierung
- Supabase als Backend
- React Router für Navigation
- jsPDF & html2canvas für PDF Export

## Entwicklung

1. Installiere Dependencies:
```bash
npm install
```

2. Erstelle eine `.env` Datei basierend auf `.env.example`:
```bash
cp .env.example .env
```

3. Fülle die Umgebungsvariablen in `.env` aus

4. Starte den Dev-Server:
```bash
npm run dev
```

## Vercel Deployment

### Umgebungsvariablen

Im Vercel Dashboard müssen folgende Umgebungsvariablen gesetzt werden:

#### Supabase
- `VITE_SUPABASE_URL` - Deine Supabase Projekt URL
- `VITE_SUPABASE_ANON_KEY` - Dein Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Dein Supabase Service Role Key

#### Clerk
- `VITE_CLERK_PUBLISHABLE_KEY` - Dein Clerk Publishable Key
- `CLERK_SECRET_KEY` - Dein Clerk Secret Key

#### Resend
- `RESEND_API_KEY` - Dein Resend API Key

#### Database
- `DATABASE_URL` - Deine Supabase PostgreSQL Verbindungs-URL

### Deployment Settings

Die `vercel.json` im Root-Verzeichnis ist bereits konfiguriert für:
- Build Command: `cd admin-dashboard && npm install && npm run build`
- Output Directory: `admin-dashboard/dist`
- Framework: Vite

### Deploy Steps

1. Verknüpfe dein GitHub Repository mit Vercel
2. Setze alle Umgebungsvariablen im Vercel Dashboard
3. Deploy wird automatisch bei Push zu `main` ausgelöst

## Features

- Dashboard Übersicht
- QR-Code Generator mit PDF Export (8 pro A4-Seite, 25×25mm)
- Patrol Übersicht und Management
- Benutzer-Authentifizierung mit Clerk
- Responsive Design

## Build

```bash
npm run build
```

Das Build-Ergebnis ist im `dist` Verzeichnis.
