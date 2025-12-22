"use client";

import React, { useState } from "react";
import { Wand2, Loader2, Image } from "lucide-react";
import { useImageEditor } from "../../../context/index";
import { applyAIEdit } from "../../../utils/aieditapi";

const AIEditTool = () => {
  const { state, dispatch } = useImageEditor();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyAIEdit = async () => {
    if (!state.selectedLayerId || !prompt) return;

    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );
    if (!selectedLayer || selectedLayer.type !== "image") {
      setError("Please select an image layer to edit.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const imageData = selectedLayer.data;
      const editedImageData = await applyAIEdit(imageData, prompt);

      dispatch({
        type: "UPDATE_LAYER_IMAGE_ONLY",
        payload: {
          id: selectedLayer.id,
          data: editedImageData,
        },
      });
      dispatch({ type: "SAVE_HISTORY" });
      setPrompt("");
    } catch (err) {
      setError("Failed to apply AI edit. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            AI Image Editor
          </h3>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700 text-sm leading-relaxed">
            The AI Image Editor uses artificial intelligence to enhance and modify images easily, offering smart corrections and creative effects for both beginners and professionals.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Edit Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the edit (e.g., 'Enhance colors, make it vibrant')"
          className="w-full h-24 p-2 rounded-md resize-none border focus:ring-pink-600 focus:border-pink-600 text-black"
          disabled={isProcessing}
        />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        onClick={handleApplyAIEdit}
        disabled={isProcessing || !prompt || !state.selectedLayerId}
        className={`
          w-full py-2 px-4 rounded-md text-white font-medium
          ${isProcessing || !prompt || !state.selectedLayerId
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          }
        `}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </div>
        ) : (
          "Apply AI Edit"
        )}
      </button>
    </div>
  );
};

export default AIEditTool;
