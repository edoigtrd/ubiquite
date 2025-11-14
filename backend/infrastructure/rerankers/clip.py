import backend.infrastructure.rerankers as master
from backend.infrastructure.utils import load_images_from_urls, drop_none
from typing import Literal

import open_clip
import torch

class ClipReranker(master.ImageReranker):
    def __init__(self, device : Literal["cpu","cuda","auto"], model_name="hf-hub:apple/MobileCLIP-S1-OpenCLIP") -> None:
        super().__init__()
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        model, preprocess, preprocess_val = open_clip.create_model_and_transforms(model_name)
        tokenizer = open_clip.get_tokenizer(model_name)

        #self.device = torch.device(self.device)
        self.model = model.to(self.device)
        self.preprocess = preprocess
        self.tokenizer = tokenizer

    def _get_prob(self, images, text):
        texts = [text] if isinstance(text, str) else text

        batch = torch.cat([self.preprocess(img).unsqueeze(0) for img in images]).to(self.device)

        tokens = self.tokenizer(texts).to(self.device)

        with torch.no_grad(), torch.autocast(self.device):
            img_feat = self.model.encode_image(batch)
            txt_feat = self.model.encode_text(tokens)

            img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
            txt_feat = txt_feat / txt_feat.norm(dim=-1, keepdim=True)

            logits = 100.0 * img_feat @ txt_feat.t()
            probs = logits.float().squeeze(-1).softmax(dim=0)

        return probs.argsort(descending=True).detach().cpu().numpy()

    def rerank(self, images: list[master.ImageResult], user_query: str) -> list[master.ImageResult]:
        pil_images = load_images_from_urls([img.img for img in images])
        pil_images = drop_none(pil_images)

        indices = self._get_prob(pil_images, user_query)
        return [images[i] for i in indices]


master.ImageRerankerRegistry.get_default_registry().register(ClipReranker)