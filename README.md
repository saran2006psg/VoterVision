# VoteVision TN

A modern web application for visualizing Tennessee electoral district data and voting patterns. Built with Next.js, Leaflet, and PostgreSQL.

## Features

- 🗺️ **Interactive Map** - Explore Tennessee's constituencies with an interactive Leaflet-based map
- 📊 **Election Data Visualization** - View electoral results with color-coded districts by winning party
- 🔍 **Detailed Constituency Information** - Click on districts to view detailed election results
- 🎨 **Color-Coded Visualization** - Visual representation of electoral outcomes by party
- 📍 **GeoJSON Integration** - Precise geographic boundaries for Tennessee constituencies
- ⚡ **Fast & Responsive** - Built with Next.js 15 for optimal performance

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Mapping**: Leaflet, react-leaflet
- **Database**: PostgreSQL with Drizzle ORM
- **Data Processing**: CSV parsing from electoral datasets
- **Deployment Ready**: Supabase integration included

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (optional for development, SQLite works out of the box)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd VoteVision
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure your database connection if using PostgreSQL.

4. **Generate database schema** (if using Drizzle)

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Seed the database**

   ```bash
   npm run seed
   ```

   Or for PostgreSQL:

   ```bash
   npm run seed-pg
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push database schema
npm run seed         # Seed SQLite database
npm run seed-pg      # Seed PostgreSQL database
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── map/               # Map page
├── components/            # React components
│   └── map/              # Map-related components
│       ├── DistrictMap.tsx
│       ├── Legend.tsx
│       ├── MapTooltip.tsx
│       └── SidePanel.tsx
├── db/                    # Database configuration
│   ├── db.ts
│   └── schema.ts
├── lib/                   # Utility functions
│   ├── drizzle.ts
│   └── map/              # Map utilities
└── types/                 # TypeScript type definitions
```

## Data Sources

- **Electoral Data**: Tennessee election results (2021)
- **Geographic Data**: GeoJSON files containing precise boundaries for Tennessee assembly constituencies

## Usage

1. **Navigate to the map**: Click "Phase 2 map" from the home page or visit `/map`
2. **Explore districts**: Click on any constituency to view detailed electoral information
3. **Use the legend**: Refer to the color legend to understand party representation

## Database Setup

### Using SQLite (Development)

The project includes SQLite support for quick development:

```bash
npm run seed
```

### Using PostgreSQL (Production)

For production deployments, configure PostgreSQL:

```bash
npm run db:push
npm run seed-pg
```

### Supabase Integration

The project includes Supabase support. Configure your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Development

### Adding New Features

1. **Create components** in `src/components/`
2. **Add database schemas** in `src/db/schema.ts`
3. **Create migrations** with `npm run db:generate`
4. **Add pages** in `src/app/` following Next.js conventions

### Styling

Tailwind CSS is configured for utility-first styling. Modify `tailwind.config.js` for custom theme settings.

## Production Build

```bash
npm run build
npm run start
```

The application will be optimized and ready for deployment on platforms like Vercel, Netlify, or your own server.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically

### Docker

Create a `Dockerfile` for containerized deployment.

### Other Platforms

Ensure Node.js 18+ is available and run the build and start scripts.

## Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

ISC - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Roadmap

- [ ] Phase 2: Enhanced district analysis
- [ ] Historical election trend analysis
- [ ] Comparative visualizations
- [ ] Mobile app optimization
- [ ] Additional state support

---

**VoteVision TN** helps citizens understand electoral data through interactive visualization. Built with ❤️ for informed civic engagement.
