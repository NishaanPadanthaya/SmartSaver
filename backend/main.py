from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import platform
import json
import importlib.util
from dotenv import load_dotenv
from database import users_collection, is_using_memory_db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import routes directly from the routes directory
from routes import users, budget, savings_goals

# Add the current directory to the Python path to help with imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Check for app.routes availability dynamically
APP_ROUTES_AVAILABLE = False
app_routes_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "routes")
if os.path.exists(app_routes_path):
    # Check for each module file
    if os.path.exists(os.path.join(app_routes_path, "savings.py")):
        try:
            spec = importlib.util.spec_from_file_location(
                "app_savings", 
                os.path.join(app_routes_path, "savings.py")
            )
            app_savings = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(app_savings)
            
            # Check for budget and auth modules
            spec = importlib.util.spec_from_file_location(
                "app_budget", 
                os.path.join(app_routes_path, "budget.py")
            )
            app_budget = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(app_budget)
            
            spec = importlib.util.spec_from_file_location(
                "app_auth", 
                os.path.join(app_routes_path, "auth.py")
            )
            app_auth = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(app_auth)
            
            APP_ROUTES_AVAILABLE = True
            print("App routes modules loaded successfully")
        except Exception as e:
            print(f"Error loading app routes modules: {e}")
    else:
        print("App routes modules not found")

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Import Firebase admin SDK for authentication
try:
    import firebase_admin
    from firebase_admin import credentials

    # Get Firebase credentials from environment variable
    firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_cred_path:
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully")
    else:
        print("Firebase credentials not found. Authentication will not work.")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    print("Authentication will not work.")

# Add health check route
@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and database status"""
    # MongoDB only - no in-memory fallback
    
    # Try to query the users collection to verify DB connection
    try:
        # Check if we can do a simple query
        sample_user = users_collection.find_one({})
        db_working = True
        db_error = None
    except Exception as e:
        db_working = False
        db_error = str(e)
    
    return {
        "status": "healthy" if db_working else "unhealthy",
        "database": {
            "status": "connected" if db_working else "error",
            "working": db_working,
            "error": db_error
        }
    }

@app.get("/db-diagnostics")
async def db_diagnostics():
    """Detailed database diagnostics endpoint"""
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure, OperationFailure
    import socket
    
    # Get the MongoDB URI and DB name from environment
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    db_name = os.environ.get("DB_NAME", "smartsaver")
    
    # Mask sensitive information in the URI
    masked_uri = mongo_uri
    if "@" in masked_uri:
        parts = masked_uri.split("@")
        auth_part = parts[0].split("://")[1].split(":")
        if len(auth_part) > 1:
            masked_uri = masked_uri.replace(auth_part[0] + ":" + auth_part[1], "****:****")
        else:
            masked_uri = masked_uri.replace(auth_part[0], "****")
    
    # Extract hostname for connectivity tests
    hostname = None
    try:
        if "mongodb+srv" in mongo_uri or "mongodb://" in mongo_uri:
            if "@" in mongo_uri:
                hostname = mongo_uri.split("@")[1].split("/")[0].split("?")[0]
            else:
                hostname = mongo_uri.split("://")[1].split("/")[0].split("?")[0]
            
            if ":" in hostname:
                hostname = hostname.split(":")[0]
    except Exception as e:
        hostname = f"Error parsing hostname: {str(e)}"
    
    # Network connectivity test
    ping_result = None
    if hostname and hostname != "localhost" and hostname != "127.0.0.1":
        try:
            # Try to resolve the hostname
            ip = socket.gethostbyname(hostname)
            ping_result = f"Successfully resolved {hostname} to {ip}"
        except Exception as e:
            ping_result = f"Failed to resolve hostname {hostname}: {str(e)}"
    
    # Test MongoDB connection with various timeout settings
    connection_result = None
    connection_error = None
    try:
        # Try with a very short timeout first
        test_client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000
        )
        test_client.admin.command('ping')
        test_db = test_client[db_name]
        collections = test_db.list_collection_names()
        connection_result = f"Connected successfully. Collections: {collections}"
    except Exception as e:
        connection_error = str(e)
    
    # System information
    system_info = {
        "os": platform.system(),
        "os_version": platform.version(),
        "python_version": sys.version,
        "pymongo_available": "pymongo" in sys.modules
    }
    
    # Current status (always MongoDB in this version)
    current_status = {
        "using_mongodb": True,
        "users_collection_type": str(type(users_collection))
    }
    
    return {
        "mongodb_uri": masked_uri,
        "db_name": db_name,
        "hostname": hostname,
        "ping_result": ping_result,
        "connection_result": connection_result,
        "connection_error": connection_error,
        "system_info": system_info,
        "current_status": current_status
    }

# List available routes for debugging
@app.get("/api/routes")
async def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return {"routes": routes}

# Include routers from routes/ directory
print("Registering main routes:")
print("- /api/users")
app.include_router(users.router, prefix="/api/users", tags=["users"])
print("- /api/budgets")
app.include_router(budget.router, prefix="/api/budgets", tags=["budgets"])
print("- /api/savings")
app.include_router(savings_goals.router, prefix="/api/savings", tags=["savings"])

# Include routers from app/routes directory if available
if APP_ROUTES_AVAILABLE:
    print("Registering app routes:")
    try:
        print("- /api/v2/auth")
        app.include_router(app_auth.router, prefix="/api/v2/auth", tags=["auth"])
        print("- /api/v2/budgets")
        app.include_router(app_budget.router, prefix="/api/v2/budgets", tags=["budgets"])
        print("- /api/v2/savings")
        app.include_router(app_savings.router, prefix="/api/v2/savings", tags=["savings"])
    except Exception as e:
        print(f"Error including app routes: {e}")

# Add a special fallback route for savings endpoints
@app.get("/api/savings/{user_id}")
async def savings_fallback(user_id: str):
    """Fallback for savings routes"""
    logger.info(f"Fallback route for savings called with user_id: {user_id}")
    
    # Query MongoDB directly for savings goals
    user = users_collection.find_one({"firebase_uid": user_id})
    if not user:
        return []
    
    return user.get("savings_goals", [])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 