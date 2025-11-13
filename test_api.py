#!/usr/bin/env python3
"""
Test script for CropGuard AI API
Run this script to test the API endpoints and functionality.
"""

import requests
import os
import time
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Health check passed: {data['message']}")
        print(f"   Model loaded: {data['model_loaded']}")
        print(f"   Classes count: {data['classes_count']}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_get_classes():
    """Test the classes endpoint"""
    print("\n📋 Testing classes endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/classes")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Classes endpoint working: {data['count']} classes loaded")
        print("   Sample classes:", data['classes'][:3], "...")
        return True
    except Exception as e:
        print(f"❌ Classes endpoint failed: {e}")
        return False

def test_prediction():
    """Test the prediction endpoint with a sample image"""
    print("\n🖼️  Testing prediction endpoint...")

    # Find a test image
    test_dir = Path("test/test_renamed")
    if not test_dir.exists():
        print("❌ Test directory not found. Please run from project root.")
        return False

    # Get first JPG file
    test_images = list(test_dir.glob("*.JPG"))
    if not test_images:
        print("❌ No test images found in test/test_renamed/")
        return False

    test_image = test_images[0]
    print(f"   Using test image: {test_image}")

    try:
        with open(test_image, "rb") as f:
            files = {"file": (test_image.name, f, "image/jpeg")}
            response = requests.post(f"{BASE_URL}/predict", files=files)

        response.raise_for_status()
        data = response.json()

        print("✅ Prediction successful!")
        print(f"   Image: {data['filename']}")
        print(f"   Prediction: {data['prediction']}")
        print(".2f")
        print(f"   Model: {data['model']}")
        print(f"   Top 3 predictions:")
        for i, pred in enumerate(data['top3_predictions'][:3], 1):
            print(".2f")

        return True
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        return False

def test_detailed_health():
    """Test the detailed health endpoint"""
    print("\n🏥 Testing detailed health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status()
        data = response.json()
        print(f"✅ Detailed health: Status = {data['status']}")
        print(f"   Model status: {data['model_status']}")
        print(f"   Classes loaded: {data['classes_loaded']}")
        return True
    except Exception as e:
        print(f"❌ Detailed health check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting CropGuard AI API Tests")
    print("=" * 50)

    # Wait a moment for API to start
    print("⏳ Waiting for API to start...")
    time.sleep(2)

    tests = [
        test_health_check,
        test_get_classes,
        test_detailed_health,
        test_prediction
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the API logs for details.")
        return 1

if __name__ == "__main__":
    exit(main())
