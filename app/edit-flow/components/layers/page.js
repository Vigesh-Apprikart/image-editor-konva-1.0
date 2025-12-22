"use client";

import React from "react";
import {
  Eye,
  EyeOff,
  Trash2,
  Copy,
  GripVertical,
  AlignCenter,
  Layers,
} from "lucide-react";
import { useImageEditor } from "../../context/index";

const LayersPanel = () => {
  const { state, dispatch } = useImageEditor();

  const handleDragStart = (e, layerId) => {
    e.dataTransfer.setData("text/plain", layerId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetLayerId) => {
    e.preventDefault();
    const draggedLayerId = e.dataTransfer.getData("text/plain");
    if (draggedLayerId === targetLayerId) return;

    const draggedIndex = state.layers.findIndex(
      (layer) => layer.id === draggedLayerId
    );
    const targetIndex = state.layers.findIndex(
      (layer) => layer.id === targetLayerId
    );
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLayers = [...state.layers];
    const [draggedLayer] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, draggedLayer);

    dispatch({ type: "REORDER_LAYERS", payload: newLayers });
  };

  const handleLayerSelect = (layerId) => {
    dispatch({ type: "SELECT_LAYER", payload: layerId });
  };

  const handleToggleVisibility = (layerId) => {
    const layer = state.layers.find((l) => l.id === layerId);
    if (layer) {
      dispatch({
        type: "UPDATE_LAYER",
        payload: {
          id: layerId,
          updates: { visible: !layer.visible },
        },
      });
    }
  };

  const handleDeleteLayer = (layerId) => {
    dispatch({ type: "DELETE_LAYER", payload: layerId });
  };

  const handleDuplicateLayer = (layerId) => {
    dispatch({ type: "DUPLICATE_LAYER", payload: layerId });
  };

  const handleCenterLayer = (layerId) => {
    window.centerLayer(layerId);
  };

  return (
    <div className="w-80 flex flex-col">
      {/* <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center text-gray-800">
          <Layers className="w-5 h-5 mr-2 text-gray-600" />
          Layers
        </h2>
      </div> */}

      <div className="flex-1 overflow-y-auto">
        {state.layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
            onClick={() => handleLayerSelect(layer.id)}
            className={`
              group p-3 border-b border-gray-100 cursor-pointer transition-colors duration-200
              ${layer.id === state.selectedLayerId
                ? "bg-blue-50 border-l-2 border-l-blue-500"
                : "hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(layer.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4 text-gray-700" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-gray-900">
                  {layer.name || `Layer ${state.layers.length - index}`}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {layer.type}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {layer.type === "image" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCenterLayer(layer.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Center Layer"
                  >
                    <AlignCenter className="w-3 h-3 text-gray-600" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateLayer(layer.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-3 h-3 text-gray-600" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLayer(layer.id);
                  }}
                  className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {state.layers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-sm">No layers yet</div>
            <div className="text-xs mt-1">Add an image to get started</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;