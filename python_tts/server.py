from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import torch
import os
from transformers import AutoProcessor, DiaForConditionalGeneration

app = FastAPI()

torch_device = "cuda" if torch.cuda.is_available() else "cpu"
current_model_checkpoint = "nari-labs/Dia-1.6B-0626"
processor = None
model = None

print(f"[DIA SERVER] Loading initial model {current_model_checkpoint} to {torch_device}...")
try:
    processor = AutoProcessor.from_pretrained(current_model_checkpoint)
    model = DiaForConditionalGeneration.from_pretrained(current_model_checkpoint).to(torch_device)
    print("[DIA SERVER] Model loaded successfully.")
except Exception as e:
    print(f"[DIA SERVER ERROR] Failed to load model: {e}")

class SpeechRequest(BaseModel):
    text: str
    model_id: str = "nari-labs/Dia-1.6B-0626"

@app.post("/generate")
async def generate_speech(req: SpeechRequest):
    global model, processor, current_model_checkpoint

    target_model = req.model_id.strip() if req.model_id else "nari-labs/Dia-1.6B-0626"

    if target_model != current_model_checkpoint or processor is None or model is None:
        print(f"[DIA SERVER] Loading newly requested model '{target_model}'...")
        try:
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            processor = AutoProcessor.from_pretrained(target_model)
            model = DiaForConditionalGeneration.from_pretrained(target_model).to(torch_device)
            current_model_checkpoint = target_model
            print("[DIA SERVER] Model changed and loaded successfully.")
        except Exception as e:
            print(f"[DIA SERVER ERROR] Failed to load requested model: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    if not model or not processor:
        raise HTTPException(status_code=500, detail="Model is still not loaded.")

    # Dia requires [S1] prepended
    raw_text = req.text.strip()
    if not raw_text.startswith("[S1]"):
        dialogue = f"[S1] {raw_text}"
    else:
        dialogue = raw_text

    print(f"[DIA SERVER] Generating audio for: {dialogue}")

    output_path = f"temp_audio_{hash(dialogue)}.wav"

    try:
        inputs = processor(text=[dialogue], padding=True, return_tensors="pt").to(torch_device)
        outputs = model.generate(
            **inputs, 
            max_new_tokens=4096, 
            guidance_scale=3.0, 
            temperature=1.2, 
            top_p=0.90, 
            top_k=45
        )
        decoded = processor.batch_decode(outputs)
        processor.save_audio(decoded, output_path)
        
        return FileResponse(output_path, media_type="audio/wav")
    except Exception as e:
        print(f"[DIA SERVER ERROR] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Note: FileResponse doesn't natively clean up the file immediately in all standard ways, 
    # but for this LCI specific isolated environment we will overwrite or ignore temp files.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
