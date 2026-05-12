import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { documentService } from '../services/documentService';
import DocumentAiSidebar from '../components/DocumentAiSidebar';
import PsychologyIcon from '@mui/icons-material/Psychology';

// УДАЛИТЕ эти строки - URL будет приходить из бэкенда
// const ONLYOFFICE_BASE_URL = (import.meta as any).env?.VITE_ONLYOFFICE_URL || 'http://localhost:8081';
// const ONLYOFFICE_SCRIPT = `${ONLYOFFICE_BASE_URL}/web-apps/apps/api/documents/api.js`;

// НОВАЯ функция - принимает URL из конфига
function loadOnlyOfficeScript(documentServerUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).DocsAPI) {
      resolve();
      return;
    }

    const scriptUrl = `${documentServerUrl}/web-apps/apps/api/documents/api.js`;
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load OnlyOffice script')));
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OnlyOffice script'));
    document.body.appendChild(script);
  });
}


const DocumentEditPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const documentId = useMemo(() => Number(id), [id]);
  const version = useMemo(() => {
    const v = searchParams.get('version');
    return v ? Number(v) : undefined;
  }, [searchParams]);

  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!documentId || Number.isNaN(documentId)) {
          throw new Error('Invalid document id');
        }

        const session = await documentService.startEditSession(documentId, version);
        setSessionKey(session.sessionKey);

        const editorConfigResp = await documentService.getEditorConfig(session.sessionKey);
        setConfig(editorConfigResp.config);

        // Fetch version ID for AI context in background - don't block the editor
        documentService.getDocumentVersions(documentId).then(versions => {
          const activeVer = version 
            ? versions.find(v => v.versionNumber === version) 
            : versions.find(v => v.isCurrent);
          
          if (activeVer) {
            setActiveVersionId(activeVer.id);
          }
        }).catch(err => {
          console.error('Failed to fetch versions for AI context:', err);
        });

        if (editorConfigResp.config.editorType === 'COLLABORA') {
          // No script loading needed for Collabora (iframe based)
          setIsLoading(false);
          return;
        }

        // OnlyOffice Flow
        const documentServerUrl = editorConfigResp.config.documentServerUrl;
        if (!documentServerUrl) {
          throw new Error('documentServerUrl not found in config');
        }

        await loadOnlyOfficeScript(documentServerUrl);
      } catch (e) {
        console.error('Failed to initialize editor:', e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [documentId, version]);

  useEffect(() => {
    if (!config || config.editorType === 'COLLABORA' || !(window as any).DocsAPI) return;

    const containerId = 'onlyoffice-editor';
    
    // Brief timeout to ensure DOM is ready and prevent potential race conditions
    const timer = setTimeout(() => {
      const el = document.getElementById(containerId);
      if (!el) return;

      el.innerHTML = '';

      try {
        const DocEditor = (window as any).DocsAPI.DocEditor;
        const editor = new DocEditor(containerId, {
          ...config,
          width: '100%',
          height: '100%',
        });

        // Store editor instance to destroy it later if possible
        (window as any).currentEditor = editor;
      } catch (e) {
        console.error('Failed to create editor:', e);
        setError(e instanceof Error ? e.message : String(e));
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        const editor = (window as any).currentEditor;
        if (editor?.destroyEditor) editor.destroyEditor();
        delete (window as any).currentEditor;
      } catch {
        // ignore
      }
    };
  }, [config]);

  const handleCommit = async () => {
    if (!sessionKey) return;
    try {
      await documentService.commitEditSession(sessionKey, 'Edited in editor');
      navigate('/documents');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <DashboardLayout title={t('documents.edit')}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Editor</h1>
            <p className="text-sm text-gray-600">Edit DOCX and save as a new version</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)} 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isAiSidebarOpen 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PsychologyIcon />
              <span>AI Assistant</span>
            </button>
            <button onClick={() => navigate('/documents')} className="btn-secondary">
              Back
            </button>
            <button onClick={handleCommit} className="btn-primary" disabled={!sessionKey}>
              Save Version
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="card">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="card">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: '78vh' }}>
            <div className="flex-1 relative h-full">
              {config?.editorType === 'COLLABORA' ? (
                <iframe
                  src={`${config.url}&access_token=${config.token}&access_token_ttl=${config.access_token_ttl || 0}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Collabora Online Editor"
                  allow="autoplay; camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
                />
              ) : (
                <div id="onlyoffice-editor" style={{ height: '100%' }} />
              )}
            </div>
            
            {activeVersionId && (
              <DocumentAiSidebar 
                documentId={documentId}
                versionId={activeVersionId}
                isOpen={isAiSidebarOpen}
                onClose={() => setIsAiSidebarOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentEditPage;