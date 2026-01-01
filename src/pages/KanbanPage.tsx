import React from 'react';
import {
    Container,
    Typography,
    Box,
    Breadcrumbs,
    Link,
    Button,
    Paper,
    InputBase,
    // Grid и Alpha удалены
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useWorkflow } from '../hooks/useWorkflow';
import KanbanBoard from '../components/workflow/KanbanBoard';
import LoadingSpinner from '../components/LoadingSpinner';

const KanbanPage: React.FC = () => {
    const { user } = useAuth();
    const { useCompanyTasks, updateTaskStatusMutation } = useWorkflow();

    // In real app, we get companyId from user context
    const companyId = (user as any)?.memberships?.[0]?.companyId || 1;

    const { data: tasks, isLoading, refetch } = useCompanyTasks(companyId);

    const handleStatusChange = (taskId: number, newStatus: string) => {
        updateTaskStatusMutation.mutate({ taskId, status: newStatus });
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, lg: 4 } }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
                        <DashboardIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                        Dashboard
                    </Link>
                    <Typography color="text.primary">Kanban Board</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>
                            Workflow Pipeline
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6b7280' }}>
                            Manage and track all document approval tasks across the company.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => refetch()}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                        >
                            Sync
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Filters Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 4,
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    bgcolor: '#f3f4f6',
                    px: 2,
                    py: 1,
                    borderRadius: '10px'
                }}>
                    <SearchIcon sx={{ color: '#9ca3af', mr: 1 }} />
                    <InputBase
                        placeholder="Search tasks, documents or users..."
                        sx={{ flexGrow: 1, fontSize: '0.9rem' }}
                    />
                </Box>
                <Button
                    startIcon={<FilterIcon />}
                    sx={{ color: '#4b5563', textTransform: 'none', fontWeight: 600 }}
                >
                    Filters
                </Button>
            </Paper>

            {/* Kanban Board Container */}
            <KanbanBoard
                tasks={tasks || []}
                onStatusChange={handleStatusChange}
            />
        </Container>
    );
};

export default KanbanPage;
