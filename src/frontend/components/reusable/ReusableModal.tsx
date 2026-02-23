import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Minimize as MinimizeIcon,
} from '@mui/icons-material';
import { createPortal } from 'react-dom';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './ReusableModal.css';

interface ReusableModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  initialPosition?: { x: number; y: number };
  resizable?: boolean;
  draggable?: boolean;
  showMinimizeButton?: boolean;
  zIndex?: number;
  className?: string;
}

const ReusableModal: React.FC<ReusableModalProps> = ({
  open,
  onClose,
  title,
  children,
  initialSize = { width: 400, height: 600 },
  minSize = { width: 300, height: 400 },
  maxSize = { width: 1200, height: 900 },
  initialPosition = { x: 100, y: 100 },
  resizable = true,
  draggable = true,
  showMinimizeButton = false,
  zIndex = 9999,
  className = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const dragRef = useRef<HTMLDivElement>(null);

  // Reset position and size when modal opens
  useEffect(() => {
    if (open) {
      setPosition(initialPosition);
      setSize(initialSize);
      setIsFullscreen(false);
      setIsMinimized(false);
    }
  }, [open, initialPosition, initialSize]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isFullscreen || isMinimized) return;
    
    if (dragRef.current && dragRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isFullscreen && !isMinimized) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handle resize
  const handleResize = (_: React.SyntheticEvent, { size: newSize }: { size: { width: number; height: number } }) => {
    if (!isFullscreen && !isMinimized) {
      setSize({
        width: Math.max(minSize.width, Math.min(maxSize.width, newSize.width)),
        height: Math.max(minSize.height, Math.min(maxSize.height, newSize.height)),
      });
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsMinimized(false);
    }
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    setIsFullscreen(false);
    setIsMinimized(false);
    onClose();
  };

  if (!open) return null;

  // Calculate dimensions based on state
  const getDimensions = () => {
    if (isFullscreen) {
      return {
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        position: 'fixed' as const,
      };
    }
    
    if (isMinimized) {
      return {
        width: 300,
        height: 50,
        top: position.y,
        left: position.x,
        position: 'fixed' as const,
      };
    }
    
    return {
      width: size.width,
      height: size.height,
      top: position.y,
      left: position.x,
      position: 'fixed' as const,
    };
  };

  const dimensions = getDimensions();

  const modalContent = (
    <Box
      sx={{
        ...dimensions,
        zIndex,
        pointerEvents: 'auto',
        ...(isMobile && !resizable && {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }),
      }}
      className={className}
    >
      {resizable && !isFullscreen && !isMinimized ? (
        <ResizableBox
          width={size.width}
          height={size.height}
          minConstraints={[minSize.width, minSize.height]}
          maxConstraints={[maxSize.width, maxSize.height]}
          onResize={handleResize}
          resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'n', 'e', 'w']}
        >
          <Paper
            elevation={isFullscreen ? 0 : 8}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.paper,
              borderRadius: isFullscreen ? 0 : 2,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              ref={dragRef}
              onMouseDown={handleMouseDown}
              sx={{
                cursor: isDragging ? 'grabbing' : (draggable && !isFullscreen && !isMinimized ? 'grab' : 'default'),
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                minHeight: 48,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {draggable && !isFullscreen && !isMinimized && (
                  <DragIndicatorIcon sx={{ opacity: 0.7 }} />
                )}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showMinimizeButton && !isFullscreen && (
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleToggleMinimize}
                    aria-label={isMinimized ? 'restore' : 'minimize'}
                    size="small"
                  >
                    <MinimizeIcon />
                  </IconButton>
                )}
                
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={handleToggleFullscreen}
                  aria-label={isFullscreen ? 'exit fullscreen' : 'fullscreen'}
                  size="small"
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={handleClose}
                  aria-label="close"
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Content */}
            {!isMinimized && (
              <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {children}
              </Box>
            )}
          </Paper>
        </ResizableBox>
      ) : (
        <Paper
          elevation={isFullscreen ? 0 : 8}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
            borderRadius: isFullscreen ? 0 : 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            ref={dragRef}
            onMouseDown={handleMouseDown}
            sx={{
              cursor: isDragging ? 'grabbing' : (draggable && !isFullscreen && !isMinimized ? 'grab' : 'default'),
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              padding: '8px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
              minHeight: 48,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {draggable && !isFullscreen && !isMinimized && (
                <DragIndicatorIcon sx={{ opacity: 0.7 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {showMinimizeButton && !isFullscreen && (
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={handleToggleMinimize}
                  aria-label={isMinimized ? 'restore' : 'minimize'}
                  size="small"
                >
                  <MinimizeIcon />
                </IconButton>
              )}
              
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleToggleFullscreen}
                aria-label={isFullscreen ? 'exit fullscreen' : 'fullscreen'}
                size="small"
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
              
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          {!isMinimized && (
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {children}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );

  // Render in portal to ensure proper z-index layering
  return createPortal(modalContent, document.body);
};

export default ReusableModal;
