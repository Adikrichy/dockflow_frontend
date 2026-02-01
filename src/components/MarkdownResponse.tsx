import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ContentCopy as ContentCopyIcon, Check as CheckIcon } from '@mui/icons-material';

interface MarkdownResponseProps {
    content: string;
}

const MarkdownResponse: React.FC<MarkdownResponseProps> = ({ content }) => {
    return (
        <ReactMarkdown
            components={{
                code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const inline = !match;
                    const codeString = String(children).replace(/\n$/, '');
                    const [copied, setCopied] = useState(false);

                    const handleCopy = () => {
                        navigator.clipboard.writeText(codeString);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    };

                    if (inline) {
                        return (
                            <Typography
                                component="code"
                                sx={{
                                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                                    px: 0.5,
                                    py: 0.2,
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    color: '#e11d48',
                                    fontSize: '0.9em',
                                    display: 'inline-block'
                                }}
                                {...props}
                            >
                                {children}
                            </Typography>
                        );
                    }

                    return (
                        <Box sx={{
                            position: 'relative',
                            my: 1.5,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #334155',
                            bgcolor: '#1e1e1e',
                            width: '100%'
                        }}>
                            <Box sx={{
                                bgcolor: '#2d2d2d',
                                px: 2,
                                py: 0.5,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #334155'
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}>
                                    {match ? match[1] : 'code'}
                                </Typography>
                                <Tooltip title={copied ? "Скопировано!" : "Копировать"}>
                                    <IconButton size="small" onClick={handleCopy} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}>
                                        {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <SyntaxHighlighter
                                {...props}
                                children={codeString}
                                style={vscDarkPlus}
                                language={match ? match[1] : 'text'}
                                PreTag="div"
                                customStyle={{
                                    margin: 0,
                                    padding: '16px',
                                    borderRadius: 0,
                                    fontSize: '0.85rem',
                                    background: 'transparent'
                                }}
                            />
                        </Box>
                    );
                },
                p: ({ children }) => <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>{children}</Typography>,
                ul: ({ children }) => <Box component="ul" sx={{ pl: 2, mb: 1 }}>{children}</Box>,
                ol: ({ children }) => <Box component="ol" sx={{ pl: 2, mb: 1 }}>{children}</Box>,
                li: ({ children }) => <Box component="li" sx={{ mb: 0.5 }}><Typography variant="body2">{children}</Typography></Box>,
                h1: ({ children }) => <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{children}</Typography>,
                h2: ({ children }) => <Typography variant="subtitle1" sx={{ mt: 1.5, mb: 1, fontWeight: 'bold' }}>{children}</Typography>,
                h3: ({ children }) => <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{children}</Typography>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownResponse;
