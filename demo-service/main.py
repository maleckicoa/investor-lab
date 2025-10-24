from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import sys
import os
import subprocess
import tempfile

# Add cifar10 to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'cifar10'))

from predict import predict_image

app = FastAPI(title="Demo Service API")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://maleckicoa.com",
        ],  # Next.js dev server
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
        result = predict_image(contents)
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}



@app.get("/download-test-images")
async def download_test_images():
    try:
        # Create temporary zip file
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_file:
            zip_path = tmp_file.name
        
        # Create zip file
        test_images_path = os.path.join(os.path.dirname(__file__), 'cifar10', 'test_images')
        subprocess.run(['zip', '-r', zip_path, '.'], cwd=test_images_path, check=True)
        
        # Return the zip file
        return FileResponse(
            path=zip_path,
            filename="test-images.zip",
            media_type="application/zip"
        )
    except Exception as e:
        return {"error": str(e), "status": "error"}
