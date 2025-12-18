"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import { Crop, Check, X, Image } from "lucide-react";
import { useImageEditor } from "../../../context/page";

// Define aspect ratios as a constant outside the component to prevent re-creation
const aspectRatios = [
  { name: "Free", value: null },
  { name: "1:1", value: 1 },
  { name: "4:3", value: 4 / 3 },
  { name: "3:4", value: 3 / 4 },
  { name: "16:9", value: 16 / 9 },
  { name: "9:16", value: 9 / 16 },
  { name: "2:3", value: 2 / 3 },
  { name: "3:2", value: 3 / 2 },
  { name: "5:4", value: 5 / 4 },
  { name: "4:5", value: 4 / 5 },
  { name: "3:1", value: 3 / 1 },
  { name: "1:3", value: 1 / 3 },
  { name: "2:1", value: 2 / 1 },
  { name: "1:2", value: 1 / 2 },
  { name: "21:9", value: 21 / 9 },
  { name: "9:21", value: 9 / 21 },
];

// Memoized Aspect Ratio Button component to prevent re-renders
const AspectRatioButton = memo(({ ratio, selectedRatio, onSelect }) => (
  <button
    onClick={() => onSelect(ratio.value)}
    className={`
      px-3 py-2 text-sm rounded-xl transition-colors duration-200
      ${
        selectedRatio === ratio.value
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }
      border ${
        selectedRatio === ratio.value ? "border-purple-300" : "border-gray-300"
      }
    `}
  >
    {ratio.name}
  </button>
));

AspectRatioButton.displayName = "AspectRatioButton";

// Define prop types for AspectRatioButton
AspectRatioButton.propTypes = {
  ratio: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number,
  }).isRequired,
  selectedRatio: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
};

const CropTool = () => {
  const { state, dispatch } = useImageEditor();
  const [selectedRatio, setSelectedRatio] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Memoize handleApplyCrop to prevent re-creation
  const handleApplyCrop = useCallback(() => {
    if (!state.selectedLayerId) {
      setErrorMessage("Please select an image layer first");
      return;
    }
    if (window.applyCrop) {
      window.applyCrop();
      setErrorMessage(null);
    }
  }, [state.selectedLayerId]);

  // Memoize handleCancelCrop
  const handleCancelCrop = useCallback(() => {
    dispatch({ type: "SET_TOOL", payload: "select" });
    setErrorMessage(null);
    setSelectedRatio(null);
  }, [dispatch]);

  // Debounced handleRatioSelect to reduce rapid state updates
  const handleRatioSelect = useCallback((ratio) => {
    setSelectedRatio(ratio);
    if (window.setCropAspectRatio) {
      window.setCropAspectRatio(ratio);
    }
    setErrorMessage(null);
  }, []);

  // Optimize useEffect to run only when currentTool changes
  useEffect(() => {
    if (state.currentTool !== "crop") {
      setErrorMessage(null);
      setSelectedRatio(null);
    }
  }, [state.currentTool]);

  // Early return if not in crop mode to avoid rendering unnecessary DOM
  if (state.currentTool !== "crop") {
    return null;
  }

  return (
    <div className="relative overflow-hidde">
      <div className="relative">
        <div className="relative z-10">
          {/* Header with Icon */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Crop className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Crop Tool
              </h3>
            </div>
          </div>

          {/* Description */}

          <div className="mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm leading-relaxed">
                Select an image on the canvas, choose an aspect ratio to fit the
                image, and adjust the crop box. Click Apply to crop the image.
              </p>
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="mb-6">
            <h4 className="text-gray-800 font-semibold mb-3">Aspect Ratio</h4>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ratio) => (
                <AspectRatioButton
                  key={ratio.name}
                  ratio={ratio}
                  selectedRatio={selectedRatio}
                  onSelect={handleRatioSelect}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleApplyCrop}
              disabled={!state.selectedLayerId}
              className="relative flex-1 group overflow-hidden"
            >
              <div className="relative px-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl border transition-colors duration-300 ">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">Apply Crop</span>
                </div>
              </div>
            </button>
            <button
              onClick={handleCancelCrop}
              className="relative flex-1 group overflow-hidden"
            >
              <div className="relative px-6 py-3 bg-black rounded-2xl border border-black-300 transition-colors duration-300 group-hover:border-black-400">
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">Cancel</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Simplified glow effect - updated for white background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl -z-10"></div>
    </div>
  );
};

// Memoize the entire CropTool component
export default memo(CropTool);
