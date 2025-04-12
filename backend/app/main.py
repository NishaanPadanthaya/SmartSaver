from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, budget, savings

app = FastAPI(
    title="Budget App API",
    description="API for AI-powered budgeting application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/users", tags=["users"])
app.include_router(budget.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(savings.router, prefix="/api/savings", tags=["savings"])

@app.get("/")
async def root():
    return {"message": "Welcome to Budget App API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 