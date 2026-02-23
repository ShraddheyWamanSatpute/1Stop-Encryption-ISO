"use client"
import type React from "react"
import {
  Button,
  Box,
  Typography,
  Card,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Alert,
  LinearProgress,
  Divider,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
} from "@mui/icons-material"
import { useState, useRef } from "react"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "../../../backend/services/Firebase"
import type {
  ChecklistItem,
  ItemResponse,
  MultipleEntryResponse,
  ChecklistSection
} from "../../../backend/interfaces/Company"
import { useCompany, CompanyChecklist, ChecklistCompletion } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
import CRUDModal from "../reusable/CRUDModal"

interface ChecklistCompletionProps {
  open: boolean
  onClose: () => void
  checklist: CompanyChecklist
  instanceDate?: number | null
  onComplete: (completion: ChecklistCompletion) => void
}

// Utility functions that were previously imported
const calculateCompletionScore = (responses: Record<string, ItemResponse>, checklist: CompanyChecklist): number => {
  // Simple implementation - calculate percentage of completed items
  const totalItems = checklist.sections.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = Object.values(responses).filter(r => r.completed).length;
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
};

const parseTime = (time?: string) => {
  if (!time) return { h: 23, m: 59 }
  const [h, m] = time.split(":").map((n) => Number(n) || 0)
  return { h, m }
}

const getDueDate = (checklist: CompanyChecklist, base: Date): Date => {
  const due = new Date(base)
  const schedule = checklist.schedule || ({} as any)
  switch (schedule.type) {
    case "daily": {
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    case "weekly": {
      const openingDay = (schedule.openingDay || "monday") as any
      const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
      const target = dayMap[openingDay] ?? 1
      const current = due.getDay()
      const diff = ((target - current + 7) % 7)
      due.setDate(due.getDate() + diff)
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    case "monthly": {
      const openingDate = schedule.openingDate || 1
      due.setDate(openingDate)
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      if (due < base) due.setMonth(due.getMonth() + 1)
      return due
    }
    case "4week": {
      // Narrow schedule for 4-week type to access optional startDate safely
      const s = schedule as { type: '4week'; startDate?: number; closingTime?: string }
      const start = s.startDate ? new Date(s.startDate) : base
      const msInDay = 24 * 60 * 60 * 1000
      const daysSince = Math.floor((base.getTime() - start.getTime()) / msInDay)
      const daysToNext = 28 - (daysSince % 28)
      due.setDate(due.getDate() + (daysToNext % 28))
      const { h, m } = parseTime(s.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
    default: {
      const { h, m } = parseTime(schedule.closingTime)
      due.setHours(h, m, 0, 0)
      return due
    }
  }
}

const getNextDueDate = (checklist: CompanyChecklist, instanceDate?: number | null): Date => {
  if (instanceDate) return new Date(instanceDate)
  const now = new Date()
  return getDueDate(checklist, now)
}

const ChecklistCompletionDialog: React.FC<ChecklistCompletionProps> = ({ open, onClose, checklist, instanceDate, onComplete }) => {
  const { state: companyState, createChecklistCompletion } = useCompany()
  const { state: settingsState } = useSettings()
  
  // Create loginState from settingsState
  const loginState = {
    uid: settingsState.auth?.uid || ''
  }
  


  const [responses, setResponses] = useState<Record<string, ItemResponse>>({})
  const [logEntries, setLogEntries] = useState<Record<string, MultipleEntryResponse[]>>({})
  const [notes, setNotes] = useState("")
  const [signature, setSignature] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef<number>(Date.now())

  const sections = checklist.sections || []
  // Filter out log sections when calculating total items
  const totalItems = sections.reduce((sum, section) => {
    // Skip log sections in the count
    if ((section.sectionType || 'normal') === 'logs') {
      return sum
    }
    return sum + section.items.length
  }, 0)
  
  // Count only completed items that are not in log sections
  const completedItems = Object.values(responses).filter((r) => {
    // Check if this response is for an item in a log section
    const isLogSectionItem = sections
      .filter(section => (section.sectionType || 'normal') === 'logs')
      .some(section => 
        section.items.some(item => item.id.replace(/[.#$\[\]/]/g, '_') === r.itemId)
      )
    return r.completed && !isLogSectionItem
  }).length
  
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 100 // Return 100% if no non-log items

  const hasCompany = Boolean(companyState.companyID)
  const hasSite = Boolean(companyState.selectedSiteID)
  const hasUser = Boolean(loginState.uid)
  const canCompleteChecklist = hasCompany && hasSite && hasUser

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const handleResponseChange = (
    itemId: string,
    value: any,
    photos?: string[],
    isOutOfRange?: boolean,
    warningLevel?: "warning" | "critical",
    explanation?: string,
  ) => {
    const item = sections.flatMap((s) => s.items).find((i) => i.id === itemId)
    setResponses((prev) => ({
      ...prev,
      [itemId]: {
        itemId,
        type: item?.type as any,
        value,
        completed: value !== null && value !== "" && value !== undefined && value !== false,
        photos: photos || prev[itemId]?.photos || [],
        isOutOfRange: isOutOfRange || false,
        warningLevel: warningLevel || "warning",
        explanation: explanation || prev[itemId]?.explanation || "",
      },
    }))
  }

  const uploadPhotoToStorage = async (file: File, itemId: string): Promise<string> => {
    const fileName = `checklist-photos/${companyState.companyID}/${checklist.id}/${itemId}/${Date.now()}_${file.name}`
    const photoRef = storageRef(storage, fileName)

    const snapshot = await uploadBytes(photoRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return downloadURL
  }

  const handlePhotoUpload = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploadingPhotos((prev) => ({ ...prev, [itemId]: true }))

    try {
      const photoUrls: string[] = []

      for (const file of Array.from(files)) {
        const url = await uploadPhotoToStorage(file, itemId)
        photoUrls.push(url)
      }

      const currentResponse = responses[itemId]
      const existingPhotos = currentResponse?.photos || []
      handleResponseChange(itemId, currentResponse?.value || true, [...existingPhotos, ...photoUrls])
    } catch (error) {
      console.error("Error uploading photos:", error)
      setError("Failed to upload photos. Please try again.")
    } finally {
      setUploadingPhotos((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const removePhoto = (itemId: string, photoIndex: number) => {
    const currentResponse = responses[itemId]
    if (currentResponse?.photos) {
      const newPhotos = currentResponse.photos.filter((_: string, index: number) => index !== photoIndex)
      handleResponseChange(itemId, currentResponse.value, newPhotos)
    }
  }

  const validateResponses = (): string[] => {
    const errors: string[] = []
    // Require signature
    if (!signature || signature.trim() === "") {
      errors.push("Digital signature is required to complete this checklist")
    }
    sections.forEach((section) => {
      // Skip validation for logs sections - they are not required
      if ((section.sectionType || 'normal') === 'logs') {
        return
      }
      
      section.items.forEach((item) => {
        const response = responses[item.id]
        if (item.required && (!response || !response.completed)) {
          errors.push(`${section.title}: ${item.title} is required`)
          return
        }

        if (response) {
          // Check if explanation is required
          if (
            item.type === "checkbox" &&
            response.value === false &&
            item.validation?.requireExplanationWhenNo &&
            !response.explanation
          ) {
            errors.push(`${section.title}: ${item.title} - Explanation required for "No" response`)
          }
          if (
            item.type === "number" &&
            response.isOutOfRange &&
            item.validation?.requireExplanationWhenOutOfRange &&
            !response.explanation
          ) {
            errors.push(`${section.title}: ${item.title} - Explanation required for out of range value`)
          }
        }
      })
    })
    return errors
  }

  const renderLogEntryInput = (sectionId: string, entryIndex: number, item: ChecklistItem) => {
    const entries = logEntries[sectionId] || []
    const entry = entries[entryIndex]
    const value = entry?.fields[item.id] || ''
    
    switch (item.type) {
      case 'text':
        return (
          <TextField
            size="small"
            fullWidth
            value={value || ''}
            onChange={(e) => handleLogEntryChange(sectionId, entryIndex, item.id, e.target.value)}
          />
        )
      case 'number':
        return (
          <TextField
            size="small"
            fullWidth
            type="number"
            value={value || ''}
            onChange={(e) => handleLogEntryChange(sectionId, entryIndex, item.id, Number(e.target.value))}
          />
        )
      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(value)}
            onChange={(e) => handleLogEntryChange(sectionId, entryIndex, item.id, e.target.checked)}
          />
        )
      default:
        return null
    }
  }

  const handleComplete = async () => {
    console.log("DEBUG - Starting checklist completion process")
    if (!companyState.companyID || !companyState.selectedSiteID || !loginState.uid) {
      console.log("ERROR - Missing required state:", { 
        companyID: companyState.companyID ? "Present" : "Missing", 
        siteID: companyState.selectedSiteID ? "Present" : "Missing", 
        uid: loginState.uid ? "Present" : "Missing" 
      })
      return
    }

    const validationErrors = validateResponses()
    if (validationErrors.length > 0) {
      console.log("DEBUG - Validation failed with errors:", validationErrors)
      setError(validationErrors.join("\n"))
      return
    }
    console.log("DEBUG - Validation passed successfully")

    try {
      setLoading(true)
      setError(null)
      console.log("DEBUG - Starting checklist submission process")

      const completedAt = Date.now()
      // Use provided instanceDate if any, else compute based on schedule
      const due = getNextDueDate(checklist, instanceDate ?? null)
      const scheduledFor = due.getTime()
      
      // Process log entries into responses format and sanitize IDs
      const processedResponses = { ...responses }
      
      // Sanitize existing response keys to remove invalid characters
      const sanitizedResponses: Record<string, ItemResponse> = {}
      Object.entries(processedResponses).forEach(([key, value]) => {
        const sanitizedKey = key.replace(/[.#$\[\]/]/g, '_')
        sanitizedResponses[sanitizedKey] = {
          ...value,
          itemId: sanitizedKey
        }
      })
      
      Object.entries(logEntries).forEach(([sectionId, entries]) => {
        const section = sections.find(s => s.id === sectionId)
        if (section && section.sectionType === 'logs') {
          section.items.forEach(item => {
            const sanitizedItemId = item.id.replace(/[.#$\[\]\/]/g, '_')
            
            // Sanitize each log entry ID and field keys to ensure Firebase compatibility
            const sanitizedEntries = entries.map(entry => ({
              ...entry,
              id: entry.id.replace(/[.#$\[\]\/]/g, '_'),
              fields: Object.entries(entry.fields).reduce((acc, [fieldKey, fieldValue]) => {
                const sanitizedFieldKey = fieldKey.replace(/[.#$\[\]\/]/g, '_')
                return { ...acc, [sanitizedFieldKey]: fieldValue }
              }, {})
            }))
            
            sanitizedResponses[sanitizedItemId] = {
              itemId: sanitizedItemId,
              type: 'multiple_entry',
              value: sanitizedEntries,
              completed: entries.length > 0
            }
          })
        }
      })
      
      const finalResponses = sanitizedResponses

      // Determine completion status based on due date (closingTime) and expiration
      let completionStatus: "completed" | "late" | "expired" = "completed"
      const closingTime = checklist.schedule?.closingTime
      let dueTime = scheduledFor
      if (closingTime) {
        const { h, m } = parseTime(closingTime)
        const dueDate = new Date(scheduledFor)
        dueDate.setHours(h || 0, m || 0, 0, 0)
        dueTime = dueDate.getTime()
      }
      const isLate = completedAt > dueTime
      const expireHours = checklist.schedule?.expireTime
      const expireAt = expireHours ? dueTime + expireHours * 60 * 60 * 1000 : null
      if (expireAt && completedAt > expireAt) {
        completionStatus = "expired"
      } else if (isLate) {
        completionStatus = "late"
      }
      
      // Create completion data
      const completion: ChecklistCompletion = {
        id: "",
        checklistId: checklist.id,
        completedBy: loginState.uid,
        completedAt,
        startedAt: startTime.current,
        scheduledFor,
        responses: finalResponses,
        status: completionStatus as any,
        overallNotes: notes.trim(),
        signature: signature.trim(),
        completionScore: calculateCompletionScore(finalResponses, checklist),
        isLate,
      }

      console.log("DEBUG - Final completion data being submitted:", {
        checklistId: completion.checklistId,
        status: completion.status,
        completedAt: new Date(completion.completedAt).toLocaleString(),
        scheduledFor: completion.scheduledFor ? new Date(completion.scheduledFor).toLocaleString() : 'Not scheduled',
        isLate: completion.isLate,
        signature: completion.signature ? "Provided" : "Missing",
        responseCount: Object.keys(finalResponses).length
      })

      console.log("DEBUG - Calling createChecklistCompletion")
      
      // Use the CompanyContext function with the correct signature
      const completionID = await createChecklistCompletion(completion)
      
      console.log("DEBUG - Received completion ID:", completionID)

      // Update the completion with the ID returned from Firebase
      completion.id = completionID

      console.log("DEBUG - Final checklist completion object:", {
        id: completion.id,
        status: completion.status,
        completedAt: completion.completedAt ? new Date(completion.completedAt).toLocaleString() : 'undefined'
      })
      
      console.log("DEBUG - Calling onComplete callback")
      onComplete(completion)
      console.log("DEBUG - Closing dialog and resetting form")
      onClose()
      resetForm()
    } catch (err) {
      console.error("ERROR - Failed to complete checklist:", err)
      setError("Failed to complete checklist")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    console.log("DEBUG - Resetting form state")
    setResponses({})
    setLogEntries({})
    setNotes("")
    setSignature("")
    setError(null)
    setExpandedSections({})
    startTime.current = Date.now()
  }

  const renderItemInput = (item: ChecklistItem) => {
    const response = responses[item.id]
    const needsExplanation =
      (item.type === "checkbox" && response?.value === false && item.validation?.requireExplanationWhenNo) ||
      (item.type === "number" && response?.isOutOfRange && item.validation?.requireExplanationWhenOutOfRange)

    const checkValueRange = (value: number) => {
      const options = item.options
      if (options && typeof options === "object") {
        if (options.minValue !== undefined && value < options.minValue) {
          return { isOutOfRange: true, level: "critical" as const }
        }
        if (options.maxValue !== undefined && value > options.maxValue) {
          return { isOutOfRange: true, level: "critical" as const }
        }
        if (options.criticalThreshold !== undefined && value >= options.criticalThreshold) {
          return { isOutOfRange: false, level: "critical" as const }
        }
        if (options.warningThreshold !== undefined && value >= options.warningThreshold) {
          return { isOutOfRange: false, level: "warning" as const }
        }
      }
      return { isOutOfRange: false, level: "warning" as const }
    }

    switch (item.type) {
      case "checkbox":
        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={response?.value === true}
                      onChange={(e) => handleResponseChange(item.id, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{item.title}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </FormGroup>
              {needsExplanation && (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Explanation Required"
                  value={response?.explanation || ""}
                  onChange={(e) =>
                    handleResponseChange(
                      item.id,
                      response?.value,
                      response?.photos,
                      response?.isOutOfRange,
                      response?.warningLevel === "normal" ? undefined : response?.warningLevel,
                      e.target.value,
                    )
                  }
                  sx={{ mt: 2 }}
                  required
                  error={!response?.explanation}
                  helperText={!response?.explanation ? "Please provide an explanation" : ""}
                />
              )}
            </FormControl>
          </Box>
        )

      case "number":
        const numValue = Number(response?.value) || 0
        const rangeCheck = checkValueRange(numValue)
        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
              {item.title}
            </Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {item.description}
              </Typography>
            )}
            <TextField
              fullWidth
              type="number"
              value={response?.value || ""}
              onChange={(e) => {
                const value = Number(e.target.value)
                const check = checkValueRange(value)
                handleResponseChange(item.id, value, undefined, check.isOutOfRange, check.level)
              }}
              placeholder="Enter number"
              InputProps={{
                endAdornment: item.options?.unit ? (
                  <InputAdornment position="end">{item.options.unit}</InputAdornment>
                ) : undefined,
              }}
              error={rangeCheck.isOutOfRange}
            />
            {rangeCheck.level === "warning" && !rangeCheck.isOutOfRange && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Warning: This value is approaching the critical threshold.
              </Alert>
            )}
            {rangeCheck.level === "critical" && !rangeCheck.isOutOfRange && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Critical: This value has reached the critical threshold.
              </Alert>
            )}
            {rangeCheck.isOutOfRange && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Value is outside acceptable range
              </Alert>
            )}
            {needsExplanation && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Explanation Required"
                value={response?.explanation || ""}
                onChange={(e) =>
                  handleResponseChange(
                    item.id,
                    response?.value,
                    response?.photos,
                    response?.isOutOfRange,
                    response?.warningLevel === "normal" ? undefined : response?.warningLevel,
                    e.target.value,
                  )
                }
                sx={{ mt: 2 }}
                required
                error={!response?.explanation}
                helperText={!response?.explanation ? "Please provide an explanation for the out of range value" : ""}
              />
            )}
          </Box>
        )

      case "text":
        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
              {item.title}
            </Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {item.description}
              </Typography>
            )}
            <TextField
              fullWidth
              multiline={item.options?.multiline}
              rows={item.options?.multiline ? 3 : 1}
              value={response?.value || ""}
              onChange={(e) => handleResponseChange(item.id, e.target.value)}
              placeholder={item.options?.placeholder || "Enter your response"}
            />
          </Box>
        )

      case "file":
        return (
          <Box key={item.id} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
              {item.title}
            </Typography>
            {item.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {item.description}
              </Typography>
            )}
            <Box sx={{ mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handlePhotoUpload(item.id, e)}
              />
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhotos[item.id]}
              >
                {uploadingPhotos[item.id] ? "Uploading..." : "Take Photo"}
              </Button>
              {uploadingPhotos[item.id] && <LinearProgress sx={{ mt: 1 }} />}
            </Box>
            {response?.photos && response.photos.length > 0 && (
              <Grid container spacing={2}>
                {response.photos.map((photo: string, index: number) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Card>
                      <Box sx={{ position: "relative" }}>
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(255,255,255,0.8)",
                          }}
                          onClick={() => removePhoto(item.id, index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  const handleAddLogEntry = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    
    // Generate a Firebase-safe ID without periods, #, $, [, ], or /
    const newEntry: MultipleEntryResponse = {
      id: `entry-${Date.now()}-${Math.random().toString(36).replace(/[.#$\[\]\/]/g, '_').substr(2, 9)}`,
      fields: {},
      timestamp: Date.now()
    }
    
    setLogEntries(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), newEntry]
    }))
  }
  
  const handleLogEntryChange = (sectionId: string, entryIndex: number, itemId: string, value: any) => {
    setLogEntries(prev => {
      const sectionEntries = [...(prev[sectionId] || [])]
      sectionEntries[entryIndex] = {
        ...sectionEntries[entryIndex],
        fields: {
          ...sectionEntries[entryIndex].fields,
          [itemId]: value
        }
      }
      return {
        ...prev,
        [sectionId]: sectionEntries
      }
    })
  }
  
  const handleRemoveLogEntry = (sectionId: string, entryIndex: number) => {
    setLogEntries(prev => {
      const sectionEntries = [...(prev[sectionId] || [])]
      sectionEntries.splice(entryIndex, 1)
      return {
        ...prev,
        [sectionId]: sectionEntries
      }
    })
  }

  const renderSection = (section: ChecklistSection) => {
    const sectionResponses = section.items.map((item) => responses[item.id]).filter(Boolean)
    const sectionProgress = section.items.length > 0 ? (sectionResponses.length / section.items.length) * 100 : 0
    const isExpanded = expandedSections[section.id] ?? false
    
    // Check if this is a logs section (default to 'normal' if not specified)
    if (section.sectionType === 'logs') {
      return renderLogsSection(section)
    }

    return (
      <Accordion key={section.id} expanded={isExpanded} onChange={() => handleSectionToggle(section.id)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", mr: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{section.title}</Typography>
              {section.description && (
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              )}
            </Box>
            <Box sx={{ minWidth: 100, ml: 2 }}>
              <Typography variant="body2" color="text.secondary" align="right">
                {sectionResponses.length}/{section.items.length} completed
              </Typography>
              <LinearProgress variant="determinate" value={sectionProgress} sx={{ mt: 0.5, height: 4 }} />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ pt: 1 }}>{section.items.map((item) => renderItemInput(item))}</Box>
        </AccordionDetails>
      </Accordion>
    )
  }
  
  const renderLogsSection = (section: ChecklistSection) => {
    const entries = logEntries[section.id] || []
    const isExpanded = expandedSections[section.id] ?? false
    
    return (
      <Accordion key={section.id} expanded={isExpanded} onChange={() => handleSectionToggle(section.id)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", mr: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{section.title}</Typography>
              <Chip label="Logs Section" size="small" color="secondary" sx={{ mt: 0.5 }} />
            </Box>
            <Box sx={{ minWidth: 100, ml: 2 }}>
              <Typography variant="body2" color="text.secondary" align="right">
                {entries.length} log entries
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="120px">Timestamp</TableCell>
                  {section.items.map(item => (
                    <TableCell key={item.id}>{item.title}</TableCell>
                  ))}
                  <TableCell width="60px">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, entryIndex) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    {section.items.map(item => (
                      <TableCell key={item.id}>
                        {renderLogEntryInput(section.id, entryIndex, item)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRemoveLogEntry(section.id, entryIndex)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => handleAddLogEntry(section.id)}
          >
            Add Log Entry
          </Button>
        </AccordionDetails>
      </Accordion>
    )
  }

  return (
    <CRUDModal
      open={open}
      onClose={onClose}
      title={`Complete Checklist: ${checklist.title}`}
      icon={<CheckCircleIcon />}
      mode="create"
      onSave={handleComplete}
      saveButtonText={loading ? "Completing..." : "Complete Checklist"}
      maxWidth="lg"
      loading={loading}
      hideDefaultActions={false}
      disabled={!canCompleteChecklist || (totalItems > 0 && completedItems === 0)}
    >
        {!canCompleteChecklist && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please ensure a company and site are selected and you are signed in before completing a checklist.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, whiteSpace: "pre-line" }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Overall Progress */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedItems} of {totalItems} items
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        {/* Sections */}
        {sections.map((section) => renderSection(section))}

        {/* Additional Fields */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          
          {/* Additional Notes - Collapsible */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Additional Notes</Typography>
              {notes.trim() && (
                <Chip 
                  label="Has notes" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2 }} 
                />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or observations"
              />
            </AccordionDetails>
          </Accordion>
          
          {/* Digital Signature - Horizontal Layout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
              Digital Signature:
            </Typography>
            <TextField
              fullWidth
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full name as digital signature"
              size="small"
            />
          </Box>
        </Box>
    </CRUDModal>
  )
}

export default ChecklistCompletionDialog
