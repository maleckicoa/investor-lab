from fastapi import BackgroundTasks, FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import sys
import os
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

# Add demo apps to path
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

@app.post("/demo-api/predict/")
async def predict(file: UploadFile = File(...)):
    
    if file.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG or JPEG images are supported")

    try:
        contents = await file.read()
        result = predict_image(contents)
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}



@app.get("/demo-api/download-test-images")
async def download_test_images(background_tasks: BackgroundTasks):
    try:
        # Create temporary zip file
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_file:
            zip_path = tmp_file.name

        test_images_path = os.path.join(os.path.dirname(__file__), 'cifar10', 'test_images')

        with ZipFile(zip_path, mode='w', compression=ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(test_images_path):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    # Preserve relative structure inside the zip
                    arcname = os.path.relpath(file_path, test_images_path)
                    zipf.write(file_path, arcname=arcname)

        background_tasks.add_task(os.unlink, zip_path)

        return FileResponse(
            path=zip_path,
            filename="test-images.zip",
            media_type="application/zip"
        )
    except Exception as e:
        return {"error": str(e), "status": "error"}