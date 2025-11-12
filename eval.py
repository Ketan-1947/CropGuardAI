import os
import torch
from PIL import Image
from torchvision import transforms
from sklearn.metrics import classification_report, confusion_matrix
import timm
import numpy as np
import re

# --- Config ---
test_dir = "test/test_renamed"
checkpoint_path = "vit_plantvillage.pth"
device = "cpu"

# --- Load checkpoint ---
checkpoint = torch.load(checkpoint_path, map_location=device)
class_names = checkpoint["class_names"]

# --- Model ---
model = timm.create_model("vit_base_patch16_224", pretrained=False)
model.head = torch.nn.Linear(model.head.in_features, len(class_names))
model.load_state_dict(checkpoint["model_state_dict"])
model = model.to(device)
model.eval()

# --- Transform ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5))
])

# --- Helper to get true label from filename ---
def extract_label(filename):
    name = os.path.splitext(filename)[0]  # remove extension
    label = re.sub(r'\d+$', '', name)     # remove trailing digits
    return label

# --- Collect predictions ---
y_true, y_pred = [], []

for fname in os.listdir(test_dir):
    if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue

    label_name = extract_label(fname)
    if label_name not in class_names:
        print(f"⚠️ Skipping {fname}: unknown class {label_name}")
        continue

    img_path = os.path.join(test_dir, fname)
    img = Image.open(img_path).convert("RGB")
    img_t = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(img_t)
        pred = torch.argmax(output, dim=1).item()

    y_true.append(class_names.index(label_name))
    y_pred.append(pred)

# --- Metrics ---
print("\nClassification Report:\n")
# Find classes actually present in test set
present_classes = sorted(list(set([class_names[i] for i in y_true])), key=lambda x: class_names.index(x))
present_indices = [class_names.index(c) for c in present_classes]

print("\nClassification Report:\n")
print(classification_report(
    y_true, y_pred, labels=present_indices, target_names=present_classes, digits=4
))


cm = confusion_matrix(y_true, y_pred)
print("Confusion Matrix:\n", cm)

accuracy = np.mean(np.array(y_true) == np.array(y_pred))
print(f"\nOverall Accuracy: {accuracy * 100:.2f}%")
