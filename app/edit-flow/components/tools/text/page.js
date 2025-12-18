"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import { useImageEditor } from "../../../context";
import { Image, Type } from "lucide-react";

// Lazy load HexColorPicker
const HexColorPicker = React.lazy(() =>
  import("react-colorful").then((module) => ({
    default: module.HexColorPicker,
  }))
);

// Import Google Fonts
import "@fontsource/pacifico";
import "@fontsource/playfair-display";
import "@fontsource/bebas-neue";
import "@fontsource/fira-code";
import "@fontsource/fredoka";
import "@fontsource/press-start-2p";
import "@fontsource/abril-fatface";
import "@fontsource/caveat";
import "@fontsource/shadows-into-light";
import "@fontsource/orbitron";
import "@fontsource/bungee";
import "@fontsource/tilt-prism";
import "@fontsource/rubik-glitch";
import "@fontsource/lobster";
import "@fontsource/major-mono-display";
import "@fontsource/montserrat";
import "@fontsource/open-sans";
import "@fontsource/roboto";
import "@fontsource/lato";
import "@fontsource/poppins";
import "@fontsource/raleway";
import "@fontsource/inter";
import "@fontsource/nunito";
import "@fontsource/ubuntu";
import "@fontsource/merriweather";
import "@fontsource/lora";
import "@fontsource/source-sans-pro";
import "@fontsource/oswald";
import "@fontsource/quicksand";
import "@fontsource/rubik";
import "@fontsource/karla";
import "@fontsource/manrope";
import "@fontsource/noto-serif";
import "@fontsource/dancing-script";
import "@fontsource/permanent-marker";

const fontFamilies = [
  "Pacifico",
  "Playfair Display",
  "Bebas Neue",
  "Fira Code",
  "Fredoka",
  "Press Start 2P",
  "Abril Fatface",
  "Caveat",
  "Shadows Into Light",
  "Orbitron",
  "Bungee",
  "Tilt Prism",
  "Rubik Glitch",
  "Lobster",
  "Major Mono Display",
  "Montserrat",
  "Open Sans",
  "Roboto",
  "Lato",
  "Poppins",
  "Raleway",
  "Inter",
  "Nunito",
  "Ubuntu",
  "Merriweather",
  "Lora",
  "Source Sans Pro",
  "Oswald",
  "Quicksand",
  "Rubik",
  "Karla",
  "Manrope",
  "Noto Serif",
  "Dancing Script",
  "Permanent Marker",
];

const defaultOptions = {
  text: "Enter your text here",
  fontSize: 24,
  fontFamily: "Roboto",
  fill: "#6366f1",
  align: "left",
};

function TextTool() {
  const { state, dispatch } = useImageEditor();
  const [options, setOptions] = useState(defaultOptions);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isTextInputActive, setIsTextInputActive] = useState(false);
  const textInputRef = useRef(null);
  // OPTIMIZATION: Added debounceTimer ref to debounce dimension updates for text changes,
  // reducing computation during rapid typing (e.g., measuring text on every keystroke).
  // This minimizes lag in input responsiveness without altering core functionality;
  // text updates immediately, dimensions update after a short delay.
  const debounceTimer = useRef(null);
  // OPTIMIZATION: Added canvasRef to reuse a single canvas element for text measurements,
  // avoiding repeated creation of canvas elements which improves performance and memory efficiency.
  const canvasRef = useRef(null);
  // FIX: Added colorDebounceTimer ref to debounce color updates during dragging.
  // This reduces the frequency of state updates and dispatches, preventing the glitchy effect
  // during rapid color picker dragging while ensuring smooth visual feedback.
  const colorDebounceTimer = useRef(null);
  // FIX: Added previewColor state to immediately reflect color changes in the UI for smooth dragging,
  // while debouncing the actual state and dispatch updates to handleChange.
  const [previewColor, setPreviewColor] = useState(options.fill);

  // Function to measure text dimensions with wrapping simulation
  const measureTextDimensions = (
    text,
    fontSize,
    fontFamily,
    maxWidth = 600
  ) => {
    // OPTIMIZATION: Reuse the canvas if it exists, otherwise create it once.
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `${fontSize}px "${fontFamily}"`;

    const words = text.split(/\s+/);
    let lines = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      const metrics = ctx.measureText(testLine);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    // FIX: Removed Math.min to allow textWidth to exceed maxWidth if necessary (e.g., long words or large font sizes)
    // to ensure the transformer covers the entire text without overflow. This makes the bounding box dynamically adjust
    // to fit the actual rendered text width, preventing the transformer line from failing to cover the text when font
    // properties change and cause potential overflow.
    const maxWidthActual =
      Math.max(...lines.map((line) => ctx.measureText(line).width)) + 20;

    const lineHeight = fontSize * 1.2;
    const textHeight = Math.max(fontSize * 1.5, lines.length * lineHeight + 10);

    return {
      textWidth: maxWidthActual,
      textHeight,
      characterCount: text.length,
    };
  };

  // Expose focusTextInput to context
  useEffect(() => {
    window.focusTextInput = () => {
      if (textInputRef.current) {
        textInputRef.current.focus();
        setIsTextInputActive(true);
      }
    };
    return () => {
      delete window.focusTextInput;
    };
  }, []);

  // Memoize font family options
  const fontOptions = useMemo(
    () =>
      fontFamilies.map((font) => (
        <option
          key={font}
          value={font}
          className="bg-white text-gray-800"
          style={{ fontFamily: font }}
        >
          {font}
        </option>
      )),
    []
  );

  // Memoize slider background
  const sliderStyle = useMemo(
    () => ({
      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((options.fontSize - 8) / (72 - 8)) * 100
        }%, #e5e7eb ${((options.fontSize - 8) / (72 - 8)) * 100}%, #e5e7eb 100%)`,
    }),
    [options.fontSize]
  );

  // Sync options with selected text layer
  useEffect(() => {
    if (state.selectedLayerId && state.layers) {
      const selectedLayer = state.layers.find(
        (layer) => layer.id === state.selectedLayerId
      );
      if (selectedLayer && selectedLayer.type === "text") {
        setOptions({
          text: selectedLayer.text,
          fontSize: selectedLayer.fontSize,
          fontFamily: selectedLayer.fontFamily,
          fill: selectedLayer.fill,
          align: selectedLayer.align,
        });
        // OPTIMIZATION: Removed redundant measurement and dispatch here.
        // Previously, it re-measured dimensions on every selection, even if already set.
        // Now, assume dimensions are up-to-date from add/handleChange; this reduces
        // unnecessary computations and dispatches, improving performance without
        // affecting functionality (dimensions are set/updated elsewhere when needed).
        setIsTextInputActive(true);
        // FIX: Update previewColor when selected layer changes to ensure color picker UI is in sync.
        setPreviewColor(selectedLayer.fill);
      } else {
        setOptions(defaultOptions);
        setIsTextInputActive(false);
        // FIX: Reset previewColor when no text layer is selected.
        setPreviewColor(defaultOptions.fill);
      }
    } else {
      setOptions(defaultOptions);
      setIsTextInputActive(false);
      // FIX: Reset previewColor when no layer is selected.
      setPreviewColor(defaultOptions.fill);
    }
  }, [state.selectedLayerId, state.layers, dispatch]);

  // Handle text input changes
  const handleChange = (field, value) => {
    if (field === "text") {
      if (value.length > 700) {
        alert("You can enter a maximum of 700 characters.");
        return;
      }
    }

    setOptions((prev) => ({ ...prev, [field]: value }));

    if (state.selectedLayerId) {
      const selectedLayer = state.layers.find(
        (layer) => layer.id === state.selectedLayerId
      );
      if (selectedLayer && selectedLayer.type === "text") {
        // Always dispatch the primary field update immediately
        dispatch({
          type: "UPDATE_LAYER",
          payload: {
            id: state.selectedLayerId,
            updates: { [field]: value },
          },
        });

        // If the change affects dimensions, handle measurement
        if (
          field === "text" ||
          field === "fontSize" ||
          field === "fontFamily"
        ) {
          // Clear any existing debounce timer
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }

          const textToUse = field === "text" ? value : selectedLayer.text;
          const sizeToUse =
            field === "fontSize" ? parseInt(value) : selectedLayer.fontSize;
          const familyToUse =
            field === "fontFamily" ? value : selectedLayer.fontFamily;

          if (field === "text") {
            // OPTIMIZATION: Debounce dimension updates for text changes to reduce lag during typing.
            // Measurement (which can be expensive for long text) is delayed by 300ms after last keystroke.
            // This improves input responsiveness; text updates instantly, dimensions catch up shortly after.
            debounceTimer.current = setTimeout(() => {
              const { textWidth, textHeight } = measureTextDimensions(
                textToUse,
                sizeToUse,
                familyToUse
              );
              dispatch({
                type: "UPDATE_LAYER",
                payload: {
                  id: state.selectedLayerId,
                  updates: { textWidth, textHeight },
                },
              });
            }, 300);
          } else {
            // For fontSize and fontFamily, update dimensions immediately (less frequent changes)
            const { textWidth, textHeight } = measureTextDimensions(
              textToUse,
              sizeToUse,
              familyToUse
            );
            // ADDED: Reset scaleX and scaleY to 1 when fontSize or fontFamily changes to ensure the bounding box fits the new font properties without distortion.
            // This enhances resizing behavior by starting from a non-scaled state after font changes, preventing overflow or extra space issues during subsequent resizes.
            // The reset maintains smooth transformer interactions as per edge case requirements for font size and family changes.
            const updates = { textWidth, textHeight };
            if (field === "fontSize" || field === "fontFamily") {
              updates.scaleX = 1;
              updates.scaleY = 1;
            }
            dispatch({
              type: "UPDATE_LAYER",
              payload: {
                id: state.selectedLayerId,
                updates,
              },
            });
          }
        }
      }
    }
  };

  // FIX: Debounced color change handler to prevent excessive re-renders and dispatches during drag.
  // Updates previewColor immediately for smooth UI feedback, while debouncing handleChange calls
  // to 100ms intervals to reduce lag and ensure smooth dragging.
  const handleColorPickerChange = useCallback(
    (color) => {
      // Update previewColor immediately for smooth visual feedback
      setPreviewColor(color);
      // Clear any existing debounce timer
      if (colorDebounceTimer.current) {
        clearTimeout(colorDebounceTimer.current);
      }
      // Debounce the handleChange call to reduce state updates and dispatches
      colorDebounceTimer.current = setTimeout(() => {
        handleChange("fill", color);
      }, 100);
    },
    [handleChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (colorDebounceTimer.current) {
        clearTimeout(colorDebounceTimer.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleAddText = () => {
    const { textWidth, textHeight } = measureTextDimensions(
      options.text,
      options.fontSize,
      options.fontFamily
    );

    const newTextLayer = {
      id: crypto.randomUUID(),
      type: "text",
      text: options.text || "Enter your text here",
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      fill: options.fill,
      align: options.align,
      x: 100,
      y: 100,
      textWidth,
      textHeight,
      visible: true,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      name: "Text Layer",
    };
    dispatch({
      type: "ADD_LAYER",
      payload: newTextLayer,
    });
    dispatch({ type: "SELECT_LAYER", payload: newTextLayer.id });
    dispatch({ type: "SET_TOOL", payload: "text" });
    setIsTextInputActive(true);
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-2 flex flex-col items-start justify-center">
          <div className="flex items-center justify-start gap-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
              <span className="text-2xl text-white">
                <Type />
              </span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Text Studio
            </h1>
          </div>
        </div>

        {/* Description */}

        <div className="mb-8">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 text-sm leading-relaxed">
              Enter your text in the Text Content field and click "Add Text" to
              place it on the canvas. You can move, resize, and style it with
              unique Google Fonts.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div>
          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content
            </label>
            <textarea
              ref={textInputRef}
              value={options.text}
              onChange={(e) => handleChange("text", e.target.value)}
              onFocus={() => setIsTextInputActive(true)}
              onBlur={() => {
                if (
                  !state.selectedLayerId ||
                  state.layers.find(
                    (layer) => layer.id === state.selectedLayerId
                  )?.type !== "text"
                ) {
                  setIsTextInputActive(false);
                }
              }}
              className={`w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 p-4 rounded-xl focus:outline-none transition-all duration-300 resize-none
                ${isTextInputActive
                  ? "ring-2 ring-offset-2 ring-offset-white ring-pink-500 shadow-lg shadow-blue-500/20 border-pink-300"
                  : "focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                }`}
              placeholder="Enter your text here"
              rows={4}
            />
            <p
              className={`text-sm mt-1 ${options.text.length > 650
                  ? "text-red-600 font-semibold"
                  : "text-gray-500"
                }`}
            >
              {options.text.length}/700 characters
            </p>
          </div>

          {/* Add Text Button */}
          <button
            onClick={handleAddText}
            disabled={!options.text.trim()}
            className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 mb-6 group ${!options.text.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2 text-xl group-hover:rotate-12 transition-transform duration-300">
                <span className="text-2xl text-white">
                  <Type />
                </span>
              </span>
              Add Text
            </span>
          </button>

          {/* Font Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Font Size:{" "}
              <span className="text-pink-600 font-bold">
                {options.fontSize}px
              </span>
            </label>
            <div className="relative">
              <input
                type="range"
                min={8}
                max={72}
                value={options.fontSize}
                onChange={(e) =>
                  handleChange("fontSize", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={sliderStyle}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8px</span>
                <span>72px</span>
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={options.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 appearance-none cursor-pointer"
              style={{ fontFamily: options.fontFamily }}
            >
              {fontOptions}
            </select>
          </div>

          {/* Color Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full bg-gray-50 border border-gray-300 p-4 rounded-xl hover:bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 mr-3 shadow-lg"
                    style={{ backgroundColor: previewColor }}
                  />
                  <span className="text-gray-800 font-medium">Pick Color</span>
                </div>
                <span
                  className={`text-gray-500 transition-transform duration-300 ${showColorPicker ? "rotate-180" : ""
                    }`}
                >
                  ⌄
                </span>
              </div>
            </button>
            {showColorPicker && (
              <React.Suspense fallback={<div>Loading color picker...</div>}>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 backdrop-blur-sm">
                  <HexColorPicker
                    color={previewColor}
                    onChange={handleColorPickerChange}
                    className="w-full"
                  />
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg flex items-center">
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 mr-2"
                      style={{ backgroundColor: previewColor }}
                    />
                    <span className="text-sm text-gray-700 font-mono">
                      {previewColor}
                    </span>
                  </div>
                </div>
              </React.Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TextTool);
