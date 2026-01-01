import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Person as PersonIcon,
    Security as RoleIcon,
    TouchApp as ActionIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

export interface StepNodeData {
    id: string;
    stepOrder: number;
    roleName: string;
    roleLevel: number;
    action: string;
    onDelete?: (id: string) => void;
}

const CustomStepNode = ({ data, selected }: { data: StepNodeData, selected?: boolean }) => {
    return (
        <Box
            sx={{
                minWidth: 260,
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.8)', // Slate 800 with transparency
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: selected
                    ? '0 0 20px rgba(59, 130, 246, 0.3)'
                    : '0 4px 15px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                }
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: '#3b82f6',
                    width: 10,
                    height: 10,
                    border: '2px solid #0f172a',
                    top: -5
                }}
            />

            {/* Header */}
            <Box sx={{
                px: 2,
                py: 1.5,
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '6px',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                    }}>
                        {data.stepOrder}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, letterSpacing: '0.02em' }}>
                        WORKFLOW STEP
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {data.onDelete && (
                        <Tooltip title="Remove">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    data.onDelete?.(data.id);
                                }}
                                sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' } }}
                            >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <PersonIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mb: -0.5 }}>
                            Assignee Role
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                            {data.roleName}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <RoleIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mb: -0.5 }}>
                            Security Level
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                            Level {data.roleLevel}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ActionIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>
                            {data.action.toUpperCase()}
                        </Typography>
                    </Box>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                </Box>
            </Box>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#3b82f6',
                    width: 10,
                    height: 10,
                    border: '2px solid #0f172a',
                    bottom: -5
                }}
            />
        </Box>
    );
};

export default memo(CustomStepNode);
