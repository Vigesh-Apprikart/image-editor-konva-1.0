"use client";

import React from 'react';
import { useImageEditor } from '../../context/index';

const StatusBar = () => {
  const { state } = useImageEditor();

  return (
    <div className="h-8 glass border-t border-white/10 px-4 flex items-center justify-between text-xs text-gray-400 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <span>Tool: {state.currentTool}</span>
        {state.selectedLayerId && (
          <span>Selected Layer: {state.selectedLayerId}</span>
        )}
        <span>Layers: {state.layers.length}</span>
      </div>

      <div className="flex items-center space-x-4">
        <span>Zoom: {Math.round(state.zoom * 100)}%</span>
        <span>Canvas: {state.canvasSize.width} × {state.canvasSize.height}</span>
        {state.isLoading && (
          <span className="text-blue-400 animate-pulse">Processing...</span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;