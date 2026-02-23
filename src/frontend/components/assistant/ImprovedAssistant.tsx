import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Divider,
  useTheme,
  Button,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AssistantIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useCompany } from '../../../backend/context/CompanyContext';
import { analyzeChatPrompt, draftEmailResponse, generateBusinessReport } from '../../../backend/services/VertexService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ImprovedAssistantProps {
  onClose?: () => void;
}

const ImprovedAssistant: React.FC<ImprovedAssistantProps> = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getBasePath } = useCompany();

  const [, setLastEmail] = useState<{ subject: string; body: string } | null>(null);
  const [, setLastReport] = useState<string | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Slash commands
      if (userMessage.startsWith('/email')) {
        const inputText = userMessage.replace('/email', '').trim();
        const email = await draftEmailResponse(inputText || 'Create a reply to the above context.');
        setLastEmail(email);
        const formatted = `Subject: ${email.subject}\n\n${email.body}`;
        
        const assistantMsg: Message = {
          role: 'assistant',
          content: formatted,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        setLastReport(null);
        return;
      }
      
      if (userMessage.startsWith('/report')) {
        const basePath = getBasePath();
        const request = userMessage.replace('/report', '').trim() || 'Generate a weekly summary.';
        const report = await generateBusinessReport(request, { basePath });
        setLastReport(report);
        
        const assistantMsg: Message = {
          role: 'assistant',
          content: report,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        setLastEmail(null);
        return;
      }

      // Regular Q&A with optional context
      const dataRequest = userMessage.toLowerCase().includes('analyze') ||
        userMessage.toLowerCase().includes('data') ||
        userMessage.toLowerCase().includes('metrics');

      const basePath = getBasePath();
      const contextData = dataRequest ? { basePath } : undefined;
      const response = await analyzeChatPrompt(userMessage, contextData);
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setLastEmail(null);
      setLastReport(null);
    } catch (error) {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content: string) => {
    // Simple formatting for better readability
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 3,
            textAlign: 'center',
          }}>
            <Avatar sx={{ 
              width: 64, 
              height: 64, 
              mb: 2, 
              bgcolor: theme.palette.primary.main,
              fontSize: '2rem',
            }}>
              <AssistantIcon />
            </Avatar>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              AI Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              I'm here to help you with your business needs. Ask me anything or use special commands like /email or /report.
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              <Chip 
                label="/email - Draft emails" 
                variant="outlined" 
                color="primary"
                size="small"
              />
              <Chip 
                label="/report - Generate reports" 
                variant="outlined" 
                color="secondary"
                size="small"
              />
              <Chip 
                label="Ask questions" 
                variant="outlined" 
                color="default"
                size="small"
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            flexGrow: 1, 
            overflowY: 'auto', 
            p: 2,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[100],
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: theme.palette.grey[600],
              },
            },
          }}>
            <List sx={{ p: 0 }}>
              {messages.map((message, index) => (
                <ListItem key={index} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                  p: 0,
                  mb: 2,
                }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: message.role === 'user' 
                        ? theme.palette.primary.main 
                        : theme.palette.grey[100],
                      color: message.role === 'user' 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.text.primary,
                      borderRadius: 2,
                      borderTopLeftRadius: message.role === 'user' ? 2 : 8,
                      borderTopRightRadius: message.role === 'user' ? 8 : 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: message.role === 'user' 
                          ? theme.palette.primary.dark 
                          : theme.palette.secondary.main,
                      }}>
                        {message.role === 'user' ? <PersonIcon /> : <AssistantIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.5,
                        }}>
                          {formatMessage(message.content)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          mt: 1, 
                          opacity: 0.7,
                          fontSize: '0.75rem',
                        }}>
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
              ))}
              
              {loading && (
                <ListItem sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start',
                  p: 0,
                  mb: 2,
                }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.grey[100],
                      borderRadius: 2,
                      borderTopLeftRadius: 8,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.secondary.main,
                      }}>
                        <AssistantIcon />
                      </Avatar>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Input Section */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (/email, /report supported)"
          variant="outlined"
          size="small"
          disabled={loading}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || loading}
                color="primary"
                sx={{ ml: 1 }}
              >
                <SendIcon />
              </IconButton>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />
        
        {/* Quick Actions */}
        {messages.length === 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setInput('/email Help me draft a professional email')}
              disabled={loading}
            >
              Draft Email
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setInput('/report Generate a business summary')}
              disabled={loading}
            >
              Generate Report
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setInput('Analyze my business data')}
              disabled={loading}
            >
              Analyze Data
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImprovedAssistant;
