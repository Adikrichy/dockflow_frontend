import { api } from './api';
import type { Document, DocumentVersion, UploadDocumentRequest } from '../types/document';

export const documentService = {
  async getUserDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/user');
    return response.data;
  },

  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
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
};
