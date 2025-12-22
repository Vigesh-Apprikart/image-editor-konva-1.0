"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import { useImageEditor } from "../../../context/index";
// import LazyLoad from "react-lazyload";

import debounce from "lodash/debounce";
import Image from "next/image";
import { Image as ImageIcon, SlidersHorizontal } from "lucide-react";

const defaultFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  opacity: 100,
};

const filterPresets = [
  { name: "Original", icon: "🎨", filters: { ...defaultFilters } },
  {
    name: "Vintage",
    icon: "📷",
    filters: {
      ...defaultFilters,
      sepia: 40,
      contrast: 110,
      brightness: 110,
      saturation: 85,
    },
  },
  {
    name: "Lomo",
    icon: "📸",
    filters: {
      ...defaultFilters,
      contrast: 140,
      saturation: 120,
      brightness: 90,
      hue: 5,
    },
  },
  {
    name: "Clarendon",
    icon: "✨",
    filters: {
      ...defaultFilters,
      contrast: 120,
      brightness: 105,
      saturation: 130,
    },
  },
  {
    name: "Grayscale",
    icon: "⚫",
    filters: { ...defaultFilters, grayscale: 100, contrast: 115 },
  },
  {
    name: "Sepia",
    icon: "🟤",
    filters: {
      ...defaultFilters,
      sepia: 80,
      brightness: 105,
      contrast: 105,
    },
  },
  {
    name: "Kodachrome",
    icon: "🎞️",
    filters: {
      ...defaultFilters,
      contrast: 125,
      saturation: 140,
      brightness: 95,
      hue: 15,
    },
  },
  {
    name: "Technicolor",
    icon: "🌈",
    filters: {
      ...defaultFilters,
      contrast: 150,
      saturation: 160,
      brightness: 100,
      hue: 350,
    },
  },
  {
    name: "Polaroid",
    icon: "📷",
    filters: {
      ...defaultFilters,
      contrast: 90,
      brightness: 120,
      saturation: 75,
      sepia: 15,
    },
  },
  {
    name: "Invert",
    icon: "🔄",
    filters: { ...defaultFilters, invert: 100 },
  },
  {
    name: "Cold",
    icon: "❄️",
    filters: {
      ...defaultFilters,
      hue: 200,
      saturation: 110,
      brightness: 95,
      contrast: 105,
    },
  },
  {
    name: "Warm",
    icon: "🔥",
    filters: {
      ...defaultFilters,
      hue: 20,
      saturation: 115,
      brightness: 110,
      contrast: 105,
    },
  },
  {
    name: "Noir",
    icon: "🎭",
    filters: {
      ...defaultFilters,
      grayscale: 100,
      contrast: 140,
      brightness: 85,
    },
  },
  {
    name: "Dramatic",
    icon: "⚡",
    filters: {
      ...defaultFilters,
      contrast: 160,
      saturation: 120,
      brightness: 80,
    },
  },
  {
    name: "Cinematic",
    icon: "🎬",
    filters: {
      ...defaultFilters,
      contrast: 130,
      brightness: 85,
      saturation: 110,
      hue: 10,
    },
  },
  {
    name: "Night Vision",
    icon: "🌙",
    filters: {
      ...defaultFilters,
      hue: 120,
      saturation: 200,
      brightness: 60,
      contrast: 180,
    },
  },
  {
    name: "Retro",
    icon: "📺",
    filters: {
      ...defaultFilters,
      sepia: 30,
      contrast: 120,
      brightness: 105,
      saturation: 90,
    },
  },
  {
    name: "Soft Glow",
    icon: "✨",
    filters: {
      ...defaultFilters,
      brightness: 120,
      contrast: 85,
      saturation: 110,
      blur: 1,
    },
  },
  {
    name: "Faded",
    icon: "🌫️",
    filters: {
      ...defaultFilters,
      brightness: 130,
      contrast: 70,
      saturation: 60,
      opacity: 85,
    },
  },
  {
    name: "High Contrast",
    icon: "⚪",
    filters: {
      ...defaultFilters,
      contrast: 180,
      brightness: 90,
      saturation: 120,
    },
  },
  {
    name: "Duotone",
    icon: "🎨",
    filters: {
      ...defaultFilters,
      hue: 240,
      saturation: 200,
      contrast: 130,
      brightness: 95,
    },
  },
  {
    name: "Acid",
    icon: "💚",
    filters: {
      ...defaultFilters,
      hue: 80,
      saturation: 200,
      contrast: 140,
      brightness: 110,
    },
  },
  {
    name: "Golden Hour",
    icon: "🌅",
    filters: {
      ...defaultFilters,
      hue: 35,
      saturation: 120,
      brightness: 115,
      contrast: 110,
    },
  },
  {
    name: "Frost",
    icon: "🧊",
    filters: {
      ...defaultFilters,
      hue: 180,
      saturation: 80,
      brightness: 130,
      contrast: 95,
    },
  },
  {
    name: "Sunset",
    icon: "🌇",
    filters: {
      ...defaultFilters,
      hue: 15,
      saturation: 140,
      brightness: 110,
      contrast: 115,
    },
  },
  {
    name: "Deep Blue",
    icon: "🌊",
    filters: {
      ...defaultFilters,
      hue: 220,
      saturation: 150,
      brightness: 85,
      contrast: 120,
    },
  },
  {
    name: "Green Tint",
    icon: "🌿",
    filters: {
      ...defaultFilters,
      hue: 100,
      saturation: 130,
      brightness: 100,
      contrast: 110,
    },
  },
  {
    name: "B&W Film",
    icon: "🎞️",
    filters: {
      ...defaultFilters,
      grayscale: 100,
      contrast: 125,
      brightness: 90,
    },
  },
  {
    name: "Film Grain",
    icon: "📽️",
    filters: {
      ...defaultFilters,
      contrast: 115,
      brightness: 95,
      saturation: 85,
      sepia: 10,
    },
  },
  {
    name: "Matte",
    icon: "🎨",
    filters: {
      ...defaultFilters,
      contrast: 80,
      brightness: 110,
      saturation: 70,
    },
  },
  {
    name: "Pastel",
    icon: "🌸",
    filters: {
      ...defaultFilters,
      brightness: 125,
      contrast: 75,
      saturation: 60,
    },
  },
];

const filterReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: action.payload.filters,
        preset: action.payload.preset,
      };
    case "RESET":
      return { filters: defaultFilters, preset: "Original" };
    default:
      return state;
  }
};

const FiltersTool = React.memo(() => {
  const { state, dispatch } = useImageEditor();
  const selectedLayerId = state.selectedLayerId;
  const selectedLayer = state.layers.find((l) => l.id === selectedLayerId);

  const [filterState, dispatchFilter] = useReducer(filterReducer, {
    filters: selectedLayer?.filters || defaultFilters,
    preset: selectedLayer?.preset || "Original",
  });
  const [isAutoAdjusting, setIsAutoAdjusting] = useState(false);
  const [resolvedImageSrc, setResolvedImageSrc] = useState(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isFineTuneFiltersOpen, setFineTuneFiltersOpen] = useState(false);
  const [visiblePresets, setVisiblePresets] = useState(8);

  const filterControls = useMemo(
    () => [
      {
        name: "brightness",
        label: "Brightness",
        min: 0,
        max: 200,
        unit: "%",
        icon: "💡",
        color: "from-yellow-400 to-orange-500",
      },
      {
        name: "contrast",
        label: "Contrast",
        min: 0,
        max: 200,
        unit: "%",
        icon: "⚡",
        color: "from-blue-400 to-purple-500",
      },
      {
        name: "saturation",
        label: "Saturation",
        min: 0,
        max: 200,
        unit: "%",
        icon: "🌈",
        color: "from-pink-400 to-red-500",
      },
      {
        name: "hue",
        label: "Hue Rotate",
        min: 0,
        max: 360,
        unit: "°",
        icon: "🎨",
        color: "from-green-400 to-blue-500",
      },
      {
        name: "blur",
        label: "Blur",
        min: 0,
        max: 10,
        unit: "px",
        icon: "🌀",
        color: "from-indigo-400 to-purple-500",
      },
      {
        name: "grayscale",
        label: "Grayscale",
        min: 0,
        max: 100,
        unit: "%",
        icon: "⚫",
        color: "from-gray-400 to-gray-600",
      },
      {
        name: "sepia",
        label: "Sepia",
        min: 0,
        max: 100,
        unit: "%",
        icon: "📜",
        color: "from-amber-400 to-orange-500",
      },
      {
        name: "invert",
        label: "Invert",
        min: 0,
        max: 100,
        unit: "%",
        icon: "🔄",
        color: "from-teal-400 to-cyan-500",
      },
      {
        name: "opacity",
        label: "Opacity",
        min: 0,
        max: 100,
        unit: "%",
        icon: "👻",
        color: "from-slate-400 to-slate-600",
      },
    ],
    []
  );

  const handleFilterChange = useMemo(
    () =>
      debounce((filterName, value) => {
        const newFilters = {
          ...filterState.filters,
          [filterName]: parseInt(value),
        };
        dispatchFilter({
          type: "UPDATE_FILTERS",
          payload: { filters: newFilters, preset: "Custom" },
        });
        if (selectedLayerId) {
          dispatch({
            type: "UPDATE_LAYER",
            payload: {
              id: selectedLayerId,
              updates: { filters: newFilters, preset: "Custom" },
            },
          });
        }
      }, 100),
    [filterState.filters, selectedLayerId, dispatch]
  );

  const applyPreset = useCallback(
    (presetName, presetFilters) => {
      dispatchFilter({
        type: "UPDATE_FILTERS",
        payload: { filters: presetFilters, preset: presetName },
      });
      if (selectedLayerId) {
        dispatch({
          type: "UPDATE_LAYER",
          payload: {
            id: selectedLayerId,
            updates: { filters: presetFilters, preset: presetName },
          },
        });
      }
    },
    [selectedLayerId, dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatchFilter({ type: "RESET" });
    if (selectedLayerId) {
      dispatch({
        type: "UPDATE_LAYER",
        payload: {
          id: selectedLayerId,
          updates: { filters: defaultFilters, preset: "Original" },
        },
      });
    }
  }, [selectedLayerId, dispatch]);

  const autoAdjust = useCallback(() => {
    setIsAutoAdjusting(true);
    const timeoutId = setTimeout(() => {
      const autoFilters = {
        brightness: Math.round(105 + Math.random() * 15),
        contrast: Math.round(110 + Math.random() * 20),
        saturation: Math.round(105 + Math.random() * 15),
        hue: Math.round(Math.random() * 10 - 5),
        blur: 0,
        grayscale: 0,
        sepia: Math.round(Math.random() * 5),
        invert: 0,
        opacity: 100,
      };
      dispatchFilter({
        type: "UPDATE_FILTERS",
        payload: { filters: autoFilters, preset: "Auto Enhanced" },
      });
      if (selectedLayerId) {
        dispatch({
          type: "UPDATE_LAYER",
          payload: {
            id: selectedLayerId,
            updates: { filters: autoFilters, preset: "Auto Enhanced" },
          },
        });
      }
      setIsAutoAdjusting(false);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [selectedLayerId, dispatch]);

  useEffect(() => {
    dispatchFilter({
      type: "UPDATE_FILTERS",
      payload: {
        filters: selectedLayer?.filters || defaultFilters,
        preset: selectedLayer?.preset || "Original",
      },
    });
  }, [selectedLayer]);

  useEffect(() => {
    let isMounted = true;
    const updateImageSrc = (src) => {
      if (isMounted && resolvedImageSrc !== src) {
        setResolvedImageSrc(src);
      }
    };

    if (selectedLayer?.data) {
      if (typeof selectedLayer.data === "string") {
        updateImageSrc(selectedLayer.data);
      } else if (selectedLayer.data instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateImageSrc(e.target.result);
        };
        reader.readAsDataURL(selectedLayer.data);
        return () => {
          reader.abort();
        };
      }
    } else {
      updateImageSrc(null);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedLayer, resolvedImageSrc]);

  const togglePresets = useCallback(
    () => setIsPresetsOpen((prev) => !prev),
    []
  );
  const toggleFineTuneFilters = useCallback(
    () => setFineTuneFiltersOpen((prev) => !prev),
    []
  );

  const loadMorePresets = useCallback(() => {
    setVisiblePresets((prev) => Math.min(prev + 8, filterPresets.length));
  }, []);

  const sampleImage =
    "https://www.autoblog.com/.image/w_3840,q_auto:good,c_fill,ar_4:3/MjEyMzI3MTA1NzA5NDgzNjQ4/koenigsegg-agera-rs.jpg";

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-2 flex flex-col items-start justify-center">
          <div className="flex items-center justify-start gap-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
              <span className="text-2xl text-white">
                <SlidersHorizontal />
              </span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Filter Studio
            </h1>
          </div>
        </div>

        {/* Description */}

        <div className="mb-8">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Image className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 text-sm leading-relaxed">
              Apply filters to enhance your image with the perfect mood or tone.
              Adjust brightness, contrast, and more to bring your design to life
              effortlessly.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-8">
            <h3
              className="text-lg font-semibold text-gray-800 mb-4 flex items-center cursor-pointer hover:text-purple-600 transition-colors duration-200"
              onClick={togglePresets}
            >
              <span className="mr-2 transform transition-transform duration-200">
                {isPresetsOpen ? "▼" : "▶"}
              </span>
              <span className="mr-2">🎨</span>
              Quick Presets
            </h3>
            {isPresetsOpen && (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-200">
                {filterPresets.slice(0, visiblePresets).map((preset) => (

                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.name, preset.filters)}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 transform hover:scale-105 ${filterState.preset === preset.name
                        ? "border-purple-500 shadow-lg shadow-purple-500/25"
                        : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    <div className="aspect-square overflow-hidden">
                      <Image
                        src={resolvedImageSrc || sampleImage}
                        alt={preset.name}
                        fill
                        style={{
                          objectFit: 'cover',
                          filter: `brightness(${preset.filters.brightness}%) contrast(${preset.filters.contrast}%) saturate(${preset.filters.saturation}%) hue-rotate(${preset.filters.hue}deg) blur(${preset.filters.blur}px) grayscale(${preset.filters.grayscale}%) sepia(${preset.filters.sepia}%) invert(${preset.filters.invert}%) opacity(${preset.filters.opacity}%)`,
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center justify-center">
                        <span className="text-xs mr-1">{preset.icon}</span>
                        <span className="text-xs font-medium text-center leading-tight">
                          {preset.name}
                        </span>
                      </div>
                    </div>
                    {filterState.preset === preset.name && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>

                ))}
                {visiblePresets < filterPresets.length && (
                  <button
                    onClick={loadMorePresets}
                    className="col-span-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6 mb-6">
            <h3
              className="text-lg font-semibold text-gray-800 mb-4 flex items-center cursor-pointer hover:text-purple-600 transition-colors duration-200"
              onClick={toggleFineTuneFilters}
            >
              <span className="mr-2 transform transition-transform duration-200">
                {isFineTuneFiltersOpen ? "▼" : "▶"}
              </span>
              <span className="mr-2">🎛️</span>
              Fine-tune Filters
            </h3>
            {isFineTuneFiltersOpen && (
              <div>
                {filterControls.map((control) => (
                  <div key={control.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <span className="mr-2">{control.icon}</span>
                        {control.label}
                      </label>
                      <span className="text-purple-600 font-bold text-sm">
                        {Math.round(filterState.filters[control.name])}
                        {control.unit}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        value={filterState.filters[control.name]}
                        onChange={(e) =>
                          handleFilterChange(control.name, e.target.value)
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((filterState.filters[control.name] - control.min) /
                              (control.max - control.min)) *
                            100
                            }%, #d1d5db ${((filterState.filters[control.name] - control.min) /
                              (control.max - control.min)) *
                            100
                            }%, #d1d5db 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {control.min}
                          {control.unit}
                        </span>
                        <span>
                          {control.max}
                          {control.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={autoAdjust}
                  disabled={isAutoAdjusting}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 mt-6 group disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="inline-flex items-center">
                    {isAutoAdjusting ? (
                      <>
                        <span className="mr-2 text-xl animate-spin">⚙️</span>
                        Auto Adjusting...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-xl group-hover:rotate-12 transition-transform duration-300">
                          🪄
                        </span>
                        Auto Enhance
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between flex-col">
            <button
              onClick={resetFilters}
              className="w-full py-4 mb-6 group bg-black text-white py-3 rounded-xl transition-all duration-300 font-medium"
            >
              🔄 Reset All
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #a855f7, #ec4899);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
            transition: all 0.3s ease;
          }

          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
          }

          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #a855f7, #ec4899);
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.75rem;
            overflow-y: auto;
            padding: 0.5rem;
          }
        `}
      </style>
    </div>
  );
});

FiltersTool.displayName = "FiltersTool";

export default FiltersTool;
