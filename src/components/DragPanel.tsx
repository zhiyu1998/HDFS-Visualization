import React from 'react';
import { draggableItems } from '../data/sampleData';
import { NodeType } from '../models/HDFSTypes';
import './DragPanel.css';

interface DragPanelProps {
  onDragStart: (type: string, label: string) => void;
}

const DragPanel: React.FC<DragPanelProps> = ({ onDragStart }) => {
  // 打印可拖拽项目，方便调试
  console.log('可拖拽项目:', draggableItems);

  // 获取组件的图标
  const getItemIcon = (type: NodeType) => {
    switch (type) {
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

  // 获取组件的说明文字
  const getItemDescription = (type: NodeType) => {
    switch (type) {
      case NodeType.NAMENODE:
        return '负责管理文件系统的命名空间和客户端的访问';
      case NodeType.DATANODE:
        return '存储实际的数据块，定期向NameNode汇报';
      case NodeType.CLIENT:
        return '访问HDFS系统的客户端';
      case NodeType.FILE:
        return '拖拽到画布后可设置文件大小，系统自动进行分块';
      case NodeType.BLOCK:
        return '数据块，HDFS的基本存储单元';
      default:
        return '';
    }
  };

  // 处理拖拽开始事件
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string, label: string) => {
    console.log('拖拽开始:', type, label);
    
    // 设置拖拽数据 - 确保是字符串类型
    const dragData = JSON.stringify({ type, label });
    console.log('设置拖拽数据:', dragData);
    
    try {
      e.dataTransfer.setData('application/reactflow', dragData);
      e.dataTransfer.setData('text/plain', dragData); // 添加备用格式
      e.dataTransfer.effectAllowed = 'move';
      
      // 调试可用格式
      console.log('拖拽数据格式:', e.dataTransfer.types);
    } catch (error) {
      console.error('设置拖拽数据错误:', error);
    }
    
    // 调用父组件的回调
    onDragStart(type, label);
  };

  return (
    <div className="drag-panel">
      <h3>组件面板</h3>
      <p>拖拽以下组件到画布中：</p>
      <div className="component-list">
        {draggableItems.map((item) => (
          <div
            key={item.id}
            className={`draggable-item ${item.type}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type, item.label)}
          >
            <div className="item-icon">
              {getItemIcon(item.type)}
            </div>
            <div className="item-content">
              <div className="item-label">{item.label}</div>
              <div className="item-description">{getItemDescription(item.type)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="drag-help">
        <p>提示: 拖拽File节点将弹出设置对话框，可自定义文件大小并观察HDFS数据块分布</p>
      </div>
    </div>
  );
};

export default DragPanel; 