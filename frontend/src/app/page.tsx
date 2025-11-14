"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LavaLamp } from "@/components/ui/fluid-blob";
import { GooeyMarquee } from "@/components/ui/gooey-marquee";
import {
  FileText,
  Users,
  Zap,
  Shield,
  Download,
  Palette,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle,
  Star,
  MessageSquare,
  BookOpen,
  BarChart3,
  TrendingUp,
  Globe,
  Cpu,
  Lock,
  Database,
  Bot,
  Network,
  DollarSign,
  Target,
  Award,
  Building2,
  Briefcase,
  Code,
  Eye,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  CreditCard,
  Pill,
} from "lucide-react";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface TreatmentRecommendation {
  available: boolean;
  disease?: string;
  crop?: string;
  confidence?: number;
  recommendations?: string;
  model_used?: string;
  error?: string;
}

export default function CropGuardAILandingPage() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Treatment recommendations state
  const [treatmentRecommendation, setTreatmentRecommendation] = useState<TreatmentRecommendation | null>(null);
  const [isLoadingTreatment, setIsLoadingTreatment] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setToast({ message: 'Successfully joined the waitlist!', type: 'success' });
      setShowWaitlistModal(false);
      setFormData({ name: '', email: '' });

      // Clear toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchTreatmentRecommendations = async (diseaseName: string, confidence: number) => {
    setIsLoadingTreatment(true);
    setTreatmentRecommendation(null);

    try {
      const response = await fetch(`${API_BASE_URL}/treatment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disease_name: diseaseName,
          confidence: confidence,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get treatment recommendations');
      }

      const result: TreatmentRecommendation = await response.json();
      setTreatmentRecommendation(result);

    } catch (error) {
      console.error('Treatment recommendation error:', error);
      setTreatmentRecommendation({
        available: false,
        error: error instanceof Error ? error.message : 'Failed to get treatment recommendations'
      });
    } finally {
      setIsLoadingTreatment(false);
    }
  };

  const handleImageAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    setIsAnalyzing(true);
    setPredictionResult(null);
    setTreatmentRecommendation(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const result: PredictionResult = await response.json();
      setPredictionResult(result);

      // Fetch treatment recommendations after successful disease detection
      if (result.prediction && !result.prediction.includes('healthy')) {
        await fetchTreatmentRecommendations(result.prediction, result.confidence);
      }

      setToast({
        message: 'Analysis completed successfully!',
        type: 'success'
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setSelectedPlantType('');
    setPredictionResult(null);
    setPreviewImage(null);
    setTreatmentRecommendation(null);
    setIsLoadingTreatment(false);
  };

  const getDiseaseDisplayName = (className: string): string => {
    // Convert API class names to user-friendly names
    const nameMap: { [key: string]: string } = {
      'Apple___Apple_scab': 'Apple Scab',
      'Apple___Cedar_apple_rust': 'Cedar Apple Rust',
      'Apple___healthy': 'Healthy Apple',
      'Corn_(maize)___Common_rust_': 'Corn Common Rust',
      'Corn_(maize)___healthy': 'Healthy Corn',
      'Potato___Early_blight': 'Potato Early Blight',
      'Potato___healthy': 'Healthy Potato',
      'Tomato___Early_blight': 'Tomato Early Blight',
      'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'Tomato Yellow Leaf Curl Virus',
      'Tomato___healthy': 'Healthy Tomato'
    };

    return nameMap[className] || className.replace(/___|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getHealthStatus = (className: string): { status: string; color: string } => {
    if (className.includes('healthy')) {
      return { status: 'Healthy', color: 'text-green-600' };
    } else {
      return { status: 'Disease Detected', color: 'text-red-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Fluid Blob Background */}
        <div className="absolute inset-0 opacity-20">
          <LavaLamp />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 mb-8">
            <Target className="w-4 h-4" />
            AI-Powered Plant Disease Detection
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            Protect Your
            <br />
            <span className="text-green-600 dark:text-green-400">Crops</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Advanced AI technology that detects plant diseases early using computer vision. Identify issues in apples, corn, potatoes, and tomatoes before they spread.
          </p>

          {/* Value Proposition */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Real-time</div>
              <div className="text-slate-600 dark:text-slate-300">Disease Detection</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">High</div>
              <div className="text-slate-600 dark:text-slate-300">Accuracy AI</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Early</div>
              <div className="text-slate-600 dark:text-slate-300">Prevention</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => setShowWaitlistModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-medium rounded-md shadow-lg hover:shadow-green-500/25 transition-all duration-300"
            >
              Try Disease Detection
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-green-950/20 dark:via-slate-900 dark:to-green-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              AI-Powered Disease Detection
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Advanced computer vision technology that identifies plant diseases with high accuracy, helping farmers protect their crops and maximize yields.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Core Features Grid */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Early Detection</h3>
                    <p className="text-slate-600 dark:text-slate-300">Identify diseases at their earliest stages before they spread and cause significant crop damage</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">High Accuracy AI</h3>
                    <p className="text-slate-600 dark:text-slate-300">Vision Transformer model trained on thousands of plant images for reliable disease identification</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Multiple Crop Support</h3>
                    <p className="text-slate-600 dark:text-slate-300">Supports apples, corn, potatoes, and tomatoes with comprehensive disease detection coverage</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Instant Results</h3>
                    <p className="text-slate-600 dark:text-slate-300">Get disease identification results in seconds with our optimized AI inference pipeline</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Detailed Reports</h3>
                    <p className="text-slate-600 dark:text-slate-300">Receive comprehensive analysis with confidence scores and treatment recommendations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Preventive Action</h3>
                    <p className="text-slate-600 dark:text-slate-300">Enable timely intervention to prevent disease spread and protect your entire crop yield</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-green-100 via-white to-green-50 dark:from-green-950/30 dark:via-slate-900 dark:to-green-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Powered by cutting-edge AI
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Advanced machine learning technologies for accurate plant disease detection and agricultural intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Vision Transformer</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">State-of-the-art ViT-Base model with 16x16 patches for superior image understanding and disease classification</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View model →</div>
            </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">PyTorch Framework</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Built with PyTorch and timm library for robust deep learning training and inference pipelines</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View training code →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Computer Vision Pipeline</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Optimized image preprocessing with torchvision transforms and PIL for consistent input processing</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View pipeline →</div>
          </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">PlantVillage Dataset</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Trained on comprehensive plant disease datasets covering apples, corn, potatoes, and tomatoes</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View dataset →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Model Evaluation</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Comprehensive evaluation with sklearn metrics, confusion matrix, and classification reports</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View evaluation →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-800 hover:shadow-green-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Next.js Frontend</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Modern React interface with file upload, real-time processing, and intuitive disease detection results</p>
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">View interface →</div>
            </div>
          </div>
        </div>
      </section>

                  {/* Disease Detection Demo */}
      <section className="py-24 px-4 bg-gradient-to-br from-green-600 via-green-500 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Try Disease Detection Now
          </h2>
          <p className="text-xl text-green-100 mb-12">
            Upload a plant image and get instant disease detection results powered by our AI model.
          </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={() => setShowWaitlistModal(true)}
                className="bg-white hover:bg-green-50 text-green-600 px-8 py-3 text-base font-medium rounded-md shadow-lg hover:shadow-green-300/50 transition-all duration-300"
              >
                Upload Plant Image
              </Button>
          </div>

          <div className="text-sm text-green-200">
            Supports apples, corn, potatoes, and tomatoes. Get detailed analysis with confidence scores.
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Disease Detection</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Apple Diseases</a></li>
                <li><a href="#" className="hover:text-white">Corn Diseases</a></li>
                <li><a href="#" className="hover:text-white">Potato Diseases</a></li>
                <li><a href="#" className="hover:text-white">Tomato Diseases</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">AI Technology</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Vision Transformer</a></li>
                <li><a href="#" className="hover:text-white">PyTorch Framework</a></li>
                <li><a href="#" className="hover:text-white">Computer Vision</a></li>
                <li><a href="#" className="hover:text-white">Model Training</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
                <li><a href="#" className="hover:text-white">Research Papers</a></li>
                <li><a href="#" className="hover:text-white">Dataset Info</a></li>
                <li><a href="#" className="hover:text-white">Model Performance</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Agriculture Impact</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-4xl font-bold mb-4 md:mb-0">CropGuard AI</div>
              <div className="text-slate-400 text-sm">
                © 2025 CropGuard AI. Protecting crops with artificial intelligence.
              </div>
            </div>
          </div>
        </div>

        {/* Massive Brand Name */}
        <div className="relative flex items-center justify-center min-h-[30vh] px-4">
          <h2 className="text-[clamp(8rem,15vw,25rem)] font-black bg-gradient-to-r from-green-400 via-green-300 to-green-400 bg-clip-text text-transparent leading-none tracking-tighter select-none">
            CropGuard AI
          </h2>
        </div>
      </footer>

      {/* Disease Detection Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Plant Disease Detection
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Upload a clear photo of your plant for AI-powered disease analysis
              </p>
            </div>

            {!predictionResult ? (
              <form onSubmit={handleImageAnalysis} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Plant Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Supported formats: JPG, JPEG, PNG</p>
                </div>

                {previewImage && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image Preview:</p>
                    <div className="relative w-full max-w-xs mx-auto">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Plant Type (Optional)
                  </label>
                  <select
                    value={selectedPlantType}
                    onChange={(e) => setSelectedPlantType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Auto-detect plant type</option>
                    <option value="apple">Apple</option>
                    <option value="corn">Corn</option>
                    <option value="potato">Potato</option>
                    <option value="tomato">Tomato</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWaitlistModal(false);
                      resetAnalysis();
                    }}
                    className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    disabled={isAnalyzing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAnalyzing || !selectedFile}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Analyze Image
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Results Display */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Analysis Complete
                  </h4>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">Primary Diagnosis:</span>
                    <span className={`font-semibold ${getHealthStatus(predictionResult.prediction).color}`}>
                      {getHealthStatus(predictionResult.prediction).status}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {getDiseaseDisplayName(predictionResult.prediction)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Confidence: {predictionResult.confidence_percentage.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h5 className="font-medium text-slate-900 dark:text-white mb-3">Top 3 Predictions:</h5>
                  <div className="space-y-2">
                    {predictionResult.top3_predictions.map((pred, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-slate-300">
                          {index + 1}. {getDiseaseDisplayName(pred.class)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Model Info:</h5>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <div>Model: {predictionResult.model}</div>
                    <div>Supported Crops: {predictionResult.supported_crops.join(', ')}</div>
                  </div>
                </div>

                {/* Treatment Recommendations Section */}
                {!predictionResult.prediction.includes('healthy') && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Treatment Recommendations
                    </h5>

                    {isLoadingTreatment ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-green-800 dark:text-green-200">Generating treatment recommendations...</span>
                      </div>
                    ) : treatmentRecommendation ? (
                      treatmentRecommendation.available ? (
                        <div className="space-y-3">
                          <div className="text-sm text-green-800 dark:text-green-200">
                            <div className="font-medium">Disease: {treatmentRecommendation.disease}</div>
                            <div className="text-xs opacity-75">Crop: {treatmentRecommendation.crop} • Confidence: {treatmentRecommendation.confidence?.toFixed(1)}%</div>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line border-l-4 border-green-500">
                            {treatmentRecommendation.recommendations}
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300 opacity-75">
                            Powered by {treatmentRecommendation.model_used}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {treatmentRecommendation.error || "Treatment recommendations not available"}
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        No treatment recommendations available
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Analyze Another Image
                  </button>
                  <button
                    onClick={() => {
                      setShowWaitlistModal(false);
                      resetAnalysis();
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5">⚠️</div>
              )}
            </div>
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
