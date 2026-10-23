# Optional AI Model Setup & Hardware Guidelines

## 1. Low-Resource Baseline (Default)

The application ships configured by default for **CPU-optimized, zero-GPU execution**:
- **Target Specification:** Intel Core i7 8th Gen / 8GB RAM / Windows 11.
- **Default Extraction:** PyPDF native text parser and regex heuristics (~35 MB RAM).
- **Default Forgery Screening:** OpenCV Laplacian variance and 64-bit dHash perceptual fingerprinting (~45 MB RAM).
- **Default Object Detection:** OpenCV dimension and brightness heuristics (~20 MB RAM).

---

## 2. Installing Advanced AI Models (Optional)

When running on high-capacity servers or workstations equipped with compatible CUDA GPUs (>= 6GB VRAM), advanced neural backends can be activated.

### PaddleOCR (High-Accuracy Document OCR)
```bash
pip install paddlepaddle paddleocr
```
Set in `.env`:
```env
OCR_ENGINE=PADDLEOCR
```

### YOLOv8 (Deep-Learning Infrastructure Object Detection)
Detects desks, computers, lab apparatus, and fire safety equipment from photographs:
```bash
pip install ultralytics
```
Set in `.env`:
```env
ENABLE_YOLO_INFRASTRUCTURE=True
YOLO_MODEL_WEIGHTS=yolov8n.pt
```

### LayoutLMv3 (Document Layout Understanding)
For forms and tabular certificate parsing:
```bash
pip install transformers torch torchvision
```
Set in `.env`:
```env
ENABLE_LAYOUTLM=True
```

---

## 3. Memory Safeguards

- Never instantiate YOLOv8, LayoutLMv3, and Detectron2 concurrently in the same process on an 8GB machine.
- Intermediate image matrices (`cv2.Mat`) and PyMuPDF pixmaps are explicitly deleted and garbage-collected after every inference step.
