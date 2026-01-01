import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Divider,
    Paper,
    Box,
    CircularProgress,
} from '@mui/material';
import {
    History as HistoryIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import type { WorkflowAuditLog } from '../../types/workflow';

interface WorkflowDetailsProps {
    auditLogs: WorkflowAuditLog[];
    isLoading?: boolean;
}

const WorkflowDetails: React.FC<WorkflowDetailsProps> = ({ auditLogs, isLoading }) => {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const getActionIcon = (action: string) => {
        if (action.toLowerCase().includes('approve')) return <CheckIcon sx={{ color: 'success.main' }} />;
        if (action.toLowerCase().includes('reject')) return <CloseIcon sx={{ color: 'error.main' }} />;
        return <HistoryIcon sx={{ color: 'info.main' }} />;
    };

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                Audit Trail & History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {auditLogs.length === 0 ? (
                    <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        No audit records found for this instance.
                    </Typography>
                ) : (
                    auditLogs.map((log, index) => (
                        <React.Fragment key={log.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'grey.100' }}>
                                        {getActionIcon(log.actionType)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="subtitle2" component="span">
                                                {log.actionType}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                color="textPrimary"
                                                sx={{ display: 'inline', mr: 1 }}
                                            >
                                                {log.description}
                                            </Typography>
                                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                                <PersonIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                                <Typography variant="caption">
                                                    {log.performedBy} {log.ipAddress ? `(${log.ipAddress})` : ''}
                                                </Typography>
                                            </Box>
                                            {log.metadata && (
                                                <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                    Metadata: {log.metadata}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                            {index < auditLogs.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    ))
                )}
            </List>
        </Paper>
    );
};

export default WorkflowDetails;
