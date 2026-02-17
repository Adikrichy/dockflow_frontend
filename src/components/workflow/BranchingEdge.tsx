import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    type Edge,
} from '@xyflow/react';
import { Box, Typography } from '@mui/material';

export type BranchingEdgeData = {
    type: 'approve' | 'reject' | 'timeout';
    condition?: string;
};

const BranchingEdge = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    data,
}: EdgeProps<Edge<BranchingEdgeData>>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isReject = data?.type === 'reject';
    const isTimeout = data?.type === 'timeout';

    // Choose color based on type
    let color = '#10b981'; // Emerald-500 (Approve)
    if (isReject) color = '#ef4444'; // Red-500 (Reject)
    if (isTimeout) color = '#f59e0b'; // Amber-500 (Timeout)

    const edgeStyle = {
        ...style,
        stroke: selected ? '#3b82f6' : color,
        strokeWidth: selected ? 3 : 2,
        transition: 'stroke 0.2s, stroke-width 0.2s',
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            <EdgeLabelRenderer>
                <Box
                    sx={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        bgcolor: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid',
                        borderColor: selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        px: 1,
                        py: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: color,
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(1.1)`,
                        }
                    }}
                    className="nodrag nopan"
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: color,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            fontSize: '0.6rem',
                            textTransform: 'uppercase'
                        }}
                    >
                        {isReject ? 'Reject' : isTimeout ? 'Timeout' : 'Approve'}
                    </Typography>
                    {data?.condition && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.55rem',
                                fontFamily: 'monospace',
                                mt: -0.5
                            }}
                        >
                            {data.condition}
                        </Typography>
                    )}
                </Box>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(BranchingEdge);
