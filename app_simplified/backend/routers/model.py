from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from ..services.model_service import ModelService
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/model",
    tags=["model"],
    responses={404: {"description": "Not found"}},
)

class GenerationRequest(BaseModel):
    text: str
    model_name: Optional[str] = None
    system_prompt: Optional[str] = "You are a helpful assistant."

@router.get("/available")
async def get_available_models() -> Dict[str, Any]:
    """
    Get information about available models.
    """
    try:
        model_service = ModelService()
        return model_service.get_available_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prompt/{template_name}")
async def run_prompt(template_name: str, variables: Dict[str, Any]) -> Dict[str, str]:
    """
    Run a prompt using a specific template.
    
    Args:
        template_name: Name of the prompt template to use
        variables: Variables to substitute in the template
    """
    try:
        model_service = ModelService()
        response = model_service.run_prompt(template_name, **variables)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_text(request: GenerationRequest) -> Dict[str, str]:
    """
    Generate text using a specified model and system prompt.
    
    Args:
        request: GenerationRequest containing text, optional model_name and system_prompt
    """
    try:
        model_service = ModelService(model_name=request.model_name if request.model_name else "qwen-turbo-latest")
        generation_function = model_service.create_generation_function(
            model_name=request.model_name,
            system_prompt=request.system_prompt
        )
        
        response = generation_function(request.text)
        if response is None:
            raise HTTPException(status_code=500, detail="Failed to generate response")
            
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 