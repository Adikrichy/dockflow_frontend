import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Select, Typography, Alert, Chip, Divider, Grid, Paper } from '@mui/material';
import { Refresh as RefreshIcon, PlayArrow as PlayIcon, Check as CheckIcon, Close as CloseIcon, Description as DocumentIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import { aiServiceAPI, type CurrentConfig, type ProviderStatus, type TestResult, type AiAnalysisResponse } from '../services/aiService';
import { documentService } from '../services/documentService';
import type { Document, DocumentVersion } from '../types/document';

const AISettingsPage: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<CurrentConfig | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Document Analysis State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | ''>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResponse | null>(null);
  const [testBenchProvider, setTestBenchProvider] = useState<string>('');

  // Load initial configuration
  useEffect(() => {
    loadConfiguration();
    loadDocuments();
  }, []);

  // Poll for analysis results
  useEffect(() => {
    if (!analyzing || !selectedDocId || !selectedVersionId) {
      return;
    }

    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;

      try {
        const result = await aiServiceAPI.getAnalysisResult(Number(selectedDocId), Number(selectedVersionId));

        if (isCancelled) return;

        setAnalysisResult(result);

        if (result.status === 'SUCCESS' || result.status === 'ERROR') {
          setAnalyzing(false);
          if (result.status === 'SUCCESS') {
            setSuccess('Document analysis completed successfully!');
          } else {
            setError(result.error || 'Document analysis failed');
          }
        }
      } catch (err) {
        console.error('Error polling for analysis:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [analyzing, selectedDocId, selectedVersionId]);

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getUserDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleDocumentChange = async (event: any) => {
    const docId = event.target.value;
    setSelectedDocId(docId);
    setSelectedVersionId('');
    setAnalysisResult(null);

    if (docId) {
      try {
        const docVersions = await documentService.getDocumentVersions(Number(docId));
        setVersions(docVersions);
        // Select current version by default
        const current = docVersions.find(v => v.isCurrent);
        if (current) {
          setSelectedVersionId(current.id);
        }
      } catch (err) {
        console.error('Failed to load versions:', err);
      }
    }
  };

  const startAnalysis = async () => {
    if (!selectedDocId || !selectedVersionId) return;

    setAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    setSuccess(null);

    try {
      await aiServiceAPI.startDocumentAnalysis(
        Number(selectedDocId),
        Number(selectedVersionId),
        testBenchProvider || undefined
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setAnalyzing(false);
    }
  };

  const renderAnalysisResult = () => {
    const rawData = analysisResult?.raw_result || (analysisResult as any)?.rawResult;
    if (!analysisResult || !rawData) return null;

    try {
      const data = JSON.parse(rawData);

      return (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Analysis Results</Typography>

          <Grid container spacing={2}>
            {/* Classification Card */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" variant="overline" display="block">Document Classification</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Chip label={data.doc_type || 'other'} color="primary" />
                    <Chip label={data.language || 'unknown'} variant="outlined" />
                    <Chip
                      label={`Confidence: ${((data.workflow_decision?.analysis_confidence || 0) * 100).toFixed(0)}%`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Workflow Suggestion Card */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <CardContent>
                  <Typography color="textSecondary" variant="overline" display="block">Workflow Suggested</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Reviewers: {data.workflow_decision?.suggested_reviewers?.join(', ') || 'unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Complexity: {data.workflow_decision?.approval_complexity || 'unknown'}
                  </Typography>
                  <Box mt={1}>
                    {data.workflow_decision?.decision_flags?.requires_human_review ? (
                      <Chip label="Human Review Required" size="small" color="warning" />
                    ) : (
                      <Chip label="Auto-Approvable" size="small" color="success" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Semantic Summary */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Semantic Summary</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="body2" paragraph><strong>Purpose:</strong> {data.semantic_summary?.purpose || 'unknown'}</Typography>
                <Typography variant="body2" paragraph><strong>Audience:</strong> {data.semantic_summary?.audience || 'unknown'}</Typography>
                {data.semantic_summary?.expected_actions?.length > 0 && (
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Expected Actions:</Typography>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {data.semantic_summary.expected_actions.map((act: string, i: number) => (
                        <li key={i}><Typography variant="body2">{act}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Requirements & Recommendations */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>Explicit Requirements</Typography>
              <Card variant="outlined">
                <CardContent sx={{ p: '12px !important' }}>
                  {data.requirements?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {data.requirements.map((req: string, i: number) => (
                        <li key={i}><Typography variant="body2">{req}</Typography></li>
                      ))}
                    </ul>
                  ) : (
                    <Typography variant="body2" color="textSecondary">No explicit requirements found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>Recommendations</Typography>
              <Card variant="outlined">
                <CardContent sx={{ p: '12px !important' }}>
                  {data.recommendations?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {data.recommendations.map((rec: string, i: number) => (
                        <li key={i}><Typography variant="body2">{rec}</Typography></li>
                      ))}
                    </ul>
                  ) : (
                    <Typography variant="body2" color="textSecondary">No recommendations found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Risks & Ambiguities */}
            {data.risks?.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Detected Risks</Typography>
                {data.risks.map((risk: any, idx: number) => (
                  <Alert
                    key={idx}
                    severity={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'info'}
                    sx={{ mb: 1 }}
                    variant="outlined"
                  >
                    <strong>[{risk.type}]</strong> {risk.description}
                  </Alert>
                ))}
              </Grid>
            )}

            {data.ambiguities?.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>Ambiguities</Typography>
                <Alert severity="warning" variant="outlined">
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {data.ambiguities.map((amb: string, i: number) => (
                      <li key={i}><Typography variant="body2">{amb}</Typography></li>
                    ))}
                  </ul>
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      );
    } catch (e) {
      console.error('Failed to parse analysis result:', e);
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning">
            Failed to parse detailed results. Showing summary instead.
          </Alert>
          <Typography variant="subtitle1">Summary</Typography>
          <Typography variant="body2">{analysisResult.summary}</Typography>
        </Box>
      );
    }
  };

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      const [config, statuses] = await Promise.all([
        aiServiceAPI.getCurrentConfig(),
        aiServiceAPI.getProviderStatus()
      ]);

      setCurrentConfig(config);
      setProviderStatuses(statuses);
      setSelectedProvider(config.currentProvider);
      setTestBenchProvider(config.currentProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProvider = event.target.value;
    setSelectedProvider(newProvider);

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await aiServiceAPI.setProvider(newProvider);
      setSuccess(`Successfully switched to ${newProvider} provider`);

      // Refresh configuration
      const updatedConfig = await aiServiceAPI.getCurrentConfig();
      setCurrentConfig(updatedConfig);

    } catch (err: any) {
      setError(err.message || 'Failed to switch provider');
      // Revert selection if failed
      if (currentConfig) {
        setSelectedProvider(currentConfig.currentProvider);
      }
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider: string) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    setError(null);

    try {
      const result = await aiServiceAPI.testProvider(provider);
      setTestResults(prev => ({ ...prev, [provider]: result }));

      if (result.status === 'working') {
        setSuccess(`${provider} provider is working correctly!`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to test ${provider} provider`);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini': return '🔮';
      case 'groq': return '⚡';
      case 'ollama': return '🦙';
      case 'mock': return '🧪';
      default: return '🤖';
    }
  };

  const getProviderColor = (provider: string) => {
    const status = providerStatuses.find(p => p.provider === provider);
    if (!status) return 'default';

    return status.isAvailable ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentConfig) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load AI configuration</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        AI Service Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Configuration
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Active Provider:
                </Typography>
                <Chip
                  label={`${getProviderIcon(currentConfig.currentProvider)} ${currentConfig.currentProvider}`}
                  color={getProviderColor(currentConfig.currentProvider)}
                  size="medium"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Available Providers:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {currentConfig.availableProviders.map(provider => (
                  <Chip
                    key={provider}
                    label={`${getProviderIcon(provider)} ${provider}`}
                    variant={provider === currentConfig.currentProvider ? "filled" : "outlined"}
                    color={getProviderColor(provider)}
                    onClick={() => testProvider(provider)}
                    onDelete={() => testProvider(provider)}
                    deleteIcon={<PlayIcon />}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Provider Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select AI Provider
              </Typography>

              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Choose your preferred AI provider:</FormLabel>
                <RadioGroup
                  value={selectedProvider}
                  onChange={handleProviderChange}
                  sx={{ mt: 1 }}
                >
                  {currentConfig.availableProviders.map(provider => {
                    const status = providerStatuses.find(p => p.provider === provider);
                    const isAvailable = status?.isAvailable ?? false;

                    return (
                      <FormControlLabel
                        key={provider}
                        value={provider}
                        control={<Radio />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{getProviderIcon(provider)}</span>
                            <span>{provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                            {isAvailable && <CheckIcon color="success" fontSize="small" />}
                            {!isAvailable && status?.errorMessage && (
                              <CloseIcon color="error" fontSize="small" />
                            )}
                            {saving && selectedProvider === provider && (
                              <CircularProgress size={16} />
                            )}
                          </Box>
                        }
                        disabled={!isAvailable || saving}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>

              <Button
                startIcon={<RefreshIcon />}
                onClick={loadConfiguration}
                sx={{ mt: 2 }}
                variant="outlined"
              >
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Provider Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provider Details & Testing
              </Typography>

              <Grid container spacing={2}>
                {currentConfig.availableProviders.map(provider => {
                  const config = currentConfig.providerConfigs[provider];
                  const status = providerStatuses.find(p => p.provider === provider);
                  const testResult = testResults[provider];

                  return (
                    <Grid item xs={12} sm={6} md={3} key={provider}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle1">
                              {getProviderIcon(provider)} {provider}
                            </Typography>
                            <Chip
                              size="small"
                              label={status?.isAvailable ? 'Available' : 'Unavailable'}
                              color={status?.isAvailable ? 'success' : 'error'}
                            />
                          </Box>

                          {config && (
                            <Box sx={{ mb: 2 }}>
                              {Object.entries(config).map(([key, value]) => (
                                <Typography key={key} variant="body2" color="textSecondary">
                                  {key}: {typeof value === 'boolean' ? (value ? '✓ Set' : '✗ Not set') : String(value)}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          {testResult && (
                            <Alert
                              severity={testResult.status === 'working' ? 'success' : 'error'}
                              sx={{ mb: 1 }}
                            >
                              <Typography variant="caption">
                                {testResult.testResponse || testResult.error}
                              </Typography>
                            </Alert>
                          )}

                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={testing[provider] ? <CircularProgress size={16} /> : <PlayIcon />}
                            onClick={() => testProvider(provider)}
                            disabled={testing[provider]}
                          >
                            {testing[provider] ? 'Testing...' : 'Test Provider'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* Document Analysis Test Bench */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AnalyticsIcon color="primary" />
                <Typography variant="h6">Document Analysis Test Bench</Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Test the document analysis engine on your existing documents. This will extract text,
                identify document type, language, key fields, and potential risks.
              </Typography>

              <Grid container spacing={3} alignItems="flex-end">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <FormLabel sx={{ mb: 1 }}>AI Provider</FormLabel>
                    <Select
                      value={testBenchProvider}
                      onChange={(e) => setTestBenchProvider(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">Use Default</MenuItem>
                      {currentConfig.availableProviders.map(provider => (
                        <MenuItem key={provider} value={provider}>
                          {getProviderIcon(provider)} {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <FormLabel sx={{ mb: 1 }}>Select Document</FormLabel>
                    <Select
                      value={selectedDocId}
                      onChange={handleDocumentChange}
                      displayEmpty
                      startAdornment={<DocumentIcon sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      <MenuItem value="" disabled>Select a document...</MenuItem>
                      {documents.map(doc => (
                        <MenuItem key={doc.id} value={doc.id}>
                          {doc.originalFilename} ({doc.status})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" disabled={!selectedDocId}>
                    <FormLabel sx={{ mb: 1 }}>Select Version</FormLabel>
                    <Select
                      value={selectedVersionId}
                      onChange={(e) => setSelectedVersionId(e.target.value as number)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select version...</MenuItem>
                      {versions.map(v => (
                        <MenuItem key={v.id} value={v.id}>
                          v{v.versionNumber} - {v.changeType} ({new Date(v.createdAt).toLocaleDateString()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                    onClick={startAnalysis}
                    disabled={analyzing || !selectedDocId || !selectedVersionId}
                    sx={{ height: '56px' }}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Document'}
                  </Button>
                </Grid>
              </Grid>

              {analyzing && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <CircularProgress size={40} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    AI is processing the document. This may take up to a minute...
                  </Typography>
                </Box>
              )}

              {!analyzing && renderAnalysisResult()}

              {!analyzing && analysisResult?.status === 'SUCCESS' && !analysisResult.raw_result && !(analysisResult as any).rawResult && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  Analysis was successful, but detailed data is missing. Summary: {analysisResult.summary || 'N/A'}
                </Alert>
              )}

              {!analyzing && !analysisResult && selectedDocId && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Select a version and click "Analyze Document" to start the process.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AISettingsPage;