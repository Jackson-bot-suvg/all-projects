from torchvision import transforms
from PIL import Image

# 图片路径
img_path = "/Users/jacksonzhang/Desktop/program/pytorch_learning/data/train/ants/0013035.jpg"
img = Image.open(img_path)  # 使用 PIL 加载图片

# 定义转换
tensor_trans = transforms.ToTensor()  # 将图片转换为 PyTorch 张量
tensor_img = tensor_trans(pic)  # 应用转换
print(tensor_img)  # 输出张量