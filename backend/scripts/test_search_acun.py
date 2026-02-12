#!/usr/bin/env python3
"""
Test FaceSeek search functionality with Acun Ilıcalı images
Usage: python test_search_acun.py <image1.jpg> [image2.jpg] [image3.jpg]
"""
import sys
import os
import json
import requests
from pathlib import Path

def load_credentials():
    """Load test credentials from file"""
    creds_file = Path(__file__).parent / ".test_credentials.json"
    if not creds_file.exists():
        print("[ERROR] Credentials file not found at:", creds_file)
        print("[INFO] Run: python scripts/create_acun_test_user.py first")
        sys.exit(1)

    with open(creds_file) as f:
        return json.load(f)

def test_search(token, image_path):
    """Test search with a single image"""
    print(f"\n[TEST] Searching with: {image_path}")

    # Check image exists
    img_file = Path(image_path)
    if not img_file.exists():
        print(f"[ERROR] Image not found: {image_path}")
        return False

    print(f"[INFO] Image size: {img_file.stat().st_size / 1024:.1f} KB")

    # Search endpoint
    api_base = "https://face-seek.com"
    search_url = f"{api_base}/api/search-face"

    # Prepare request
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        with open(img_file, 'rb') as f:
            files = {'file': f}
            print(f"[WAIT] Sending search request...")
            response = requests.post(search_url, headers=headers, files=files, timeout=30)

        print(f"[RESP] Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Search successful")

            # Display results
            results = result.get("results", [])
            if results:
                print(f"[FOUND] {len(results)} matches:")
                for i, match in enumerate(results[:5], 1):
                    print(f"  {i}. Similarity: {match.get('similarity', 0):.2%}")
                    print(f"     Source: {match.get('source', 'Unknown')}")
                    if match.get('source_url'):
                        print(f"     URL: {match['source_url'][:60]}...")
            else:
                print("[INFO] No matches found (dataset may not contain Acun Ilıcalı)")

            return True
        else:
            print(f"[ERROR] Search failed: {response.status_code}")
            try:
                error = response.json()
                print(f"[ERROR] Details: {error}")
            except:
                print(f"[ERROR] Response: {response.text}")
            return False

    except Exception as e:
        print(f"[ERROR] Exception: {e}")
        return False

def main():
    """Main test runner"""
    # Get credentials
    creds = load_credentials()
    token = creds["token"]
    email = creds["email"]

    print("=" * 70)
    print("[SETUP] FaceSeek Search Test")
    print("=" * 70)
    print(f"[USER] {email}")
    print(f"[TOKEN] {token[:30]}...")
    print()

    # Get images from command line or use defaults
    if len(sys.argv) > 1:
        images = sys.argv[1:]
    else:
        print("[INFO] Usage: python test_search_acun.py <image1.jpg> [image2.jpg] [image3.jpg]")
        print("[INFO] No images provided. Using test images if available...")
        images = []

    if not images:
        print("[ERROR] Please provide image files to search")
        sys.exit(1)

    # Run tests
    print(f"\n[RUN] Testing {len(images)} image(s)...")
    print("=" * 70)

    results = []
    for image in images:
        success = test_search(token, image)
        results.append((image, success))

    # Summary
    print("\n" + "=" * 70)
    print("[SUMMARY] Test Results")
    print("=" * 70)
    for image, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {image}")

    passed = sum(1 for _, s in results if s)
    print(f"\nTotal: {passed}/{len(results)} passed")

    return 0 if all(s for _, s in results) else 1

if __name__ == "__main__":
    sys.exit(main())
