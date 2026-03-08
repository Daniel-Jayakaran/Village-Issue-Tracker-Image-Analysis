from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from img_identification import analyze_images

app = FastAPI(title="Smart City Image Analyzer API")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "API Running Successfully"}


@app.post("/analyze-images")
async def analyze_images_api(files: List[UploadFile] = File(...)):
    """
    Upload multiple images and analyze them using Gemini
    """
    
    print("FILES RECEIVED:", len(files))

    file_bytes = []
    file_names = []

    for file in files:
        content = await file.read()
        file_bytes.append(content)
        file_names.append(file.filename)

    # Call Gemini analysis
    results = analyze_images(file_bytes)

    mapped_results = []

    for i, res in enumerate(results):
        mapped_results.append({
            "image_name": file_names[i],
            "category": res.get("category"),
            "description": res.get("description"),
            "severity_level": res.get("severity_level")
        })

    return {"results": mapped_results}


@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """
    Test endpoint for single file upload
    """

    content = await file.read()

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content)
    }