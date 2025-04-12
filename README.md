# Budget App - FARM Stack with Firebase Auth

This is an AI-powered budget management application built with the FARM stack (FastAPI, React, MongoDB) and Firebase Authentication.

## Features

- User registration and authentication with Firebase
- User profiles with customizable settings
- Financial goal setting
- Budget preferences and customization

## Project Structure

```
budget-app/
├── backend/
│   ├── app/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # Pydantic models
│   │   ├── routes/         # API routes
│   │   └── main.py         # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── main.py             # Entry point
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # React context (auth)
    │   ├── firebase/       # Firebase configuration
    │   ├── pages/          # Page components
    │   ├── App.js          # Main app component
    │   └── index.js        # React entry point
    ├── .env.example        # Environment variables example
    └── package.json        # Node.js dependencies
```

## Setup Instructions

### Prerequisites

- Node.js and npm
- Python 3.8 or higher
- MongoDB
- Firebase project

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your MongoDB and Firebase credentials.

5. Start the backend server:
   ```
   python main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Firebase configuration.

4. Start the development server:
   ```
   npm start
   ```

### Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable Authentication and add Email/Password and Google as sign-in methods
3. Generate a Firebase Admin SDK private key for the backend
4. Add the web app to your Firebase project and get the configuration
5. Add the Firebase configuration to your frontend and backend environment files

## Development

- Backend API will be available at: http://localhost:8000
- Frontend development server will be available at: http://localhost:3000

## License

MIT