import React, { useState, useCallback, useRef } from 'react';
import { Node } from 'reactflow';
import HDFSFlow from './components/HDFSFlow';
import DragPanel from './components/DragPanel';
import DataDistributionD3 from './components/DataDistributionD3';
import { NodeType, DataBlock, HDFSFile } from './models/HDFSTypes';
import { dataBlocks, clusterNodes } from './data/sampleData';
import './App.css';

// 定义标签类型
type TabType = 'files' | 'details';

const App: React.FC = () => {
  // 节点详情状态
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // 添加文件列表状态
  const [files, setFiles] = useState<HDFSFile[]>([]);
  
  // 当前选中的文件
  const [selectedFile, setSelectedFile] = useState<HDFSFile | undefined>(undefined);
  
  // 当前拖拽的组件类型
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
  // 保存拖放位置
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);
  
  // HDFS配置参数
  const [blockSize, setBlockSize] = useState<number>(128); // 默认块大小为128MB
  const [customFileSize, setCustomFileSize] = useState<number>(256); // 默认文件大小为256MB
  const [showFileDialog, setShowFileDialog] = useState<boolean>(false);
  
  // 标签导航状态
  const [activeTab, setActiveTab] = useState<TabType>('files');
  
  // HDFS Flow 组件引用
  const hdfsFlowRef = useRef<any>(null);

  // 处理节点点击
  const handleNodeClick = (node: Node) => {
    console.log('节点被点击:', node);
    setSelectedNode(node);
  };

  // 处理拖拽开始
  const handleDragStart = (type: string, label: string) => {
    console.log('拖拽开始:', type, label);
    setDraggedNodeType(type);
  };

  // 处理节点添加完成
  const handleNodeAdded = useCallback((nodeType: string, fromDrag: boolean = true) => {
    console.log('节点添加完成:', nodeType, '是否来自拖拽:', fromDrag);
    
    // 如果是从拖拽操作添加的节点，处理特殊情况
    if (fromDrag) {
      // 如果是拖拽的File节点，显示文件大小对话框
      if (nodeType === NodeType.FILE) {
        console.log('显示文件大小输入对话框');
        setShowFileDialog(true);
        
        // 注意：此时节点实际上还未创建，等待用户输入文件大小后再创建
      }
      
      // 拖拽添加节点时不执行额外的模拟逻辑，避免创建多余的节点
      // 不要调用simulateFileUpload或simulateBlockDistribution
      
      // 重置拖拽状态
      setDraggedNodeType(null);
      return;
    }
    
    // 只有非拖拽方式添加的节点才执行模拟逻辑
    if (nodeType === NodeType.FILE) {
      // 模拟文件上传到HDFS
      console.log('模拟文件上传 (编程方式)');
      simulateFileUpload();
    } else if (nodeType === NodeType.BLOCK) {
      // 模拟数据块分发过程
      console.log('模拟数据块分发 (编程方式)');
      simulateBlockDistribution();
    }
    
    // 重置拖拽状态
    setDraggedNodeType(null);
  }, []);

  // 处理拖拽位置更新 - 从HDFSFlow组件获取拖放位置
  const handleDropPositionUpdate = useCallback((position: { x: number; y: number }) => {
    console.log('更新拖放位置:', position);
    setDropPosition(position);
  }, []);

  // 处理文件大小输入确认
  const handleFileInputConfirm = () => {
    // 关闭对话框
    setShowFileDialog(false);
    
    console.log('用户确认文件大小:', customFileSize);
    
    // 使用用户输入的文件大小执行文件上传模拟
    simulateFileUploadWithSize(customFileSize);
  };
  
  // 模拟文件上传到HDFS (使用自定义大小)
  const simulateFileUploadWithSize = (fileSize: number) => {
    // 计算需要的数据块数 (根据当前配置的块大小)
    const blockCount = Math.ceil(fileSize / blockSize);
    
    // 创建新的数据块
    const newBlocks: DataBlock[] = [];
    for (let i = 0; i < blockCount; i++) {
      // 为每个数据块随机选择3个DataNode进行副本存储
      const datanodes = [...clusterNodes]
        .filter(node => node.type === NodeType.DATANODE)
        .map(node => node.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      // 计算当前块的实际大小（最后一个块可能小于块大小）
      const currentBlockSize = (i === blockCount - 1) 
        ? (fileSize - (blockCount - 1) * blockSize) // 最后一个块的实际大小
        : blockSize; // 其他块使用配置的块大小
      
      newBlocks.push({
        id: `block-${Date.now()}-${i}`,
        size: currentBlockSize,
        replicas: datanodes
      });
    }
    
    // 创建新文件
    const newFile: HDFSFile = {
      id: `file-${Date.now()}`,
      name: `file-${Date.now()}.dat`,
      path: `/user/hdfs/file-${Date.now()}.dat`,
      size: fileSize,
      blocks: newBlocks
    };
    
    console.log('创建新文件:', newFile);
    
    // 更新文件列表
    setFiles(prevFiles => [...prevFiles, newFile]);
    
    // 设置当前选中的文件
    setSelectedFile(newFile);
    
    // 自动切换到文件详情标签
    setActiveTab('details');
    
    // 触发可视化效果 - 只创建节点，不触发额外的模拟逻辑
    if (hdfsFlowRef.current) {
      // 使用保存的拖放位置或默认位置
      const nodePosition = dropPosition || { x: 300, y: 300 };
      
      console.log('在位置创建文件节点:', nodePosition);
      
      // 直接调用addNode而不是addFileNode，避免触发额外的模拟逻辑
      hdfsFlowRef.current.addNode(NodeType.FILE, newFile.name, nodePosition, false, true);
      
      // 重置拖放位置
      setDropPosition(null);
    }
  };

  // 模拟文件上传到HDFS (使用随机大小)
  const simulateFileUpload = () => {
    // 生成随机文件大小 (64MB - 256MB)
    const fileSize = Math.floor(Math.random() * 192) + 64;
    simulateFileUploadWithSize(fileSize);
  };
  
  // 模拟数据块分发过程
  const simulateBlockDistribution = () => {
    // 生成随机数据块大小 (32MB - 64MB)
    const blockSize = Math.floor(Math.random() * 32) + 32;
    
    // 为数据块随机选择3个DataNode进行副本存储
    const datanodes = [...clusterNodes]
      .filter(node => node.type === NodeType.DATANODE)
      .map(node => node.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // 创建新的数据块
    const newBlock: DataBlock = {
      id: `block-${Date.now()}`,
      size: blockSize,
      replicas: datanodes
    };
    
    console.log('创建新数据块:', newBlock);
    
    // 更新可视化效果
    if (hdfsFlowRef.current) {
      hdfsFlowRef.current.addBlockNode(newBlock);
    }
  };
  
  // 处理文件点击
  const handleFileClick = (file: HDFSFile) => {
    setSelectedFile(file);
    // 点击文件后自动切换到详情标签
    setActiveTab('details');
  };

  // 切换标签
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>HDFS可视化系统</h1>
        <p>通过拖拽操作模拟HDFS的数据分块、分发和冗余备份过程</p>
      </header>
      
      <main className="app-main">
        {/* 左侧控制面板 */}
        <div className="control-panel">
          {/* HDFS配置 */}
          <div className="hdfs-config-panel">
            <h3>HDFS 配置</h3>
            <div className="config-item">
              <label>块大小 (MB):</label>
              <input 
                type="number" 
                min="64" 
                max="256" 
                value={blockSize} 
                onChange={(e) => setBlockSize(Math.max(64, parseInt(e.target.value) || 64))}
              />
              <div className="slider-container">
                <input 
                  type="range" 
                  min="64" 
                  max="256" 
                  step="64" 
                  value={blockSize}
                  onChange={(e) => setBlockSize(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>64MB</span>
                  <span>128MB</span>
                  <span>192MB</span>
                  <span>256MB</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 拖拽组件面板 */}
          <DragPanel onDragStart={handleDragStart} />
        </div>
        
        {/* HDFS流程图可视化 */}
        <div className="hdfs-visualization">
          <HDFSFlow 
            ref={hdfsFlowRef} 
            onNodeClick={handleNodeClick}
            onNodeAdded={handleNodeAdded}
            onDropPositionUpdate={handleDropPositionUpdate}
          />
        </div>
        
        {/* 右侧面板 - 带标签导航 */}
        <div className="right-panel">
          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => handleTabChange('files')}
              >
                文件列表
              </button>
              <button 
                className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => handleTabChange('details')}
                disabled={!selectedFile}
              >
                文件详情
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'files' ? (
                // 文件列表标签内容
                <div className="file-info-panel">
                  <h3>HDFS文件列表</h3>
                  {files.length === 0 ? (
                    <p>暂无文件，请从组件面板拖拽"File"到中间画布</p>
                  ) : (
                    <ul className="file-list">
                      {files.map(file => (
                        <li 
                          key={file.id} 
                          className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
                          onClick={() => handleFileClick(file)}
                        >
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">{file.size}MB</div>
                          <div className="block-summary">
                            <div className="block-info">
                              <span>数据块: {file.blocks.length}</span>
                              <span>块大小: {blockSize}MB</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                // 文件详情标签内容
                <div className="data-distribution">
                  {selectedFile ? (
                    <>
                      <h3>文件详情: {selectedFile.name}</h3>
                      <div className="file-detail-info">
                        <div>文件大小: <strong>{selectedFile.size}MB</strong></div>
                        <div>块数量: <strong>{selectedFile.blocks.length}</strong></div>
                        <div>块大小: <strong>{blockSize}MB</strong></div>
                        
                        <div className="block-visualization">
                          {selectedFile.blocks.map((block, idx) => (
                            <div 
                              key={idx} 
                              className="block-viz-item"
                              style={{
                                width: `${(block.size / selectedFile.size) * 100}%`,
                                backgroundColor: block.size < blockSize ? '#ffcc80' : '#90caf9'
                              }}
                              title={`块 ${idx+1}: ${block.size}MB`}
                            ></div>
                          ))}
                        </div>
                        
                        <div className="file-blocks">
                          <h4>块详情:</h4>
                          <ul className="block-list">
                            {selectedFile.blocks.map((block, idx) => (
                              <li key={block.id} className="block-item">
                                <div className="block-header">
                                  <div>块 {idx+1}: {block.id}</div>
                                  <div className={`block-size ${block.size < blockSize ? 'partial' : ''}`}>
                                    {block.size}MB {block.size < blockSize ? '(部分块)' : '(完整块)'}
                                  </div>
                                </div>
                                <div>副本: {block.replicas.length}</div>
                                <div className="replicas">
                                  {block.replicas.map(dn => (
                                    <span key={dn} className="replica-node">{dn}</span>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <DataDistributionD3 file={selectedFile} />
                      </div>
                    </>
                  ) : (
                    <p>请先选择一个文件查看详情</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 节点详情 */}
        {selectedNode && (
          <div className="node-details">
            <h3>节点详情</h3>
            <div>ID: {selectedNode.id}</div>
            <div>类型: {selectedNode.data.nodeType}</div>
            <div>标签: {selectedNode.data.label}</div>
            {selectedNode.data.status && (
              <div>状态: {selectedNode.data.status}</div>
            )}
          </div>
        )}
      </main>
      
      {/* 文件大小输入对话框 */}
      {showFileDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3>设置文件大小</h3>
            <div className="input-group">
              <label>文件大小 (MB):</label>
              <input 
                type="number" 
                min="1" 
                value={customFileSize} 
                onChange={(e) => setCustomFileSize(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="block-calculation">
              <div>当前块大小: <strong>{blockSize}MB</strong></div>
              <div>需要的块数: <strong>{Math.ceil(customFileSize / blockSize)}</strong></div>
              <div className="blocks-preview">
                {Array.from({ length: Math.ceil(customFileSize / blockSize) }).map((_, idx) => {
                  const isLastBlock = idx === Math.ceil(customFileSize / blockSize) - 1;
                  const lastBlockSize = isLastBlock ? (customFileSize % blockSize) || blockSize : blockSize;
                  return (
                    <div 
                      key={idx} 
                      className="preview-block"
                      style={{
                        width: `${(blockSize / customFileSize) * 100}%`,
                        backgroundColor: isLastBlock && lastBlockSize < blockSize ? '#ffcc80' : '#90caf9'
                      }}
                      title={`块 ${idx+1}: ${isLastBlock ? lastBlockSize : blockSize}MB`}
                    ></div>
                  );
                })}
              </div>
              <div className="blocks-details">
                {Array.from({ length: Math.ceil(customFileSize / blockSize) }).map((_, idx) => {
                  const isLastBlock = idx === Math.ceil(customFileSize / blockSize) - 1;
                  const lastBlockSize = isLastBlock ? (customFileSize % blockSize) || blockSize : blockSize;
                  return (
                    <div key={idx} className="block-detail">
                      块 {idx+1}: {lastBlockSize}MB {isLastBlock && lastBlockSize < blockSize ? '(部分块)' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowFileDialog(false)}>取消</button>
              <button onClick={handleFileInputConfirm}>确认</button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <p></p>
      </footer>
    </div>
  );
};

export default App;
