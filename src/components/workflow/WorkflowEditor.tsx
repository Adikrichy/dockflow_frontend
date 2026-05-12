import { useState, useCallback, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
    BackgroundVariant
} from '@xyflow/react';
import type {
    Connection,
    Edge,
    Node,
    OnNodesChange,
    OnEdgesChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Editor from '@monaco-editor/react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Divider,
    Stack,
    Tabs,
    Tab,
    Drawer,
    MenuItem,
    Select,
    FormControl,
    CircularProgress,
    IconButton,
    Tooltip,
    Switch,
} from '@mui/material';
import {
    Save as SaveIcon,
    Code as CodeIcon,
    Add as AddIcon,
    AutoGraph as VisualIcon,
    Close as CloseIcon,
    Settings as SettingsIcon,
    ChevronLeft as CollapseIcon,
    AutoAwesome as AiIcon,
    SmartToy as BotIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { websocketService } from '../../services/websocketService';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CustomStepNode from './CustomStepNode';
import type { StepNodeData } from './CustomStepNode';
import BranchingEdge from './BranchingEdge';
import type { BranchingEdgeData } from './BranchingEdge';

const nodeTypes = {
    stepNode: CustomStepNode
};

const edgeTypes = {
    branchingEdge: BranchingEdge
};

interface WorkflowEditorProps {
    initialName?: string;
    initialDescription?: string;
    initialXml?: string;
    initialAllowedRoleLevels?: number[];
    onSave: (data: { name: string; description: string; stepsXml: string; allowedRoleLevels: number[] }, isAutoSave?: boolean) => void;
    isLoading?: boolean;
}

const WorkflowEditor = ({
    initialName = '',
    initialDescription = '',
    initialXml = '',
    initialAllowedRoleLevels = [100],
    onSave,
    isLoading = false,
}: WorkflowEditorProps) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [activeTab, setActiveTab] = useState(0);
    const [xml, setXml] = useState(initialXml || `<workflow>\n  <step order="1" roleName="Manager" roleLevel="60" action="approve"/>\n</workflow>`);
    const [roles, setRoles] = useState<Array<{ id: number, name: string, level: number }>>([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    // Sync external XML changes (like WebSocket updates to the template)
    useEffect(() => {
        if (initialXml && initialXml !== xml) {
            setXml(initialXml);
        }
    }, [initialXml]);

    // Ensure 100 is always there
    const [allowedStartLevels, setAllowedStartLevels] = useState<number[]>(() => {
        const initial = initialAllowedRoleLevels || [100];
        return initial.includes(100) ? initial : [...initial, 100];
    });

    // React Flow state
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

    // Sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleStartLevel = (level: number) => {
        if (level === 100) return; // CEO always allowed, cannot be toggled off
        setAllowedStartLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level].sort((a, b) => b - a) // nicely sort descending
        );
    };

    // Parsing XML to React Flow
    const parseXmlToFlow = useCallback((content: string) => {
        try {
            // Sanitize unescaped < and > inside condition="..." and description="..." attributes
            // This prevents DOMParser from silently failing when AI generates something like condition="amount < 1000"
            let safeContent = content;
            safeContent = safeContent.replace(/(condition|description)="([^"]*)"/g, (match, attrName, attrValue) => {
                const escapedValue = attrValue
                    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;') // Escape stray & first
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `${attrName}="${escapedValue}"`;
            });

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(safeContent, 'text/xml');
            const stepElements = xmlDoc.getElementsByTagName('step');
            const onApproveElements = xmlDoc.getElementsByTagName('onApprove');
            const onRejectElements = xmlDoc.getElementsByTagName('onReject');

            const onTimeoutElements = xmlDoc.getElementsByTagName('onTimeout');

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // 1. Create Nodes
            for (let i = 0; i < stepElements.length; i++) {
                const step = stepElements[i];
                const order = parseInt(step.getAttribute('order') || '1');
                const roleName = step.getAttribute('roleName') || 'Manager';
                const id = `node-${order}-${i}-${Date.now()}`;

                newNodes.push({
                    id,
                    type: 'stepNode',
                    position: { x: sidebarCollapsed ? 100 : 350, y: i * 200 + 100 },
                    data: {
                        id,
                        stepOrder: order,
                        roleName: roleName,
                        roleLevel: parseInt(step.getAttribute('roleLevel') || '60'),
                        action: step.getAttribute('action') || 'approve',
                        parallel: step.getAttribute('parallel') === 'true',
                        description: step.getAttribute('description') || '',
                        allowedActions: step.getAttribute('allowedActions') ? step.getAttribute('allowedActions')?.split(',') : [],
                        onDelete: deleteNode
                    } as any
                });
            }

            // 2. Helper to find node by order
            const findNodeByOrder = (order: number) => newNodes.find(n => (n.data as any).stepOrder === order);

            // 3. Create Edges from routing rules
            const processRules = (elements: HTMLCollectionOf<Element>, type: 'approve' | 'reject' | 'timeout') => {
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    const sourceOrder = parseInt(el.getAttribute('stepOrder') || '');
                    const targetOrder = parseInt(el.getAttribute('targetStep') || '');
                    const condition = el.getAttribute('condition') || undefined;

                    if (!isNaN(sourceOrder) && !isNaN(targetOrder)) {
                        const sourceNode = findNodeByOrder(sourceOrder);
                        const targetNode = findNodeByOrder(targetOrder);

                        if (sourceNode && targetNode) {
                            newEdges.push({
                                id: `edge-${type}-${sourceOrder}-${targetOrder}-${i}`,
                                source: sourceNode.id,
                                target: targetNode.id,
                                type: 'branchingEdge',
                                data: { type, condition },
                                animated: true,
                            });
                        }
                    }
                }
            };

            processRules(onApproveElements, 'approve');
            processRules(onRejectElements, 'reject');
            processRules(onTimeoutElements, 'timeout');

            // 4. Fallback: If no custom edges, create default sequence
            if (newEdges.length === 0) {
                for (let i = 1; i < newNodes.length; i++) {
                    newEdges.push({
                        id: `edge-auto-${i}`,
                        source: newNodes[i - 1].id,
                        target: newNodes[i].id,
                        type: 'branchingEdge',
                        data: { type: 'approve' },
                        animated: true,
                    });
                }
            }

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (e) {
            console.error('Failed to parse XML', e);
        }
    }, [sidebarCollapsed]);

    useEffect(() => {
        parseXmlToFlow(xml);
    }, []);

    const syncFlowToXml = useCallback(() => {
        const sortedNodes = [...nodes].sort((a, b) => {
            const orderA = (a.data as any).stepOrder;
            const orderB = (b.data as any).stepOrder;
            if (orderA !== orderB) return orderA - orderB;
            return a.position.y - b.position.y;
        });

        let newXml = '<workflow>\n';

        const escapeXmlAttr = (str: string) => {
            if (!str) return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        // 1. Generate steps
        sortedNodes.forEach((node) => {
            const data = node.data as any;
            const parallelStr = data.parallel ? ' parallel="true"' : '';
            const descriptionStr = data.description ? ` description="${escapeXmlAttr(data.description)}"` : '';
            const allowedActionsStr = data.allowedActions && data.allowedActions.length > 0 ? ` allowedActions="${escapeXmlAttr(data.allowedActions.join(','))}"` : '';
            newXml += `  <step order="${data.stepOrder}" roleName="${escapeXmlAttr(data.roleName)}" roleLevel="${data.roleLevel}" action="${escapeXmlAttr(data.action)}"${parallelStr}${descriptionStr}${allowedActionsStr}/>\n`;
        });

        newXml += '\n';

        // 2. Generate routing rules from edges
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
                const sourceOrder = (sourceNode.data as any).stepOrder;
                const targetOrder = (targetNode.data as any).stepOrder;
                let tagType = 'onApprove';
                const type = (edge.data as any)?.type;
                if (type === 'reject') tagType = 'onReject';
                if (type === 'timeout') tagType = 'onTimeout';

                const condition = (edge.data as any)?.condition ? ` condition="${escapeXmlAttr((edge.data as any).condition)}"` : '';

                newXml += `  <${tagType} stepOrder="${sourceOrder}" targetStep="${targetOrder}"${condition}/>\n`;
            }
        });

        newXml += '</workflow>';
        setXml(newXml);
    }, [nodes, edges]);

    // AI Assistant state
    const { currentCompany } = useAuth();
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    // WebSocket link for AI suggestions
    useEffect(() => {
        const companyId = currentCompany?.companyId;
        if (!companyId) return;

        let isMounted = true;

        const subscribe = () => {
            if (!isMounted) return;
            if (!websocketService.isConnected()) {
                console.log('[WorkflowEditor] WS not connected, retrying subscribe in 1s...');
                setTimeout(subscribe, 1000);
                return;
            }

            console.log('[WorkflowEditor] Subscribing to AI suggestions for company', companyId);
            websocketService.subscribeToWorkflowSuggestions(companyId, (data) => {
                if (!isMounted) return;
                console.log('[WorkflowEditor] RECEIVED AI RESPONSE:', data);

                // Immediately reset generating state to stop spinner
                setIsAiGenerating(false);

                if (data.xml) {
                    try {
                        console.log('[WorkflowEditor] Applying new XML update...');
                        setXml(data.xml);
                        parseXmlToFlow(data.xml);
                        setIsAiDialogOpen(false);
                        setAiPrompt('');
                        // Auto-save so the database is updated and next Edit open shows correct XML
                        onSave({
                            name,
                            description,
                            stepsXml: data.xml,
                            allowedRoleLevels: allowedStartLevels,
                        }, true);
                    } catch (err) {
                        console.error('[WorkflowEditor] Error applying AI XML:', err);
                        alert('Error applying AI suggestion: ' + (err instanceof Error ? err.message : String(err)));
                    }
                } else if (data.error) {
                    console.error('[WorkflowEditor] AI logic error:', data.error);
                    alert('AI Generation Error: ' + data.error);
                }
            });
        };

        subscribe();

        return () => {
            isMounted = false;
            console.log('[WorkflowEditor] Unsubscribing from AI suggestions for company', companyId);
            websocketService.unsubscribeFromWorkflowSuggestions(companyId);
        };
    }, [currentCompany?.companyId, parseXmlToFlow]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            type: 'branchingEdge',
            data: { type: 'approve' },
            animated: true,
        }, eds)),
        []
    );

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    };

    const onEdgeClick = (_: any, edge: Edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    };

    const addStep = () => {
        // ... (omitted same content if possible, but tool needs exact match)
        const nextOrder = nodes.length + 1;
        const id = `node-${nextOrder}-${Date.now()}`;
        const lastNode = nodes[nodes.length - 1];

        const newNode: Node = {
            id,
            type: 'stepNode',
            position: {
                x: lastNode ? lastNode.position.x : 350,
                y: lastNode ? lastNode.position.y + 200 : 100
            },
            data: {
                id,
                stepOrder: nextOrder,
                roleName: roles[0]?.name || 'New Role',
                roleLevel: roles[0]?.level || 50,
                action: 'approve',
                parallel: false,
                description: '',
                allowedActions: [],
                onDelete: deleteNode
            } as any
        };

        setNodes((nds) => [...nds, newNode]);
        if (lastNode) {
            setEdges((eds) => [...eds, {
                id: `edge-${Date.now()}`,
                source: lastNode.id,
                target: id,
                type: 'branchingEdge',
                data: { type: 'approve' },
                animated: true,
            }]);
        }
    };

    const handleNodeDataChange = (field: keyof StepNodeData, value: any) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [field]: value,
                        },
                    };
                }
                return node;
            })
        );

        setSelectedNode(prev => prev ? ({
            ...prev,
            data: { ...prev.data, [field]: value }
        }) : null);
    };

    const handleEdgeDataChange = (field: keyof BranchingEdgeData, value: any) => {
        if (!selectedEdge) return;

        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === selectedEdge.id) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            [field]: value,
                        },
                    };
                }
                return edge;
            })
        );

        setSelectedEdge(prev => prev ? ({
            ...prev,
            data: { ...prev.data, [field]: value }
        }) : null);
    };

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        setSelectedNode(null);
    }, []);

    const handleSave = () => {
        if (activeTab === 0) syncFlowToXml();

        onSave({
            name,
            description,
            stepsXml: xml,
            allowedRoleLevels: allowedStartLevels
        });
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setRolesLoading(true);
                const response = await fetch('/api/company/getAllRoles', {
                    credentials: 'include'  // Important for cookies
                });
                if (response.ok) {
                    const data = await response.json();  // массив вроде [{id, name, level, isSystem}]
                    setRoles(data);
                } else {
                    console.error('Error loading roles');
                }
            } catch (err) {
                console.error('Network error loading roles', err);
            } finally {
                setRolesLoading(false);
            }
        };

        fetchRoles();
    }, []);

    useEffect(() => {
        if (activeTab === 0) syncFlowToXml();
    }, [nodes, edges, activeTab, syncFlowToXml]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#020617', // Deep dark
            color: 'white',
            borderRadius: 0,
            overflow: 'hidden',
            border: 'none',
            // Global scrollbar styling for the entire editor
            '& ::-webkit-scrollbar': { width: '8px', height: '8px' },
            '& ::-webkit-scrollbar-track': { bgcolor: 'transparent !important' },
            '& ::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255, 255, 255, 0.1) !important',
                borderRadius: '10px !important',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2) !important' }
            },
            // ReactFlow Controls styling to avoid "white blocks"
            '& .react-flow__controls-button': {
                bgcolor: '#1e293b !important',
                color: '#94a3b8 !important',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1) !important',
                '&:hover': {
                    bgcolor: '#334155 !important',
                    color: 'white !important',
                },
                '& svg': {
                    fill: 'currentColor !important',
                }
            },
            '& .react-flow__controls': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5) !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                borderRadius: '8px !important',
                overflow: 'hidden'
            }
        }}>
            {/* Top Toolbar */}
            <Box sx={{
                height: 64,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 10
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                        Workflow Studio
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', height: 24, my: 'auto' }} />
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => {
                            if (v === 0 && activeTab === 1) {
                                // Switching from XML to Flow - re-parse
                                parseXmlToFlow(xml);
                            } else if (v === 1 && activeTab === 0) {
                                // Switching from Flow to XML - sync first
                                syncFlowToXml();
                            }
                            setActiveTab(v);
                        }}
                        sx={{
                            minHeight: 40,
                            '& .MuiTabs-indicator': { bgcolor: '#3b82f6', height: 3, borderRadius: '3px 3px 0 0' },
                            '& .MuiTab-root': {
                                color: 'rgba(255, 255, 255, 0.4)',
                                minHeight: 40,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                '&.Mui-selected': { color: '#3b82f6' }
                            }
                        }}
                    >
                        <Tab icon={<VisualIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Flow Editor" />
                        <Tab icon={<CodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="XML Code" />
                    </Tabs>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AiIcon />}
                        onClick={() => setIsAiDialogOpen(true)}
                        sx={{
                            color: '#7c3aed',
                            borderColor: 'rgba(124, 58, 237, 0.4)',
                            '&:hover': {
                                borderColor: '#7c3aed',
                                bgcolor: 'rgba(124, 58, 237, 0.05)'
                            },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2,
                            borderRadius: '8px'
                        }}
                    >
                        AI Assist
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={isLoading ? null : <SaveIcon />}
                        onClick={handleSave}
                        disabled={isLoading || !name || (activeTab === 0 && nodes.length === 0)}
                        sx={{
                            bgcolor: '#3b82f6',
                            color: 'white',      // FIX: Ensure text is white
                            '&:hover': { bgcolor: '#2563eb' },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            borderRadius: '8px'
                        }}
                    >
                        {isLoading ? 'Syncing...' : 'Deploy Version'}
                    </Button>
                </Box>
            </Box>

            {/* Main Workspace */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

                {/* Left Sidebar (Component Palette) */}
                <Box sx={{
                    width: sidebarCollapsed ? 60 : 280,
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                    bgcolor: 'rgba(15, 23, 42, 0.95)', // Slightly darker
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    // Global scrollbar styling for the sidebar
                    '& ::-webkit-scrollbar': { width: '6px' },
                    '& ::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '& ::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                    }
                }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {!sidebarCollapsed && <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em' }}>COMPONENTS</Typography>}
                        <IconButton size="small" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            <CollapseIcon sx={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </IconButton>
                    </Box>

                    {!sidebarCollapsed && (
                        <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexGrow: 1, pb: 2 }}>
                            <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <TextField
                                    label="Template Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    fullWidth
                                    variant="standard"
                                    InputProps={{ disableUnderline: true, sx: { color: 'white', fontWeight: 600, fontSize: '0.9rem' } }}
                                    InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem' } }}
                                />
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    variant="standard"
                                    InputProps={{ disableUnderline: true, sx: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' } }}
                                    InputLabelProps={{ sx: { color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem' } }}
                                />
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700, mb: 2, display: 'block', letterSpacing: '0.05em' }}>
                                    WHO CAN START
                                </Typography>

                                {rolesLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
                                    </Box>
                                ) : roles.length === 0 ? (
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', py: 2 }}>
                                        No roles found
                                    </Typography>
                                ) : (
                                    <Box sx={{
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        pr: 1,
                                        // Specific scrollbar styling for role list
                                        '&::-webkit-scrollbar': { width: '4px' },
                                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent !important' },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }
                                    }}> {/* Scrolling container */}
                                        <Stack spacing={1}>
                                            {roles.sort((a, b) => b.level - a.level).map(({ level, name }) => {
                                                const isSelected = allowedStartLevels.includes(level);
                                                const isMandatory = level === 100;

                                                return (
                                                    <Box
                                                        key={level}
                                                        onClick={() => !isMandatory && toggleStartLevel(level)}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            p: 1.25,
                                                            borderRadius: '8px',
                                                            bgcolor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                                            border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)'}`,
                                                            cursor: isMandatory ? 'default' : 'pointer',
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            opacity: isMandatory ? 1 : 0.8,
                                                            '&:hover': !isMandatory ? {
                                                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                                                borderColor: '#3b82f6',
                                                                opacity: 1,
                                                                transform: 'translateX(4px)'
                                                            } : {}
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 18,
                                                                height: 18,
                                                                borderRadius: '4px',
                                                                border: `2px solid ${isSelected ? (level >= 80 ? '#a78bfa' : level >= 60 ? '#34d399' : '#94a3b8') : 'rgba(255, 255, 255, 0.2)'}`,
                                                                bgcolor: isSelected ? (level >= 80 ? '#a78bfa' : level >= 60 ? '#34d399' : '#94a3b8') : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {isSelected && (
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </Box>
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2, display: 'block' }}>
                                                                {name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.65rem' }}>
                                                                Level {level} {isMandatory && '• Mandatory'}
                                                            </Typography>
                                                        </Box>
                                                        {isMandatory && (
                                                            <Tooltip title="CEO always has access">
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                )}

                                {allowedStartLevels.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#ef4444', mt: 2, fontWeight: 500 }}>
                                        Warning: no one will be able to start the workflow!
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600, mb: 1, display: 'block' }}>AVAILABLE STEPS</Typography>
                                <Button
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    onClick={addStep}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        py: 1.5,
                                        px: 2,
                                        color: '#f8fafc',
                                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px dashed rgba(59, 130, 246, 0.3)',
                                        borderRadius: '10px',
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
                                        textTransform: 'none'
                                    }}
                                >
                                    Add Sequential Step
                                </Button>
                            </Box>

                            <Box sx={{ mt: 3, opacity: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600, mb: 1, display: 'block' }}>INSPECTOR</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', borderRadius: '10px' }}>
                                    {selectedNode ? 'Step selected. Edit properties in the right panel.' : 'Select a node to view properties.'}
                                </Paper>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Canvas Area */}
                <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#020617' }}>
                    {activeTab === 0 ? (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            style={{ background: '#020617' }}
                        >
                            <Background
                                color="#1e293b"
                                gap={24}
                                variant={BackgroundVariant.Dots}
                                size={2}
                            />
                            <Controls
                                style={{
                                    background: '#1e293b',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '4px'
                                }}
                            >
                                {/* We can't easily style internal Control buttons via style prop, 
                                    so we use CSS injection or standard ReactFlow class overrides if we had a CSS file.
                                    Instead, let's just make sure the background is dark enough. */}
                            </Controls>
                        </ReactFlow>
                    ) : (
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            theme="vs-dark"
                            value={xml}
                            onChange={(value) => setXml(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                formatOnPaste: true,
                                formatOnType: true,
                                padding: { top: 20, bottom: 20 },
                            }}
                        />
                    )}

                    {/* Properties Drawer */}
                    <Drawer
                        anchor="right"
                        open={!!selectedNode || !!selectedEdge}
                        onClose={() => {
                            setSelectedNode(null);
                            setSelectedEdge(null);
                        }}
                        variant="persistent"
                        PaperProps={{
                            sx: {
                                width: 340,
                                p: 0,
                                bgcolor: '#0f172a',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
                                // Scrollbar for properties drawer
                                '& ::-webkit-scrollbar': { width: '6px' },
                                '& ::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                                '& ::-webkit-scrollbar-thumb': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px'
                                }
                            }
                        }}
                    >
                        <Box sx={{ height: 64, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <SettingsIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {selectedNode ? 'Node Properties' : 'Edge Properties'}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => {
                                setSelectedNode(null);
                                setSelectedEdge(null);
                            }} sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Box sx={{ p: 4, height: 'calc(100% - 64px)', overflowY: 'auto' }}>
                            {selectedNode ? (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>ORDINAL POSITION</Typography>
                                        <TextField
                                            type="number"
                                            value={(selectedNode?.data as any)?.stepOrder || 1}
                                            onChange={(e) => handleNodeDataChange('stepOrder', parseInt(e.target.value))}
                                            fullWidth
                                            variant="filled"
                                            sx={{
                                                '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.4)' }
                                            }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>
                                            TARGET ROLE
                                        </Typography>
                                        <FormControl fullWidth variant="filled" sx={{
                                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                        }}>
                                            <Select
                                                value={(selectedNode?.data as any)?.roleName || ''}
                                                onChange={(e) => {
                                                    const selectedRole = roles.find(r => r.name === e.target.value);
                                                    if (selectedRole) {
                                                        handleNodeDataChange('roleName', selectedRole.name);
                                                        handleNodeDataChange('roleLevel', selectedRole.level);  // Auto-set level
                                                    }
                                                }}
                                                disabled={rolesLoading || roles.length === 0}
                                                displayEmpty
                                            >
                                                {rolesLoading ? (
                                                    <MenuItem disabled>Loading roles...</MenuItem>
                                                ) : roles.length === 0 ? (
                                                    <MenuItem disabled>No roles in company</MenuItem>
                                                ) : (
                                                    roles.map((role) => (
                                                        <MenuItem key={role.id} value={role.name}>
                                                            {role.name} (Level: {role.level})
                                                        </MenuItem>
                                                    ))
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.3)',
                                                fontWeight: 700,
                                                mb: 1,
                                                display: 'block'
                                            }}
                                        >
                                            ACCESS LEVEL
                                        </Typography>
                                        <TextField
                                            type="number"
                                            value={(selectedNode?.data as any)?.roleLevel || 60}
                                            fullWidth
                                            variant="filled"
                                            InputProps={{
                                                readOnly: true, // Prevent manual editing
                                            }}
                                            sx={{
                                                '& .MuiFilledInput-root': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    color: 'white'
                                                },
                                                '& .MuiFilledInput-input': {
                                                    cursor: 'default', // Remove input cursor
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                },
                                                '& .MuiFilledInput-root.Mui-disabled': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                }
                                            }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>STEP DESCRIPTION</Typography>
                                        <TextField
                                            multiline
                                            rows={3}
                                            value={(selectedNode?.data as any)?.description || ''}
                                            onChange={(e) => handleNodeDataChange('description', e.target.value)}
                                            placeholder="Enter instructions for the assignee..."
                                            fullWidth
                                            variant="filled"
                                            sx={{
                                                '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                                '& .MuiInputBase-input': { fontSize: '0.875rem' }
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255, 255, 255, 0.02)', p: 2, borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>Parallel Execution</Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>Assign to all roles simultaneously</Typography>
                                        </Box>
                                        <Switch
                                            checked={(selectedNode?.data as any)?.parallel || false}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleNodeDataChange('parallel', e.target.checked)}
                                            color="primary"
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>PRIMARY POSITIVE ACTION</Typography>
                                        <FormControl fullWidth variant="filled" sx={{
                                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                            '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.4)' }
                                        }}>
                                            <Select
                                                value={(selectedNode?.data as any)?.action || 'approve'}
                                                onChange={(e) => handleNodeDataChange('action', e.target.value)}
                                                disableUnderline
                                            >
                                                <MenuItem value="approve">Approve</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', mt: 1, display: 'block', fontStyle: 'italic' }}>
                                            * Approve & Reject are always available by default
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>OPTIONAL ACTIONS</Typography>
                                        <FormControl fullWidth variant="filled" sx={{
                                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                            '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.4)' }
                                        }}>
                                            <Select
                                                multiple
                                                value={(selectedNode?.data as any)?.allowedActions || []}
                                                onChange={(e) => handleNodeDataChange('allowedActions', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                disableUnderline
                                                renderValue={(selected: any) => selected.join(', ')}
                                            >
                                                <MenuItem value="DELEGATE">Delegate</MenuItem>
                                                <MenuItem value="REQUEST_CHANGES">Request Changes</MenuItem>
                                                <MenuItem value="HOLD">Hold context</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => selectedNode && deleteNode(selectedNode.id)}
                                        sx={{
                                            color: '#ef4444',
                                            borderColor: 'rgba(239, 68, 68, 0.2)',
                                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444' },
                                            textTransform: 'none',
                                            py: 1.5,
                                            borderRadius: '10px'
                                        }}
                                    >
                                        Remove Action Block
                                    </Button>
                                </Stack>
                            ) : selectedEdge ? (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>PATH TYPE</Typography>
                                        <FormControl fullWidth variant="filled" sx={{
                                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                        }}>
                                            <Select
                                                value={(selectedEdge?.data as any)?.type || 'approve'}
                                                onChange={(e) => handleEdgeDataChange('type', e.target.value)}
                                                disableUnderline
                                            >
                                                <MenuItem value="approve">On Approve (Positive)</MenuItem>
                                                <MenuItem value="reject">On Reject (Negative)</MenuItem>
                                                <MenuItem value="timeout">On Timeout (Expiration)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>CONDITION (OPTIONAL)</Typography>
                                        <TextField
                                            value={(selectedEdge?.data as any)?.condition || ''}
                                            onChange={(e) => handleEdgeDataChange('condition', e.target.value)}
                                            placeholder="e.g. $amount > 1000"
                                            fullWidth
                                            variant="filled"
                                            sx={{
                                                '& .MuiFilledInput-root': { bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' },
                                                '& .MuiInputBase-input': { fontFamily: 'monospace' }
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', mt: 1, display: 'block' }}>
                                            Available variables: $amount, $type, etc.
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => selectedEdge && setEdges(eds => eds.filter(e => e.id !== selectedEdge.id))}
                                        sx={{
                                            color: '#ef4444',
                                            borderColor: 'rgba(239, 68, 68, 0.2)',
                                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444' },
                                            textTransform: 'none',
                                            py: 1.5,
                                            borderRadius: '10px'
                                        }}
                                    >
                                        Remove Connection
                                    </Button>
                                </Stack>
                            ) : null}
                        </Box>
                    </Drawer>

                    {/* AI Assistant Dialog */}
                    <Dialog
                        open={isAiDialogOpen}
                        onClose={() => !isAiGenerating && setIsAiDialogOpen(false)}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{
                            sx: {
                                borderRadius: '12px',
                                bgcolor: '#0f172a', // FIX: Dark background
                                color: 'white',      // FIX: White text
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                            <BotIcon color="primary" />
                            AI Workflow Assistant
                        </DialogTitle>
                        <DialogContent
                            dividers
                            sx={{
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                // FIX: Dark scrollbar for AI dialog
                                '&::-webkit-scrollbar': { width: '8px' },
                                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                                '&::-webkit-scrollbar-thumb': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                }
                            }}
                        >
                            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.6)' }}>
                                Describe your business process in natural language. The AI will generate nodes, connections, and branching logic for you.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="e.g., A 3-step approval process. Step 1 is Accountant, Step 2 is Manager. If Manager rejects, go back to Accountant. Step 3 is CEO."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                disabled={isAiGenerating}
                                autoFocus
                                variant="filled"
                                sx={{
                                    mb: 1,
                                    '& .MuiFilledInput-root': {
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                                        '&.Mui-focused': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                                    },
                                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.3)' }
                                }}
                            />
                            {isAiGenerating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="caption" color="primary">
                                        Generating workflow diagram...
                                    </Typography>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2, pt: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Button onClick={() => setIsAiDialogOpen(false)} disabled={isAiGenerating} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    if (!aiPrompt.trim()) return;
                                    setIsAiGenerating(true);
                                    try {
                                        const response = await fetch(`/api/workflow/ai-suggest?companyId=${currentCompany?.companyId}`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                prompt: aiPrompt,
                                                currentXml: xml // Send the current XML state
                                            }),
                                            credentials: 'include'
                                        });
                                        if (!response.ok) {
                                            throw new Error(await response.text());
                                        }
                                    } catch (err: any) {
                                        setIsAiGenerating(false);
                                        alert('Failed to contact AI: ' + err.message);
                                    }
                                }}
                                disabled={isAiGenerating || !aiPrompt.trim()}
                                startIcon={isAiGenerating ? <CircularProgress size={16} color="inherit" /> : <VisualIcon />}
                                sx={{
                                    borderRadius: '8px',
                                    bgcolor: '#7c3aed',
                                    color: 'white', // FIX: Ensure text is white
                                    '&:hover': { bgcolor: '#6d28d9' }
                                }}
                            >
                                Generate
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Box >
        </Box >
    );
};

export default WorkflowEditor;
