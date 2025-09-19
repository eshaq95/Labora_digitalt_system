<<<<<<< HEAD
# Labora-Digit

A comprehensive warehouse management system designed specifically for laboratory environments, featuring advanced inventory tracking, GS1 barcode support, and professional-grade audit trails.

## Overview

Labora-Digit provides complete inventory lifecycle management from initial synchronization through consumption tracking. The system supports complex laboratory requirements including lot tracking, expiry date management, HMS hazard codes, and structured cycle counting with full audit capabilities.

## Key Features

### Inventory Management
- Real-time inventory tracking with lot-level precision
- Automatic low stock alerts and dashboard indicators
- FEFO (First Expired, First Out) inventory rotation
- Multi-location inventory support with location-based filtering

### Barcode & GS1 Support
- Advanced GS1 barcode parsing with Application Identifier support
- Multiple barcode associations per item with primary designation
- Camera-based scanning with Data Matrix support
- Manual barcode entry with keyboard wedge compatibility

### Receiving & Synchronization
- Structured goods receipt with automatic lot creation
- Initial synchronization wizard for existing inventory
- On-the-fly barcode registration for unknown items
- Automatic expiry date and lot number extraction from GS1 codes

### Cycle Counting
- Structured counting sessions with scope filtering
- Blind counting mode for accuracy improvement
- Automatic discrepancy calculation with recount thresholds
- Approval workflow with atomic inventory adjustments

### Audit & Compliance
- Complete transaction history with user attribution
- Reason code tracking for all inventory movements
- Role-based access control with granular permissions
- Full audit trail for regulatory compliance

## Technical Architecture

### Stack
- **Frontend**: Next.js 15 with React 19, TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with optimized indexing
- **Authentication**: JWT-based with role management
- **Styling**: Tailwind CSS with dark mode support

### Database Design
- Normalized schema with proper foreign key relationships
- Optimized for inventory queries with strategic indexing
- UTC date handling to prevent timezone-related errors
- Atomic transactions for data consistency

### Security
- Server-side authentication middleware
- Role-based route protection
- Input validation with Zod schemas
- Secure cookie-based session management

## API Endpoints

### Core Resources
- `/api/items` - Item catalog management
- `/api/inventory` - Inventory queries and lot management
- `/api/receipts` - Goods receipt processing
- `/api/cycle-counting` - Structured counting sessions

### Specialized Services
- `/api/scan-lookup` - Smart barcode resolution
- `/api/alerts` - System notifications and low stock alerts
- `/api/import/excel` - Bulk data import capabilities

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or pnpm package manager

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env.local`
4. Run database migrations: `npx prisma migrate deploy`
5. Seed initial data: `npx prisma db seed`
6. Start development server: `npm run dev`

### Environment Configuration
```
DATABASE_URL="postgresql://username:password@localhost:5432/labora_digit"
JWT_SECRET="your-secure-jwt-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Usage

### Initial Setup
1. Access the application at `http://localhost:3000`
2. Log in with administrator credentials
3. Configure departments, categories, and locations
4. Import existing item catalog via CSV or Excel
5. Perform initial inventory synchronization

### Daily Operations
- Use "Scan & Go" for quick inventory consumption
- Process goods receipts through the Mottak module
- Monitor inventory levels via the Lagerstatus dashboard
- Execute periodic cycle counting for accuracy

### Administration
- Manage user roles and permissions
- Configure low stock thresholds and alerts
- Review audit trails and transaction history
- Export data for external reporting

## Development

### Code Organization
- `pages/` - Application routes and page components
- `components/` - Reusable UI components and forms
- `app/api/` - Backend API route handlers
- `lib/` - Utility functions and shared logic
- `prisma/` - Database schema and migrations

### Key Components
- **BarcodeScanner**: Camera-based scanning with fallback options
- **ReceiptForm**: Structured goods receipt processing
- **CycleCountingSession**: Professional inventory counting workflow
- **GlobalSearch**: Command palette-style navigation

### Testing
Run the test suite: `npm test`
Type checking: `npm run type-check`
Linting: `npm run lint`

## Deployment

### Production Build
1. Build the application: `npm run build`
2. Configure production environment variables
3. Deploy to your preferred hosting platform
4. Run database migrations in production
5. Configure SSL certificates and security headers

### Recommended Infrastructure
- Application server with Node.js runtime
- PostgreSQL database with regular backups
- Redis for session storage (optional)
- CDN for static asset delivery

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

## License

This project is proprietary software developed for laboratory inventory management. All rights reserved.
