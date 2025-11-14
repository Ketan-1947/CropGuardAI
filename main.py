from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from PIL import Image
from torchvision import transforms
import timm
import io
import os
from typing import Dict, Any
from openai import OpenAI
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
CHECKPOINT_PATH = "vit_plantvillage.pth"
DEVICE = "cpu"  # Use CPU for deployment, can be changed to "cuda" if GPU available

# --- OpenRouter Configuration ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

# Initialize OpenAI client for OpenRouter
openai_client = None
if OPENROUTER_API_KEY:
    openai_client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )

# --- Pydantic Models ---
class TreatmentRequest(BaseModel):
    disease_name: str
    confidence: float = 0.0

# --- Global variables for model ---
model = None
class_names = None
transform = None

# --- Initialize FastAPI app ---
app = FastAPI(
    title="CropGuard AI API",
    description="AI-powered plant disease detection using computer vision",
    version="1.0.0"
)

# --- CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_model():
    """Load the trained Vision Transformer model"""
    global model, class_names, transform

    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Model checkpoint not found: {CHECKPOINT_PATH}")

    # Load checkpoint
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
    class_names = checkpoint["class_names"]

    # Initialize model
    model = timm.create_model("vit_base_patch16_224", pretrained=False)
    model.head = torch.nn.Linear(model.head.in_features, len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(DEVICE)
    model.eval()

    # Define transform (same as in predict.py)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5))
    ])

    print(f"Model loaded successfully with {len(class_names)} classes: {class_names}")

def get_crop_type_from_disease(disease_name: str) -> str:
    """Extract crop type from disease class name"""
    disease_lower = disease_name.lower()

    if 'apple' in disease_lower:
        return 'Apple'
    elif 'corn' in disease_lower or 'maize' in disease_lower:
        return 'Corn'
    elif 'potato' in disease_lower:
        return 'Potato'
    elif 'tomato' in disease_lower:
        return 'Tomato'
    else:
        return 'Unknown Crop'

def get_treatment_recommendations(disease_name: str, confidence_score: float) -> Dict[str, Any]:
    """Get treatment recommendations from OpenRouter LLM"""

    if not openai_client:
        return {
            "error": "LLM service not configured. Please set OPENROUTER_API_KEY environment variable.",
            "available": False
        }

    try:
        # Extract crop type from disease name
        crop_type = get_crop_type_from_disease(disease_name)

        # Convert disease name to user-friendly format
        display_disease = disease_name.replace('___', ' ').replace('_', ' ').title()

        # Create structured prompt
        prompt = f"""You are an expert agricultural advisor. A crop disease has been detected.

Disease: {display_disease}
Crop: {crop_type}
Severity: {confidence_score:.1f}%

Provide ACTIONABLE treatment recommendations in this structure:

1. IMMEDIATE ACTIONS (first 24-48 hours):
   - Pesticide: [Name with dosage per liter]
   - Application method: [Foliar spray/soil drench]

2. TREATMENT PROTOCOL (next 7-14 days):
   - Chemical options: [Fungicides with rotation schedule]
   - Biological options: [Biopesticides if available]
   - Cultural practices: [Pruning, irrigation, sanitation]

3. PREVENTION MEASURES:
   - Resistant varieties
   - Crop rotation strategy
   - Field sanitation

4. CAUTIONS:
   - Local regulations
   - Environmental impact
   - Pesticide resistance management

Keep recommendations specific, practical, and evidence-based for agricultural professionals."""

        # Make API call to OpenRouter
        completion = openai_client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://cropguard-ai.vercel.app",
                "X-Title": "CropGuard AI Disease Detection",
            },
            model=OPENROUTER_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,  # Lower temperature for more consistent recommendations
            max_tokens=1000
        )

        recommendations = completion.choices[0].message.content

        return {
            "available": True,
            "disease": display_disease,
            "crop": crop_type,
            "confidence": confidence_score,
            "recommendations": recommendations,
            "model_used": OPENROUTER_MODEL
        }

    except Exception as e:
        print(f"LLM API error: {str(e)}")
        return {
            "error": f"Failed to get treatment recommendations: {str(e)}",
            "available": False
        }

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    try:
        load_model()
        print("CropGuard AI API started successfully!")
    except Exception as e:
        print(f"Failed to load model: {e}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "CropGuard AI API is running",
        "status": "healthy",
        "model_loaded": model is not None,
        "classes_count": len(class_names) if class_names else 0
    }

@app.get("/classes")
async def get_classes():
    """Get list of supported disease classes"""
    if not class_names:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    return {
        "classes": class_names,
        "count": len(class_names)
    }

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    """
    Predict plant disease from uploaded image

    - **file**: Image file (jpg, jpeg, png)
    - Returns: Prediction result with confidence and class name
    """
    if not model or not transform:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    # Validate file type
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a JPG, JPEG, or PNG image."
        )

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Preprocess image
        img_tensor = transform(image).unsqueeze(0).to(DEVICE)

        # Make prediction
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            predicted_idx = int(torch.argmax(outputs, dim=1).item())
            confidence = float(probabilities[predicted_idx].item())

        # Get prediction result
        predicted_class = class_names[predicted_idx]

        # Get top 3 predictions for additional context
        top3_prob, top3_idx = torch.topk(probabilities, 3)
        top3_predictions = [
            {
                "class": class_names[int(idx)],
                "confidence": float(prob)
            }
            for prob, idx in zip(top3_prob, top3_idx)
        ]

        return {
            "filename": file.filename,
            "prediction": predicted_class,
            "confidence": confidence,
            "confidence_percentage": round(confidence * 100, 2),
            "top3_predictions": top3_predictions,
            "model": "Vision Transformer (ViT-Base)",
            "supported_crops": ["Apple", "Corn", "Potato", "Tomato"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/treatment")
async def get_treatment(request: TreatmentRequest):
    """
    Get treatment recommendations for detected plant disease using LLM

    - **disease_name**: Name of the detected disease (e.g., "Apple___Apple_scab")
    - **confidence**: Confidence score from 0.0 to 1.0
    - Returns: Structured treatment recommendations or error message
    """
    recommendations = get_treatment_recommendations(request.disease_name, request.confidence)

    if not recommendations.get("available", False):
        error_msg = recommendations.get("error", "Treatment recommendations not available")
        raise HTTPException(status_code=503, detail=error_msg)

    return recommendations

@app.get("/health")
async def health_check():
    """Detailed health check"""
    model_status = "loaded" if model else "not loaded"
    classes_status = len(class_names) if class_names else 0
    llm_status = "configured" if openai_client else "not configured"

    return {
        "status": "healthy" if model else "unhealthy",
        "model_status": model_status,
        "classes_loaded": classes_status,
        "llm_status": llm_status,
        "device": DEVICE,
        "checkpoint_path": CHECKPOINT_PATH
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
