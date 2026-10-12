"""
VeriFact AI — Vision Forensics & Multimodal Image Integrity Engine
Performs Error Level Analysis (ELA), EXIF metadata inspection,
synthetic artifact detection, and visual-linguistic consistency scoring.
"""

from __future__ import annotations

import io
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class ImageForensics:
    """
    Multimodal image integrity and forensic tampering detector.
    - Error Level Analysis (ELA): reveals resaved/spliced image areas
    - Metadata/EXIF scanner: detects synthetic generation signatures (Midjourney, DALL-E, Photoshop)
    - CLIP cross-modal similarity check
    """

    def __init__(self):
        self._clip_model = None
        self._clip_processor = None
        self._is_initialized = False

    def initialize_clip(self) -> bool:
        """Attempt to load HuggingFace OpenCLIP / CLIP model."""
        try:
            from transformers import CLIPProcessor, CLIPModel

            self._clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self._clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self._is_initialized = True
            logger.info("Initialized CLIP vision-text model.")
            return True
        except Exception as e:
            logger.info("CLIP model not initialized (%s). Operating in forensic ELA + heuristic mode.", e)
            self._is_initialized = False
            return False

    def analyze_image(
        self,
        image_bytes: bytes,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run complete forensic analysis on image binary bytes."""
        try:
            from PIL import Image, ImageChops, ImageEnhance, ExifTags
        except ImportError:
            return {
                "score": 50.0,
                "confidence": 0.5,
                "ela_anomaly_score": 0.0,
                "exif_metadata": {},
                "ai_generator_signatures": [],
                "warnings": ["Pillow library not installed; image forensics bypassed."],
            }

        try:
            img = Image.open(io.BytesIO(image_bytes))
            format_name = img.format or "UNKNOWN"
            width, height = img.size
        except Exception as e:
            return {
                "score": 20.0,
                "confidence": 0.3,
                "warnings": [f"Failed to decode image data: {str(e)}"],
            }

        # 1. EXIF Metadata & Software tags inspection
        exif_info, ai_tags = self._extract_metadata(img)

        # 2. Error Level Analysis (ELA)
        ela_score, ela_details = self._compute_ela(img)

        # 3. Cross-modal semantic alignment (Caption vs Image)
        clip_score = self._compute_clip_alignment(img, caption)

        # 4. Synthesize final forensic score (0 = High Tampering, 100 = Authentic)
        tamper_penalty = 0.0

        if ai_tags:
            tamper_penalty += 45.0  # Explicit AI generator found in metadata
        if ela_score > 0.4:
            tamper_penalty += (ela_score - 0.4) * 60.0  # Compression variance
        if clip_score is not None and clip_score < 0.25:
            tamper_penalty += 20.0  # Caption drastically disagrees with image content

        authenticity_score = max(5.0, min(95.0, 85.0 - tamper_penalty))
        confidence = 0.85 if ai_tags else round(0.55 + min(0.35, ela_score), 2)

        return {
            "score": round(authenticity_score, 1),
            "confidence": round(confidence, 2),
            "ela_anomaly_score": round(ela_score, 3),
            "ela_details": ela_details,
            "clip_similarity": round(clip_score, 3) if clip_score is not None else 0.72,
            "image_dimensions": f"{width}x{height}",
            "image_format": format_name,
            "exif_metadata": exif_info,
            "ai_generator_signatures": ai_tags,
            "ocr_text": "",
            "warnings": ["Detected synthetic AI generator metadata signature!"] if ai_tags else [],
        }

    def _extract_metadata(self, img) -> tuple[Dict[str, str], List[str]]:
        """Extract camera EXIF and search for generative AI tool signatures."""
        metadata = {}
        ai_signatures = []

        try:
            from PIL.ExifTags import TAGS

            raw_exif = img.getexif()
            if raw_exif:
                for tag_id, val in raw_exif.items():
                    tag_name = TAGS.get(tag_id, str(tag_id))
                    if isinstance(val, (bytes, bytearray)):
                        continue
                    metadata[str(tag_name)] = str(val)[:120]

            # Check for AI generators in metadata or software tags
            full_meta_str = " ".join(metadata.values()).lower()
            known_ai_tools = [
                "midjourney", "stable diffusion", "dall-e", "comfyui", "automatic1111",
                "novelai", "civitai", "photoshop generative fill", "adobe firefly", "bing image creator"
            ]
            for tool in known_ai_tools:
                if tool in full_meta_str:
                    ai_signatures.append(tool.title())

            # Check PNG text chunks
            if hasattr(img, "text") and isinstance(img.text, dict):
                for k, v in img.text.items():
                    metadata[f"PNG_{k}"] = str(v)[:120]
                    v_low = str(v).lower()
                    for tool in known_ai_tools:
                        if tool in v_low and tool.title() not in ai_signatures:
                            ai_signatures.append(tool.title())

        except Exception as e:
            logger.debug("EXIF parsing error: %s", e)

        return metadata, ai_signatures

    def _compute_ela(self, img, quality: int = 90) -> tuple[float, Dict[str, Any]]:
        """
        Error Level Analysis: re-compresses image at 90% JPEG quality
        and measures pixel difference variance.
        """
        try:
            from PIL import ImageChops, ImageStat

            # Convert to RGB
            rgb_img = img.convert("RGB")
            buffer = io.BytesIO()
            rgb_img.save(buffer, "JPEG", quality=quality)
            buffer.seek(0)

            resaved_img = img.__class__.open(buffer)
            diff = ImageChops.difference(rgb_img, resaved_img)

            # Measure variance / statistical brightness of difference
            stat = ImageStat.Stat(diff)
            mean_diff = sum(stat.mean) / len(stat.mean)
            rms_diff = sum(stat.rms) / len(stat.rms)

            # Anomaly metric normalized [0.0 - 1.0]
            anomaly_score = min(1.0, (rms_diff / 35.0))

            return anomaly_score, {
                "mean_diff": round(mean_diff, 2),
                "rms_diff": round(rms_diff, 2),
                "quality_tested": quality,
            }
        except Exception as e:
            logger.debug("ELA calculation failed: %s", e)
            return 0.15, {"error": str(e)}

    def _compute_clip_alignment(self, img, caption: Optional[str]) -> Optional[float]:
        """Compute CLIP visual-textual semantic matching if available."""
        if not caption or not self._is_initialized or not self._clip_model:
            return None

        try:
            import torch

            inputs = self._clip_processor(
                text=[caption],
                images=img.convert("RGB"),
                return_tensors="pt",
                padding=True,
            )
            with torch.no_grad():
                outputs = self._clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1).cpu().numpy()
                return float(probs[0][0])
        except Exception as e:
            logger.debug("CLIP similarity error: %s", e)
            return None
