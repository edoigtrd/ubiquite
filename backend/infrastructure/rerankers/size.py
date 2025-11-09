import backend.infrastructure.rerankers as master
from backend.infrastructure.utils import load_images_from_urls, drop_none
from typing import Literal

class SizeReranker(master.ImageReranker):
    def __init__(self, metric : Literal["area","diagonal"]) -> None:
        super().__init__()
        self.metric = metric

    def rerank(self, images: list[master.ImageResult], user_query: str) -> list[master.ImageResult]:
        # Rank images by their size (width * height) in descending order (largest first)
        pil_images = load_images_from_urls([img.img for img in images])
        pil_images = drop_none(pil_images)

        get_size = lambda im: im.size[0] * im.size[1]
        get_diagonal = lambda im: (im.size[0]**2 + im.size[1]**2)**0.5

        def compute_metric(im) :
            match self.metric :
                case "area" :
                    return get_size(im)
                case "diagonal" :
                    return get_diagonal(im)
                case _ :
                    return get_size(im)

        images = [
            (x, compute_metric(pil_img))
            for x, pil_img in zip(images, pil_images)
        ]

        return [
            img
            for img, size in sorted(images, key=lambda x: x[1], reverse=True)
        ]


master.ImageRerankerRegistry.get_default_registry().register(SizeReranker)
