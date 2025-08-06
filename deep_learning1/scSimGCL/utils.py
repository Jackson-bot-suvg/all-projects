import os
import torch
import random
import numpy as np
import h5py
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    normalized_mutual_info_score,
    adjusted_rand_score,
    homogeneity_score,
    completeness_score
)
from scipy.optimize import linear_sum_assignment

# 定义设备
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 其他函数定义...

# 设置随机种子以确保可复现性
def setup_seed(seed):
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True

# 数据加载器
def loader_construction(data_path):
    with h5py.File(data_path, 'r') as f:
        X_all = f['X'][:]
        y_all = f['obs/cell_id'][:]

    # 检查数据中的 NaN 和 Inf
    print(f"DEBUG => X_all shape: {X_all.shape}")
    print(f"DEBUG => any NaN in X_all? {np.isnan(X_all).any()}")
    print(f"DEBUG => any Inf in X_all? {np.isinf(X_all).any()}")
    print(f"DEBUG => max/min in X_all: {np.nanmax(X_all)} {np.nanmin(X_all)}")

    # 移除包含 NaN 的行
    if np.isnan(X_all).any():
        nan_mask = ~np.isnan(X_all).any(axis=1)
        X_all = X_all[nan_mask]
        y_all = y_all[nan_mask]
        print(f"DEBUG => shape after removing NaN rows: {X_all.shape}")
        print(f"DEBUG => any NaN in X_all after removal? {np.isnan(X_all).any()}")

    input_dim = X_all.shape[1]
    # 确保标签是整数编码
    if not np.issubdtype(y_all.dtype, np.integer):
        y_all = np.unique(y_all, return_inverse=True)[1]

    X_train, X_test, y_train, y_test = train_test_split(X_all, y_all, test_size=0.2, random_state=1)
    train_set = CellDataset(X_train, y_train)
    test_set = CellDataset(X_test, y_test)

    train_loader = torch.utils.data.DataLoader(dataset=train_set, batch_size=128, shuffle=True, num_workers=0)
    test_loader = torch.utils.data.DataLoader(dataset=test_set, batch_size=128, shuffle=False, num_workers=0)

    return train_loader, test_loader, input_dim

# 数据集类
class CellDataset(torch.utils.data.Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, index):
        return self.X[index], self.y[index]

# 聚类准确度计算
def cluster_acc(y_true, y_pred):
    y_true = y_true.astype(np.int64)
    assert y_pred.size == y_true.size
    D = max(y_pred.max(), y_true.max()) + 1
    w = np.zeros((D, D), dtype=np.int64)
    for i in range(y_pred.size):
        w[y_pred[i], y_true[i]] += 1

    ind = linear_sum_assignment(w.max() - w)  # 确保使用正确的函数
    ind = np.array((ind[0], ind[1])).T

    return sum([w[i, j] for i, j in ind]) * 1.0 / y_pred.size

# 评估指标计算
def evaluate(y_true, y_pred):
    acc = cluster_acc(y_true, y_pred)
    f1 = 0  # 如果需要 F1 分数，需要补充计算逻辑
    nmi = normalized_mutual_info_score(y_true, y_pred)
    ari = adjusted_rand_score(y_true, y_pred)
    homo = homogeneity_score(y_true, y_pred)
    comp = completeness_score(y_true, y_pred)
    return acc, f1, nmi, ari, homo, comp