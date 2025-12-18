"use client";

import React from 'react';
import {
  MousePointer,
  Move,
  Crop,
  Type,
  Scissors,
  SlidersHorizontal,
  Image,
  Palette,
  PanelRight,
  Wand2 // New icon for AI editing
} from 'lucide-react';
import { useImageEditor } from '../../context/page';

const tools = [
  { id: 'select', icon: MousePointer, name: 'Select' },
  { id: 'move', icon: Move, name: 'Move' },
  { id: 'panel-toggle', icon: PanelRight, name: 'Toggle Panel' },
  { id: 'crop', icon: Crop, name: 'Crop' },
  { id: 'background-remove', icon: Scissors, name: 'Remove Background' },
  { id: 'text', icon: Type, name: 'Text' },
  { id: 'filters', icon: SlidersHorizontal, name: 'Filter' },
  { id: 'background', icon: Image, name: 'Background' },
  { id: 'add-color', icon: Palette, name: 'Add Color' },
  { id: 'ai-edit', icon: Wand2, name: 'Edit with AI' }, // New AI Edit tool
];

const ToolSidebar = () => {
  const { state, dispatch } = useImageEditor();

  const handleToolSelect = (toolId) => {
    if (toolId === 'panel-toggle') {
      dispatch({ type: 'TOGGLE_PANEL' });
    } else {
      dispatch({ type: 'SET_TOOL', payload: toolId });
    }
  };

  return (
    <div className="w-48 bg-white border-r border-gray-200 flex flex-col py-4 space-y-2 shadow-lg">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = state.currentTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={`
              relative w-full h-12 flex items-center px-4 transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'hover:bg-gray-100'
              }
            `}
          >
            <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
            <span className={`text-sm truncate ${isActive ? 'text-white' : 'text-gray-700'}`}>
              {tool.name}
            </span>
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 animate-pulse" />
            )}
          </button>
        );
      })}
      
      <div className="flex-1" />
    </div>
  );
};

export default ToolSidebar;