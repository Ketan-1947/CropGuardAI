# CropGuard AI API

A FastAPI-based REST API for plant disease detection using Vision Transformer (ViT) models.

## Features

- **Plant Disease Detection**: Identify diseases in apples, corn, potatoes, and tomatoes
- **High Accuracy**: Powered by Vision Transformer (ViT-Base) model
- **Real-time Processing**: Fast inference with optimized preprocessing
- **RESTful API**: Clean endpoints with JSON responses
- **CORS Support**: Ready for web application integration

## Supported Diseases

The API can detect the following plant diseases:

### Apple
- Apple Scab
- Cedar Apple Rust

### Corn (Maize)
- Common Rust

### Potato
- Early Blight

### Tomato
- Early Blight
- Yellow Leaf Curl Virus

### Healthy Plants
- Apple (healthy)
- Potato (healthy)
- Tomato (healthy)

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the API

```bash
python main.py
```

The API will start on `http://localhost:8000`

### 3. Test the API

#### Health Check
```bash
curl http://localhost:8000/
```

#### Get Supported Classes
```bash
curl http://localhost:8000/classes
```

#### Make a Prediction
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/your/plant_image.jpg"
```

## API Endpoints

### `GET /`
Health check endpoint
- **Response**: API status and model information

### `GET /classes`
Get list of supported disease classes
- **Response**: Array of class names and count

### `POST /predict`
Predict plant disease from image
- **Parameters**:
  - `file`: Image file (JPG, JPEG, PNG)
- **Response**:
  ```json
  {
    "filename": "plant_image.jpg",
    "prediction": "Apple___Apple_scab",
    "confidence": 0.9876,
    "confidence_percentage": 98.76,
    "top3_predictions": [
      {"class": "Apple___Apple_scab", "confidence": 0.9876},
      {"class": "Apple___Cedar_apple_rust", "confidence": 0.0123},
      {"class": "Apple___healthy", "confidence": 0.0001}
    ],
    "model": "Vision Transformer (ViT-Base)",
    "supported_crops": ["Apple", "Corn", "Potato", "Tomato"]
  }
  ```

### `GET /health`
Detailed health check
- **Response**: Comprehensive system status

## Model Details

- **Architecture**: Vision Transformer (ViT-Base)
- **Input Size**: 224x224 pixels
- **Pretrained**: No (trained from scratch on PlantVillage dataset)
- **Classes**: 8 disease categories
- **Framework**: PyTorch with timm library

## Integration with Frontend

The API is designed to work seamlessly with the CropGuardAI Next.js frontend:

1. **CORS Enabled**: Accepts requests from any origin
2. **File Upload**: Handles multipart form data
3. **JSON Responses**: Easy to consume in JavaScript
4. **Error Handling**: Proper HTTP status codes and error messages

## Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Deployment

For production deployment, consider:
- Setting `DEVICE = "cuda"` if GPU is available
- Using a production WSGI server like Gunicorn
- Setting specific allowed origins in CORS middleware
- Adding rate limiting and authentication
- Using environment variables for configuration

## Testing

Use the provided test images in the `test/` directory:

```bash
# Test with a sample image
curl -X POST "http://localhost:8000/predict" \
     -F "file=@test/test_renamed/Apple___Apple_scab.JPG"
```

## Error Handling

The API includes comprehensive error handling:
- **400**: Invalid file type or request
- **404**: Model checkpoint not found
- **500**: Internal server errors
- **503**: Model not loaded

## Performance

- **Inference Time**: ~100-200ms per image on CPU
- **Memory Usage**: ~1GB RAM for model loading
- **Concurrent Requests**: Handles multiple requests (limited by hardware)

## License

This project is part of CropGuardAI - AI-powered plant disease detection.
