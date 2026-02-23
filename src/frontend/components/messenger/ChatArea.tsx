"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Paper,
  Chip,
  InputAdornment,
  Collapse,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
} from "@mui/material"
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material"
import { useMessenger, Chat, Message } from "../../../backend/context/MessengerContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
// Use Messenger context instead of Company context
import MessageList from "./MessageList"
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react"
// Removed direct Firebase auth import - using context instead

interface ChatAreaProps {
  chat: Chat
  onBack?: () => void
  showBackButton?: boolean
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, onBack, showBackButton }) => {
  const { state, sendMessage, forwardMessage } = useMessenger()
  const { state: companyState } = useCompany()
  const { state: settingsState } = useSettings()
  // Use Messenger context for company data
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const [selectedChats, setSelectedChats] = useState<string[]>([])
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Header actions simplified; settings menu only

  useEffect(() => {
    // Focus message input when chat changes
    if (messageInputRef.current) {
      messageInputRef.current.focus()
    }
    scrollToBottom()
  }, [chat.id])
  
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setIsTyping(true)
    try {
      const mapped: { id: string; type: "image" | "video" | "audio" | "document" | "file"; url: string; name: string; size: number; mimeType: string; metadata: Record<string, any> }[] | undefined = attachments.length > 0
        ? attachments.map((file) => ({
            id: crypto.randomUUID(),
            type: (file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("video/")
              ? "video"
              : file.type.startsWith("audio/")
              ? "audio"
              : file.type.startsWith("application/")
              ? "document"
              : "file") as "image" | "video" | "audio" | "document" | "file",
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            mimeType: file.type,
            metadata: {},
          }))
        : undefined

      await sendMessage(newMessage, mapped)

      // Assume success if no error was thrown
      setNewMessage("")
      setAttachments([])
      setReplyTo(null)
      scrollToBottom()
      setShowEmojiPicker(false)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  // Star/Mute actions removed with simplified header

  const handleReply = (message: Message) => {
    setReplyTo(message)
    if (messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }

  const handleEdit = (message: Message) => {
    setNewMessage(message.text)
    setReplyTo(null) // Clear any existing reply
    if (messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }

  const handleForward = (message: Message) => {
    setForwardingMessage(message)
    setShowForwardDialog(true)
  }

  const handleForwardConfirm = async () => {
    if (forwardingMessage && selectedChats.length > 0) {
      try {
        // Forward the message to selected chats in one call
        await forwardMessage(forwardingMessage.id, selectedChats)
        // Assume success if no error was thrown
        setShowForwardDialog(false)
        setForwardingMessage(null)
        setSelectedChats([])
      } catch (error) {
        console.error("Error forwarding message:", error)
      }
    }
  }

  const handleForwardCancel = () => {
    setShowForwardDialog(false)
    setForwardingMessage(null)
    setSelectedChats([])
  }

  const handleChatToggle = (chatId: string) => {
    setSelectedChats((prev) => (prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]))
  }

  const getChatIcon = () => {
    switch (chat.type) {
      case "company":
        return <BusinessIcon />
      case "site":
        return <LocationIcon />
      case "department":
        return <WorkIcon />
      case "group":
        return <GroupIcon />
      default:
        return chat.name.charAt(0).toUpperCase()
    }
  }

  const getChatSubtitle = () => {
    switch (chat.type) {
      case "company":
        return "Company-wide chat"
      case "site":
        return "Site chat"
      case "department":
        return "Department chat"
      case "group":
        return `${chat.participants?.length ?? 0} members`
      case "direct":
        const otherParticipant = state.users?.find(
          (user) => user.uid !== settingsState.auth?.uid && (chat.participants || []).includes(user.uid),
        )
        const status = state.userStatuses?.[otherParticipant?.uid || ""]
        return status ? `${status.status}${status.customStatus ? ` - ${status.customStatus}` : ""}` : "offline"
      default:
        return ""
    }
  }

  return (
    <Box sx={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column", 
      minHeight: 0,
      position: "relative"
    }}>
      {/* Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          {showBackButton && (
            <IconButton onClick={onBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              chat.type === "direct" ? (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    border: "2px solid white",
                  }}
                />
              ) : chat.type === "group" ? (
                <Avatar
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: "primary.main",
                    fontSize: "0.6rem",
                  }}
                >
                  {(chat.participants?.length ?? 0)}
                </Avatar>
              ) : null
            }
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 40,
                height: 40,
              }}
            >
              {getChatIcon()}
            </Avatar>
          </Badge>
          <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {chat.type === "company" ? (companyState.companyName || chat.name) : chat.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getChatSubtitle()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={handleMenuClick}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <MessageList
          messages={state.messages?.[chat.id] || []}
          onReply={handleReply}
          onForward={handleForward}
          onEdit={handleEdit}
          currentUserId={settingsState.auth?.uid || ""}
        />
      </Box>

      {/* Reply Preview */}
      <Collapse in={!!replyTo}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mx: 2,
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "action.hover",
            borderLeft: 3,
            borderColor: "primary.main",
            borderRadius: 1,
            flexShrink: 0
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Replying to {replyTo?.firstName} {replyTo?.lastName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {replyTo?.text}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyTo(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: "divider",
          flexShrink: 0,
          bgcolor: "background.paper"
        }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Attachments ({attachments.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeAttachment(index)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Message Input */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: "divider", 
        bgcolor: "background.paper", 
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        flexShrink: 0
      }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} size="small">
            <EmojiIcon />
          </IconButton>
          <IconButton onClick={handleAttachClick} size="small">
            <AttachFileIcon />
          </IconButton>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} multiple />
          <TextField
            ref={messageInputRef}
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            disabled={isTyping}
            InputProps={{
              endAdornment: isTyping && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && attachments.length === 0) || isTyping}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Emoji Picker */}
        <Collapse in={showEmojiPicker}>
          <Box sx={{ mt: 2 }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height={300} />
          </Box>
        </Collapse>
      </Box>

      {/* Forward Dialog */}
      <Dialog open={showForwardDialog} onClose={handleForwardCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Forward Message</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select chats to forward this message to:
          </Typography>
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {state.chats
              .filter((c) => c.id !== chat.id) // Don't show current chat
              .map((chatItem) => (
                <ListItem key={chatItem.id} disablePadding>
                  <ListItem button onClick={() => handleChatToggle(chatItem.id)} sx={{ pl: 0 }}>
                    <Checkbox checked={selectedChats.includes(chatItem.id)} tabIndex={-1} disableRipple />
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>{chatItem.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={chatItem.name} secondary={`${chatItem.participants?.length ?? 0} members`} />
                  </ListItem>
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleForwardCancel}>Cancel</Button>
          <Button onClick={handleForwardConfirm} variant="contained" disabled={selectedChats.length === 0}>
            Forward ({selectedChats.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => console.log("View info")}>
          <GroupIcon sx={{ mr: 1 }} />
          Chat Info
        </MenuItem>
        <MenuItem onClick={() => console.log("Search messages")}>
          <SearchIcon sx={{ mr: 1 }} />
          Search Messages
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => console.log("Clear history")}>
          <DeleteIcon sx={{ mr: 1 }} />
          Clear History
        </MenuItem>
        <MenuItem onClick={() => console.log("Leave chat")} sx={{ color: "error.main" }}>
          <ExitToAppIcon sx={{ mr: 1 }} />
          Leave Chat
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ChatArea
