export interface Document {
  id: number;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
  company: string;
  signed: boolean;
  amount?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  documentType?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  currentVersion: number;
  versionCount: number;
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  originalFilename: string;
  fileSize: number;
  changeDescription?: string;
  changeType: 'UPLOAD' | 'WATERMARK' | 'SIGNATURE' | 'VERSION';
  createdBy: string;
  createdAt: string;
  isSigned: boolean;
  hasWatermark: boolean;
  isCurrent: boolean;
}

export interface UploadDocumentRequest {
  file: File;
  metadata?: {
    amount?: number;
    priority?: string;
    documentType?: string;
  };
}
