"use client";

import React, { useRef } from "react";
import { ZoomIn, ZoomOut, Download, Upload, Sparkles } from "lucide-react";
import { useImageEditor } from "../../context/index";
import Konva from "konva";

const TopNavbar = () => {
  const { state, dispatch } = useImageEditor();
  const fileInputRef = useRef(null);

  const handleZoomIn = () => {
    dispatch({ type: "SET_ZOOM", payload: state.zoom + 0.1 });
  };

  const handleZoomOut = () => {
    dispatch({ type: "SET_ZOOM", payload: state.zoom - 0.1 });
  };

  const handleExport = () => {
    const stage = window.Konva.stages[0]; // Assuming single stage
    if (!stage) {
      console.error("No stage found for export");
      return;
    }

    const layers = state.layers.filter((layer) => layer.visible);

    if (layers.length === 0) {
      console.error("No visible layers to export");
      return;
    }

    // Find the transformer layer (last layer in the stage)
    const transformerLayer = stage.getLayers()[stage.getLayers().length - 1];
    let transformerWasVisible = false;
    let transformerNodes = [];

    // Store transformer state and hide it
    if (transformerLayer) {
      const transformer = transformerLayer.findOne("Transformer");
      if (transformer) {
        transformerWasVisible = transformer.visible();
        transformerNodes = transformer.nodes();
        transformer.visible(false);
        transformerLayer.batchDraw();
      }
    }

    if (layers.length === 1 && layers[0].type === "image") {
      const layer = layers[0];
      const imageData = layer.data;
      const cropRect = window.cropRect; // Assume cropRect is exposed from KonvaCanvas
      const filteredImage = window.filteredImages && window.filteredImages[layer.id];

      if (layer.filters || cropRect) {
        // Create a temporary canvas to render the cropped and filtered image
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        const img = filteredImage || (imageData instanceof HTMLImageElement ? imageData : new window.Image());

        if (typeof imageData === "string") {
          img.src = imageData;
        }

        // Wait for image to load if not already loaded
        const loadImage = new Promise((resolve) => {
          if (img.complete) resolve();
          else img.onload = () => resolve();
        });

        loadImage.then(() => {
          // Set canvas dimensions based on crop or full image
          const scaleX = layer.scaleX || 1;
          const scaleY = layer.scaleY || 1;
          const cropX = cropRect ? Math.round((cropRect.x - (layer.x || 0)) / scaleX) : 0;
          const cropY = cropRect ? Math.round((cropRect.y - (layer.y || 0)) / scaleY) : 0;
          const cropWidth = cropRect ? Math.round(cropRect.width / scaleX) : img.width;
          const cropHeight = cropRect ? Math.round(cropRect.height / scaleY) : img.height;

          tempCanvas.width = cropWidth;
          tempCanvas.height = cropHeight;

          // Apply filters if present and function is available
          if (layer.filters && window.generateFilterString) {
            ctx.filter = window.generateFilterString(layer.filters);
          }

          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          const dataURL = tempCanvas.toDataURL("image/png");

          const link = document.createElement("a");
          link.href = dataURL;
          link.download = layer.name ? `${layer.name}.png` : "image.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      } else if (typeof imageData === "string") {
        // Download the original image data directly
        const link = document.createElement("a");
        link.href = imageData;
        link.download = layer.name ? `${layer.name}.png` : "image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (imageData instanceof HTMLImageElement) {
        // Convert HTMLImageElement to Data URL
        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imageData, 0, 0);
        const dataURL = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = layer.name ? `${layer.name}.png` : "image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Multiple layers: export the entire canvas
      const dataURL = stage.toDataURL({
        mimeType: "image/png",
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "canvas_export.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Restore transformer state
    if (transformerLayer && transformerWasVisible) {
      const transformer = transformerLayer.findOne("Transformer");
      if (transformer) {
        transformer.visible(true);
        transformer.nodes(transformerNodes);
        transformerLayer.batchDraw();
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newLayer = {
          id: crypto.randomUUID(),
          type: "image",
          data: e.target.result,
          visible: true,
          opacity: 1,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          name: file.name.split(".")[0],
        };
        dispatch({ type: "ADD_LAYER", payload: newLayer });
      };
      reader.readAsDataURL(file);
    });
    event.target.value = null; // Reset input to allow re-uploading the same file
  };

  return (
    <nav className="px-4 py-[13.5px] flex items-center justify-between bg-white border-b border-gray-200">
      <div className="flex items-center space-x-6">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Design Studio
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 bg-gray-100 border border-gray-200 rounded-lg px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="tooltip p-1 rounded hover:bg-gray-200 transition-colors duration-200 text-gray-700"
            data-tooltip="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium px-2 min-w-[50px] text-center text-gray-800">
            {Math.round(state.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="tooltip p-1 rounded hover:bg-gray-200 transition-colors duration-200 text-gray-700"
            data-tooltip="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleUploadClick}
          className="tooltip px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 font-medium text-sm text-white shadow-md"
          data-tooltip="Upload"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload Image
        </button>

        <button
          className="tooltip px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 font-medium text-sm text-white shadow-md"
          data-tooltip="Upload"
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Magic Write
        </button>

        <button
          onClick={handleExport}
          className="tooltip px-4 py-2 rounded-lg bg-black font-medium text-sm text-white shadow-md"
          data-tooltip="Export"
        >
          <Download className="w-4 h-4 inline mr-2" />
          Download
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
    </nav>
  );
};

export default TopNavbar;