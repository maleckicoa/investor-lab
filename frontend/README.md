# Frontend

A Next.js frontend application for visualizing ETL summary data from the financial data pipeline.

## Features

- **ETL Summary Dashboard**: Visualize data processing counts over time
- **Interactive Charts**: Line charts showing trends and bar charts for breakdowns
- **Data Table**: Detailed view of all ETL summary records
- **Responsive Design**: Works on desktop and mobile devices
- **Clean Styling**: Modern UI using inline styles and CSS

## Prerequisites

- Node.js 18+ 
- PostgreSQL database running with the `investor_lab_db` database
- ETL service running and populating the `raw.etl_summary` table

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `env.example` to `.env.local` and update the database connection details:
   ```bash
   cp env.example .env.local
   ```
   
   Update the database credentials in `.env.local`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=investor_lab_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Database Schema

The frontend connects to the `raw.etl_summary` table with the following structure:

```sql
CREATE TABLE raw.etl_summary (
    date DATE PRIMARY KEY,
    day VARCHAR(10),
    fx_cnt INTEGER,
    close_cnt INTEGER,
    vol_cnt INTEGER,
    close_eur_cnt INTEGER,
    close_usd_cnt INTEGER,
    vol_eur_cnt INTEGER,
    vol_usd_cnt INTEGER,
    mcap_cnt INTEGER,
    mcap_eur_cnt INTEGER,
    mcap_usd_cnt INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/etl-summary`: Fetches ETL summary data from the database

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Inline Styles**: Modern CSS-in-JS approach for styling
- **Recharts**: React charting library
- **PostgreSQL**: Database with `pg` driver
- **date-fns**: Date manipulation utilities

## Development

- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── etl-summary/   # ETL summary API
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                    # Utility libraries
│   └── db.ts             # Database connection
├── types/                  # TypeScript type definitions
│   └── etl.ts            # ETL data types
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Troubleshooting

1. **Database Connection Issues**: Ensure PostgreSQL is running and credentials are correct
2. **Missing Data**: Verify the ETL service has populated the `raw.etl_summary` table
3. **Build Errors**: Check TypeScript compilation and dependency installation
4. **Styling Issues**: The app uses inline styles, so no external CSS framework is required 