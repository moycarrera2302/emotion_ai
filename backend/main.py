"""
EmotionsAI Python Backend
Requires: pip install -r requirements.txt
Requires: Ollama running locally with a model pulled (e.g. ollama pull llama3.2)

Run: uvicorn main:app --reload
"""

import json
from typing import Optional
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="EmotionsAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"  # Change to llama3, mistral, phi3, etc.


# ── Models ────────────────────────────────────────────────────────────────────

class EmotionSnapshot(BaseModel):
    dominant_emotion: str
    confidence: float
    valence: float
    arousal: float
    stress_level: float
    recent_emotions: list[str] = []
    session_duration_s: Optional[int] = None


class InsightResponse(BaseModel):
    insight: str
    suggestion: str
    model: str
    backend: str = "ollama"


class MindfulnessRequest(BaseModel):
    valence: float
    stress_level: float
    dominant_emotion: str


class MindfulnessResponse(BaseModel):
    exercise: str
    reasoning: str
    instructions: str


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    ollama_ok = False
    model_available = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://localhost:11434/api/tags")
            if r.status_code == 200:
                ollama_ok = True
                tags = r.json().get("models", [])
                model_available = any(OLLAMA_MODEL in m.get("name", "") for m in tags)
    except Exception:
        pass
    return {
        "status": "ok",
        "ollama": ollama_ok,
        "model": OLLAMA_MODEL,
        "model_available": model_available,
    }


# ── LLM Insights ─────────────────────────────────────────────────────────────

@app.post("/api/insights")
async def get_insights(data: EmotionSnapshot) -> InsightResponse:
    valence_desc = "positive" if data.valence > 0.3 else "negative" if data.valence < -0.3 else "neutral"
    arousal_desc = "high energy" if data.arousal > 0.3 else "low energy" if data.arousal < -0.3 else "moderate energy"

    recent = ", ".join(data.recent_emotions[-5:]) if data.recent_emotions else "not available"
    duration_info = f"{data.session_duration_s // 60}m {data.session_duration_s % 60}s" if data.session_duration_s else "unknown"

    prompt = f"""You are EmotionsAI, an empathetic emotional wellness assistant.

Current emotional reading:
- Dominant emotion: {data.dominant_emotion} (confidence: {data.confidence:.0%})
- Valence: {data.valence:.2f} ({valence_desc})
- Arousal: {data.arousal:.2f} ({arousal_desc})
- Stress level: {data.stress_level:.0%}
- Recent emotion sequence: {recent}
- Session duration: {duration_info}

Provide a brief, empathetic observation about this emotional state (1-2 sentences) and one practical, science-based suggestion.
Important: frame observations with care ("I notice..." not "You are..."). Never pathologize normal emotional variation.

Respond in JSON format with exactly these keys:
- "insight": a warm, observational sentence about the emotional state
- "suggestion": one specific, actionable suggestion

JSON only, no other text."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.7, "top_p": 0.9},
            })
            result = r.json()
            parsed = json.loads(result["response"])
            return InsightResponse(
                insight=parsed.get("insight", "I notice an interesting emotional pattern."),
                suggestion=parsed.get("suggestion", "Take a moment to check in with yourself."),
                model=OLLAMA_MODEL,
            )
    except Exception as e:
        return InsightResponse(
            insight=f"I notice your current emotional state shows {data.dominant_emotion}.",
            suggestion="Take a slow deep breath and notice how you feel in this moment.",
            model=f"{OLLAMA_MODEL} (unavailable: {str(e)[:50]})",
        )


# ── Mindfulness Recommendation ───────────────────────────────────────────────

@app.post("/api/mindfulness")
async def recommend_mindfulness(data: MindfulnessRequest) -> MindfulnessResponse:
    exercises = {
        "4-7-8": "4-7-8 Breathing (inhale 4s, hold 7s, exhale 8s) — Weil 2015",
        "box": "Box Breathing (4s inhale, hold, exhale, hold) — Navy SEAL protocol",
        "physiological-sigh": "Physiological Sigh (double inhale + long exhale) — Balban et al. 2023",
        "coherent": "Coherent Breathing (5.5 breaths/min) — Lehrer & Gevirtz 2014",
        "body-scan": "Body Scan meditation — Kabat-Zinn MBSR 1990",
    }

    prompt = f"""You are an emotional wellness expert recommending a mindfulness exercise.

Current state:
- Emotion: {data.dominant_emotion}
- Valence: {data.valence:.2f} (-1=very negative, +1=very positive)
- Stress: {data.stress_level:.0%}

Available exercises:
{json.dumps(exercises, indent=2)}

Choose the most appropriate exercise for this state and explain why briefly.
Respond in JSON with keys:
- "exercise": one of the exercise keys (e.g. "box")
- "reasoning": one sentence why this exercise fits
- "instructions": brief step-by-step (2-3 sentences)

JSON only."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.5},
            })
            result = r.json()
            parsed = json.loads(result["response"])
            return MindfulnessResponse(
                exercise=parsed.get("exercise", "box"),
                reasoning=parsed.get("reasoning", "This exercise helps regulate the nervous system."),
                instructions=parsed.get("instructions", "Breathe slowly and evenly."),
            )
    except Exception:
        return MindfulnessResponse(
            exercise="physiological-sigh",
            reasoning="Quick stress relief when the backend is unavailable.",
            instructions="Take a deep inhale, add a short second inhale, then exhale fully and slowly.",
        )
