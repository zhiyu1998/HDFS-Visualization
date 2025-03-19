import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { HDFSFile, DataBlock } from '../models/HDFSTypes';
import { clusterNodes } from '../data/sampleData';
import './DataDistributionD3.css';

interface DataDistributionD3Props {
  file?: HDFSFile;
  animationDuration?: number;
}

const DataDistributionD3: React.FC<DataDistributionD3Props> = ({ 
  file, 
  animationDuration = 1000 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!file || !svgRef.current) return;
    
    // 清除之前的可视化
    d3.select(svgRef.current).selectAll('*').remove();
    
    // 获取SVG容器的尺寸
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // 创建SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // 定义布局参数
    const margin = { top: 40, right: 20, bottom: 40, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // 创建主容器
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // 标题
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text(`文件: ${file.name} (${file.size}MB)`);
    
    // 计算节点位置
    const nameNodeX = innerWidth / 2;
    const nameNodeY = 50;
    const dataNodeCount = clusterNodes.filter(node => node.type === 'datanode').length;
    const dataNodeY = innerHeight - 50;
    const dataNodeSpacing = innerWidth / (dataNodeCount + 1);
    
    // 绘制NameNode
    const nameNode = g.append('g')
      .attr('class', 'node namenode')
      .attr('transform', `translate(${nameNodeX}, ${nameNodeY})`);
    
    nameNode.append('circle')
      .attr('r', 30)
      .attr('fill', '#ffcc80')
      .attr('stroke', '#ef6c00')
      .attr('stroke-width', 2);
    
    nameNode.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .text('NameNode');
    
    // 绘制DataNodes
    const dataNodes = clusterNodes.filter(node => node.type === 'datanode');
    const dataNodeElements: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];
    
    dataNodes.forEach((node, i) => {
      const x = (i + 1) * dataNodeSpacing;
      const dataNode = g.append('g')
        .attr('class', `node datanode ${node.id}`)
        .attr('transform', `translate(${x}, ${dataNodeY})`);
      
      dataNode.append('circle')
        .attr('r', 25)
        .attr('fill', '#90caf9')
        .attr('stroke', '#1976d2')
        .attr('stroke-width', 2);
      
      dataNode.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .text(node.label);
      
      dataNodeElements.push(dataNode);
    });
    
    // 绘制数据块分布
    if (file.blocks && file.blocks.length > 0) {
      // 绘制从NameNode到DataNode的连接线
      file.blocks.forEach((block, blockIndex) => {
        // 为每个副本创建动画路径
        block.replicas.forEach((replicaNodeId, replicaIndex) => {
          // 找到对应的DataNode位置
          const dataNodeIndex = dataNodes.findIndex(node => node.id === replicaNodeId);
          if (dataNodeIndex >= 0) {
            const dataNodeX = (dataNodeIndex + 1) * dataNodeSpacing;
            
            // 创建路径
            const path = g.append('path')
              .attr('class', 'block-path')
              .attr('d', `M ${nameNodeX} ${nameNodeY + 30} L ${dataNodeX} ${dataNodeY - 25}`)
              .attr('stroke', '#666')
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '5,5')
              .attr('fill', 'none');
            
            // 创建数据块
            const block = g.append('circle')
              .attr('class', 'data-block')
              .attr('r', 8)
              .attr('fill', '#ffe082')
              .attr('stroke', '#ffa000')
              .attr('stroke-width', 1.5)
              .attr('cx', nameNodeX)
              .attr('cy', nameNodeY + 30);
            
            // 添加标签
            const blockLabel = g.append('text')
              .attr('class', 'block-label')
              .attr('text-anchor', 'middle')
              .attr('font-size', '8px')
              .attr('x', nameNodeX)
              .attr('y', nameNodeY + 30 + 3)
              .text(`B${blockIndex + 1}`);
            
            // 创建动画
            const delay = blockIndex * 300 + replicaIndex * 500;
            
            // 延迟后开始动画
            setTimeout(() => {
              // 计算路径长度
              const pathLength = path.node()!.getTotalLength();
              
              // 设置动画
              block.transition()
                .duration(animationDuration)
                .attrTween('transform', function() {
                  return function(t: number) {
                    // 获取路径上的点
                    const point = path.node()!.getPointAtLength(pathLength * t);
                    return `translate(${point.x - nameNodeX}, ${point.y - (nameNodeY + 30)})`;
                  };
                });
              
              blockLabel.transition()
                .duration(animationDuration)
                .attrTween('transform', function() {
                  return function(t: number) {
                    const point = path.node()!.getPointAtLength(pathLength * t);
                    return `translate(${point.x - nameNodeX}, ${point.y - (nameNodeY + 30)})`;
                  };
                });
              
              // 动画结束后
              setTimeout(() => {
                // 绘制数据块到DataNode上
                const dataNode = dataNodeElements[dataNodeIndex];
                const blockCountOnNode = dataNode.selectAll('.data-block-indicator').size();
                
                dataNode.append('circle')
                  .attr('class', 'data-block-indicator')
                  .attr('r', 5)
                  .attr('fill', '#ffe082')
                  .attr('stroke', '#ffa000')
                  .attr('stroke-width', 1)
                  .attr('cx', 15 - blockCountOnNode * 7)
                  .attr('cy', -15);
                
                dataNode.append('text')
                  .attr('class', 'block-label')
                  .attr('text-anchor', 'middle')
                  .attr('font-size', '6px')
                  .attr('x', 15 - blockCountOnNode * 7)
                  .attr('y', -15 + 2)
                  .text(`B${blockIndex + 1}`);
                
                // 移除动画路径和块
                block.remove();
                blockLabel.remove();
              }, animationDuration);
            }, delay);
          }
        });
      });
    }
    
  }, [file, animationDuration]);
  
  return (
    <div className="data-distribution-container">
      <svg ref={svgRef} className="data-distribution-chart"></svg>
    </div>
  );
};

export default DataDistributionD3; 