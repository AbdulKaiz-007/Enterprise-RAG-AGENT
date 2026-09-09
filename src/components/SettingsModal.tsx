import React, { useState } from 'react';
import { X, Sliders, Key, ShieldCheck, Cpu, Info, Check } from 'lucide-react';
import { EngineConfig } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EngineConfig;
  onSaveConfig: (updates: Partial<EngineConfig> & { customTinyfishKey?: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [threshold, setThreshold] = useState(config.threshold);
  const [synthesisEngine, setSynthesisEngine] = useState(config.synthesisEngine);
  const [customKey, setCustomKey] = useState('');
  const [domainFilter, setDomainFilter] = useState(config.jobDomainFilterEnabled);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      threshold,
      synthesisEngine,
      jobDomainFilterEnabled: domainFilter,
      ...(customKey ? { customTinyfishKey: customKey } : {})
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">RAG Engine & Guardrail Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5 text-xs sm:text-sm">
          {/* Calibrated Threshold Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Calibrated Relevance Threshold</span>
              </label>
              <span className="font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.85"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0.10 (Permissive)</span>
              <span className="font-semibold text-slate-600">0.40 - 0.55 (Calibrated V3 Optimum)</span>
              <span>0.85 (Strict)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Queries with maximum similarity below this threshold trigger the safe refusal guardrail to prevent hallucinations.
            </p>
          </div>

          {/* Synthesis Engine Preference */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Synthesis & Answer Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'auto', label: 'Auto (Best Available)', desc: 'Gemini → TinyFish → Extractive' },
                { id: 'gemini', label: 'Gemini AI (Flash)', desc: 'Native server-side Google GenAI' },
                { id: 'tinyfish', label: 'TinyFish Agent', desc: 'Autonomous reasoning sandbox' },
                { id: 'extractive', label: 'Strict Extractive', desc: '100% deterministic local quotes' }
              ].map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setSynthesisEngine(engine.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    synthesisEngine === engine.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">{engine.label}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{engine.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TinyFish API Integration Status */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-slate-500" />
                <span>TinyFish Universal Agent</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                config.hasTinyfishKey
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {config.hasTinyfishKey ? 'Key Connected' : 'Optional Key'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              If you have a TinyFish API key, you can enter it below to execute live URL crawling and autonomous agent reasoning. If empty, the system automatically uses smart direct web extraction.
            </p>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Enter TinyFish API Key (optional)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
