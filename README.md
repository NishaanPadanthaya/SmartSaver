# AI Finance Platform - SmartSaver

A full-stack AI-powered finance management platform built with Next.js, Tailwind CSS, Prisma, Clerk, Inngest, and more. This application helps users manage their finances, track expenses, set budgets, and get AI-powered insights.
App link - https://smart-saver-rust.vercel.app/

## Features

- User authentication with Clerk
- Dashboard with financial insights and visualizations
- Transaction management with AI receipt scanning
- Account management
- Budget tracking and alerts
- Recurring transactions
- Monthly financial reports
- Responsive design with Tailwind CSS and Shadcn UI

## Prerequisites

- Node.js 18.17.0 or later
- PostgreSQL database
- Clerk account for authentication
- Google Gemini API key for AI features
- Resend account for email functionality
- ArcJet account for security

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-finance-platform
```

### 2. Install dependencies

To install dependencies, use one of the following commands:

```bash
# Option 1: Using legacy peer dependencies flag (recommended for this project)
npm install --legacy-peer-deps

# Option 2: Using force flag
npm install --force
```

> **Note**: This project requires specific versions of React and React DOM (19.0.0-rc-66855b96-20241106) to work with Next.js 15.0.3. The flags above help resolve dependency conflicts.

### 3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/finance_platform
DIRECT_URL=postgresql://username:password@localhost:5432/finance_platform

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_***
CLERK_SECRET_KEY=sk_test_***
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI Features
GEMINI_API_KEY=your_gemini_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Security
ARCJET_KEY=your_arcjet_key
```

### 4. Set up the database

Run the following command to create and apply database migrations:

```bash
npx prisma migrate dev
```

This will create the necessary tables in your PostgreSQL database.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

This command is also automatically run during the installation process.

### 6. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Running in Production

### Build the application

```bash
npm run build
```

### Start the production server

```bash
npm start
```

## Additional Commands

- **Email Development**: To test email templates locally
  ```bash
  npm run email
  ```

- **Linting**: To check code quality
  ```bash
  npm run lint
  ```

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **AI Features**: Google Gemini AI
- **Email**: Resend
- **Background Jobs**: Inngest
- **Security**: ArcJet

## Project Structure

- `/app`: Next.js application routes and components
- `/components`: Reusable UI components
- `/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/actions`: Server actions for data operations

