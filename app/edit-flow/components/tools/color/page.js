"use client";

import React, { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useImageEditor } from "../../../context/page";
import { Palette, Image } from "lucide-react";

const AddColorTool = () => {
  const { state, dispatch } = useImageEditor();
  const [color, setColor] = useState("#ff0055");
  const [isApplying, setIsApplying] = useState(false);

  const applyColor = async () => {
    setIsApplying(true);
    if (state.selectedLayerId) {
      dispatch({
        type: "UPDATE_LAYER",
        payload: {
          id: state.selectedLayerId,
          updates: { backgroundColor: color },
        },
      });
    }
    setTimeout(() => {
      setIsApplying(false);
    }, 300);
  };

  return (
    <div className="relative w-full max-w-sm text-gray-800">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Palette className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Add Color
            </h3>
          </div>
        </div>

        {/* Description */}

        <div className="mb-8">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 text-sm leading-relaxed">
              Select any color from the picker below and apply it as the
              background color for the selected image layer.
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 backdrop-blur-sm">
            <HexColorPicker
              color={color}
              onChange={setColor}
              style={{
                width: "100%",
                height: "180px",
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-xl blur-xl -z-10 opacity-50" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-lg"
                  style={{ backgroundColor: color }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Selected Color
                </p>
                <p className="text-sm font-mono font-medium text-gray-800">
                  {color.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={applyColor}
            disabled={isApplying || !state.selectedLayerId}
            className="group relative w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Apply Color</span>
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 -z-10" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddColorTool;
