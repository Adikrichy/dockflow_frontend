import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Chip,
    Avatar,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    Schedule as TimeIcon
} from '@mui/icons-material';
import type { TaskResponse } from '../../types/workflow';

interface KanbanBoardProps {
    tasks: TaskResponse[];
    onStatusChange: (taskId: number, newStatus: string) => void;
    onClaimTask?: (taskId: number) => void;
    currentUserLevel?: number;
    currentUserId?: number;
}

const COLUMNS = [
    { id: 'PENDING', title: 'To Do', color: '#6366f1' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
    { id: 'APPROVED', title: 'Completed', color: '#10b981' },
    { id: 'REJECTED', title: 'Rejected', color: '#ef4444' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    tasks,
    onStatusChange,
    onClaimTask,
    currentUserLevel,
    currentUserId
}) => {
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        // If moving from PENDING to IN_PROGRESS, treat as claiming
        if (source.droppableId === 'PENDING' && destination.droppableId === 'IN_PROGRESS') {
            if (onClaimTask) {
                onClaimTask(parseInt(draggableId));
            } else {
                onStatusChange(parseInt(draggableId), destination.droppableId);
            }
        } else {
            onStatusChange(parseInt(draggableId), destination.droppableId);
        }
    };

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => {
            // Filter by status first
            if (t.status !== status) return false;

            // Strict filtering for "To Do" (Pool)
            if (status === 'PENDING') {
                // Show task if it matches role level (if user level is known)
                if (currentUserLevel !== undefined) {
                    return t.requiredRoleLevel === currentUserLevel && !t.assignedTo;
                }
                return !t.assignedTo;
            }

            // Strict filtering for "In Progress" (My Work)
            if (status === 'IN_PROGRESS') {
                if (currentUserId !== undefined) {
                    return t.assignedTo?.id === currentUserId;
                }
                return true;
            }

            // For Completed/Rejected, show all tasks that match user's role level by default
            // to keep the board clean for that specific role.
            if (currentUserLevel !== undefined) {
                return t.requiredRoleLevel === currentUserLevel;
            }

            return true;
        });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, height: 'calc(100vh - 250px)' }}>
                {COLUMNS.map((column) => (
                    <Box key={column.id} sx={{ minWidth: 320, maxWidth: 320, display: 'flex', flexDirection: 'column' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mb: 2,
                                bgcolor: 'transparent',
                                borderBottom: `3px solid ${column.color}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#374151' }}>
                                {column.title}
                            </Typography>
                            <Chip
                                label={getTasksByStatus(column.id).length}
                                size="small"
                                sx={{ bgcolor: '#e5e7eb', fontWeight: 600, color: '#4b5563' }}
                            />
                        </Paper>

                        <Droppable droppableId={column.id}>
                            {(provided: any, snapshot: any) => (
                                <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{
                                        flexGrow: 1,
                                        bgcolor: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.05)' : '#f9fafb',
                                        borderRadius: '12px',
                                        p: 1.5,
                                        minHeight: 150,
                                        transition: 'background-color 0.2s ease',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {getTasksByStatus(column.id).map((task, index) => (
                                        <Draggable
                                            key={task.id.toString()}
                                            draggableId={task.id.toString()}
                                            index={index}
                                            isDragDisabled={
                                                (task.status === 'PENDING' && currentUserLevel !== undefined && task.requiredRoleLevel !== currentUserLevel) ||
                                                (task.status === 'IN_PROGRESS' && currentUserId !== undefined && task.assignedTo?.id !== currentUserId)
                                            }
                                        >
                                            {(provided: any, snapshot: any) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    sx={{
                                                        mb: 2,
                                                        borderRadius: '12px',
                                                        boxShadow: snapshot.isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                                        border: '1px solid #e5e7eb',
                                                        opacity: (snapshot.isDragging || (task.status === 'PENDING' && currentUserLevel !== undefined && task.requiredRoleLevel !== currentUserLevel)) ? 0.8 : 1,
                                                        bgcolor: (task.status === 'PENDING' && currentUserLevel !== undefined && task.requiredRoleLevel !== currentUserLevel) ? '#f9fafb' : '#fff',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: column.color,
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                            <Chip
                                                                label={task.requiredRoleName}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 700,
                                                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                                    color: '#4f46e5'
                                                                }}
                                                            />
                                                            <IconButton size="small">
                                                                <MoreIcon sx={{ fontSize: '1.2rem', color: '#9ca3af' }} />
                                                            </IconButton>
                                                        </Box>

                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                mb: 1,
                                                                color: '#1f2937',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            Approving {task.document.filename}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                            <TimeIcon sx={{ fontSize: '0.9rem', color: '#6b7280' }} />
                                                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                                {new Date(task.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ display: 'flex', ml: -0.5 }}>
                                                                {task.assignedTo ? (
                                                                    <Tooltip title={task.assignedTo.email}>
                                                                        <Avatar
                                                                            sx={{
                                                                                width: 28,
                                                                                height: 28,
                                                                                fontSize: '0.75rem',
                                                                                bgcolor: '#3b82f6',
                                                                                border: '2px solid #fff'
                                                                            }}
                                                                        >
                                                                            {task.assignedTo.email[0].toUpperCase()}
                                                                        </Avatar>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip title="Unassigned">
                                                                        <Avatar
                                                                            sx={{
                                                                                width: 28,
                                                                                height: 28,
                                                                                bgcolor: '#f3f4f6',
                                                                                color: '#9ca3af',
                                                                                border: '2px solid #fff'
                                                                            }}
                                                                        >
                                                                            ?
                                                                        </Avatar>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500 }}>
                                                                ID: #{task.id}
                                                            </Typography>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </Box>
                ))}
            </Box>
        </DragDropContext>
    );
};

export default KanbanBoard;
