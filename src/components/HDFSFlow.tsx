import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { initialNodes, initialEdges } from '../data/sampleData';
import { NodeType, FlowNode } from '../models/HDFSTypes';
import './HDFSFlow.css';

// 自定义节点类型 - 所有节点都使用CustomNode组件
const nodeTypes: NodeTypes = {
  [NodeType.NAMENODE]: CustomNode,
  [NodeType.DATANODE]: CustomNode,
  [NodeType.CLIENT]: CustomNode,
  [NodeType.FILE]: CustomNode,
  [NodeType.BLOCK]: CustomNode,
};

// 打印节点类型映射，方便调试
console.log('节点类型映射:', nodeTypes);
console.log('NodeType枚举值:', NodeType);

interface HDFSFlowProps {
  onNodeClick?: (node: Node) => void;
  onNodeAdded?: (nodeType: string, fromDrag?: boolean) => void;
  onDropPositionUpdate?: (position: { x: number; y: number }) => void;
}

const HDFSFlow = forwardRef<any, HDFSFlowProps>(({ onNodeClick, onNodeAdded, onDropPositionUpdate }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 调试用 - 打印当前节点
  useEffect(() => {
    console.log('当前节点:', nodes);
  }, [nodes]);

  // 打印初始节点，验证节点格式
  useEffect(() => {
    console.log('初始节点:', initialNodes);
    console.log('节点类型映射:', nodeTypes);
  }, []);

  // 处理连接创建
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // 处理节点点击
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log('节点被点击:', node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // 添加新节点到流程图
  const addNode = useCallback((
    nodeType: NodeType, 
    label: string, 
    position: { x: number; y: number }, 
    fromDrag: boolean = true,
    skipCallback: boolean = false // 添加参数，决定是否跳过回调
  ) => {
    // 创建新节点
    const newNode: FlowNode = {
      id: `${nodeType}-${Date.now()}`,
      // 直接使用NodeType枚举值作为type
      type: nodeType,
      position,
      data: {
        label,
        nodeType,
      },
    };

    console.log('添加新节点:', newNode);
    console.log('节点类型:', nodeType, '类型:', typeof nodeType);
    
    setNodes((nds) => {
      const newNodes = [...nds, newNode];
      console.log('更新后的节点列表:', newNodes);
      return newNodes;
    });
    
    // 调用回调通知父组件节点已添加，除非skipCallback为true
    if (onNodeAdded && !skipCallback) {
      onNodeAdded(nodeType, fromDrag);
    }
    
    return newNode;
  }, [setNodes, onNodeAdded]);

  // 添加文件节点
  const addFileNode = useCallback((file: any) => {
    const position = { x: 300, y: 300 };
    // 设置skipCallback为true，避免循环调用
    return addNode(NodeType.FILE, file.name, position, false, true);
  }, [addNode]);

  // 添加数据块节点
  const addBlockNode = useCallback((block: any) => {
    const position = { x: 400, y: 300 };
    // 设置skipCallback为true，避免循环调用
    return addNode(NodeType.BLOCK, `Block-${block.id.split('-')[1]}`, position, false, true);
  }, [addNode]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addNode,
    addFileNode,
    addBlockNode,
    getNodes: () => nodes,
    getEdges: () => edges
  }));

  // 处理拖拽结束时放置节点
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('拖拽悬停中...');
    setIsDraggingOver(true);
  }, []);

  // 处理拖拽离开
  const onDragLeave = useCallback(() => {
    console.log('拖拽离开');
    setIsDraggingOver(false);
  }, []);

  // 处理放置
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      console.log('拖拽放置事件触发');
      setIsDraggingOver(false);

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.error('ReactFlow实例或wrapper不存在');
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      console.log('ReactFlow区域位置:', reactFlowBounds);
      
      // 尝试获取所有拖拽数据格式
      const formats = event.dataTransfer.types;
      console.log('可用的拖拽数据格式:', formats);
      
      let dataStr = '';
      
      if (formats.includes('application/reactflow')) {
        dataStr = event.dataTransfer.getData('application/reactflow');
      } else if (formats.includes('text/plain')) {
        dataStr = event.dataTransfer.getData('text/plain');
      }
      
      console.log('拖拽数据字符串:', dataStr);
      
      if (!dataStr) {
        console.error('没有获取到拖拽数据');
        return;
      }

      try {
        const { type, label } = JSON.parse(dataStr);
        console.log('解析后的拖拽数据:', { type, label });
        
        // 获取放置位置（相对于流程图）
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        console.log('放置位置:', position);
        console.log('放置类型:', type, '类型:', typeof type);

        // 特殊处理File类型节点，不立即创建节点，而是等用户输入文件大小
        if (type === NodeType.FILE) {
          console.log('File节点拖放，等待用户输入文件大小');
          
          // 通知父组件拖放位置
          if (onDropPositionUpdate) {
            onDropPositionUpdate(position);
          }
          
          // 通知父组件节点添加事件
          if (onNodeAdded) {
            onNodeAdded(type, true);
          }
          return;
        }

        // 创建其他类型节点
        const newNode = addNode(type as NodeType, label, position, true);
        console.log('创建的新节点:', newNode);
      } catch (e) {
        console.error('解析拖拽数据错误:', e);
      }
    },
    [reactFlowInstance, addNode, onNodeAdded, onDropPositionUpdate]
  );

  console.log('渲染HDFSFlow组件');
  console.log('当前节点列表:', nodes);

  return (
    <div 
      className={`hdfs-flow ${isDraggingOver ? 'drag-over' : ''}`} 
      ref={reactFlowWrapper}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        onInit={(instance) => {
          console.log('ReactFlow初始化完成');
          setReactFlowInstance(instance);
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
});

HDFSFlow.displayName = 'HDFSFlow';

export default HDFSFlow; 