"use client"

import React, { createContext, useContext, useReducer, useEffect, useState } from "react"
import type { 
  Chat, Message, Contact, ChatCategory, UserBasicDetails, ChatNotification,
  ChatSettings, DraftMessage, Attachment, ContactInvitation, UserStatus
} from "../interfaces/Messenger"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import * as MessengerAPI from "../functions/Messenger"

interface MessengerState {
  chats: Chat[]
  messages: { [chatId: string]: Message[] }
  contacts: Contact[]
  activeChat: Chat | null
  categories: ChatCategory[]
  users: UserBasicDetails[]
  userStatuses: { [userId: string]: UserStatus }
  contactInvitations: ContactInvitation[]
  notifications: ChatNotification[]
  chatSettings: { [chatId: string]: ChatSettings }
  drafts: { [chatId: string]: DraftMessage }
  searchResults: Message[]
  isLoading: boolean
  isSearching: boolean
  error: string | null
  basePath: string
}

type MessengerAction =
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "ADD_CHAT"; payload: Chat }
  | { type: "UPDATE_CHAT"; payload: { chatId: string; updates: Partial<Chat> } }
  | { type: "DELETE_CHAT"; payload: string }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_ACTIVE_CHAT"; payload: Chat | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BASE_PATH"; payload: string }

interface MessengerContextType {
  state: MessengerState
  dispatch: React.Dispatch<MessengerAction>
  // Permission functions
  canViewMessenger: () => boolean
  canEditMessenger: () => boolean
  canDeleteMessenger: () => boolean
  isOwner: () => boolean
  
  // Core Functions
  setActiveChat: (chatId: string | null) => void
  createChat: (name: string, participants: string[], type: Chat["type"], options?: Partial<Chat>) => Promise<string | null>
  sendMessage: (text: string, attachments?: Attachment[]) => Promise<boolean>
  refreshChats: () => Promise<void>
  
  // Extended Functions (placeholder implementations)
  updateChatDetails: (chatId: string, updates: Partial<Chat>) => Promise<boolean>
  deleteChat: (chatId: string) => Promise<boolean>
  forwardMessage: (messageId: string, targetChatIds: string[]) => Promise<boolean>
  editMessage: (messageId: string, newText: string) => Promise<boolean>
  deleteMessage: (messageId: string) => Promise<boolean>
  pinMessage: (messageId: string) => Promise<boolean>
  unpinMessage: (messageId: string) => Promise<boolean>
  markAsRead: (messageId: string) => Promise<boolean>
  addReaction: (messageId: string, emoji: string) => Promise<boolean>
  removeReaction: (messageId: string, emoji: string) => Promise<boolean>
  searchMessages: (query: string, chatId?: string) => Promise<Message[]>
  setUserStatus: (status: UserStatus["status"], customStatus?: string) => Promise<boolean>
  getWorkContacts: () => UserBasicDetails[]
  getSavedContacts: () => Contact[]
  sendContactInvitation: (toUserId: string, message?: string) => Promise<boolean>
  acceptContactInvitation: (invitationId: string) => Promise<boolean>
  declineContactInvitation: (invitationId: string) => Promise<boolean>
  removeContact: (contactId: string) => Promise<boolean>
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<boolean>
  createCategory: (name: string, options?: Partial<ChatCategory>) => Promise<string | null>
  updateCategory: (categoryId: string, updates: Partial<ChatCategory>) => Promise<boolean>
  deleteCategory: (categoryId: string) => Promise<boolean>
  updateChatSettings: (chatId: string, settings: Partial<ChatSettings>) => Promise<boolean>
  saveDraft: (chatId: string, text: string, attachments?: Attachment[]) => Promise<boolean>
  getDraft: (chatId: string) => Promise<DraftMessage | null>
  uploadAttachment: (file: File) => Promise<Attachment | null>
}

const MessengerContext = createContext<MessengerContextType | undefined>(undefined)

const initialState: MessengerState = {
  chats: [], messages: {}, contacts: [], activeChat: null, categories: [], users: [],
  userStatuses: {}, contactInvitations: [], notifications: [], chatSettings: {},
  drafts: {}, searchResults: [], isLoading: false, isSearching: false, error: null, basePath: ""
}

const messengerReducer = (state: MessengerState, action: MessengerAction): MessengerState => {
  switch (action.type) {
    case "SET_CHATS": return { ...state, chats: action.payload }
    case "ADD_CHAT": return { ...state, chats: [...state.chats, action.payload] }
    case "UPDATE_CHAT": return {
      ...state, chats: state.chats.map(chat => 
        chat.id === action.payload.chatId ? { ...chat, ...action.payload.updates } : chat)
    }
    case "DELETE_CHAT": return { ...state, chats: state.chats.filter(chat => chat.id !== action.payload) }
    case "SET_MESSAGES": return { ...state, messages: { ...state.messages, [action.payload.chatId]: action.payload.messages } }
    case "ADD_MESSAGE": return {
      ...state, messages: { ...state.messages, [action.payload.chatId]: [...(state.messages[action.payload.chatId] || []), action.payload] }
    }
    case "SET_ACTIVE_CHAT": return { ...state, activeChat: action.payload }
    case "SET_LOADING": return { ...state, isLoading: action.payload }
    case "SET_ERROR": return { ...state, error: action.payload }
    case "SET_BASE_PATH": return { ...state, basePath: action.payload }
    default: return state
  }
}

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(messengerReducer, initialState)
  const { getBasePath, state: companyState, autoSelectSiteIfOnlyOne, isOwner, hasPermission } = useCompany()
  const { state: settingsState } = useSettings()

  useEffect(() => {
    // If messenger data level is site/subsite and no site selected, try to auto-select one
    const messengerLevel = companyState.dataManagement?.messenger
    if ((messengerLevel === "site" || messengerLevel === "subsite") && !companyState.selectedSiteID) {
      // Fire and forget; basePath will recompute on selection change
      autoSelectSiteIfOnlyOne().catch(() => {})
    }

    const newBasePath = getBasePath("messenger")
    
    dispatch({ type: "SET_BASE_PATH", payload: newBasePath })
    // Ensure functions layer (which reads localStorage) has the active companyId
    if (companyState.companyID) {
      try {
        localStorage.setItem("companyId", companyState.companyID)
        if (companyState.selectedSiteID) localStorage.setItem("siteId", companyState.selectedSiteID)
        if (companyState.selectedSubsiteID) localStorage.setItem("subsiteId", companyState.selectedSubsiteID)
      } catch (_) {
        // no-op for environments without localStorage
      }
    }
    // Diagnostics - only log when basePath actually changes
    try {
      if (state.basePath !== newBasePath) {
        console.log("MessengerContext basePath computed:", newBasePath, {
          companyId: companyState.companyID,
          siteId: companyState.selectedSiteID,
          subsiteId: companyState.selectedSubsiteID,
          messengerLevel,
        })
      }
    } catch {
      // Ignore localStorage errors in environments without localStorage
    }
  }, [getBasePath, companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID, companyState.dataManagement?.messenger])

  // Auto-load chats when base path is set with debouncing to prevent multiple calls
  const [lastRefreshKey, setLastRefreshKey] = useState<string>("")
  
  useEffect(() => {
    const refreshKey = `${state.basePath}-${settingsState.auth?.uid}`
    
    if (state.basePath && settingsState.auth?.uid && !state.isLoading && refreshKey !== lastRefreshKey) {
      setLastRefreshKey(refreshKey)
      refreshChats()
    }
  }, [state.basePath, settingsState.auth?.uid, state.isLoading, lastRefreshKey])

  // Real-time: refresh chats when user's chat index or chats collection changes
  useEffect(() => {
    if (!state.basePath || !settingsState.auth?.uid) return
    const unsubscribe = MessengerAPI.listenToChatList(() => {
      // Lightweight refresh to keep list current
      refreshChats()
    })
    return () => {
      try { unsubscribe && unsubscribe() } catch {}
    }
    // basePath/auth changes re-subscribe
  }, [state.basePath, settingsState.auth?.uid])

  const refreshChats = async () => {
    if (!state.basePath) return
    // Persist companyId so functions/Messenger.tsx resolves correct basePath
    if (companyState.companyID) {
      try { localStorage.setItem("companyId", companyState.companyID) } catch (_) {}
    }
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const chats = await MessengerAPI.fetchUserChats()
      dispatch({ type: "SET_CHATS", payload: chats })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load chats" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const setActiveChat = (chatId: string | null) => {
    const chat = chatId ? state.chats.find(c => c.id === chatId) || null : null
    dispatch({ type: "SET_ACTIVE_CHAT", payload: chat })
  }

  const createChat = async (name: string, participants: string[], type: Chat["type"], options?: Partial<Chat>): Promise<string | null> => {
    try {
      // For company chats, force the name to the selected company name
      const effectiveName = type === "company" && (companyState.companyName || name)
        ? (companyState.companyName || name)
        : name
      const createdId = await MessengerAPI.createChat(
        effectiveName,
        participants,
        type,
        {
          companyId: companyState.companyID || undefined,
          siteId: companyState.selectedSiteID || undefined,
          createdBy: settingsState.auth.uid || undefined,
          isPrivate: false,
          isArchived: false,
          ...(options || {}),
        }
      )
      if (createdId) {
        // Refresh to include the new chat in state
        await refreshChats()
      }
      return createdId
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to create chat" })
      return null
    }
  }

  const sendMessage = async (text: string, attachments?: Attachment[]): Promise<boolean> => {
    if (!state.activeChat) return false
    try {
      const messageId = await MessengerAPI.sendMessage(
        state.activeChat.id,
        text,
        undefined,
        undefined,
        attachments
      )
      if (messageId) {
        // Optionally fetch latest messages or optimistically update
        return true
      }
      return false
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to send message" })
      return false
    }
  }

  // Placeholder implementations for extended functions
  const updateChatDetails = async (chatId: string, updates: Partial<Chat>) => { console.log("updateChatDetails", chatId, updates); return true }
  const deleteChat = async (chatId: string) => { console.log("deleteChat", chatId); return true }
  const forwardMessage = async (messageId: string, targetChatIds: string[]) => { console.log("forwardMessage", messageId, targetChatIds); return true }
  const editMessage = async (messageId: string, newText: string) => { console.log("editMessage", messageId, newText); return true }
  const deleteMessage = async (messageId: string) => { console.log("deleteMessage", messageId); return true }
  const pinMessage = async (messageId: string) => { console.log("pinMessage", messageId); return true }
  const unpinMessage = async (messageId: string) => { console.log("unpinMessage", messageId); return true }
  const markAsRead = async (messageId: string) => { console.log("markAsRead", messageId); return true }
  const addReaction = async (messageId: string, emoji: string) => { console.log("addReaction", messageId, emoji); return true }
  const removeReaction = async (messageId: string, emoji: string) => { console.log("removeReaction", messageId, emoji); return true }
  const searchMessages = async (query: string, chatId?: string) => { console.log("searchMessages", query, chatId); return [] }
  const setUserStatus = async (status: UserStatus["status"], customStatus?: string) => { console.log("setUserStatus", status, customStatus); return true }
  const getWorkContacts = () => state.users.filter(u => u.companyIds.includes(companyState.companyID || "") && u.uid !== settingsState.auth.uid)
  const getSavedContacts = () => state.contacts.filter(c => c.type === "saved")
  const sendContactInvitation = async (toUserId: string, message?: string) => { console.log("sendContactInvitation", toUserId, message); return true }
  const acceptContactInvitation = async (invitationId: string) => { console.log("acceptContactInvitation", invitationId); return true }
  const declineContactInvitation = async (invitationId: string) => { console.log("declineContactInvitation", invitationId); return true }
  const removeContact = async (contactId: string) => { console.log("removeContact", contactId); return true }
  const updateContact = async (contactId: string, updates: Partial<Contact>) => { console.log("updateContact", contactId, updates); return true }
  const createCategory = async (name: string, options?: Partial<ChatCategory>) => { console.log("createCategory", name, options); return "cat-" + Date.now() }
  const updateCategory = async (categoryId: string, updates: Partial<ChatCategory>) => { console.log("updateCategory", categoryId, updates); return true }
  const deleteCategory = async (categoryId: string) => { console.log("deleteCategory", categoryId); return true }
  const updateChatSettings = async (chatId: string, settings: Partial<ChatSettings>) => { console.log("updateChatSettings", chatId, settings); return true }
  const saveDraft = async (chatId: string, text: string, attachments?: Attachment[]) => { console.log("saveDraft", chatId, text, attachments); return true }
  const getDraft = async (chatId: string) => { console.log("getDraft", chatId); return null }
  const uploadAttachment = async (file: File) => { console.log("uploadAttachment", file.name); return null }

  // Prefetch and listen to messages of the active chat
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const activeId = state.activeChat?.id
    if (activeId) {
      try {
        // Prefetch recent messages so the window is populated immediately
        MessengerAPI.fetchMessages(activeId, 50)
          .then((msgs) => dispatch({ type: "SET_MESSAGES", payload: { chatId: activeId, messages: msgs } }))
          .catch(() => {})
        unsubscribe = MessengerAPI.listenToMessages(activeId, (msgs) => {
          dispatch({ type: "SET_MESSAGES", payload: { chatId: activeId, messages: msgs } })
        })
      } catch (e) {
        console.warn("Failed to subscribe to messages", e)
      }
    }
    return () => {
      try { if (unsubscribe) unsubscribe() } catch {}
    }
  }, [state.activeChat?.id])

  const contextValue: MessengerContextType = {
    state, dispatch, setActiveChat, createChat, sendMessage, refreshChats,
    updateChatDetails, deleteChat, forwardMessage, editMessage, deleteMessage,
    pinMessage, unpinMessage, markAsRead, addReaction, removeReaction, searchMessages,
    setUserStatus, getWorkContacts, getSavedContacts, sendContactInvitation,
    acceptContactInvitation, declineContactInvitation, removeContact, updateContact,
    createCategory, updateCategory, deleteCategory, updateChatSettings, saveDraft, getDraft, uploadAttachment,
    // Permission functions - Owner has full access
    canViewMessenger: () => isOwner() || hasPermission("messenger", "chat", "view"),
    canEditMessenger: () => isOwner() || hasPermission("messenger", "chat", "edit"),
    canDeleteMessenger: () => isOwner() || hasPermission("messenger", "chat", "delete"),
    isOwner: () => isOwner()
  }

  return <MessengerContext.Provider value={contextValue}>{children}</MessengerContext.Provider>
}

export const useMessenger = (): MessengerContextType => {
  const context = useContext(MessengerContext)
  if (!context) {
    // Return a safe default context instead of throwing error
    // Only warn in development mode to reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.warn("useMessenger called outside MessengerProvider - returning empty context")
    }
    
    const emptyState: MessengerState = {
      chats: [],
      messages: {},
      contacts: [],
      activeChat: null,
      categories: [],
      users: [],
      userStatuses: {},
      contactInvitations: [],
      notifications: [],
      chatSettings: {},
      drafts: {},
      searchResults: [],
      isLoading: false,
      isSearching: false,
      error: null,
      basePath: "",
    }
    
    const emptyContext: MessengerContextType = {
      state: emptyState,
      dispatch: () => {},
      canViewMessenger: () => false,
      canEditMessenger: () => false,
      canDeleteMessenger: () => false,
      isOwner: () => false,
      setActiveChat: () => {},
      createChat: async () => null,
      sendMessage: async () => false,
      refreshChats: async () => {},
      updateChatDetails: async () => false,
      deleteChat: async () => false,
      forwardMessage: async () => false,
      editMessage: async () => false,
      deleteMessage: async () => false,
      pinMessage: async () => false,
      unpinMessage: async () => false,
      markAsRead: async () => false,
      addReaction: async () => false,
      removeReaction: async () => false,
      searchMessages: async () => [],
      setUserStatus: async () => false,
      getWorkContacts: () => [],
      getSavedContacts: () => [],
      sendContactInvitation: async () => false,
      acceptContactInvitation: async () => false,
      declineContactInvitation: async () => false,
      removeContact: async () => false,
      updateContact: async () => false,
      createCategory: async () => null,
      updateCategory: async () => false,
      deleteCategory: async () => false,
      updateChatSettings: async () => false,
      saveDraft: async () => false,
      getDraft: async () => null,
      uploadAttachment: async () => null,
    }
    
    return emptyContext
  }
  return context
}

// Export types for frontend consumption
export type { 
  Chat, 
  Message, 
  Contact, 
  ChatCategory, 
  UserBasicDetails, 
  ChatNotification,
  ChatSettings, 
  DraftMessage, 
  Attachment, 
  ContactInvitation, 
  UserStatus
} from "../interfaces/Messenger"
