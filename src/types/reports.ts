export interface ReportData {
    totalDocuments: number;
    totalVersions: number;
    pendingDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    averageProcessingTime: number;
    totalUsers: number;
    activeUsers: number;
    weeklyData: Array<{
        day: string;
        approved: number;
        pending: number;
        rejected: number;
    }>;
    userActivity: Array<{
        userName: string;
        documentsProcessed: number;
        percentage: number;
        processingTime: string;
    }>;
    documentTypes: Array<{
        type: string;
        count: number;
        color: string;
    }>;
}

export interface ReportFilters {
    timeRange: string;
    team?: string;
    company?: string;
    tag?: string;
}
