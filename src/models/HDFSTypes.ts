// HDFS节点类型
export enum NodeType {
    NAMENODE = 'namenode',
    DATANODE = 'datanode',
    CLIENT = 'client',
    FILE = 'file',
    BLOCK = 'block'
}

// HDFS集群节点
export interface HDFSNode {
    id: string;
    type: NodeType;
    label: string;
    status?: 'active' | 'standby' | 'dead';
}

// 数据块
export interface DataBlock {
    id: string;
    size: number;
    replicas: string[]; // DataNode IDs where replicas are stored
}

// 文件
export interface HDFSFile {
    id: string;
    name: string;
    path: string;
    size: number;
    blocks: DataBlock[];
}

// 流程图节点
export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        label: string;
        nodeType: NodeType;
        [key: string]: any;
    };
}

// 流程图连接
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
}

// 拖拽项
export interface DraggableItem {
    id: string;
    type: NodeType;
    label: string;
} 