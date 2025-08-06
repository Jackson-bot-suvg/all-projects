import os
import numpy as np
import h5py
from sklearn.preprocessing import scale, minmax_scale
import pickle

def read_h5(file_path, take_log=True):
    """读取 HDF5 文件"""
    dataset = {}
    with h5py.File(file_path, 'r') as h5file:
        required_keys = ['X', 'var']
        if not all(key in h5file for key in required_keys):
            raise ValueError(f"File {file_path} is missing one or more required keys: {required_keys}")
        dataset['gene_exp'] = h5file['X'][:]
        if 'gene_id' not in h5file['var']:
            raise ValueError(f"File {file_path} is missing 'gene_id' under 'var'.")
        dataset['gene_sym'] = [
            x.decode('utf-8') if isinstance(x, bytes) else str(x)
            for x in h5file['var']['gene_id'][:]
        ]
        dataset['sample_labels'] = np.arange(dataset['gene_exp'].shape[0])
        dataset['cell_labels'] = dataset['sample_labels']
        dataset['cluster_labels'] = np.zeros(dataset['gene_exp'].shape[0], dtype=int)
        if take_log:
            dataset['gene_exp'] = np.log2(dataset['gene_exp'] + 1)
    print(f"File {file_path} loaded with {dataset['gene_exp'].shape[0]} samples and {dataset['gene_exp'].shape[1]} features.")
    return dataset


def preprocess_dataset(dataset, standardization=True, scaling=True):
    """预处理数据集"""
    gene_exp = dataset['gene_exp']
    std_dev = np.std(gene_exp, axis=0)
    valid_features = std_dev > 1e-6
    dataset['gene_exp'] = gene_exp[:, valid_features]
    dataset['gene_sym'] = [dataset['gene_sym'][i] for i in range(len(valid_features)) if valid_features[i]]
    if standardization:
        scale(dataset['gene_exp'], axis=1, with_mean=True, with_std=True, copy=False)
    if scaling:
        minmax_scale(dataset['gene_exp'], feature_range=(0, 1), axis=1, copy=False)
    return dataset


def generate_cluster_similarity(dataset, cluster_similarity_file):
    """生成 cluster 相似性矩阵并保存"""
    print("Calculating similarity matrix...")
    cluster_similarity = np.corrcoef(dataset['gene_exp'], rowvar=False)  # 基于基因表达矩阵的列（基因）计算相关性
    with open(cluster_similarity_file, 'wb') as f:
        pickle.dump(cluster_similarity, f)
    print(f"Cluster similarity file saved to {cluster_similarity_file}")


def read_cluster_similarity(cluster_similarity_file, thr=0.9):
    """
    从文件中读取 cluster similarity 矩阵，并生成成对的 cluster 信息
    """
    with open(cluster_similarity_file, 'rb') as f:
        cluster_similarity = pickle.load(f)

    cluster_pairs = []
    for i in range(cluster_similarity.shape[0]):
        for j in range(i + 1, cluster_similarity.shape[1]):
            if cluster_similarity[i, j] >= thr:
                cluster_pairs.append((i + 1, j + 1, cluster_similarity[i, j]))
    print(f"Generated {len(cluster_pairs)} cluster pairs with similarity threshold {thr}.")
    return np.array(cluster_pairs)


def pre_processing(dataset_file_list, pre_process_paras):
    """加载和预处理多个数据集"""
    dataset_list = []
    for file_path in dataset_file_list:
        print(f"Processing file: {file_path}")
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} does not exist.")
            continue
        try:
            dataset = read_h5(file_path, take_log=pre_process_paras.get('take_log', True))
            dataset = preprocess_dataset(
                dataset,
                standardization=pre_process_paras.get('standardization', True),
                scaling=pre_process_paras.get('scaling', True)
            )
            print(f"Processed dataset: {len(dataset['gene_sym'])} genes, {len(dataset['sample_labels'])} samples.")
            dataset_list.append(dataset)
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
    if not dataset_list:
        print("Warning: No valid datasets were processed.")
    return dataset_list

def pre_processing(dataset_file_list, pre_process_paras):
    dataset_list = []
    for file_path in dataset_file_list:
        print(f"Processing file: {file_path}")
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} does not exist.")
            continue
        try:
            dataset = read_h5(file_path, take_log=pre_process_paras.get('take_log', True))
            dataset = preprocess_dataset(
                dataset,
                standardization=pre_process_paras.get('standardization', True),
                scaling=pre_process_paras.get('scaling', True)
            )
            print(f"Processed dataset: {len(dataset['gene_sym'])} genes, {len(dataset['sample_labels'])} samples.")
            dataset_list.append(dataset)
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
    if not dataset_list:
        print("Warning: No valid datasets were processed.")
    return dataset_list


if __name__ == "__main__":
    print("This module is for preprocessing datasets.")