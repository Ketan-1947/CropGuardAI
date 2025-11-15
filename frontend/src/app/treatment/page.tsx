"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Pill,
  ArrowLeft,
  Target,
  BarChart3,
  Shield,
  AlertTriangle,
  Download,
  Share,
} from "lucide-react";

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

export default function TreatmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [treatmentRecommendation, setTreatmentRecommendation] = useState<TreatmentRecommendation | null>(null);
  const [isLoadingTreatment, setIsLoadingTreatment] = useState(false);

  useEffect(() => {
    // Get data from localStorage using session ID
    const sessionId = searchParams.get('session');
    const hasTreatment = searchParams.get('hasTreatment') === 'true';

    if (sessionId) {
      try {
        // Get prediction data
        const predictionData = localStorage.getItem(`prediction_${sessionId}`);
        if (predictionData) {
          setPredictionResult(JSON.parse(predictionData));
        }

        // Get treatment data if available
        if (hasTreatment) {
          const treatmentData = localStorage.getItem(`treatment_${sessionId}`);
          if (treatmentData) {
            setTreatmentRecommendation(JSON.parse(treatmentData));
          }
        }

        // Clean up localStorage after loading (optional - keeps data for page refreshes)
        // setTimeout(() => {
        //   localStorage.removeItem(`prediction_${sessionId}`);
        //   if (hasTreatment) localStorage.removeItem(`treatment_${sessionId}`);
        // }, 1000);

      } catch (error) {
        console.error('Failed to load session data:', error);
        // Redirect back to home if data is corrupted
        router.push('/');
      }
    } else {
      // No session ID, redirect to home
      router.push('/');
    }
  }, [searchParams, router]);

  const getDiseaseDisplayName = (className: string): string => {
    const nameMap: { [key: string]: string } = {
      'Apple___Apple_scab': 'Apple Scab',
      'Apple___Cedar_apple_rust': 'Cedar Apple Rust',
      'Apple___healthy': 'Healthy Apple',
      'Corn_(maize)___Common_rust_': 'Corn Common Rust',
      'Corn_(maize)___healthy': 'Healthy Corn',
      'Potato___Early_blight': 'Potato Early Blight',
      'Potato___healthy': 'Healthy Potato',
      'Tomato___Early_blight': 'Tomato Early Blight',
      'Tomato___Late_blight': 'Tomato Late Blight',
      'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'Tomato Yellow Leaf Curl Virus',
      'Tomato___healthy': 'Healthy Tomato'
    };

    return nameMap[className] || className.replace(/___|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getHealthStatus = (className: string): { status: string; color: string; bgColor: string } => {
    if (className.includes('healthy')) {
      return { status: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
    } else {
      return { status: 'Disease Detected', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    }
  };

  if (!predictionResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading treatment information...</p>
        </div>
      </div>
    );
  }

  const healthInfo = getHealthStatus(predictionResult.prediction);
  const isDisease = !predictionResult.prediction.includes('healthy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Detection
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plant Disease Analysis</h1>
              <p className="text-slate-600 dark:text-slate-300">Complete diagnosis and treatment recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Disease Diagnosis Section */}
        <div className={`rounded-xl p-6 border-2 ${healthInfo.bgColor}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {isDisease ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Primary Diagnosis</h2>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${healthInfo.color} bg-white border`}>
                  {healthInfo.status}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {getDiseaseDisplayName(predictionResult.prediction)}
              </div>
              <div className="text-lg text-slate-600 dark:text-slate-300">
                Confidence: <span className="font-semibold">{predictionResult.confidence_percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Predictions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top 3 Predictions
          </h3>
          <div className="space-y-3">
            {predictionResult.top3_predictions.map((pred, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-6">{index + 1}.</span>
                  <span className="text-slate-900 dark:text-white">
                    {getDiseaseDisplayName(pred.class)}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {(pred.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Model Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            AI Model Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">Model:</div>
              <div className="text-blue-800 dark:text-blue-200">{predictionResult.model}</div>
            </div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">Supported Crops:</div>
              <div className="text-blue-800 dark:text-blue-200">{predictionResult.supported_crops.join(', ')}</div>
            </div>
          </div>
        </div>

        {/* Treatment Recommendations - Only show if disease detected */}
        {isDisease && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                <Pill className="w-6 h-6" />
                Treatment Recommendations
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {isLoadingTreatment ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-lg text-green-800 dark:text-green-200">Generating treatment recommendations...</span>
              </div>
            ) : treatmentRecommendation ? (
              treatmentRecommendation.available ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-green-900 dark:text-green-100">
                        <div className="font-semibold text-lg">{treatmentRecommendation.disease}</div>
                        <div className="text-sm opacity-75">
                          Crop: {treatmentRecommendation.crop} • Confidence: {treatmentRecommendation.confidence?.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right text-xs text-green-700 dark:text-green-300 opacity-75">
                        Powered by {treatmentRecommendation.model_used}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="prose prose-green dark:prose-invert max-w-none">
                      <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                        {treatmentRecommendation.recommendations}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <div className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                    Treatment Recommendations Unavailable
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {treatmentRecommendation.error || "Unable to generate treatment recommendations at this time."}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-green-800 dark:text-green-200">
                  Preparing treatment recommendations...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-slate-200 dark:border-slate-700">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Analyze Another Image
          </Button>
          <Button
            onClick={() => router.back()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
