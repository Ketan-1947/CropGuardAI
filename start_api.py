#!/usr/bin/env python3
"""
Script to start the CropGuard AI API server
"""

import subprocess
import sys
import os

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import torch
        import timm
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_model():
    """Check if model file exists"""
    if os.path.exists("vit_plantvillage.pth"):
        print("✅ Model file found: vit_plantvillage.pth")
        return True
    else:
        print("❌ Model file not found: vit_plantvillage.pth")
        print("Please ensure the trained model is in the project root.")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting CropGuard AI API server...")
    print("📡 API will be available at: http://localhost:8000")
    print("📖 API documentation at: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print("-" * 50)

    try:
        # Run the server
        subprocess.run([
            sys.executable, "main.py"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        return False

    return True

def main():
    """Main function"""
    print("🌱 CropGuard AI API Launcher")
    print("=" * 40)

    # Check prerequisites
    if not check_dependencies():
        return 1

    if not check_model():
        return 1

    # Start server
    success = start_server()

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
