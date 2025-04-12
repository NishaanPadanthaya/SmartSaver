# SmartSaver App

A personal finance management application with budget tracking, savings goals, and financial insights.

## Features

- User authentication with Firebase
- Budget management
- Savings goals tracking
- Financial insights and reports
- Profile management

## Development Setup

### Frontend (React)

1. Navigate to the frontend directory:

```bash
cd SmartSaver/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your Firebase configuration:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

4. Start the frontend development server:

```bash
npm start
```

### Backend (FastAPI)

1. Navigate to the backend directory:

```bash
cd SmartSaver/backend
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up your Firebase service account:
   - Download your Firebase service account key from the Firebase console
   - Save it as `serviceAccountKey.json` in the backend directory

5. Start the backend server:

```bash
python main.py
```

## Development Mode (No MongoDB Required)

If you don't have MongoDB installed or available, the application will use an in-memory database for development:

1. Start the backend server as normal:

```bash
python main.py
```

2. In the frontend, enable "Dev Mode" by clicking the "Dev Mode: OFF" button in the navigation bar
3. This allows you to use the application without Firebase authentication or MongoDB

## API Endpoints

- `/api/users` - User profile management
- `/api/budgets` - Budget management
- `/api/savings` - Savings goals management

## Deployment

Instructions for deploying to production will be added in a future update.