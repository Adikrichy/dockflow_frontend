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
} from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from 'react-i18next';
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
    const { user, currentCompany } = useAuth();
    const { t } = useTranslation();
    const { useCompanyTasks, updateTaskStatusMutation, claimTaskMutation } = useWorkflow();

    const companyId = currentCompany?.companyId || 1;
    const userRoleLevel = currentCompany?.roleLevel;
    const userId = user?.id;

    const { data: tasks, isLoading, refetch } = useCompanyTasks(companyId);

    const handleStatusChange = (taskId: number, newStatus: string) => {
        updateTaskStatusMutation.mutate({ taskId, status: newStatus });
    };

    const handleClaimTask = (taskId: number) => {
        claimTaskMutation.mutate(taskId);
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <DashboardLayout title={t('navigation.kanban')}>
            <Container maxWidth={false} sx={{ mt: 0, mb: 4, px: { xs: 2, lg: 4 } }}>
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
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                            Workflow Pipeline
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
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
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'background.paper'
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    bgcolor: 'action.hover',
                    px: 2,
                    py: 1,
                    borderRadius: '10px'
                }}>
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <InputBase
                        placeholder="Search tasks, documents or users..."
                        sx={{ flexGrow: 1, fontSize: '0.9rem' }}
                    />
                </Box>
                <Button
                    startIcon={<FilterIcon />}
                    sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
                >
                    Filters
                </Button>
            </Paper>

            {/* Kanban Board Container */}
            <KanbanBoard
                tasks={tasks || []}
                onStatusChange={handleStatusChange}
                onClaimTask={handleClaimTask}
                currentUserLevel={userRoleLevel}
                currentUserId={userId}
            />
            </Container>
        </DashboardLayout>
    );
};

export default KanbanPage;
