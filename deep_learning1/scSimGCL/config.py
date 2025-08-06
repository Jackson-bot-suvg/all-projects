# config.py

config = {
    'graph_head': 10,   # 多头注意力数，需要 input_dim % graph_head == 0
    'phi': 0.5,         # 构图阈值
    'gcn_dim': 512,     # GCN 隐藏维度
    'mlp_dim': 256,     # MLP 投影维度

    # 随机丢弃率（比较大，训练容易出现不稳定，如需稳定可调小/调0）
    'prob_feature': 0.1,
    'prob_edge': 0.5,
    'dropout': 0.4,

    # 对比学习相关
    'tau': 0.7,
    'alpha': 0.6,
    'beta': 0.3,
    'lambda_cl': 0.9,   # 对比损失在总损失中的权重

    'lr': 0.001,        # 学习率（对大网络+对比学习较高，可能出现NaN风险）
    'seed': 42,
    'epochs': 300,

    'input_dim': 16270, # 特征维度
    'num_classes': 524  # 用于KMeans聚类
}