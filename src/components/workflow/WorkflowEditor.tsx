import { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
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
    IconButton,
} from '@mui/material';
import {
    Save as SaveIcon,
    Code as CodeIcon,
    Add as AddIcon,
    AutoGraph as VisualIcon,
    Close as CloseIcon,
    Settings as SettingsIcon,
    ChevronLeft as CollapseIcon,
} from '@mui/icons-material';
import CustomStepNode from './CustomStepNode';
import type { StepNodeData } from './CustomStepNode';

const nodeTypes = {
    stepNode: CustomStepNode
};

interface WorkflowEditorProps {
    initialName?: string;
    initialDescription?: string;
    initialXml?: string;
    onSave: (data: { name: string; description: string; stepsXml: string }) => void;
    isLoading?: boolean;
}

const WorkflowEditor = ({
    initialName = '',
    initialDescription = '',
    initialXml = '',
    onSave,
    isLoading = false,
}: WorkflowEditorProps) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [activeTab, setActiveTab] = useState(0);
    const [xml, setXml] = useState(initialXml || `<workflow>\n  <step order="1" roleName="Manager" roleLevel="60" action="approve"/>\n</workflow>`);
    const [roles, setRoles] = useState<Array<{id: number, name: string, level: number}>>([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    // React Flow state
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // Sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Parsing XML to React Flow
    const parseXmlToFlow = useCallback((content: string) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');
            const steps = xmlDoc.getElementsByTagName('step');

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const order = parseInt(step.getAttribute('order') || '1');
                const id = `node-${i}-${Date.now()}`;

                newNodes.push({
                    id,
                    type: 'stepNode',
                    position: { x: sidebarCollapsed ? 100 : 350, y: i * 200 + 100 },
                    data: {
                        id,
                        stepOrder: order,
                        roleName: step.getAttribute('roleName') || 'Manager',
                        roleLevel: parseInt(step.getAttribute('roleLevel') || '60'),
                        action: step.getAttribute('action') || 'approve',
                        onDelete: deleteNode
                    } as any
                });

                if (i > 0) {
                    newEdges.push({
                        id: `edge-${i}`,
                        source: newNodes[i - 1].id,
                        target: id,
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
                        style: { stroke: '#3b82f6', strokeWidth: 2 }
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
        sortedNodes.forEach((node, index) => {
            const data = node.data as any;
            newXml += `  <step order="${index + 1}" roleName="${data.roleName}" roleLevel="${data.roleLevel}" action="${data.action}"/>\n`;
        });
        newXml += '</workflow>';
        setXml(newXml);
    }, [nodes]);

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
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            style: { stroke: '#3b82f6', strokeWidth: 2 }
        }, eds)),
        []
    );

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNode(node);
    };

    const addStep = () => {
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
                roleName: 'New Role',
                roleLevel: 50,
                action: 'approve',
                onDelete: deleteNode
            } as any
        };

        setNodes((nds) => [...nds, newNode]);
        if (lastNode) {
            setEdges((eds) => [...eds, {
                id: `edge-${Date.now()}`,
                source: lastNode.id,
                target: id,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
                style: { stroke: '#3b82f6', strokeWidth: 2 }
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

    const deleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        setSelectedNode(null);
    }, []);

    const handleSave = () => {
        if (activeTab === 0) syncFlowToXml();
        onSave({ name, description, stepsXml: xml });
    };

  useEffect(() => {
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch('/api/company/getAllRoles', {
        credentials: 'include'  // Важно, чтобы куки с токеном ушли
      });
      if (response.ok) {
        const data = await response.json();  // массив вроде [{id, name, level, isSystem}]
        setRoles(data);
      } else {
        console.error('Ошибка загрузки ролей');
      }
    } catch (err) {
      console.error('Ошибка сети при загрузке ролей', err);
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
            bgcolor: '#0f172a', // Slate 900
            color: 'white',
            borderRadius: 0,
            overflow: 'hidden',
            border: 'none'
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
                        onChange={(_, v) => setActiveTab(v)}
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
                        variant="contained"
                        startIcon={isLoading ? null : <SaveIcon />}
                        onClick={handleSave}
                        disabled={isLoading || !name || (activeTab === 0 && nodes.length === 0)}
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': { bgcolor: '#2563eb' },
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
                    bgcolor: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease'
                }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {!sidebarCollapsed && <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em' }}>COMPONENTS</Typography>}
                        <IconButton size="small" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            <CollapseIcon sx={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </IconButton>
                    </Box>

                    {!sidebarCollapsed && (
                        <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                            nodeTypes={nodeTypes}
                            fitView
                            style={{ background: '#020617' }}
                        >
                            <Background
                                color="#1e293b"
                                gap={24}
                                variant={BackgroundVariant.Dots}
                                size={2}
                            />
                            <Controls style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
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
                        open={!!selectedNode}
                        onClose={() => setSelectedNode(null)}
                        variant="persistent"
                        PaperProps={{
                            sx: {
                                width: 340,
                                p: 0,
                                bgcolor: '#0f172a',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
                            }
                        }}
                    >
                        <Box sx={{ height: 64, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <SettingsIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Properties</Typography>
                            </Box>
                            <IconButton onClick={() => setSelectedNode(null)} sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Box sx={{ p: 4 }}>
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
                    handleNodeDataChange('roleLevel', selectedRole.level);  // Автоматически подставляем level
                }
            }}
            disabled={rolesLoading || roles.length === 0}
            displayEmpty
        >
            {rolesLoading ? (
                <MenuItem disabled>Загрузка ролей...</MenuItem>
            ) : roles.length === 0 ? (
                <MenuItem disabled>Нет ролей в компании</MenuItem>
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
            readOnly: true, // Запрещаем редактирование
        }}
        sx={{
            '& .MuiFilledInput-root': { 
                bgcolor: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                color: 'white' 
            },
            '& .MuiFilledInput-input': {
                cursor: 'default', // Убираем курсор ввода
                color: 'rgba(255, 255, 255, 0.9)',
            },
            '& .MuiFilledInput-root.Mui-disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
            }
        }}
    />
</Box>

<Box>
    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, mb: 1, display: 'block' }}>REQUIRED ACTION</Typography>
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
            <MenuItem value="sign">Digital Signature</MenuItem>
            <MenuItem value="review">Internal Review</MenuItem>
            <MenuItem value="publish">Final Publish</MenuItem>
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
</Box>
</Drawer>
</Box>
</Box>
</Box>
    );
};

export default WorkflowEditor;
