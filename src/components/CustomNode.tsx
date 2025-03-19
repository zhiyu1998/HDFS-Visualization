import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeType } from '../models/HDFSTypes';
import './CustomNode.css';

interface CustomNodeData {
  label: string;
  nodeType: NodeType;
  status?: 'active' | 'standby' | 'dead';
}

const CustomNode = ({ data, isConnectable }: NodeProps<CustomNodeData>) => {
  const { label, nodeType, status = 'active' } = data;
  
  const getNodeClass = () => {
    let baseClass = 'custom-node';
    
    switch (nodeType) {
      case NodeType.NAMENODE:
        baseClass += ' namenode';
        break;
      case NodeType.DATANODE:
        baseClass += ' datanode';
        break;
      case NodeType.CLIENT:
        baseClass += ' client';
        break;
      case NodeType.FILE:
        baseClass += ' file';
        break;
      case NodeType.BLOCK:
        baseClass += ' block';
        break;
      default:
        break;
    }
    
    if (status === 'dead') {
      baseClass += ' dead';
    } else if (status === 'standby') {
      baseClass += ' standby';
    }
    
    return baseClass;
  };
  
  const getNodeIcon = () => {
    switch (nodeType) {
      case NodeType.NAMENODE:
        return '📊';
      case NodeType.DATANODE:
        return '💾';
      case NodeType.CLIENT:
        return '👤';
      case NodeType.FILE:
        return '📄';
      case NodeType.BLOCK:
        return '🧩';
      default:
        return '❓';
    }
  };
  
  return (
    <div className={getNodeClass()}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="node-icon">{getNodeIcon()}</div>
      <div className="node-label">{label}</div>
      {status && status !== 'active' && (
        <div className="node-status">{status}</div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default memo(CustomNode); 