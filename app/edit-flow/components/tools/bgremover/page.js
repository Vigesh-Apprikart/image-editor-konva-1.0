"use client";

import React, { useState, useCallback, memo } from "react";
import { Scissors, Image, AlertCircle, Sparkles } from "lucide-react";
import { useImageEditor } from "../../../context/index";

// Utility to convert data URL to Blob
const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

// Utility to validate image size
const validateImageSize = (blob, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (blob.size > maxSizeBytes) {
    throw new Error(`Image size exceeds ${maxSizeMB}MB limit`);
  }
  return blob;
};

// Utility to fetch remote image
const fetchRemoteImage = async (url) => {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response.blob();
};

const BackgroundRemover = () => {
  const { state, dispatch, saveToHistory } = useImageEditor();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const removeBackgroundHandler = useCallback(async () => {
    if (isProcessing) return;

    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );

    if (!selectedLayer || selectedLayer.type !== "image") {
      setErrorMessage("Please select an image layer first");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let imageBlob;

      // Handle different image data types
      if (typeof selectedLayer.data === "string") {
        if (selectedLayer.data.startsWith("data:image")) {
          imageBlob = await dataUrlToBlob(selectedLayer.data);
          imageBlob = await validateImageSize(imageBlob);
        } else if (
          selectedLayer.data.startsWith("http://") ||
          selectedLayer.data.startsWith("https://")
        ) {
          imageBlob = await fetchRemoteImage(selectedLayer.data);
          imageBlob = await validateImageSize(imageBlob);
        } else {
          throw new Error("Invalid image URL");
        }
      } else if (selectedLayer.data instanceof File) {
        imageBlob = await validateImageSize(selectedLayer.data);
      } else {
        throw new Error("Unsupported image data format");
      }

      // Prepare form data for API
      const formData = new FormData();
      formData.append("image", imageBlob);

      // Make API call to remove background
      const response = await fetch(
        "https://prompthkit.apprikart.com/api/v1/ai/remove-background",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // Get the result as a blob
      const resultBlob = await response.blob();

      // Convert result to data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read result"));
        reader.readAsDataURL(resultBlob);
      });

      // Create new image to get dimensions
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load processed image"));
        img.src = dataUrl;
      });

      const maxWidth = 800 * 0.8;
      const maxHeight = 600 * 0.8;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

      // Update layer with new image data, preserving existing properties
      dispatch({
        type: "UPDATE_LAYER",
        payload: {
          id: selectedLayer.id,
          updates: {
            data: dataUrl,
            x: selectedLayer.x,
            y: selectedLayer.y,
            scaleX: selectedLayer.scaleX,
            scaleY: selectedLayer.scaleY,
            width: img.width,
            height: img.height,
            initialized: true,
            filters: selectedLayer.filters || null,
            preset: selectedLayer.preset || "Original",
            opacity: selectedLayer.opacity || 1,
            rotation: selectedLayer.rotation || 0,
            backgroundColor: selectedLayer.backgroundColor || null,
            name: selectedLayer.name || "Image Layer",
            visible:
              selectedLayer.visible !== undefined
                ? selectedLayer.visible
                : true,
          },
        },
      });

      // Save to history to track changes
      saveToHistory();
      dispatch({ type: "SET_TOOL", payload: "select" });
    } catch (error) {
      console.error("Background removal failed:", error);
      setErrorMessage(`Background removal failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [
    state.layers,
    state.selectedLayerId,
    dispatch,
    saveToHistory,
    isProcessing,
  ]);

  // Early return for non-active tool
  if (state.currentTool !== "background-remove") return null;

  return (
    <div className="relative overflow-hidden">
      <div className="relative">
        <div className="relative z-10">
          {/* Header with Icon */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Scissors className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Background Remover
              </h3>
            </div>
          </div>

          {/* Description */}

          <div className="mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm leading-relaxed">
                Select an image on the canvas and click the magic button below
                to instantly remove its background using cutting-edge AI
                technology. Maximum image size: 5MB.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={removeBackgroundHandler}
            disabled={isProcessing || !state.selectedLayerId}
            className="relative w-full group overflow-hidden"
          >
            <div className="relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl border border-blue-300 transition-all duration-300 group-hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="flex items-center justify-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-bold text-white">
                      Processing Magic...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-white group-hover:animate-pulse" />
                    <span className="font-bold text-white">
                      Remove Background
                    </span>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Additional Subtle Effect for White Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-blue-100/30 rounded-3xl blur-3xl -z-10" />
    </div>
  );
};

export default memo(BackgroundRemover);
