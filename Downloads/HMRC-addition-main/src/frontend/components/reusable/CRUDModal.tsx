"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Slide,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface CRUDModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  disableEscapeKeyDown?: boolean
  disableBackdropClick?: boolean
  // Additional properties for CRUD functionality
  mode?: 'create' | 'edit' | 'view'
  onSave?: (data: any) => void | Promise<void>
  onEdit?: () => void
  saveButtonText?: string
  editButtonText?: string
  cancelButtonText?: string
  loading?: boolean
  hideDefaultActions?: boolean
  disabled?: boolean
  // Form ref for integration
  formRef?: React.RefObject<{ submit: () => void }>
}

const CRUDModal: React.FC<CRUDModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  actions,
  maxWidth = 'md',
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  mode,
  onSave,
  onEdit,
  saveButtonText = 'Save',
  editButtonText = 'Edit',
  cancelButtonText = 'Cancel',
  loading = false,
  hideDefaultActions = false,
  disabled = false,
  formRef,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleClose = () => {
    setIsFullscreen(false)
    onClose()
  }

  const handleSave = async () => {
    if (!onSave) return
    
    try {
      setIsSaving(true)
      
      // Use formRef if available
      if (formRef && formRef.current) {
        formRef.current.submit()
      } else {
        // Fallback: Look for a form submit function in the children
        const formElement = document.querySelector('form')
        if (formElement) {
          // Trigger form submission which will call the form's handleSubmit
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
          formElement.dispatchEvent(submitEvent)
        } else {
          // Last resort: call onSave with empty data (should not happen)
          console.warn('No form ref or submit button found, calling onSave with empty data')
          await onSave({})
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
  }

  // Generate default actions based on mode
  const getDefaultActions = () => {
    if (hideDefaultActions) return actions
    
    const defaultActions = []
    
    // Cancel button (always present except in view mode, unless cancelButtonText is undefined)
    if (mode !== 'view' && cancelButtonText !== undefined) {
      defaultActions.push(
        <Button
          key="cancel"
          onClick={handleClose}
          disabled={isSaving || loading}
        >
          {cancelButtonText}
        </Button>
      )
    }
    
    // Mode-specific buttons
    if (mode === 'view') {
      if (onEdit) {
        defaultActions.push(
          <Button
            key="edit"
            onClick={handleEdit}
            variant="contained"
            startIcon={<EditIcon />}
            disabled={loading}
          >
            {editButtonText}
          </Button>
        )
      }
      defaultActions.push(
        <Button
          key="close"
          onClick={handleClose}
          variant="outlined"
        >
          Close
        </Button>
      )
    } else if (mode === 'create' || mode === 'edit') {
      if (onSave) {
        defaultActions.push(
          <Button
            key="save"
            onClick={handleSave}
            variant="contained"
            startIcon={isSaving || loading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={isSaving || loading || disabled}
          >
            {isSaving ? 'Saving...' : saveButtonText}
          </Button>
        )
      }
    }
    
    // If custom actions are provided, merge them with default actions
    if (actions) {
      return [...defaultActions, actions]
    }
    
    return defaultActions
  }

  return (
    <Dialog
      open={open}
      onClose={disableBackdropClick ? undefined : handleClose}
      TransitionComponent={Transition}
      maxWidth={isFullscreen ? false : maxWidth}
      fullWidth={!isFullscreen}
      fullScreen={isFullscreen || isMobile}
      disableEscapeKeyDown={disableEscapeKeyDown}
      PaperProps={{
        sx: {
          borderRadius: isFullscreen ? 0 : 2,
          minHeight: isFullscreen ? '100vh' : 'auto',
          maxHeight: isFullscreen ? '100vh' : '90vh',
          width: isFullscreen ? '100vw' : 'auto',
          margin: isFullscreen ? 0 : 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            {icon && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {title && (
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {!isMobile && (
              <IconButton
                onClick={handleToggleFullscreen}
                size="small"
                sx={{
                  color: 'inherit',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'inherit',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 3,
            flex: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 4,
            },
          }}
        >
          {children}
        </Box>
      </DialogContent>

      {/* Actions */}
      {(actions || !hideDefaultActions) && (
        <DialogActions
          sx={{
            p: 2,
            pt: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
            gap: 1,
          }}
        >
          {(() => {
            const actions = getDefaultActions()
            console.log("CRUDModal: Rendering DialogActions with", Array.isArray(actions) ? actions.length : 0, "actions")
            return actions
          })()}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default CRUDModal

