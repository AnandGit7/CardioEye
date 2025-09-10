# Overview

CardioEye is a real-time cardiac monitoring platform that connects patients, doctors, and healthcare administrators through continuous ECG monitoring and intelligent health alerts. The system provides real-time visualization of cardiac data, automated health alerts based on configurable thresholds, and multi-channel communication through WhatsApp, SMS, email, and push notifications. Built as a full-stack web application with React frontend and Express backend, it integrates with PostgreSQL for data persistence and Twilio for communication services.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development patterns
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture
- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js for REST API endpoints and middleware
- **Authentication**: Replit Auth integration with OpenID Connect using Passport.js strategy
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Real-time Communication**: WebSocket server for live notifications and ECG data streaming
- **API Design**: RESTful endpoints with role-based access control (patient/doctor/admin)

## Database Layer
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Relational model supporting users, patients, doctors, ECG readings, health alerts, and notification preferences
- **Connection Pooling**: Neon serverless connection pooling for efficient database access

## Authentication & Authorization
- **Strategy**: Replit Auth with OpenID Connect for secure authentication
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Role-based Access**: Three-tier system (patient, doctor, admin) with endpoint-level protection
- **Security**: HTTP-only cookies, CSRF protection, and secure session management

## Real-time Features
- **WebSocket Implementation**: Native WebSocket server for real-time ECG data and notifications
- **ECG Visualization**: Canvas-based real-time chart rendering with grid overlay
- **Alert System**: Real-time health alerts with severity levels (low, medium, high, critical)
- **Notification Center**: Live notification feed with unread indicators and WebSocket updates

# External Dependencies

## Communication Services
- **Twilio API**: SMS and WhatsApp messaging for critical health alerts
- **Email Service**: Integrated email notifications for non-critical communications
- **Push Notifications**: Web push notifications for real-time browser alerts

## Cloud Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Replit Hosting**: Development and deployment platform with integrated auth services
- **WebSocket Support**: Native WebSocket implementation for real-time features

## Development Tools
- **shadcn/ui**: Pre-built accessible UI components with Tailwind CSS integration
- **Radix UI**: Headless UI primitives for complex interactive components
- **Drizzle Kit**: Database migration and schema management tools
- **ESBuild**: Fast JavaScript bundling for production builds