import { api } from './api';
import type { Document, DocumentVersion, UploadDocumentRequest } from '../types/document';

export const documentService = {
  async getUserDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/user');
    return response.data;
  },

  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);

      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });
      }

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to upload document';
      throw new Error(message);
    }
  },

  async getDocument(id: number): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async getDocumentFile(id: number): Promise<Blob> {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getDocumentVersionFile(documentId: number, versionNumber: number): Promise<Blob> {
    const response = await api.get(`/documents/${documentId}/versions/${versionNumber}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getDocumentVersions(id: number): Promise<DocumentVersion[]> {
    const response = await api.get(`/documents/${id}/versions`);
    return response.data;
  },

  async restoreVersion(documentId: number, versionId: number): Promise<DocumentVersion> {
    const response = await api.post(`/documents/${documentId}/versions/${versionId}/restore`);
    return response.data;
  },

  async addWatermark(documentId: number, watermarkText: string): Promise<DocumentVersion> {
    const response = await api.post(`/documents/${documentId}/watermark`, {
      watermarkText,
    });
    return response.data;
  },

  async signDocument(documentId: number, signature: string): Promise<DocumentVersion> {
    const response = await api.post(`/documents/${documentId}/sign`, {
      signature,
    });
    return response.data;
  },

  async startEditSession(documentId: number): Promise<{ sessionKey: string }> {
    const response = await api.post('/document-edit/session/start', { documentId });
    return response.data;
  },

  async getEditorConfig(sessionKey: string): Promise<{ config: any }> {
    const response = await api.get(`/document-edit/session/${sessionKey}/config`);
    return response.data;
  },

  async commitEditSession(sessionKey: string, changeDescription?: string): Promise<{ docxVersionId: number; pdfVersionId: number }> {
    const response = await api.post(`/document-edit/session/${sessionKey}/commit`, changeDescription ? { changeDescription } : undefined);
    return response.data;
  },
};
