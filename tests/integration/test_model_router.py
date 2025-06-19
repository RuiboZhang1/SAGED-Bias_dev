import pytest
from fastapi.testclient import TestClient
import random
from app_simplified.backend.main import app

client = TestClient(app)

def test_get_available_models():
    """Test getting available models endpoint"""
    response = client.get("/api/model/available")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "success"
    assert "models" in data
    assert isinstance(data["models"], dict)
    assert len(data["models"]) > 0
    return data["models"]

def test_generate_text():
    """Test text generation with a random model"""
    # First get available models
    models = test_get_available_models()
    
    # Randomly select a model
    model_name = random.choice(list(models.keys()))
    
    # Test generation with the selected model
    test_text = "What is the capital of France?"
    response = client.post(
        "/api/model/generate",
        json={
            "text": test_text,
            "model_name": model_name,
            "system_prompt": "You are a helpful assistant."
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0

def test_generate_text_with_default_model():
    """Test text generation with default model (no model specified)"""
    test_text = "What is the capital of Japan?"
    response = client.post(
        "/api/model/generate",
        json={
            "text": test_text,
            "system_prompt": "You are a helpful assistant."
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0

def test_generate_text_invalid_input():
    """Test text generation with invalid input"""
    response = client.post(
        "/api/model/generate",
        json={
            "text": "",  # Empty text should fail
            "system_prompt": "You are a helpful assistant."
        }
    )
    
    assert response.status_code == 422  # Validation error

def test_generate_text_invalid_model():
    """Test text generation with invalid model name"""
    response = client.post(
        "/api/model/generate",
        json={
            "text": "What is the capital of Germany?",
            "model_name": "non-existent-model",
            "system_prompt": "You are a helpful assistant."
        }
    )
    
    assert response.status_code == 500  # Server error for invalid model 