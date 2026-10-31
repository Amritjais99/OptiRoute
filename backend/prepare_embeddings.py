"""Download the ONNX model during build so first prompts do not download it."""
from optiroute.engine.embeddings import SentenceTransformer

SentenceTransformer("all-MiniLM-L6-v2").encode("deployment readiness")
