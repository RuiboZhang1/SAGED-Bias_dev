import requests
import random
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust this to match your server URL

def print_separator(title: str):
    """Print a separator with title for better readability"""
    print("\n" + "="*50)
    print(f" {title} ".center(50, "="))
    print("="*50 + "\n")

def get_available_models() -> Dict[str, Any]:
    """Get available models from the API"""
    print_separator("Getting Available Models")
    
    try:
        response = requests.get(f"{BASE_URL}/api/model/available")
        response.raise_for_status()  # Raise exception for bad status codes
        
        data = response.json()
        print("Response Status:", response.status_code)
        print("Response Data:")
        print(json.dumps(data, indent=2))
        
        return data["models"]
    except requests.exceptions.RequestException as e:
        print(f"Error getting models: {e}")
        return {}

def test_generate_text(model_name: str = None):
    """Test text generation with specified or random model"""
    print_separator("Testing Text Generation")
    
    # If no model specified, get available models and pick one randomly
    if model_name is None:
        models = get_available_models()
        if not models:
            print("No models available to test with")
            return
        model_name = random.choice(list(models.keys()))
        print(f"Selected random model: {model_name}")
    
    test_text = "What is the capital of France?"
    print(f"Test text: {test_text}")
    
    try:
        payload = {
            "text": test_text,
            "system_prompt": "You are a helpful assistant."
        }
        if model_name:
            payload["model_name"] = model_name
            
        print("\nSending request with payload:")
        print(json.dumps(payload, indent=2))
        
        response = requests.post(f"{BASE_URL}/api/model/generate", json=payload)
        response.raise_for_status()
        
        data = response.json()
        print("\nResponse Status:", response.status_code)
        print("Generated Response:")
        print(json.dumps(data, indent=2))
        
    except requests.exceptions.RequestException as e:
        print(f"Error generating text: {e}")

def test_invalid_cases():
    """Test various invalid cases"""
    print_separator("Testing Invalid Cases")
    
    # Test empty text
    print("\nTesting empty text:")
    try:
        response = requests.post(
            f"{BASE_URL}/api/model/generate",
            json={
                "text": "",
                "system_prompt": "You are a helpful assistant."
            }
        )
        print(f"Status Code: {response.status_code}")
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
    
    # Test invalid model
    print("\nTesting invalid model:")
    try:
        response = requests.post(
            f"{BASE_URL}/api/model/generate",
            json={
                "text": "What is the capital of Germany?",
                "model_name": "non-existent-model",
                "system_prompt": "You are a helpful assistant."
            }
        )
        print(f"Status Code: {response.status_code}")
        print("Response:", response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")

def main():
    """Main function to run all tests"""
    print_separator("Starting Model Router Tests")
    
    # Get available models
    models = get_available_models()
    
    if models:
        # Test with random model
        test_generate_text()
        
        # Test with default model (no model specified)
        print_separator("Testing with Default Model")
        test_generate_text(model_name=None)
        
        # Test invalid cases
        test_invalid_cases()
    else:
        print("Could not proceed with tests as no models are available")

if __name__ == "__main__":
    main() 