# 🌱 CropGuard AI

AI-powered plant disease detection using computer vision and Vision Transformer models. Protect your crops by identifying diseases early with high accuracy.

## 📋 Overview

CropGuard AI is a comprehensive solution for agricultural disease detection that includes:

- **Machine Learning Model**: Vision Transformer (ViT) trained on plant disease datasets
- **REST API**: FastAPI backend for real-time predictions
- **Web Interface**: Next.js frontend for easy image upload and results
- **Multiple Crops**: Support for apples, corn, potatoes, and tomatoes

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+ (for frontend)
- Trained model file (`vit_plantvillage.pth`)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd CropGuardAI
```

### 2. Backend API
```bash
# Install dependencies
pip install -r requirements.txt

# Start the API server
python start_api.py
# or directly: python main.py
```

### 3. Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

### 4. Test the API
```bash
python test_api.py
```

## 📁 Project Structure

```
CropGuardAI/
├── main.py                 # FastAPI application
├── predict.py              # Standalone prediction script
├── train.py                # Model training script
├── eval.py                 # Model evaluation script
├── requirements.txt        # Python dependencies
├── test_api.py            # API testing script
├── start_api.py           # API launcher script
├── vit_plantvillage.pth   # Trained model weights
├── README_API.md          # Detailed API documentation
├── frontend/              # Next.js web application
│   ├── src/app/          # Next.js pages and components
│   ├── package.json      # Frontend dependencies
│   └── ...
└── test/                 # Test images
    ├── test/             # Original test images
    └── test_renamed/     # Processed test images
```

## 🔬 Supported Diseases

### Apple
- Apple Scab (`Apple___Apple_scab`)
- Cedar Apple Rust (`Apple___Cedar_apple_rust`)
- Healthy (`Apple___healthy`)

### Corn (Maize)
- Common Rust (`Corn_(maize)___Common_rust_`)
- Healthy (`Corn_(maize)___healthy`)

### Potato
- Early Blight (`Potato___Early_blight`)
- Healthy (`Potato___healthy`)

### Tomato
- Early Blight (`Tomato___Early_blight`)
- Yellow Leaf Curl Virus (`Tomato___Tomato_Yellow_Leaf_Curl_Virus`)
- Healthy (`Tomato___healthy`)

## 🛠️ API Usage

### Start the Server
```bash
python start_api.py
```

### Health Check
```bash
curl http://localhost:8000/
```

### Make Prediction
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/plant_image.jpg"
```

### Response Format
```json
{
  "filename": "plant_image.jpg",
  "prediction": "Apple___Apple_scab",
  "confidence": 0.9876,
  "confidence_percentage": 98.76,
  "top3_predictions": [
    {"class": "Apple___Apple_scab", "confidence": 0.9876},
    {"class": "Apple___healthy", "confidence": 0.0123},
    {"class": "Apple___Cedar_apple_rust", "confidence": 0.0001}
  ],
  "model": "Vision Transformer (ViT-Base)",
  "supported_crops": ["Apple", "Corn", "Potato", "Tomato"]
}
```

## 🧪 Testing

### Run All Tests
```bash
python test_api.py
```

### Manual Testing with Images
```bash
# Test with a sample image
curl -X POST "http://localhost:8000/predict" \
     -F "file=@test/test_renamed/Apple___Apple_scab.JPG"
```

## 🏗️ Model Details

- **Architecture**: Vision Transformer (ViT-Base-Patch16-224)
- **Input Size**: 224×224 pixels
- **Parameters**: ~86M
- **Training Data**: PlantVillage dataset
- **Framework**: PyTorch + timm
- **Accuracy**: High accuracy on test set (see evaluation results)

## 🚀 Deployment

### Local Development
```bash
# Start API
python main.py

# Start frontend (separate terminal)
cd frontend && npm run dev
```

### Production Deployment
- Use Gunicorn for production serving
- Set `DEVICE = "cuda"` for GPU acceleration
- Configure CORS for your domain
- Add authentication and rate limiting as needed

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📊 Model Training

To retrain the model:

```bash
# Prepare your dataset in ImageFolder format
# data/
#   ├── train/
#   │   ├── class1/
#   │   ├── class2/
#   │   └── ...
#   └── valid/
#       ├── class1/
#       ├── class2/
#       └── ...

# Train the model
python train.py

# Evaluate performance
python eval.py
```

## 🔧 Configuration

### API Settings
Edit `main.py` to configure:
- `CHECKPOINT_PATH`: Path to model weights
- `DEVICE`: "cpu" or "cuda"
- CORS origins for production

### Model Settings
The model uses these transforms:
- Resize to 224×224
- Convert to tensor
- Normalize with mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5)

**Protect your crops with AI-powered disease detection! 🌾**
