"use client"

import type React from "react"
import { useState } from "react"
import Papa from "papaparse"
import { ref, set } from "firebase/database"
import { db as database } from "../services/firebase"
import { Button, Typography, CircularProgress, TextField, Box } from "@mui/material"
import { Horizontal, Page } from "../styles/StyledComponents"

const sanitizeFirebaseKey = (key: string): string => {
  return (key || "")
    .replace(/[.#$/[\]]/g, "_") // Replace invalid characters with underscores
    .trim() // Trim leading/trailing whitespace
}

const UploadPage: React.FC = () => {
  const [date, setDate] = useState<string>("")
  const [runsheet, setRunsheet] = useState<string[][] | null>(null)
  const [preorders, setPreorders] = useState<string[][] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (file: File, type: "runsheet" | "preorders") => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const csvData = e.target?.result
      if (typeof csvData !== "string") {
        setError("Failed to read the file.")
        return
      }

      Papa.parse<string[]>(csvData, {
        complete: (results) => {
          const rows = results.data as string[][]
          if (type === "runsheet") {
            setRunsheet(rows)
          } else {
            setPreorders(rows)
          }
        },
        skipEmptyLines: true,
      })
    }

    reader.onerror = () => {
      setError("Error reading file.")
    }

    reader.readAsText(file)
  }

  const handleUploadToFirebase = async () => {
    if (!date) {
      setError("Please select a date before uploading.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const runsheetData = runsheet ? parseRunsheet(runsheet) : null
      const preorderData = preorders ? parsePreorders(preorders) : null

      if (!runsheetData && !preorderData) {
        throw new Error("No data to upload.")
      }

      await saveDataToFirebase(date, runsheetData, preorderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setUploading(false)
    }
  }

  const parseRunsheet = (rows: string[][]) => {
    const details: Record<string, any> = {}
    const bookings: Record<string, any> = {}
    const bookingCounts: Record<string, number> = {}
    const bookingReferences: Record<string, string> = {} // Track original booking names

    const columnTitlesRowIndex = rows.findIndex((row) => row[0]?.trim().toLowerCase() === "name")
    if (columnTitlesRowIndex === -1) {
      throw new Error("Couldn't find the column titles row with 'Name' in the first column.")
    }

    for (let i = 0; i < columnTitlesRowIndex; i++) {
      if (rows[i]?.[0]) {
        const key = sanitizeFirebaseKey(rows[i][0])
        details[key] = rows[i]?.[1]?.trim() || ""
      }
    }

    details.columnTitles = rows[columnTitlesRowIndex]?.map((title) => title.trim().toLowerCase())

    for (let i = columnTitlesRowIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[0]?.trim()) {
        const baseBookingName = sanitizeFirebaseKey(row[0]?.trim())
        bookingCounts[baseBookingName] = (bookingCounts[baseBookingName] || 0) + 1

        const bookingData: Record<string, any> = { tableNumber: null, movement: {} }

        details.columnTitles?.forEach((title: string, index: number) => {
          if (title && row[index]?.trim()) {
            bookingData[sanitizeFirebaseKey(title)] = row[index]?.trim()
          }
        })

        // Process table numbers with PM/AM filtering
        if (bookingData["area"]) {
          const area = bookingData["area"]
            .replace(/[^\w\s]/g, "")
            .replace(/table/gi, "")
            .split(/\s+/)
            .map((item: string) => {
              // Skip items that end with PM or AM (case insensitive)
              if (item.toUpperCase().endsWith("PM") || item.toUpperCase().endsWith("AM")) {
                return null
              }
              const num = Number.parseInt(item, 10)
              return isNaN(num) ? null : num
            })
            .filter((num: number | null) => num !== null)
            .sort((a: number, b: number) => a - b)

          if (area.length > 0) {
            const ranges: string[] = []
            let start = area[0]
            let end = area[0]

            for (let j = 1; j < area.length; j++) {
              if (area[j] === end + 1) {
                end = area[j]
              } else {
                ranges.push(start === end ? `T${start}` : `T${start} - ${end}`)
                start = area[j]
                end = area[j]
              }
            }
            ranges.push(start === end ? `T${start}` : `T${start} - ${end}`)
            bookingData.tableNumber = ranges.join(", ")
          }
        }

        // Handle duplicate bookings
        let finalBookingName = baseBookingName
        if (bookingCounts[baseBookingName] === 2) {
          // If this is the second occurrence, rename it with "Drinks"
          finalBookingName = `${baseBookingName} Drinks`
        }

        if (bookingCounts[baseBookingName] > 2) {
          const earlierBookingName = bookingReferences[baseBookingName]

          if (earlierBookingName) {
            const earlierTableNumber = bookings[earlierBookingName]?.tableNumber || "Unknown"

            // Store movement information instead of changing name
            bookings[earlierBookingName]["movement"]["moveTo"] = bookingData.tableNumber
            bookingData["movement"]["moveFrom"] = earlierTableNumber
          }
        } else {
          bookingReferences[baseBookingName] = finalBookingName
        }

        // Store booking
        bookings[finalBookingName] = bookingData
      }
    }

    return { details, bookings }
  }

  const parsePreorders = (rows: string[][]) => {
    const preorders: Record<string, any> = {}
    const linkedBookings: Record<string, string> = {} // Track earliest occurrence of each booking
    let currentBookingName: string | null = null
    let headerFound = false

    rows.forEach((row, rowIndex) => {
      const strippedRow = row.map((cell) => (cell ? cell.trim() : ""))

      // Detect header row with "type, item, quantity, time, for"
      if (strippedRow.join(",").toLowerCase().includes("type,item,quantity,time,for")) {
        headerFound = true

        if (rowIndex >= 4) {
          const bookingNameRow = rows[rowIndex - 3]
          let originalBookingName = sanitizeFirebaseKey(bookingNameRow?.[0]?.trim() || "")

          // Extract only the part before the comma (i.e., the base name)
          originalBookingName = originalBookingName.split(",")[0].trim()

          let finalPreorderName = originalBookingName

          // Check if this booking has a movement entry (i.e., was moved)
          if (linkedBookings[originalBookingName]) {
            currentBookingName = linkedBookings[originalBookingName]
          } else {
            currentBookingName = originalBookingName
            linkedBookings[originalBookingName] = currentBookingName
          }

          // Modify preorder name if there are movements
          const movementData = preorders[currentBookingName]?.movement || {}
          if (movementData.moveTo) {
            finalPreorderName = `${originalBookingName}, Move To ${movementData.moveTo}`
          }

          // Ensure the first occurrence has a preorder entry
          if (!preorders[finalPreorderName]) {
            preorders[finalPreorderName] = { items: [] }
          }
        }

        return
      }

      // If inside the preorders section, attach orders to the correct booking
      if (headerFound && strippedRow.length >= 5 && currentBookingName) {
        const forField = strippedRow[4]
        if (forField === "First Order: --/--") {
          return
        }

        preorders[currentBookingName].items.push({
          type: strippedRow[0],
          item: strippedRow[1],
          quantity: strippedRow[2],
          time: strippedRow[3],
          for: sanitizeFirebaseKey(forField || ""),
          dietary: strippedRow[5] || "",
        })
      }
    })

    return preorders
  }

  const saveDataToFirebase = async (
    date: string,
    runsheetData: { details: Record<string, any>; bookings: Record<string, any> } | null,
    preorderData: Record<string, any> | null,
  ) => {
    const sanitizedDate = sanitizeFirebaseKey(date)
    const refPath = `RunsheetsAndPreorders/${sanitizedDate}`

    console.log("Data being uploaded to Firebase:", {
      date: sanitizedDate,
      runsheetDetails: runsheetData?.details || {},
      bookings: runsheetData?.bookings || {},
      preorders: preorderData || {},
    })
    await set(ref(database, refPath), {
      date: sanitizedDate,
      runsheetDetails: runsheetData?.details || {},
      bookings: runsheetData?.bookings || {},
      preorders: preorderData || {},
    })
  }

  return (
    <Page>
      <Typography variant="h4" gutterBottom>
        Upload Runsheet and Preorders
      </Typography>
      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        margin="normal"
      />
      <Horizontal>
        <Box>
          <Typography variant="h6">Runsheet Upload</Typography>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file, "runsheet")
              }
            }}
            disabled={uploading}
          />
        </Box>
        <Box>
          <Typography variant="h6">Preorders Upload</Typography>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file, "preorders")
              }
            }}
            disabled={uploading}
          />
        </Box>
      </Horizontal>
      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUploadToFirebase}
          disabled={uploading || (!runsheet && !preorders)}
        >
          Upload to Firebase
        </Button>
        {uploading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
      </Box>
    </Page>
  )
}

export default UploadPage
