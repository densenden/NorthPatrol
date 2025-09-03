# NorthPatrol MVP

A security patrol tracking system that enables guards to scan QR code checkpoints and log their status, with admin oversight and email notifications.

## Features

- **QR Code Scanning**: Guards scan 20 sequential checkpoints via QR codes
- **Status Logging**: Mark each checkpoint as "OK" or "Not OK" with mandatory notes for issues
- **Email Notifications**: Automatic alerts to admins when notes exist or checkpoints are skipped
- **Admin Dashboard**: Complete oversight of patrols, timestamps, and notes
- **Role-based Access**: Separate scanner and admin roles via Clerk authentication

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk (email-only magic links)
- **QR Scanner**: @yudiel/react-qr-scanner
- **Email**: Resend API
- **UI Design**: iOS 26 / Liquid Glass UI principles

## Quick Start

### Prerequisites

- Node.js v20+
- Supabase account
- Clerk account
- Resend account for email notifications

### Installation

1. Clone the repository
```bash
git clone [your-repo-url]
cd NorthPatrol
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `RESEND_API_KEY`: Your Resend API key

4. Set up Supabase database
```bash
npx supabase start
npx supabase db push
```

5. Run development server
```bash
npm run dev
```

## Project Structure

```
NorthPatrol/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Route pages
│   ├── services/        # API services
│   ├── contexts/        # React contexts
│   └── utils/           # Helper functions
├── admin-dashboard/     # Separate admin app
├── supabase/           # Database migrations
└── public/             # Static assets
```

## Development Plan

### Phase 1: Foundation (Week 1)
- ✅ Project setup with Vite + React
- ✅ Supabase database schema
- ⬜ Clerk authentication integration
- ⬜ Basic routing structure

### Phase 2: Core Features (Week 2)
- ⬜ QR scanner component
- ⬜ Checkpoint scan flow
- ⬜ Session management
- ⬜ Database CRUD operations

### Phase 3: Admin & Notifications (Week 3)
- ⬜ Admin dashboard layout
- ⬜ Patrol history view
- ⬜ Resend email integration
- ⬜ Alert system for issues

### Phase 4: Polish & Deploy (Week 4)
- ⬜ iOS 26 UI styling
- ⬜ Inter font integration
- ⬜ Testing & bug fixes
- ⬜ Production deployment

## Database Schema

- **users**: User accounts with roles
- **checkpoints**: 20 predefined QR locations
- **sessions**: Patrol sessions with timing
- **scans**: Individual checkpoint scans with status

## Missing Configuration

To complete setup, you need:
1. **Supabase Project**: Create at https://supabase.com
2. **Clerk Application**: Set up at https://clerk.dev
3. **Resend Account**: Register at https://resend.com
4. Add credentials to `.env` file

## Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## License

Private - All rights reserved