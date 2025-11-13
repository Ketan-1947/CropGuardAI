# CropGuard AI Frontend Integration

This document explains how the Next.js frontend integrates with the FastAPI backend for plant disease detection.

## 🚀 Quick Start

### 1. Start the Backend API
```bash
# From the project root
pip install -r requirements.txt
python start_api.py
```
API will be available at `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:3000`

### 3. Test the Integration
1. Open `http://localhost:3000` in your browser
2. Click the "Try Disease Detection" button
3. Upload a plant image (JPG, JPEG, or PNG)
4. View the AI analysis results

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production deployment
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### API URL Configuration

The frontend automatically uses:
- `http://localhost:8000` in development (if no env var set)
- Your configured `NEXT_PUBLIC_API_URL` for production

## 📋 Features

### Image Upload & Preview
- **File Validation**: Accepts JPG, JPEG, PNG formats
- **Image Preview**: Shows uploaded image before analysis
- **Size Limits**: Handles various image sizes appropriately

### Real-time Analysis
- **Loading States**: Animated spinner during processing
- **Progress Feedback**: Clear status messages
- **Error Handling**: User-friendly error messages

### Results Display
- **Primary Diagnosis**: Main disease prediction with confidence
- **Health Status**: "Healthy" or "Disease Detected" indicator
- **Top 3 Predictions**: Alternative possibilities ranked by confidence
- **Model Information**: AI model details and supported crops

## 🛠️ Technical Implementation

### State Management

The frontend uses React hooks for state management:

```typescript
// Image upload states
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewImage, setPreviewImage] = useState<string | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
```

### API Integration

#### Upload Function
```typescript
const handleImageAnalysis = async (e: React.FormEvent) => {
  const formData = new FormData();
  formData.append('file', selectedFile);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  setPredictionResult(result);
};
```

#### Error Handling
```typescript
try {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Analysis failed');
  }

  const result = await response.json();
  // Handle success
} catch (error) {
  // Handle error
  setToast({
    message: error.message,
    type: 'error'
  });
}
```

### TypeScript Interfaces

```typescript
interface PredictionResult {
  filename: string;
  prediction: string;
  confidence: number;
  confidence_percentage: number;
  top3_predictions: Array<{
    class: string;
    confidence: number;
  }>;
  model: string;
  supported_crops: string[];
}
```

## 🎨 UI Components

### Modal Structure
- **Upload Form**: File input with preview
- **Results Display**: Comprehensive analysis results
- **Navigation**: Reset and close functionality

### Responsive Design
- **Mobile-first**: Works on all screen sizes
- **Modal Sizing**: Adapts to content and screen size
- **Dark Mode**: Full dark mode support

## 🔍 Disease Classification

### Supported Diseases
The system detects:
- **Apple**: Scab, Cedar Apple Rust, Healthy
- **Corn**: Common Rust, Healthy
- **Potato**: Early Blight, Healthy
- **Tomato**: Early Blight, Yellow Leaf Curl Virus, Healthy

### Display Names
API class names are converted to user-friendly names:
```typescript
const getDiseaseDisplayName = (className: string): string => {
  const nameMap = {
    'Apple___Apple_scab': 'Apple Scab',
    'Corn_(maize)___Common_rust_': 'Corn Common Rust',
    // ... more mappings
  };
  return nameMap[className] || className.replace(/___|_/g, ' ');
};
```

## 🚨 Error Handling

### API Errors
- **400**: Invalid file type or format
- **500**: Server processing errors
- **503**: Model not loaded

### User Feedback
- **Toast Notifications**: Success and error messages
- **Loading States**: Visual feedback during processing
- **Form Validation**: Client-side input validation

## 🔒 Security Considerations

### File Upload Security
- **Type Validation**: Only image files accepted
- **Size Limits**: Reasonable file size restrictions
- **Client-side Preview**: Safe image handling

### CORS Configuration
- **Development**: Allows all origins for testing
- **Production**: Configure specific allowed domains

## 📱 Testing the Integration

### Manual Testing
1. Start both backend and frontend
2. Upload test images from `test/test_renamed/`
3. Verify results match expected classifications
4. Test error scenarios (invalid files, API down)

### Automated Testing
```bash
# Backend tests
python test_api.py

# Frontend tests (if implemented)
npm run test
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
npm run start
```

### Environment Setup
- Set `NEXT_PUBLIC_API_URL` to your production API URL
- Configure CORS in the backend for your domain
- Ensure HTTPS for production

### Performance Optimization
- **Image Compression**: Consider client-side image resizing
- **Caching**: Implement appropriate caching strategies
- **CDN**: Use CDN for static assets

## 🐛 Troubleshooting

### Common Issues

#### API Connection Failed
- Check if backend is running on correct port
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check CORS configuration

#### Upload Fails
- Ensure file is valid image format (JPG, JPEG, PNG)
- Check file size limits
- Verify network connectivity

#### Model Not Loaded
- Ensure `vit_plantvillage.pth` exists
- Check backend logs for model loading errors
- Restart the backend API

### Debug Mode
Enable debug logging in the browser console:
```typescript
console.log('API Response:', result);
console.log('Error:', error);
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [CropGuard AI API Docs](./README_API.md)

---

**Happy plant disease detection! 🌱🔬**
