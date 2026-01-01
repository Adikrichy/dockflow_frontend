import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Button,
    IconButton,
    Chip,
    Typography,
    Box,
    Tooltip,
} from '@mui/material';
import {
    CheckCircleOutline as ApproveIcon,
    HighlightOff as RejectIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { useWorkflowStore } from '../../store/workflowStore';
import type { TaskResponse } from '../../types/workflow';

interface TaskTableProps {
    tasks: TaskResponse[];
    onApprove: (task: TaskResponse) => void;
    onReject: (task: TaskResponse) => void;
    onViewDocument: (documentId: number) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onApprove, onReject, onViewDocument }) => {
    const { selectedTaskIds, setSelectedTaskIds, toggleTaskSelection } = useWorkflowStore();

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedTaskIds(tasks.map((task) => task.id));
        } else {
            setSelectedTaskIds([]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            default: return 'default';
        }
    };

    return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={selectedTaskIds.length > 0 && selectedTaskIds.length < tasks.length}
                                checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                                onChange={handleSelectAll}
                            />
                        </TableCell>
                        <TableCell>Document Name</TableCell>
                        <TableCell>Required Role</TableCell>
                        <TableCell>Step</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                <Typography color="textSecondary">No pending tasks found</Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        tasks.map((task) => (
                            <TableRow
                                key={task.id}
                                hover
                                selected={selectedTaskIds.includes(task.id)}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedTaskIds.includes(task.id)}
                                        onChange={() => toggleTaskSelection(task.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {task.document?.filename || 'Unknown Document'}
                                        </Typography>
                                        <Tooltip title="View Document">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => task.document && onViewDocument(task.document.id)}
                                                    sx={{ ml: 1 }}
                                                    disabled={!task.document}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {task.requiredRoleName} (Lvl {task.requiredRoleLevel})
                                    </Typography>
                                </TableCell>
                                <TableCell>{task.stepOrder}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={task.status}
                                        size="small"
                                        color={getStatusColor(task.status) as any}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="textSecondary">
                                        {new Date(task.createdAt).toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<ApproveIcon />}
                                            color="success"
                                            onClick={() => onApprove(task)}
                                            disabled={task.status !== 'PENDING'}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<RejectIcon />}
                                            color="error"
                                            onClick={() => onReject(task)}
                                            disabled={task.status !== 'PENDING'}
                                        >
                                            Reject
                                        </Button>
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

export default TaskTable;
