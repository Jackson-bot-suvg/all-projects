# main.py
import utils
print(dir(utils))  # 输出 utils 模块中所有可用的变量和函数

import argparse
import warnings
import torch
import numpy as np
import sys

from utils import setup_seed, loader_construction, evaluate, device
from scSimGCL import Model
from sklearn.cluster import KMeans
from config import config

def train(train_loader,
          test_loader,
          input_dim,
          graph_head,
          phi,
          gcn_dim,
          mlp_dim,
          prob_feature,
          prob_edge,
          tau,
          alpha,
          beta,
          lambda_cl,
          dropout,
          lr,
          seed,
          epochs,
          save_model_path,
          device):

    model = Model(
        input_dim=input_dim,
        graph_head=graph_head,
        phi=phi,
        gcn_dim=gcn_dim,
        mlp_dim=mlp_dim,
        prob_feature=prob_feature,
        prob_edge=prob_edge,
        tau=tau,
        alpha=alpha,
        beta=beta,
        dropout=dropout
    ).to(device)

    opt_model = torch.optim.Adam(model.parameters(), lr=lr)
    setup_seed(seed)

    print(f"DEBUG => Start Training Loop, epochs={epochs}, lr={lr}, dropout={dropout}")

    for each_epoch in range(epochs):
        model.train()
        for step, (batch_x, batch_y) in enumerate(train_loader):
            batch_x = batch_x.float().to(device)
            batch_z, x_imp, loss_cl = model(batch_x)

            # 仅对非零元素做 MAE
            mask = torch.where(
                batch_x != 0,
                torch.ones_like(batch_x),
                torch.zeros_like(batch_x)
            ).to(device)

            mae_f = torch.nn.L1Loss(reduction='mean')
            loss_mae = mae_f(mask * x_imp, mask * batch_x)

            # 对比损失
            loss = loss_mae + lambda_cl * loss_cl

            opt_model.zero_grad()
            loss.backward()

            # 可选：梯度裁剪（较大网络 + 对比学习时能防止梯度爆炸）
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)

            opt_model.step()

        # 每隔若干 epoch 打印一次 loss
        if (each_epoch + 1) % 50 == 0 or each_epoch == 0:
            print(f"DEBUG => Epoch {each_epoch+1}/{epochs}, loss = {loss.item():.4f}")

    # 保存模型
    state = {
        'net': model.state_dict(),
        'optimizer': opt_model.state_dict(),
        'epoch': epochs
    }
    torch.save(state, save_model_path)
    print("DEBUG => Training finished, model saved to", save_model_path)
    return model

def test(model, test_loader, n_clusters, seed):
    z_test = []
    y_test = []
    model.eval()
    with torch.no_grad():
        for step, (batch_x, batch_y) in enumerate(test_loader):
            batch_x = batch_x.float().to(device)
            batch_z, _, _ = model(batch_x)
            z_test.append(batch_z.cpu().numpy())
            y_test.append(batch_y.numpy())
    z_test = np.vstack(z_test)
    y_test = np.hstack(y_test)

    # 动态调整 n_clusters，避免超过样本数
    n_clusters = min(n_clusters, len(z_test))
    kmeans = KMeans(n_clusters=n_clusters, random_state=seed, n_init=20).fit(z_test)
    y_kmeans_test = kmeans.labels_

    acc, f1, nmi, ari, homo, comp = evaluate(y_test, y_kmeans_test)
    return {'CA': acc, 'NMI': nmi, 'ARI': ari}


if __name__ == '__main__':
    warnings.filterwarnings("ignore")

    print("DEBUG => sys.executable =", sys.executable)
    print("DEBUG => sys.version =", sys.version)

    parser = argparse.ArgumentParser()

    parser.add_argument("--graph_head", type=int, default=config['graph_head'])
    parser.add_argument("--phi", type=float, default=config['phi'])
    parser.add_argument("--gcn_dim", type=int, default=config['gcn_dim'])
    parser.add_argument("--mlp_dim", type=int, default=config['mlp_dim'])
    parser.add_argument("--prob_feature", type=float, default=config['prob_feature'])
    parser.add_argument("--prob_edge", type=float, default=config['prob_edge'])
    parser.add_argument("--tau", type=float, default=config['tau'])
    parser.add_argument("--alpha", type=float, default=config['alpha'])
    parser.add_argument("--beta", type=float, default=config['beta'])
    parser.add_argument("--lambda_cl", type=float, default=config['lambda_cl'])
    parser.add_argument("--dropout", type=float, default=config['dropout'])
    parser.add_argument("--n_clusters", type=int, default=config['num_classes'])
    parser.add_argument("--lr", type=float, default=config['lr'])
    parser.add_argument("--seed", type=int, default=config['seed'])
    parser.add_argument("--epochs", type=int, default=config['epochs'])
    parser.add_argument("--data_path", type=str, default="Camp.h5")
    parser.add_argument("--save_model_path", type=str, default="model.pth")

    args = parser.parse_args()
    print("DEBUG => args =", args)

    # 加载数据 (含去NaN操作)
    train_loader, test_loader, input_dim = loader_construction(args.data_path)
    print("DEBUG => loader_construction returned input_dim =", input_dim)

    print("DEBUG => final graph_head =", args.graph_head,
          "phi =", args.phi,
          "gcn_dim =", args.gcn_dim,
          "mlp_dim =", args.mlp_dim,
          "input_dim =", input_dim,
          "data_path =", args.data_path)

    # 训练
    model = train(
        train_loader, test_loader, input_dim,
        args.graph_head, args.phi, args.gcn_dim, args.mlp_dim,
        args.prob_feature, args.prob_edge, args.tau,
        args.alpha, args.beta, args.lambda_cl, args.dropout,
        args.lr, args.seed, args.epochs,
        args.save_model_path, device
    )

    # 测试
    results = test(model, test_loader, args.n_clusters, args.seed)
    print("DEBUG => Test results:", results)