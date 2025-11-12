import os
import torch
from PIL import Image
from torchvision import transforms
import timm

# --- Config ---
_CHECKPOINT_PATH = "vit_plantvillage.pth"
_DEVICE = "cuda"

# --- Load checkpoint and class names ---
checkpoint = torch.load(_CHECKPOINT_PATH, map_location=_DEVICE)
class_names = checkpoint["class_names"]

# --- Model ---
model = timm.create_model("vit_base_patch16_224", pretrained=False)
model.head = torch.nn.Linear(model.head.in_features, len(class_names))
model.load_state_dict(checkpoint["model_state_dict"])
model = model.to(_DEVICE)
model.eval()

# --- Transform ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5))
])


def predict_image(image_path: str) -> str:
    """Return the predicted class name for the given image file path.

    Minimal checks are performed: verifies the file exists and is an image file
    by extension. Raises FileNotFoundError if the path doesn't exist.

    Args:
        image_path: path to an image file (jpg/jpeg/png).

    Returns:
        The predicted class name (str).
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    if not image_path.lower().endswith(('.jpg', '.jpeg', '.png')):
        # Let PIL attempt to open other types, but warn early for common cases.
        pass

    img = Image.open(image_path).convert("RGB")
    img_t = transform(img).unsqueeze(0).to(_DEVICE)

    with torch.no_grad():
        output = model(img_t)
        pred_idx = int(torch.argmax(output, dim=1).item())

    return class_names[pred_idx]

print(predict_image(r"C:\Ketan\projects\plant\test\test\CornCommonRust3.JPG"))
