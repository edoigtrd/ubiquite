import backend.infrastructure.rerankers as master
import voyageai
from PIL import Image
from backend.infrastructure.utils import load_images_from_urls, drop_none
import numpy as np
from scipy.spatial.distance import cosine
import math

def count_tokens(img: Image.Image) -> int:
    w, h = img.size
    pixels = w * h
    return math.ceil(pixels * 1/560)

class VoyageReranker(master.ImageReranker):
    def __init__(self, api_key, model) -> None:
        super().__init__()
        self.vo = voyageai.Client(api_key=api_key)
        self.model = model

    def rerank(self, images: list[master.ImageResult], user_query: str) -> list[master.ImageResult]:
        inputs = []

        pil_images = load_images_from_urls([img.img for img in images])
        pil_images = drop_none(pil_images)

        for img, pil_img in zip(images, pil_images):
            if pil_img is None :
                continue
            inputs.append([
                img.title if img.title else "image",
                pil_img
            ])
        
        inputs = drop_none(inputs)
        
        images_em = self.vo.multimodal_embed(inputs, model=self.model, input_type="document").embeddings
        query_em = self.vo.multimodal_embed([[user_query]], model=self.model, input_type="query").embeddings[0]

        similarities = []
        for idx, img_em in enumerate(images_em):
            sim = 1 - cosine(query_em, img_em)
            similarities.append((sim, idx))

        similarities.sort(reverse=True, key=lambda x: x[0])
        reranked_images = [images[idx] for _, idx in similarities]
        return reranked_images


# Register the VoyageReranker
master.ImageRerankerRegistry.get_default_registry().register(VoyageReranker)
