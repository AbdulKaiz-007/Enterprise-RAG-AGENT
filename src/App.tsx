import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { ChatTab } from './components/ChatTab.js';
import { DocumentsTab } from './components/DocumentsTab.js';
import { CitationsTab } from './components/CitationsTab.js';
import { EvaluationTab } from './components/EvaluationTab.js';
import { SettingsModal } from './components/SettingsModal.js';
import { DocumentModal } from './components/DocumentModal.js';
import { DocumentRecord, EngineConfig } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'citations' | 'evaluation'>('chat');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [config, setConfig] = useState<EngineConfig>({
    threshold: 0.40,
    synthesisEngine: 'auto',
    hasGeminiKey: false,
    hasTinyfishKey: false,
    jobDomainFilterEnabled: false
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDocForModal, setSelectedDocForModal] = useState<DocumentRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDocuments = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        const docs: DocumentRecord[] = data.documents || [];
        setDocuments(docs);
        const chunkSum = docs.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
        setTotalChunks(chunkSum);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      console.error('Failed to load config', err);
    }
  };

  const handleSaveConfig = async (updates: Partial<EngineConfig> & { customTinyfishKey?: string }) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      console.error('Failed to update config', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        docCount={documents.length}
        chunkCount={totalChunks}
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={fetchDocuments}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatTab config={config} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            config={config}
            onRefresh={fetchDocuments}
            onViewDocChunks={setSelectedDocForModal}
          />
        )}

        {activeTab === 'citations' && (
          <CitationsTab
            documents={documents}
            config={config}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationTab config={config} />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <DocumentModal
        document={selectedDocForModal}
        onClose={() => setSelectedDocForModal(null)}
      />
    </div>
  );
}
