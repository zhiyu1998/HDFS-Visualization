import { NodeType, HDFSNode, HDFSFile, DataBlock, FlowNode, FlowEdge } from '../models/HDFSTypes';

// 模拟集群节点
export const clusterNodes: HDFSNode[] = [
    { id: 'nn1', type: NodeType.NAMENODE, label: 'NameNode-1', status: 'active' },
    { id: 'dn1', type: NodeType.DATANODE, label: 'DataNode-1', status: 'active' },
    { id: 'dn2', type: NodeType.DATANODE, label: 'DataNode-2', status: 'active' },
    { id: 'dn3', type: NodeType.DATANODE, label: 'DataNode-3', status: 'active' },
    { id: 'client1', type: NodeType.CLIENT, label: 'Client-1' },
];

// 模拟数据块
export const dataBlocks: DataBlock[] = [
    { id: 'block1', size: 128, replicas: ['dn1', 'dn2', 'dn3'] },
    { id: 'block2', size: 64, replicas: ['dn1', 'dn3'] },
    { id: 'block3', size: 128, replicas: ['dn2', 'dn1'] },
];

// 模拟文件
export const hdfsFiles: HDFSFile[] = [
    {
        id: 'file1',
        name: 'example.txt',
        path: '/user/hdfs/example.txt',
        size: 192,
        blocks: [dataBlocks[0], dataBlocks[1]],
    },
    {
        id: 'file2',
        name: 'data.csv',
        path: '/user/hdfs/data.csv',
        size: 128,
        blocks: [dataBlocks[2]],
    },
];

// 初始流程图节点
export const initialNodes: FlowNode[] = [
    {
        id: 'nn1',
        type: 'namenode',
        position: { x: 250, y: 50 },
        data: { label: 'NameNode-1', nodeType: NodeType.NAMENODE },
    },
    {
        id: 'dn1',
        type: 'datanode',
        position: { x: 100, y: 200 },
        data: { label: 'DataNode-1', nodeType: NodeType.DATANODE },
    },
    {
        id: 'dn2',
        type: 'datanode',
        position: { x: 250, y: 200 },
        data: { label: 'DataNode-2', nodeType: NodeType.DATANODE },
    },
    {
        id: 'dn3',
        type: 'datanode',
        position: { x: 400, y: 200 },
        data: { label: 'DataNode-3', nodeType: NodeType.DATANODE },
    },
    {
        id: 'client1',
        type: 'client',
        position: { x: 250, y: 350 },
        data: { label: 'Client-1', nodeType: NodeType.CLIENT },
    },
];

// 初始流程图连接
export const initialEdges: FlowEdge[] = [
    { id: 'e1-2', source: 'nn1', target: 'dn1', animated: true },
    { id: 'e1-3', source: 'nn1', target: 'dn2', animated: true },
    { id: 'e1-4', source: 'nn1', target: 'dn3', animated: true },
    { id: 'e5-1', source: 'client1', target: 'nn1', animated: true },
];

// 可拖拽组件项
export const draggableItems = [
    { id: 'drag-nn', type: NodeType.NAMENODE, label: 'NameNode' },
    { id: 'drag-dn', type: NodeType.DATANODE, label: 'DataNode' },
    { id: 'drag-client', type: NodeType.CLIENT, label: 'Client' },
    { id: 'drag-file', type: NodeType.FILE, label: 'File' },
    { id: 'drag-block', type: NodeType.BLOCK, label: 'Block' },
]; 