import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Typography,
    Box,
    Tooltip,
} from '@mui/material';
import {
    PlayArrow as StartIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import type { WorkflowTemplate } from '../../types/workflow';

interface TemplateTableProps {
    templates: WorkflowTemplate[];
    onStartWorkflow: (template: WorkflowTemplate) => void;
    onViewXml: (template: WorkflowTemplate) => void;
    onEdit: (template: WorkflowTemplate) => void;
    onDelete: (template: WorkflowTemplate) => void;
    onManageAccess?: (template: WorkflowTemplate) => void;
    canManage: boolean;
}

const TemplateTable: React.FC<TemplateTableProps> = ({
    templates,
    onStartWorkflow,
    onViewXml,
    onEdit,
    onDelete,
    onManageAccess,
    canManage,
}) => {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                        <TableCell>Template Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {templates.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                <Typography color="textSecondary">No workflow templates available</Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        templates.map((template) => (
                            <TableRow key={template.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{template.name}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                                        {template.description || 'No description'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption">
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<StartIcon />}
                                            variant="outlined"
                                            onClick={() => onStartWorkflow(template)}
                                        >
                                            Start
                                        </Button>
                                        {canManage && onManageAccess && (
                                            <Tooltip title="Manage Access">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => onManageAccess(template)}
                                                >
                                                    <SecurityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="View XML">
                                            <IconButton size="small" onClick={() => onViewXml(template)}>
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {canManage && (
                                            <>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" color="primary" onClick={() => onEdit(template)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
                                                            onDelete(template);
                                                        }
                                                    }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TemplateTable;
