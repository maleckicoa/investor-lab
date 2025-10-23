from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add cifar10 to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'cifar10'))

from predict import predict_image

app = FastAPI(title="Demo Service API")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Demo Service API is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    
    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG or JPEG images are supported")

    try:
        contents = await file.read()
        print('Main')
        result = predict_image(contents)
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}
