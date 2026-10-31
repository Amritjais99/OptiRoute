"""Run MiniLM embeddings with ONNX, without loading the PyTorch runtime."""
import os

import numpy as np
from fastembed import TextEmbedding


class SentenceTransformer:
    def __init__(self, name):
        self.model = TextEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            cache_dir=os.environ.get("EMBEDDING_CACHE_DIR", "/tmp/optiroute-embeddings"),
            threads=1,
        )

    def encode(self, text, convert_to_tensor=False):
        return next(self.model.embed([text]))


class util:
    @staticmethod
    def cos_sim(left, right):
        a, b = np.asarray(left), np.asarray(right)
        denominator = np.linalg.norm(a) * np.linalg.norm(b)
        return np.asarray(np.dot(a, b) / denominator if denominator else 0.0)
