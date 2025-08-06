#!/usr/bin/env python
import os
import torch
import numpy as np
import pandas as pd
import random
import pickle
import argparse
import matplotlib.pyplot as plt

from BERMAD import training, testing
from pre_processing import pre_processing, read_cluster_similarity, generate_cluster_similarity

# 固定随机种子
seed = 0
random.seed(seed)
np.random.seed(seed)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
torch.manual_seed(seed)

# 神经网络参数
code_dim = 20
batch_size = 50  # 每个 cluster 的批大小
base_lr = 1e-3
lr_step = 200  # 学习率的步长衰减
momentum = 0.9
l2_decay = 5e-5
gamma = 1  # 重建与迁移学习之间的正则化权重
log_interval = 1

# CUDA 设置
device_id = 0  # 使用的 GPU ID
cuda = torch.cuda.is_available()
if cuda:
    torch.cuda.set_device(device_id)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

# 命令行参数
parser = argparse.ArgumentParser(description='Training the BERMAD model')
parser.add_argument('-data_folder', type=str, default='./', help='文件夹路径，用于加载数据和保存结果')
parser.add_argument('-files', nargs='+', required=True, help='多个批次的文件名')
parser.add_argument('-similarity_thr', type=float, default=0.9, help='分布匹配的相似性阈值')
parser.add_argument('-num_epochs', type=float, default=2000, help='训练的总轮数')
parser.add_argument('-alpha', type=float, default=0.1, help='hidden1 层的权重')
parser.add_argument('-beta', type=float, default=0.1, help='hidden2 层的权重')
parser.add_argument('-delta', type=float, default=0.5, help='code 层的权重')

plt.ioff()  # 关闭 Matplotlib 的交互模式

if __name__ == '__main__':
    # 从命令行获取参数
    args = parser.parse_args()
    data_folder = args.data_folder
    dataset_file_list = args.files
    cluster_similarity_file = os.path.join(data_folder, 'metaneighbor.csv')
    code_save_file = os.path.join(data_folder, 'code_list.pkl')
    similarity_thr = args.similarity_thr
    num_epochs = args.num_epochs
    dataset_file_list = [os.path.join(data_folder, f) for f in dataset_file_list]
    alpha = args.alpha
    beta = args.beta
    delta = args.delta

    # 预处理参数
    pre_process_paras = {'take_log': True, 'standardization': True, 'scaling': True}
    nn_paras = {
        'code_dim': code_dim,
        'batch_size': batch_size,
        'num_epochs': num_epochs,
        'base_lr': base_lr,
        'lr_step': lr_step,
        'momentum': momentum,
        'l2_decay': l2_decay,
        'gamma': gamma,
        'cuda': cuda,
        'log_interval': log_interval,
        'alpha': alpha,
        'beta': beta,
        'delta': delta
    }

    # 数据预处理
    print("Reading and preprocessing datasets...")
    dataset_list = pre_processing(dataset_file_list, pre_process_paras)
    if not dataset_list:
        raise ValueError("No datasets were loaded or preprocessed successfully.")

    # 检查 cluster similarity 文件
    if not os.path.exists(cluster_similarity_file):
        print(f"Cluster similarity file not found. Generating at {cluster_similarity_file}...")
        generate_cluster_similarity(dataset_list[0], cluster_similarity_file)

    # 读取 cluster 相似性
    print("Reading cluster similarity...")
    cluster_pairs = read_cluster_similarity(cluster_similarity_file, similarity_thr)

    # 设置输入维度
    nn_paras['num_inputs'] = len(dataset_list[0]['gene_sym'])

    # 开始训练
    print("Starting model training...")
    model, loss_total_list, loss_reconstruct_list, loss_transfer_list = training(dataset_list, cluster_pairs, nn_paras)

    # 保存训练损失图
    print("Saving training loss plots...")
    plt.figure()
    plt.plot(loss_total_list, label='Total Loss')
    plt.plot(loss_reconstruct_list, label='Reconstruction Loss')
    plt.plot(loss_transfer_list, label='Transfer Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.savefig(os.path.join(data_folder, 'loss.png'))
    plt.close()

    # 测试模型
    print("Testing the model...")
    code_list = testing(model, dataset_list, nn_paras)

    # 保存编码结果
    print(f"Saving encoded results to {code_save_file}...")
    with open(code_save_file, 'wb') as f:
        pickle.dump(code_list, f)

    # 保存为 CSV 文件
    print("Saving combined results to CSV...")
    codes = np.hstack([code for code in code_list])
    df = pd.DataFrame(codes.transpose())
    df.to_csv(os.path.join(data_folder, "combined.csv"), index=False)

    print("All tasks completed successfully!")