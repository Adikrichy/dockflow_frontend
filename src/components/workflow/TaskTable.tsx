import React from 'react';
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
    Visibility as ViewIcon,
    PersonAdd as DelegateIcon,
    RateReview as RequestChangesIcon,
    PauseCircle as HoldIcon
} from '@mui/icons-material';
import { useWorkflowStore } from '../../store/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { useAuth } from '../../hooks/useAuth';
import type { TaskResponse, TaskActionRequest } from '../../types/workflow';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { useState } from 'react';

interface TaskTableProps {
    tasks: TaskResponse[];
    onApprove: (task: TaskResponse) => void;
    onReject: (task: TaskResponse) => void;
    onViewDocument: (documentId: number) => void;
    onClaim?: (taskId: number) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, onApprove, onReject, onViewDocument, onClaim }) => {
    const { selectedTaskIds, setSelectedTaskIds, toggleTaskSelection } = useWorkflowStore();
    const { executeTaskActionMutation, useCompanyMembers } = useWorkflow();
    const { currentCompany } = useAuth();

    // Dialog State
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'DELEGATE' | 'REQUEST_CHANGES' | 'HOLD' | null>(null);
    const [actionTask, setActionTask] = useState<TaskResponse | null>(null);
    const [comment, setComment] = useState('');
    const [targetUserId, setTargetUserId] = useState<number | ''>('');

    // Fetch members for delegation
    const { data: members } = useCompanyMembers(currentCompany?.companyId || null);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedTaskIds(tasks.map((task) => task.id));
        } else {
            setSelectedTaskIds([]);
        }
    };

    const handleActionClick = (task: TaskResponse, action: 'DELEGATE' | 'REQUEST_CHANGES' | 'HOLD') => {
        setActionTask(task);
        setSelectedAction(action);
        setComment('');
        setTargetUserId('');
        setActionDialogOpen(true);
    };

    const handleSubmitAction = () => {
        if (!actionTask || !selectedAction) return;

        const request: TaskActionRequest = {
            actionType: selectedAction,
            comment: comment,
            targetUserId: selectedAction === 'DELEGATE' && targetUserId ? Number(targetUserId) : undefined
        };

        executeTaskActionMutation.mutate({ taskId: actionTask.id, request }, {
            onSuccess: () => {
                setActionDialogOpen(false);
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'info';
            case 'IN_PROGRESS': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'DELEGATED': return 'info';
            case 'CHANGES_REQUESTED': return 'warning';
            case 'ON_HOLD': return 'default';
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
                                        {task.status === 'PENDING' && onClaim && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => onClaim(task.id)}
                                                sx={{ borderRadius: '8px', textTransform: 'none' }}
                                            >
                                                Claim
                                            </Button>
                                        )}

                                        {/* Dynamic Actions */}
                                        {task.status === 'IN_PROGRESS' && task.availableActions && task.availableActions.length > 0 ? (
                                            task.availableActions.map((action) => {
                                                let color: 'success' | 'error' | 'primary' | 'warning' | 'info' | 'secondary' = 'primary';
                                                let icon = undefined;
                                                let onClick = () => { };

                                                switch (action) {
                                                    case 'APPROVE':
                                                        color = 'success';
                                                        icon = <ApproveIcon />;
                                                        onClick = () => onApprove(task);
                                                        break;
                                                    case 'REJECT':
                                                        color = 'error';
                                                        icon = <RejectIcon />;
                                                        onClick = () => onReject(task);
                                                        break;
                                                    case 'DELEGATE':
                                                        color = 'info';
                                                        icon = <DelegateIcon />;
                                                        onClick = () => handleActionClick(task, 'DELEGATE');
                                                        break;
                                                    case 'REQUEST_CHANGES':
                                                        color = 'warning';
                                                        icon = <RequestChangesIcon />;
                                                        onClick = () => handleActionClick(task, 'REQUEST_CHANGES');
                                                        break;
                                                    case 'HOLD':
                                                        color = 'secondary';
                                                        icon = <HoldIcon />;
                                                        onClick = () => handleActionClick(task, 'HOLD');
                                                        break;
                                                    default:
                                                        break;
                                                }

                                                return (
                                                    <Button
                                                        key={action}
                                                        size="small"
                                                        startIcon={icon}
                                                        color={color}
                                                        onClick={onClick}
                                                        variant="contained"
                                                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                                                    >
                                                        {action.replace('_', ' ')}
                                                    </Button>
                                                );
                                            })
                                        ) : (
                                            /* Fallback for legacy tasks or if no actions defined */
                                            <>
                                                <Button
                                                    size="small"
                                                    startIcon={<ApproveIcon />}
                                                    color="success"
                                                    onClick={() => onApprove(task)}
                                                    disabled={task.status !== 'IN_PROGRESS'}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<RejectIcon />}
                                                    color="error"
                                                    onClick={() => onReject(task)}
                                                    disabled={task.status !== 'IN_PROGRESS'}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}

                                        {/* CHANGES REQUESTED Action */}
                                        {task.status === 'CHANGES_REQUESTED' && (
                                            <>
                                                {task.templateId && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => window.open(`/workflow/template/${task.templateId}/edit`, '_blank')}
                                                        sx={{ mr: 1, textTransform: 'none' }}
                                                    >
                                                        Edit Template
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => {
                                                        executeTaskActionMutation.mutate({
                                                            taskId: task.id,
                                                            request: { actionType: 'RESUBMIT' as any, comment: 'Changes made, resubmitting.' }
                                                        });
                                                    }}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Resubmit
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Action Dialog */}
            <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedAction === 'DELEGATE' ? 'Delegate Task' :
                        selectedAction === 'REQUEST_CHANGES' ? 'Request Changes' :
                            selectedAction === 'HOLD' ? 'Hold Task' : 'Task Action'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedAction === 'DELEGATE' && (
                            <FormControl fullWidth>
                                <InputLabel>Assign To</InputLabel>
                                <Select
                                    value={targetUserId}
                                    onChange={(e) => setTargetUserId(e.target.value as number)}
                                    label="Assign To"
                                >
                                    {members?.map((member: any) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.firstName ? `${member.firstName} ${member.lastName}` : member.email} ({member.companyRole})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            label="Comment"
                            multiline
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            fullWidth
                            placeholder={selectedAction === 'REQUEST_CHANGES' ? "Describe what needs to be changed..." : "Add a comment..."}
                            required={selectedAction === 'REQUEST_CHANGES'}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmitAction}
                        variant="contained"
                        color="primary"
                        disabled={selectedAction === 'DELEGATE' && !targetUserId}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </TableContainer>
    );
};

export default TaskTable;
