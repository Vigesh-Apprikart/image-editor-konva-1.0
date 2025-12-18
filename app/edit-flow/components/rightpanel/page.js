"use client";

import React, { useState } from "react";
import { Layers, Settings } from "lucide-react";
import LayersPanel from "../layers/page";
import PropertiesPanel from "../properties/page";

const RightPanel = () => {
  const [activeTab, setActiveTab] = useState("properties");

  return (
    <div className=" flex flex-col bg-white border-l border-slate-200 shadow-xl">
      <div className="flex bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200/70">
        <button
          onClick={() => setActiveTab("layers")}
          className={`flex-1 p-4 text-center text-sm font-medium transition-all duration-300 ease-out relative group ${
            activeTab === "layers"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-b-3 border-purple-500 shadow-sm"
              : "text-slate-600 hover:bg-gradient-to-b hover:from-white hover:to-slate-50 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Layers
              className={`w-4 h-4 transition-transform duration-200 ${
                activeTab === "layers" ? "scale-110" : "group-hover:scale-105"
              }`}
            />
            <span className="tracking-wide">Layers</span>
          </div>
          {activeTab === "layers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 p-4 text-center text-sm font-medium transition-all duration-300 ease-out relative group ${
            activeTab === "properties"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-b-3 border-purple-500 shadow-sm"
              : "text-slate-600 hover:bg-gradient-to-b hover:from-white hover:to-slate-50 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Settings
              className={`w-4 h-4 transition-transform duration-200 ${
                activeTab === "properties"
                  ? "scale-110"
                  : "group-hover:scale-105"
              }`}
            />
            <span className="tracking-wide">Properties</span>
          </div>
          {activeTab === "properties" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md"></div>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/30 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        <div className="min-h-full">
          {activeTab === "layers" && <LayersPanel />}
          {activeTab === "properties" && <PropertiesPanel />}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
