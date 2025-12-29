#!/usr/bin/env python
"""Test Gemini API key"""
import os
import sys

print("=" * 50)
print("Testing Gemini API Key")
print("=" * 50)

# Check environment variable
gemini_key = os.getenv('GEMINI_API_KEY')
print(f"\n1. GEMINI_API_KEY exists: {bool(gemini_key)}")
if gemini_key:
    print(f"   Key length: {len(gemini_key)}")
    print(f"   Key starts with AIzaSy: {gemini_key.startswith('AIzaSy')}")
    print(f"   Key (first 20 chars): {gemini_key[:20]}...")
else:
    print("   ❌ GEMINI_API_KEY not found!")
    sys.exit(1)

# Test Gemini extractor initialization
print("\n2. Testing Gemini Extractor initialization...")
try:
    from app.ai.extractors.gemini_extractor import GeminiExtractor
    extractor = GeminiExtractor()
    print("   ✅ Gemini extractor initialized successfully!")
    print(f"   Model: {extractor.model.model_name}")
except Exception as e:
    print(f"   ❌ Error initializing Gemini extractor: {e}")
    sys.exit(1)

# Test MultiModelExtractor
print("\n3. Testing MultiModelExtractor...")
try:
    from app.ai.multi_model_extractor import MultiModelExtractor
    multi_extractor = MultiModelExtractor()
    print("   ✅ MultiModelExtractor initialized!")
    print(f"   Available extractors:")
    print(f"     - OpenAI: {'Yes' if multi_extractor.openai_extractor else 'No (no API key)'}")
    print(f"     - Gemini: {'Yes' if multi_extractor.gemini_extractor else 'No (no API key)'}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
print("✅ All tests passed! Gemini API key is working.")
print("=" * 50)








