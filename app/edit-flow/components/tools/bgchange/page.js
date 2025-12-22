"use client";

import React, { useState, useRef } from "react";
import { Image as ImageIcon, Palette, Sparkles, Upload, X } from "lucide-react";
import { useImageEditor } from "../../../context/index";
import { Image } from "lucide-react";

// Initial background images
const initialBackgroundImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1679678691006-0ad24fecb769?w=500&auto=format&fit=crop",
    name: "Aurora",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1682686580391-615b4f64f2bf?w=500&auto=format&fit=crop",
    name: "Mountain",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=500&auto=format&fit=crop",
    name: "Ocean",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&auto=format&fit=crop",
    name: "Forest",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&auto=format&fit=crop",
    name: "Desert",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop",
    name: "Mist",
  },
];

const colorPresets = [
  { color: "#2a2a72", name: "Midnight Indigo", transparent: false },
  { color: "#ff6f61", name: "Coral Blaze", transparent: false },
  { color: "#00c4b4", name: "Aqua Teal", transparent: false },
  { color: "#ffcb6b", name: "Golden Glow", transparent: false },
  { color: "#6b7280", name: "Slate Mist", transparent: false },
  { color: "#d81b60", name: "Fuchsia Pop", transparent: false },
  { color: "#3f51b5", name: "Royal Blue", transparent: false },
  { color: "#66bb6a", name: "Lime Zest", transparent: false },
  { color: "transparent", name: "Transparent", transparent: true },
];

const gradientPresets = [
  {
    gradient: "linear-gradient(135deg, #ff5e62 0%, #f9cb9c 100%)",
    name: "Tropical Sunset",
  },
  {
    gradient: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
    name: "Night Sky",
  },
  {
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    name: "Candy Floss",
  },
  {
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    name: "Emerald Wave",
  },
  {
    gradient: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
    name: "Citrus Burst",
  },
  {
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    name: "Aqua Dream",
  },
];

const BackgroundTool = () => {
  const { dispatch } = useImageEditor();
  const [activeTab, setActiveTab] = useState("colors");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(
    gradientPresets[0].gradient
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [customImage, setCustomImage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [backgroundImages, setBackgroundImages] = useState(
    initialBackgroundImages
  );
  const fileInputRef = useRef(null);

  const handleColorSelect = (color, isTransparent = false) => {
    setSelectedColor(isTransparent ? "transparent" : color);
    setSelectedImage(null);
    setCustomImage(null);
  };

  const handleGradientSelect = (gradient) => {
    setSelectedGradient(gradient);
    setSelectedImage(null);
    setCustomImage(null);
  };

  const handleImageSelect = (imageUrl) => {
    setSelectedImage(imageUrl);
    setCustomImage(imageUrl);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload a valid image file (JPG, PNG, etc.)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image file size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageUrl = e.target.result;
        const newImage = {
          id: backgroundImages.length + 1,
          url: newImageUrl,
          name: `Custom Image ${backgroundImages.length - initialBackgroundImages.length + 1
            }`,
        };
        setBackgroundImages([...backgroundImages, newImage]);
        setCustomImage(newImageUrl);
        setSelectedImage(newImageUrl);
        setUploadError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSelection = () => {
    setSelectedColor("#2a2a72");
    setSelectedGradient(gradientPresets[0].gradient);
    setSelectedImage(null);
    setCustomImage(null);
    setUploadError(null);
    dispatch({
      type: "SET_BACKGROUND",
      payload: { type: "color", value: "#2a2a72" },
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileUpload(syntheticEvent);
    }
  };

  const handleApplyBackground = () => {
    if (selectedImage) {
      dispatch({
        type: "SET_BACKGROUND",
        payload: { type: "image", value: selectedImage },
      });
    } else if (activeTab === "gradients") {
      dispatch({
        type: "SET_BACKGROUND",
        payload: { type: "gradient", value: selectedGradient },
      });
    } else {
      dispatch({
        type: "SET_BACKGROUND",
        payload: { type: "color", value: selectedColor },
      });
    }
  };

  const tabs = [
    { id: "colors", label: "Colors", icon: Palette },
    { id: "gradients", label: "Gradients", icon: Sparkles },
    { id: "images", label: "Images", icon: ImageIcon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Image className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Background Selector
          </h3>
        </div>
      </div>

      {/* Description */}

      <div className="mb-8">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700 text-sm leading-relaxed">
            Choose a background to match your style—whether solid colors,
            gradients, images, or transparent, set the perfect scene for your
            design.
          </p>
        </div>
      </div>

      {/* Collapsible Tab Navigation */}
      <div className="mb-8">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between py-3 px-4 bg-gray-100 backdrop-blur-sm rounded-xl font-medium text-sm text-gray-800 hover:bg-gray-200 transition-all duration-200 border border-gray-300"
        >
          <span>Select Background Type</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-200 ${isCollapsed ? "rotate-0" : "rotate-180"
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {!isCollapsed && (
          <div className="mt-2 bg-gray-100 backdrop-blur-sm rounded-xl border border-gray-300">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsCollapsed(true);
                  }}
                  className={`w-full flex items-center py-3 px-4 text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === "colors" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Solid Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {colorPresets.map((preset) => (
                <div key={preset.color} className="text-center">
                  <button
                    onClick={() =>
                      handleColorSelect(preset.color, preset.transparent)
                    }
                    className={`w-full h-16 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${selectedColor === preset.color && !selectedImage
                        ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-white"
                        : ""
                      } ${preset.transparent
                        ? 'bg-[url(\'data:image/svg+xml,%3Csvg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="8" height="8" fill="%23E5E7EB"/%3E%3Crect x="8" y="8" width="8" height="8" fill="%23E5E7EB"/%3E%3Crect x="8" width="8" height="8" fill="%23D1D5DB"/%3E%3Crect x="8" y="8" width="8" height="8" fill="%23D1D5DB"/%3E%3C/svg%3E\')] bg-repeat'
                        : ""
                      }`}
                    style={
                      preset.transparent
                        ? {}
                        : { backgroundColor: preset.color }
                    }
                    aria-label={`Select ${preset.name}`}
                  />
                  <span className="text-xs text-gray-600 mt-2 block">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-50 backdrop-blur-sm rounded-xl border border-gray-300">
              <h4 className="font-medium text-gray-800 mb-3">Custom Color</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={
                    selectedColor === "transparent" ? "#ffffff" : selectedColor
                  }
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-16 h-16 rounded-lg border-2 border-gray-400 cursor-pointer"
                />
                <div>
                  <p className="text-sm text-gray-600">Pick any color</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedColor}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gradients" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Gradient Backgrounds
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {gradientPresets.map((preset, index) => (
                <div key={index} className="text-center">
                  <button
                    onClick={() => handleGradientSelect(preset.gradient)}
                    className={`w-full h-24 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${selectedGradient === preset.gradient && !selectedImage
                        ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-white"
                        : ""
                      }`}
                    style={{ background: preset.gradient }}
                    aria-label={`Select ${preset.name} gradient`}
                  />
                  <span className="text-sm text-gray-600 mt-3 block font-medium">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Image Backgrounds
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
              {backgroundImages.map((image) => (
                <div key={image.id} className="text-center">
                  <button
                    onClick={() => handleImageSelect(image.url)}
                    className={`group relative w-full h-32 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${selectedImage === image.url
                        ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-white"
                        : ""
                      }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-gray-800 text-sm font-medium">
                          Select
                        </span>
                      </div>
                    </div>
                  </button>
                  <span className="text-sm text-gray-600 mt-3 block font-medium">
                    {image.name}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center hover:border-blue-500 transition-colors duration-200 bg-gray-50 backdrop-blur-sm"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Upload size={32} className="mx-auto text-gray-600 mb-4" />
              <h4 className="font-medium text-gray-800 mb-2">
                Upload Custom Image
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop or click to select (JPG, PNG, max 5MB)
              </p>
              <button
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-2 text-white rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium"
              >
                Choose File
              </button>
              {uploadError && (
                <p className="text-sm text-red-600 mt-4">{uploadError}</p>
              )}
              {customImage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Uploaded Image Preview:
                  </p>
                  <div className="relative inline-block mt-2">
                    <img
                      src={customImage}
                      alt="Uploaded preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setCustomImage(null);
                        setSelectedImage(null);
                        setUploadError(null);
                        dispatch({
                          type: "SET_BACKGROUND",
                          payload: { type: "color", value: "#2a2a72" },
                        });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleApplyBackground}
        className="w-full px-4 py-2 text-white rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium flex items-center justify-center my-5"
      >
        <Upload size={18} className="mr-2" />
        Apply Background
      </button>

      {/* Preview and Controls Section */}
      <div className="mt-8 p-4 bg-gray-50 backdrop-blur-sm rounded-xl border border-gray-300">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-800">Preview</h4>
          <button
            onClick={handleClearSelection}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all duration-200 text-sm font-medium"
          >
            Reset
          </button>
        </div>
        <div
          className="w-full h-24 rounded-lg border-2 border-gray-400 transition-all duration-300"
          style={{
            background:
              activeTab === "colors"
                ? selectedColor === "transparent"
                  ? 'url(\'data:image/svg+xml,%3Csvg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="8" height="8" fill="%23E5E7EB"/%3E%3Crect x="8" y="8" width="8" height="8" fill="%23E5E7EB"/%3E%3Crect x="8" width="8" height="8" fill="%23D1D5DB"/%3E%3Crect x="8" y="8" width="8" height="8" fill="%23D1D5DB"/%3E%3C/svg%3E\') repeat'
                  : selectedColor
                : activeTab === "gradients"
                  ? selectedGradient
                  : selectedImage
                    ? `url(${selectedImage}) center/cover`
                    : "rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </div>
  );
};

export default BackgroundTool;
