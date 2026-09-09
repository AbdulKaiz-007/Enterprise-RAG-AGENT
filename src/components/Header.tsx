import React from 'react';
import { ShieldCheck, Database, Cpu, Sliders, RefreshCw, FileText, Sparkles, Key } from 'lucide-react';
import { EngineConfig } from '../types.js';

interface HeaderProps {
  activeTab: 'chat' | 'documents' | 'citations' | 'evaluation';
  setActiveTab: (tab: 'chat' | 'documents' | 'citations' | 'evaluation') => void;
  docCount: number;
  chunkCount: number;
  config: EngineConfig;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  docCount,
  chunkCount,
  config,
  onOpenSettings,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">Enterprise RAG Assistant</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  JP-020
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Zero-Hallucination Guarded
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Retrieval-Augmented Enterprise Intelligence & Compliance Verification
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-600 font-medium">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>{docCount} Docs</span>
              <span className="text-slate-300">|</span>
              <span>{chunkCount} Chunks</span>
            </div>

            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Threshold: <strong className="text-slate-800">{(config.threshold).toFixed(2)}</strong></span>
            </div>

            <button
              id="refresh-data-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh status & data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              id="settings-btn"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-100 -mb-px overflow-x-auto scrollbar-none py-1">
          <button
            id="tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Assistant Q&A</span>
          </button>

          <button
            id="tab-documents"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Ingestion & Management</span>
            <span className={`px-1.5 py-0.2 text-xs rounded-full ${activeTab === 'documents' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {docCount}
            </span>
          </button>

          <button
            id="tab-citations"
            onClick={() => setActiveTab('citations')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'citations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Chunk & Citation Explorer</span>
          </button>

          <button
            id="tab-evaluation"
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'evaluation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Evaluation & Audit Dashboard</span>
          </button>
        </div>
      </div>
    </header>
  );
};
