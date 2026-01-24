import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { documentService } from '../services/documentService';

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

import { useSearchParams } from 'react-router-dom';

const DocumentEditPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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

        // ИСПРАВЛЕНО: используем documentServerUrl из конфига
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
    if (!config || !(window as any).DocsAPI) return;

    const containerId = 'onlyoffice-editor';
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = '';

    try {
      const DocEditor = (window as any).DocsAPI.DocEditor;
      const editor = new DocEditor(containerId, config);

      return () => {
        try {
          if (editor?.destroyEditor) editor.destroyEditor();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.error('Failed to create editor:', e);
      setError(e instanceof Error ? e.message : String(e));
    }
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
    <Navigation>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Editor</h1>
            <p className="text-sm text-gray-600">Edit DOCX and save as a new version</p>
          </div>
          <div className="flex space-x-2">
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
          <div className="card" style={{ height: '75vh' }}>
            <div id="onlyoffice-editor" style={{ height: '100%' }} />
          </div>
        )}
      </div>
    </Navigation>
  );
};

export default DocumentEditPage;