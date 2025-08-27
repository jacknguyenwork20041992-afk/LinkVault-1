# Document Management System for Language Center

## Overview

This is a full-stack web application designed for managing educational documents and programs at a language learning center. The system features role-based access control with admin and user roles, where admins can manage programs, categories, documents, users, and notifications, while regular users can view and access learning materials. The application is built using modern web technologies with a focus on Vietnamese language interface and educational content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for end-to-end type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints with role-based access control middleware

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Core Tables**:
  - Users table with role-based permissions (admin/user)
  - Programs table for educational programs with difficulty levels
  - Categories table linked to programs for content organization
  - Documents table storing Google Drive links and metadata
  - Notifications system with global and targeted messaging
  - Sessions table for authentication state persistence

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC protocol for secure login flows
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role Management**: Admin and user roles with middleware-enforced permissions
- **Access Control**: Route-level protection with admin-only endpoints for management functions

### File Management Strategy
- **Document Storage**: Google Drive integration for document hosting
- **Metadata Storage**: Local database storage for document information and categorization
- **File Types**: Support for various document formats (PDF, DOC, XLS, PPT) with appropriate icons

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration toolkit
- **express**: Web application framework for API endpoints
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React routing library

### UI & Styling
- **@radix-ui/***: Headless UI components for accessibility and consistency
- **tailwindcss**: Utility-first CSS framework for styling
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe CSS class management

### Authentication & Security
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware for Express
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development Tools
- **vite**: Build tool and development server with hot reload
- **typescript**: Static type checking for enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Form Handling & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration layer for validation schemas
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation