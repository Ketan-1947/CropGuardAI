import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import timm
import os

# --- Setup ---
data_dir = "data/"   # adjust path if needed
save_path = "vit_plantvillage.pth"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- Dataset ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.5, 0.5, 0.5), std=(0.5, 0.5, 0.5))
])

train_ds = datasets.ImageFolder(os.path.join(data_dir, "train"), transform=transform)
val_ds = datasets.ImageFolder(os.path.join(data_dir, "valid"), transform=transform)

train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
val_loader = DataLoader(val_ds, batch_size=32)

# --- Model ---
model = timm.create_model('vit_base_patch16_224', pretrained=True)
model.head = nn.Linear(model.head.in_features, len(train_ds.classes))
model = model.to(device)

# --- Training setup ---
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

# --- Training loop ---
for epoch in range(3):  # short run for demo
    model.train()
    running_loss = 0.0
    for imgs, labels in train_loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = criterion(model(imgs), labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
    print(f"Epoch {epoch+1}: Loss = {running_loss/len(train_loader):.4f}")

# --- Save model ---
torch.save({
    "model_state_dict": model.state_dict(),
    "class_names": train_ds.classes
}, save_path)
print(f"Model saved to {save_path}")
