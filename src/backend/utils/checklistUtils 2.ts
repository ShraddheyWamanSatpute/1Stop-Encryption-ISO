import type { CompanyChecklist, ChecklistCompletion, ItemResponse } from "../interfaces/Company"

// Define ChecklistMetrics interface for dashboard
export interface ChecklistMetrics {
  totalChecklists: number
  completedOnTime: number
  completedLate: number
  overdue: number
  completionRate: number
  averageScore: number
  streakCount: number
}

// Date and time utilities
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

export const isToday = (timestamp: number): boolean => {
  const today = new Date()
  const date = new Date(timestamp)
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  )
}

// Update the function to handle the correct schedule types and property names
export const isOverdue = (checklist: CompanyChecklist, lastCompletion?: ChecklistCompletion): boolean => {
  if (!checklist.schedule) return false
  
  const scheduleType = checklist.schedule.type
  
  // Continuous checklists are never overdue, they're always available
  if (scheduleType === "continuous") {
    return false
  }
  
  if (!lastCompletion) return true

  const now = Date.now()
  const lastCompletedAt = lastCompletion.completedAt

  switch (scheduleType) {
    case "daily":
      return now - lastCompletedAt > 24 * 60 * 60 * 1000 // 24 hours
    case "weekly":
      return now - lastCompletedAt > 7 * 24 * 60 * 60 * 1000 // 7 days
    case "monthly":
      return now - lastCompletedAt > 30 * 24 * 60 * 60 * 1000 // 30 days
    case "yearly":
      return now - lastCompletedAt > 365 * 24 * 60 * 60 * 1000 // 365 days
    case "4week":
      return now - lastCompletedAt > 28 * 24 * 60 * 60 * 1000 // 28 days (4 weeks)
    default:
      return false
  }
}

// Calculate completion score based on responses, excluding log section items
export const calculateCompletionScore = (
  responses: Record<string, ItemResponse>,
  checklist?: CompanyChecklist
): number => {
  if (!responses || Object.keys(responses).length === 0) return 0
  
  // Filter out log section items if checklist is provided
  const filteredResponses = checklist ? 
    Object.entries(responses).filter(([itemId]) => {
      // Check if this item belongs to a logs section
      const isLogSectionItem = checklist.sections
        .filter(section => section.sectionType === 'logs')
        .some(section => 
          section.items.some(item => item.id.replace(/[.#$\[\]/]/g, '_') === itemId)
        )
      return !isLogSectionItem
    }).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<string, ItemResponse>) : 
    responses
  
  // If all items were log section items, return 100% (perfect score)
  if (Object.keys(filteredResponses).length === 0) return 100
  
  const totalItems = Object.keys(filteredResponses).length
  const passedItems = Object.values(filteredResponses).filter(r => r.completed).length
  
  return Math.round((passedItems / totalItems) * 100)
}

// Check if completion is late
export const isCompletionLate = (completion: ChecklistCompletion, checklist: CompanyChecklist): boolean => {
  if (!completion.scheduledFor || !checklist.schedule) return false
  
  // Get the due time based on closing time if available
  let dueTime = completion.scheduledFor;
  if (checklist.schedule?.closingTime) {
    const [hours, minutes] = checklist.schedule.closingTime.split(':').map(Number);
    const dueDate = new Date(completion.scheduledFor);
    dueDate.setHours(hours || 0, minutes || 0, 0, 0);
    dueTime = dueDate.getTime();
  }
  
  return completion.completedAt > dueTime;
}

// Count how many completions were submitted late
export const getLateCompletionsCount = (completions: ChecklistCompletion[], checklists: CompanyChecklist[]): number => {
  if (!completions || completions.length === 0) return 0
  return completions.filter(completion => {
    // A completion is late if it's overdue or if the computed status is late/expired
    if (completion.status === 'overdue') return true
    const checklist = checklists.find(c => c.id === completion.checklistId)
    if (checklist) {
      const computedStatus = getChecklistStatus(checklist, [completion])
      return computedStatus === 'late' || computedStatus === 'expired'
    }
    return false
  }).length
}

// Check if checklist is open for completion
export const isChecklistOpen = (checklist: CompanyChecklist): boolean => {
  if (!checklist.schedule) return true
  
  const now = Date.now();
  
  // If the checklist has an opening time and closing time
  if (checklist.schedule.openingTime && checklist.schedule.closingTime) {
    // Convert opening and closing times to timestamps for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse opening time (HH:MM format)
    const [openHours, openMinutes] = checklist.schedule.openingTime.split(':').map(Number);
    const openingTimestamp = new Date(today);
    openingTimestamp.setHours(openHours, openMinutes, 0, 0);
    
    // Parse closing time (HH:MM format)
    const [closeHours, closeMinutes] = checklist.schedule.closingTime.split(':').map(Number);
    const closingTimestamp = new Date(today);
    closingTimestamp.setHours(closeHours, closeMinutes, 0, 0);
    
    // Handle case where closing time is earlier than opening time (next day)
    if (closingTimestamp.getTime() < openingTimestamp.getTime()) {
      closingTimestamp.setDate(closingTimestamp.getDate() + 1); // Move to next day
    }
    
    // Calculate expire time (if set, otherwise use closing time)
    let expireTimestamp;
    if (checklist.schedule.expireTime) {
      // expireTime is in hours after closing time
      expireTimestamp = new Date(closingTimestamp.getTime() + (checklist.schedule.expireTime * 60 * 60 * 1000));
    } else {
      expireTimestamp = closingTimestamp;
    }
    
    // Checklist is open if current time is between opening time and expire time
    return now >= openingTimestamp.getTime() && now <= expireTimestamp.getTime();
  }
  
  return true;
}

// Check if checklist is overdue
export const isChecklistOverdue = (checklist: CompanyChecklist, lastCompletion?: ChecklistCompletion): boolean => {
  return isOverdue(checklist, lastCompletion)
}

// Get schedule timestamps for a checklist
export const getScheduleTimestamps = (): { next: number, deadline: number } => {
  const now = Date.now()
  const nextDay = now + 24 * 60 * 60 * 1000
  
  return {
    next: now,
    deadline: nextDay
  }
}

// Calculate metrics for dashboard
export const getChecklistMetrics = (checklists: CompanyChecklist[], completions: ChecklistCompletion[]): ChecklistMetrics => {
  const totalChecklists = checklists.length
  let completedOnTime = 0
  let completedLate = 0
  let overdue = 0
  let totalScore = 0
  let scoreCount = 0
  
  // Process completions
  completions.forEach(completion => {
    if (completion.status === 'completed') {
      // Calculate if completion is late
      const checklist = checklists.find(c => c.id === completion.checklistId)
      const isLate = checklist ? isCompletionLate(completion, checklist) : false
      
      if (isLate) {
        completedLate++
      } else {
        completedOnTime++
      }
      
      // Calculate completion score
      const score = calculateCompletionScore(completion.responses)
      if (score !== undefined) {
        totalScore += score
        scoreCount++
      }
    }
  })
  
  // Count overdue checklists
  checklists.forEach(checklist => {
    const lastCompletion = completions.find(c => c.checklistId === checklist.id)
    if (isOverdue(checklist, lastCompletion)) {
      overdue++
    }
  })
  
  return {
    totalChecklists,
    completedOnTime,
    completedLate,
    overdue,
    completionRate: totalChecklists > 0 ? ((completedOnTime + completedLate) / totalChecklists) * 100 : 0,
    averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
    streakCount: 7 // Placeholder value
  }
}

export const getNextDueDate = (checklist: CompanyChecklist, lastCompletion?: ChecklistCompletion): number => {
  if (!checklist.schedule) return Date.now()
  const scheduleType = checklist.schedule.type
  const now = Date.now()
  
  // For continuous checklists, they're always due now
  if (scheduleType === "continuous") {
    return now
  }
  
  const baseTime = lastCompletion?.completedAt || now

  switch (scheduleType) {
    case "daily":
      return baseTime + 24 * 60 * 60 * 1000
    case "weekly": {
      // For weekly checklists, calculate the next week occurrence
      const nextWeek = baseTime + 7 * 24 * 60 * 60 * 1000
      // If no completion or completion is old, start from current week
      if (!lastCompletion || (now - lastCompletion.completedAt) > 7 * 24 * 60 * 60 * 1000) {
        // Calculate start of current week (Monday)
        const currentDate = new Date(now)
        const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday to 6, others to dayOfWeek - 1
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - daysToMonday)
        startOfWeek.setHours(0, 0, 0, 0)
        return startOfWeek.getTime()
      }
      return nextWeek
    }
    case "4week": {
      // For 4-week cycles, use the startDate if available, otherwise calculate from last completion
      const schedule = checklist.schedule
      const startDate = schedule && 'startDate' in schedule && typeof schedule.startDate === 'number' ? schedule.startDate : undefined
      if (startDate) {
        // Calculate how many 4-week cycles have passed since start date
        const cycleLength = 28 * 24 * 60 * 60 * 1000 // 28 days in milliseconds
        const timeSinceStart = now - startDate
        const cyclesPassed = Math.floor(timeSinceStart / cycleLength)
        const nextCycleStart = startDate + ((cyclesPassed + 1) * cycleLength)
        
        // If we're still in the current cycle and no completion, return current cycle start
        if (!lastCompletion || lastCompletion.completedAt < (startDate + (cyclesPassed * cycleLength))) {
          return startDate + (cyclesPassed * cycleLength)
        }
        
        return nextCycleStart
      }
      // Fallback to adding 28 days to base time if no start date
      return baseTime + 28 * 24 * 60 * 60 * 1000
    }
    case "monthly":
      return baseTime + 30 * 24 * 60 * 60 * 1000
    case "yearly":
      return baseTime + 365 * 24 * 60 * 60 * 1000
    default:
      return baseTime + 24 * 60 * 60 * 1000
  }
}

// Check if a checklist is expired based on expire time
export const isExpired = (checklist: CompanyChecklist, lastCompletion?: ChecklistCompletion): boolean => {
  if (!checklist.schedule?.expireTime || !checklist.schedule?.closingTime) return false
  
  const dueDate = getNextDueDate(checklist, lastCompletion)
  
  // Get the opening time if available
  let openingTimestamp = null;
  if (checklist.schedule.openingTime) {
    const [openHours, openMinutes] = checklist.schedule.openingTime.split(':').map(Number);
    const openingDate = new Date(dueDate);
    openingDate.setHours(openHours, openMinutes, 0, 0);
    openingTimestamp = openingDate.getTime();
  }
  
  // Parse closing time (HH:MM format)
  const [closeHours, closeMinutes] = checklist.schedule.closingTime.split(':').map(Number);
  const closingDate = new Date(dueDate);
  closingDate.setHours(closeHours, closeMinutes, 0, 0);
  let closingTimestamp = closingDate.getTime();
  
  // Handle case where closing time is earlier than opening time (next day)
  if (openingTimestamp && closingTimestamp < openingTimestamp) {
    closingDate.setDate(closingDate.getDate() + 1); // Move to next day
    closingTimestamp = closingDate.getTime();
  }
  
  // Calculate expire time based on closing time
  const expireDate = closingTimestamp + (checklist.schedule.expireTime * 60 * 60 * 1000) // Convert hours to milliseconds
  const now = Date.now()
  
  return now > expireDate
}

export const getChecklistStatus = (
  checklist: CompanyChecklist,
  completions: ChecklistCompletion[],
  instanceDate?: number // Optional parameter to check status for a specific instance date
): "completed" | "overdue" | "due" | "upcoming" | "late" | "expired" => {
  const userCompletions = completions.filter((c) => c.checklistId === checklist.id)
  const lastCompletion = userCompletions.sort((a, b) => b.completedAt - a.completedAt)[0]

  if (!checklist.schedule) {
    return "upcoming"
  }

  // Handle continuous checklists - they're always available for completion
  if (checklist.schedule.type === "continuous") {
    // If there's a recent completion (within the last hour), show as completed
    if (lastCompletion && (Date.now() - lastCompletion.completedAt) < 60 * 60 * 1000) {
      return "completed"
    }
    // Otherwise, continuous checklists are always due
    return "due"
  }

  // If we're checking a specific instance date
  if (instanceDate) {
    // Find completion for this specific instance
    const instanceCompletion = userCompletions.find(c => {
      // For daily checklists, match by the day of scheduledFor
      if (checklist.schedule?.type === "daily") {
        if (!c.scheduledFor) return false
        const scheduledDate = new Date(c.scheduledFor)
        const targetDate = new Date(instanceDate)
        return scheduledDate.getFullYear() === targetDate.getFullYear() &&
               scheduledDate.getMonth() === targetDate.getMonth() &&
               scheduledDate.getDate() === targetDate.getDate()
      }
      // For other schedule types, use exact scheduledFor match
      return c.scheduledFor === instanceDate
    })
    
    // If we have a completion for this instance
    if (instanceCompletion) {
      // Ensure we return a valid status type
      if (instanceCompletion.status === "in_progress") {
        return "due" // Map in_progress to due for consistency
      }
      
      // Return the stored status - this ensures that completed late items stay marked as "late"
      // and expired items stay marked as "expired" even after completion
      return instanceCompletion.status as "completed" | "overdue" | "due" | "upcoming" | "late" | "expired"
    }
    
    const now = Date.now()
    
    // Get the closing time for this instance
    let closingTimestamp = instanceDate;
    
    // If the checklist has a closing time, use it
    if (checklist.schedule.closingTime) {
      // Get opening time if available
      let openingTimestamp = null;
      if (checklist.schedule.openingTime) {
        const [openHours, openMinutes] = checklist.schedule.openingTime.split(':').map(Number);
        const openingDate = new Date(instanceDate);
        openingDate.setHours(openHours, openMinutes, 0, 0);
        openingTimestamp = openingDate.getTime();
      }
      
      // Parse closing time (HH:MM format)
      const [closeHours, closeMinutes] = checklist.schedule.closingTime.split(':').map(Number);
      const closingDate = new Date(instanceDate);
      closingDate.setHours(closeHours, closeMinutes, 0, 0);
      closingTimestamp = closingDate.getTime();
      
      // Handle case where closing time is earlier than opening time (next day)
      if (openingTimestamp && closingTimestamp < openingTimestamp) {
        closingDate.setDate(closingDate.getDate() + 1); // Move to next day
        closingTimestamp = closingDate.getTime();
      }
      
      const instanceDate24HoursAgo = closingTimestamp - (24 * 60 * 60 * 1000); // 24 hours before closing time
      
      // If current time is before opening time, it's upcoming
      if (openingTimestamp && now < openingTimestamp) {
        return "upcoming";
      }
      
      // If current time is more than 24 hours before closing time, it's upcoming
      if (now < instanceDate24HoursAgo) {
        return "upcoming";
      }
      
      // If current time is between 24 hours before closing and closing time, it's due
      if (now >= instanceDate24HoursAgo && now <= closingTimestamp) {
        return "due";
      }
      
      // If we've passed closing time but haven't checked expire time yet, it's overdue by default
      // This ensures we don't default to "upcoming" when the status should be "overdue"
      if (now > closingTimestamp) {
        return "overdue";
      }
    }
    
    // Calculate expire time if set
    if (checklist.schedule.expireTime) {
      const expireTimestamp = closingTimestamp + (checklist.schedule.expireTime * 60 * 60 * 1000);
      
      // If current time is between closing time and expire time, it's overdue
      if (now > closingTimestamp && now <= expireTimestamp) {
        return "overdue";
      }
      
      // If current time is past expire time, it's expired
      if (now > expireTimestamp) {
        return "expired";
      }
    } else {
      // If no expire time and past closing time, it's overdue
      if (now > closingTimestamp) {
        return "overdue";
      }
    }
    
    // Default for instances without specific time handling
    if (instanceDate > now) {
      return "upcoming";
    } else if (isToday(instanceDate)) {
      return "due";
    } else {
      return "overdue";
    }
  }
  
  // Original logic for getting current status (not for a specific instance)
  // Check if checklist is expired
  if (isExpired(checklist, lastCompletion)) {
    return "expired";
  }

  // Check if there's a recent completion
  if (lastCompletion) {
    const dueDate = getNextDueDate(checklist, lastCompletion);
    
    // If completed recently and not yet time for next occurrence
    if (lastCompletion.completedAt > dueDate - getScheduleInterval(checklist.schedule.type)) {
      // Check if completion was late by comparing completedAt to dueDate
      const wasLate = lastCompletion.completedAt > dueDate
      return wasLate ? "late" : "completed";
    }
  }

  const now = Date.now();
  const nextDueDate = getNextDueDate(checklist, lastCompletion);
  
  // Get the closing time for the next due date
  let closingTimestamp = nextDueDate;
  
  // If the checklist has a closing time, use it
  if (checklist.schedule.closingTime) {
    // Parse closing time (HH:MM format)
    const nextDueDate24HoursAgo = nextDueDate - (24 * 60 * 60 * 1000); // 24 hours before due date
    const [closeHours, closeMinutes] = checklist.schedule.closingTime.split(':').map(Number);
    const closingDate = new Date(nextDueDate);
    closingDate.setHours(closeHours, closeMinutes, 0, 0);
    closingTimestamp = closingDate.getTime();
    
    // If current time is more than 24 hours before closing time, it's upcoming
    if (now < nextDueDate24HoursAgo) {
      return "upcoming";
    }
    
    // If current time is between 24 hours before closing and closing time, it's due
    if (now >= nextDueDate24HoursAgo && now <= closingTimestamp) {
      return "due";
    }
    
    // If current time is past closing time, check if it's expired
    if (now > closingTimestamp) {
      // Calculate expire time if set
      if (checklist.schedule.expireTime) {
        const expireTimestamp = closingTimestamp + (checklist.schedule.expireTime * 60 * 60 * 1000);
        
        // If current time is between closing time and expire time, it's overdue
        if (now <= expireTimestamp) {
          return "overdue";
        } else {
          return "expired";
        }
      } else {
        return "overdue";
      }
    }
  }

  // Default fallback logic
  if (isToday(nextDueDate)) {
    return "due";
  }

  return "upcoming";
}

export const filterChecklistsByStatus = (
  checklists: CompanyChecklist[],
  completions: ChecklistCompletion[],
  status: "completed" | "overdue" | "due" | "upcoming" | "late" | "expired",
): CompanyChecklist[] => {
  return checklists.filter((checklist) => getChecklistStatus(checklist, completions) === status)
}

// Generate instances for repeating checklists
export interface ChecklistInstance {
  checklist: CompanyChecklist
  instanceDate: number
  status: "completed" | "overdue" | "due" | "upcoming" | "late" | "expired"
}

// Generate instances for a repeating checklist
export const generateChecklistInstances = (
  checklist: CompanyChecklist,
  completions: ChecklistCompletion[],
  daysToShow: number = 7 // Default to showing a week's worth of instances
): ChecklistInstance[] => {
  // Get checklist creation date - only generate instances after this date
  const checklistCreatedAt = checklist.createdAt || 0
  const creationDate = new Date(checklistCreatedAt)
  creationDate.setHours(0, 0, 0, 0) // Start of creation day
  
  if (!checklist.schedule) {
    // Non-repeating checklist, just return a single instance if it's after creation
    const instanceDate = Math.max(Date.now(), checklistCreatedAt)
    return [{
      checklist,
      instanceDate,
      status: getChecklistStatus(checklist, completions)
    }]
  }
  
  const instances: ChecklistInstance[] = []
  const now = Date.now()
  const userCompletions = completions.filter(c => c.checklistId === checklist.id)
  const lastCompletion = userCompletions.sort((a, b) => b.completedAt - a.completedAt)[0]
  
  // Start from the last completion or current time - no longer used directly
  // Keeping track of last completion for reference
  
  // For daily checklists, start from today and go back to find any overdue instances
  if (checklist.schedule.type === "daily") {
    // Start from today at midnight, but not before creation date
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    // Find the most recent completion for today
    // Match by scheduledFor to find the completion for today's instance
    const todayCompletion = userCompletions.find(c => {
      if (!c.scheduledFor) return false
      const scheduledDate = new Date(c.scheduledFor)
      return scheduledDate.getFullYear() === today.getFullYear() &&
             scheduledDate.getMonth() === today.getMonth() &&
             scheduledDate.getDate() === today.getDate()
    })
    
    // If no completion today, add today's instance
    if (!todayCompletion) {
      // Force recalculation of status for today
      const todayStatus = getChecklistStatus(checklist, completions, today.getTime())
      
      instances.push({
        checklist,
        instanceDate: today.getTime(),
        status: todayStatus
      })
    } else {
      // Today is completed - use the actual completion status (could be "completed", "late", or "expired")
      const completionStatus = todayCompletion.status as "completed" | "overdue" | "due" | "upcoming" | "late" | "expired"
      instances.push({
        checklist,
        instanceDate: today.getTime(),
        status: completionStatus
      })
    }
    
    // Add past instances that might be overdue (up to 7 days back)
    // But don't go back before the creation date
    for (let i = 1; i <= daysToShow; i++) {
      const pastDate = new Date(today)
      pastDate.setDate(pastDate.getDate() - i)
      pastDate.setHours(0, 0, 0, 0)
      
      // Skip if this date is before the checklist creation date
      if (pastDate.getTime() < checklistCreatedAt) {
        break
      }
      
      const pastCompletion = userCompletions.find(c => {
        if (!c.scheduledFor) return false
        const scheduledDate = new Date(c.scheduledFor)
        return scheduledDate.getFullYear() === pastDate.getFullYear() &&
               scheduledDate.getMonth() === pastDate.getMonth() &&
               scheduledDate.getDate() === pastDate.getDate()
      })
      
      if (pastCompletion) {
        // Add completed instance with its actual status
        const completionStatus = pastCompletion.status as "completed" | "overdue" | "due" | "upcoming" | "late" | "expired"
        instances.push({
          checklist,
          instanceDate: pastDate.getTime(),
          status: completionStatus
        })
      } else {
        // Add uncompleted past instance
        const status = getChecklistStatus(checklist, completions, pastDate.getTime())
        // Only add if it's not expired
        if (status !== "expired") {
          instances.push({
            checklist,
            instanceDate: pastDate.getTime(),
            status
          })
        }
      }
    }
    
    // Add future instances
    for (let i = 1; i <= daysToShow; i++) {
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + i)
      futureDate.setHours(0, 0, 0, 0)
      
      instances.push({
        checklist,
        instanceDate: futureDate.getTime(),
        status: "upcoming"
      })
    }
  } else if (checklist.schedule.type === "continuous") {
    // For continuous checklists, just return a single always-available instance
    instances.push({
      checklist,
      instanceDate: now,
      status: getChecklistStatus(checklist, completions)
    })
  } else if (checklist.schedule.type === "4week") {
    // For 4-week cycles, generate instances based on the start date
    const cycleLength = 28 * 24 * 60 * 60 * 1000 // 28 days in milliseconds
    
    // Check if there's a start date - if not, use old logic for legacy checklists
    const schedule = checklist.schedule
    const scheduleStartDate = schedule && 'startDate' in schedule && typeof schedule.startDate === 'number' ? schedule.startDate : undefined
    if (scheduleStartDate) {
      // Use the later of startDate or creation date
      const effectiveStartDate = Math.max(scheduleStartDate, checklistCreatedAt)
      
      // Calculate current cycle
      const timeSinceStart = now - effectiveStartDate
      const currentCycle = Math.floor(timeSinceStart / cycleLength)
      const currentCycleStart = effectiveStartDate + (currentCycle * cycleLength)
      
      // Add current cycle if not completed
      const currentCycleCompletion = userCompletions.find(c => 
        c.completedAt >= currentCycleStart && c.completedAt < (currentCycleStart + cycleLength)
      )
      
      if (!currentCycleCompletion && currentCycleStart <= now) {
        instances.push({
          checklist,
          instanceDate: currentCycleStart,
          status: getChecklistStatus(checklist, completions, currentCycleStart)
        })
      } else if (currentCycleCompletion) {
        instances.push({
          checklist,
          instanceDate: currentCycleStart,
          status: "completed"
        })
      }
      
      // Add next cycle if current is completed
      if (currentCycleCompletion) {
        const nextCycleStart = effectiveStartDate + ((currentCycle + 1) * cycleLength)
        instances.push({
          checklist,
          instanceDate: nextCycleStart,
          status: nextCycleStart <= now ? "due" : "upcoming"
        })
      }
    } else {
      // Legacy checklists without start date - use old logic
      const baseTime = lastCompletion?.completedAt || Math.max(now, checklistCreatedAt)
      const nextDue = baseTime + cycleLength
      
      instances.push({
        checklist,
        instanceDate: nextDue,
        status: getChecklistStatus(checklist, completions)
      })
    }
  } else {
    // For weekly, monthly, yearly checklists, use the original logic
    instances.push({
      checklist,
      instanceDate: getNextDueDate(checklist, lastCompletion),
      status: getChecklistStatus(checklist, completions)
    })
  }
  
  return instances
}

export const sortChecklistsByPriority = (
  checklists: CompanyChecklist[],
  completions: ChecklistCompletion[],
): CompanyChecklist[] => {
  return checklists.sort((a, b) => {
    const statusA = getChecklistStatus(a, completions)
    const statusB = getChecklistStatus(b, completions)

    // Priority order: expired > overdue > due > upcoming > late > completed
    const priorityOrder = { expired: 0, overdue: 1, due: 2, upcoming: 3, late: 4, completed: 5 }
    return priorityOrder[statusA] - priorityOrder[statusB]
  })
}

export const getCompletionRate = (checklist: CompanyChecklist, completions: ChecklistCompletion[]): number => {
  const checklistCompletions = completions.filter((c) => c.checklistId === checklist.id)
  if (checklistCompletions.length === 0) return 0

  const completedCount = checklistCompletions.filter((c) => c.status === "completed").length
  return Math.round((completedCount / checklistCompletions.length) * 100)
}

export const getStreakCount = (checklist: CompanyChecklist, completions: ChecklistCompletion[]): number => {
  const checklistCompletions = completions
    .filter((c) => c.checklistId === checklist.id && c.status === "completed")
    .sort((a, b) => b.completedAt - a.completedAt)

  if (checklistCompletions.length === 0) return 0

  let streak = 0
  if (!checklist.schedule) return 0
  const scheduleInterval = getScheduleInterval(checklist.schedule.type)

  for (let i = 0; i < checklistCompletions.length; i++) {
    const completion = checklistCompletions[i]
    const expectedTime = Date.now() - i * scheduleInterval

    // Allow some tolerance (6 hours)
    if (Math.abs(completion.completedAt - expectedTime) <= 6 * 60 * 60 * 1000) {
      streak++
    } else {
      break
    }
  }

  return streak
}

const getScheduleInterval = (scheduleType: string): number => {
  switch (scheduleType) {
    case "daily":
      return 24 * 60 * 60 * 1000
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000
    case "yearly":
      return 365 * 24 * 60 * 60 * 1000
    case "4week":
      return 28 * 24 * 60 * 60 * 1000 // 28 days (4 weeks)
    case "continuous":
      return 0 // Continuous checklists don't have intervals
    default:
      return 24 * 60 * 60 * 1000
  }
}

export const calculateProgress = (checklist: CompanyChecklist, completion: ChecklistCompletion): number => {
  if (!checklist.items || checklist.items.length === 0) return 0

  const completedItems = Object.values(completion.responses).filter((response: ItemResponse) => {
    const item = checklist.items?.find((i) => i.id === response.itemId)
    if (!item) return false

    switch (item.type) {
      case "yesno":
        return response.value === "yes"
      case "number":
        return response.value !== null && response.value !== undefined
      case "text":
        return response.value && response.value.toString().trim().length > 0
      case "photo":
        return response.photos && response.photos.length > 0
      default:
        return false
    }
  })

  return Math.round((completedItems.length / checklist.items.length) * 100)
}

// Fix the validation function to use 'title' instead of 'text'
export const validateChecklistCompletion = (
  checklist: CompanyChecklist,
  completion: Partial<ChecklistCompletion>,
): string[] => {
  const errors: string[] = []

  if (!completion.responses || Object.keys(completion.responses).length === 0) {
    errors.push("At least one response is required")
    return errors
  }

  checklist.items?.forEach((item) => {
    const response = completion.responses?.[item.id]

    if (item.required && !response) {
      errors.push(`Response required for: ${item.title}`) // Changed from item.text to item.title
      return
    }

    if (response) {
      switch (item.type) {
        case "yesno":
          if (!["yes", "no"].includes(response.value as string)) {
            errors.push(`Invalid yes/no response for: ${item.title}`) // Changed from item.text to item.title
          }
          break
        case "number":
          if (typeof response.value !== "number") {
            errors.push(`Number required for: ${item.title}`) // Changed from item.text to item.title
          }
          break
        case "text":
          if (!response.value || response.value.toString().trim().length === 0) {
            errors.push(`Text required for: ${item.title}`) // Changed from item.text to item.title
          }
          break
        case "photo":
          if (!response.photos || response.photos.length === 0) {
            errors.push(`Photo required for: ${item.title}`) // Changed from item.text to item.title
          }
          break
      }
    }
  })

  return errors
}
