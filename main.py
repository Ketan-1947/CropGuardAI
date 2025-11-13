from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from PIL import Image
from torchvision import transforms
import timm
import io
import os
from typing import Dict, Any

# --- Configuration ---
CHECKPOINT_PATH = "vit_plantvillage.pth"
DEVICE = "cpu"  # Use CPU for deployment, can be changed to "cuda" if GPU available

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

@app.get("/health")
async def health_check():
    """Detailed health check"""
    model_status = "loaded" if model else "not loaded"
    classes_status = len(class_names) if class_names else 0

    return {
        "status": "healthy" if model else "unhealthy",
        "model_status": model_status,
        "classes_loaded": classes_status,
        "device": DEVICE,
        "checkpoint_path": CHECKPOINT_PATH
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
