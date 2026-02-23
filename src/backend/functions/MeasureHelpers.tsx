"use client"
import { useState, useEffect } from "react"
import { ref, get, set } from "../services/Firebase"
import { useCompany } from "../context/CompanyContext"
// SiteContext has been merged into CompanyContext
import { db } from "../services/Firebase" // Declare db variable

// Interface for a measure
export interface Measure {
  id: string
  name: string
  quantity: string | number
  unit: string
}

// Interface for measure option used in dropdowns
export interface MeasureOption {
  id: string
  name: string
  price: number
  amount: number
  supplierId: string
}

// Hook to fetch measures with better error handling and loading states
export const useMeasures = () => {
  const [measures, setMeasures] = useState<Measure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { state: companyState } = useCompany()
  // Using CompanyContext for site state (after SiteContext merge)

  useEffect(() => {
    const fetchMeasures = async () => {
      if (!companyState.companyID || !companyState.selectedSiteID) {
        console.log("useMeasures - Missing company or site ID")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log("useMeasures - Fetching measures...")
        const measuresRef = ref(db, `companies/${companyState.companyID}/sites/${companyState.selectedSiteID}/data/stock/measures`)
        const snapshot = await get(measuresRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          console.log("useMeasures - Raw measures data:", data)

          const fetchedMeasures: Measure[] = Object.entries(data).map(([id, measureData]: [string, any]) => ({
            id,
            name: measureData.name || `Measure ${id}`,
            quantity: measureData.quantity || "1",
            unit: measureData.unit || "unit",
          }))

          console.log("useMeasures - Processed measures:", fetchedMeasures)
          setMeasures(fetchedMeasures)
        } else {
          console.warn("useMeasures - No measures found in database")
          setMeasures([])
        }
      } catch (err) {
        console.error("useMeasures - Error fetching measures:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch measures")
        setMeasures([])
      } finally {
        setLoading(false)
      }
    }

    fetchMeasures()
  }, [companyState.companyID, companyState.selectedSiteID])

  return { measures, loading, error }
}

// Function to get purchase measure options for a specific product
export const getPurchaseMeasureOptions = (product: any, allMeasures: Measure[]): MeasureOption[] => {
  console.log("getPurchaseMeasureOptions - Starting for product:", product?.name)
  console.log("getPurchaseMeasureOptions - Available measures:", allMeasures.length)

  if (!product?.purchase) {
    console.log("getPurchaseMeasureOptions - No purchase data found")
    return []
  }

  const options: MeasureOption[] = []
  const addedMeasureIds = new Set<string>()

  // Add default measure if it exists
  if (product.purchase.defaultMeasure && product.purchase.price !== undefined) {
    const measure = allMeasures.find((m) => m.id === product.purchase.defaultMeasure)
    if (measure) {
      options.push({
        id: product.purchase.defaultMeasure,
        name: measure.name,
        price: Number(product.purchase.price) || 0,
        amount: Number(product.purchase.amount) || 1,
        supplierId: product.purchase.defaultSupplier || "",
      })
      addedMeasureIds.add(product.purchase.defaultMeasure)
      console.log("getPurchaseMeasureOptions - Added default measure:", measure.name)
    }
  }

  // Add units if they exist
  if (product.purchase.units && Array.isArray(product.purchase.units)) {
    console.log("getPurchaseMeasureOptions - Processing units:", product.purchase.units.length)

    product.purchase.units.forEach((unit: any, index: number) => {
      if (unit?.measure && !addedMeasureIds.has(unit.measure)) {
        const measure = allMeasures.find((m) => m.id === unit.measure)
        if (measure) {
          options.push({
            id: unit.measure,
            name: measure.name,
            price: Number(unit.price) || 0,
            amount: Number(unit.amount) || 1,
            supplierId: unit.supplierId || "",
          })
          addedMeasureIds.add(unit.measure)
          console.log(`getPurchaseMeasureOptions - Added unit ${index}:`, measure.name)
        } else {
          console.warn(`getPurchaseMeasureOptions - Measure not found for unit ${index}:`, unit.measure)
        }
      }
    })
  }

  console.log("getPurchaseMeasureOptions - Final options:", options.length)
  return options
}

// Function to get sales measure options for a specific product
export const getSalesMeasureOptions = (product: any, allMeasures: Measure[]): MeasureOption[] => {
  console.log("getSalesMeasureOptions - Starting for product:", product?.name)
  console.log("getSalesMeasureOptions - Available measures:", allMeasures.length)

  if (!product?.sale) {
    console.log("getSalesMeasureOptions - No sale data found")
    return []
  }

  const options: MeasureOption[] = []
  const addedMeasureIds = new Set<string>()

  // Add default measure if it exists
  if (product.sale.defaultMeasure && product.sale.price !== undefined) {
    const measure = allMeasures.find((m) => m.id === product.sale.defaultMeasure)
    if (measure) {
      options.push({
        id: product.sale.defaultMeasure,
        name: measure.name,
        price: Number(product.sale.price) || 0,
        amount: Number(product.sale.amount) || 1,
        supplierId: "",
      })
      addedMeasureIds.add(product.sale.defaultMeasure)
      console.log("getSalesMeasureOptions - Added default measure:", measure.name)
    }
  }

  // Add units if they exist
  if (product.sale.units && Array.isArray(product.sale.units)) {
    console.log("getSalesMeasureOptions - Processing units:", product.sale.units.length)

    product.sale.units.forEach((unit: any, index: number) => {
      if (unit?.measure && !addedMeasureIds.has(unit.measure)) {
        const measure = allMeasures.find((m) => m.id === unit.measure)
        if (measure) {
          options.push({
            id: unit.measure,
            name: measure.name,
            price: Number(unit.price) || 0,
            amount: Number(unit.amount) || 1,
            supplierId: "",
          })
          addedMeasureIds.add(unit.measure)
          console.log(`getSalesMeasureOptions - Added unit ${index}:`, measure.name)
        } else {
          console.warn(`getSalesMeasureOptions - Measure not found for unit ${index}:`, unit.measure)
        }
      }
    })
  }

  console.log("getSalesMeasureOptions - Final options:", options.length)
  return options
}

// Helper function to validate and fix quantity
const validateQuantity = (quantity: string | number): string => {
  const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity
  return (numQuantity <= 0 ? 1 : numQuantity).toString()
}

// Function to create sample measures if none exist
export const createSampleMeasures = async (companyID: string, siteID: string): Promise<void> => {
  console.log("createSampleMeasures - Creating sample measures...")
  const measuresRef = ref(db, `companies/${companyID}/sites/${siteID}/data/stock/measures`)

  const sampleMeasures = {
    measure1: {
      name: "Kilogram",
      quantity: validateQuantity("1"),
      unit: "kg",
    },
    measure2: {
      name: "Gram",
      quantity: validateQuantity("1"),
      unit: "g",
    },
    measure3: {
      name: "Litre",
      quantity: validateQuantity("1"),
      unit: "l",
    },
    measure4: {
      name: "Millilitre",
      quantity: validateQuantity("1"),
      unit: "ml",
    },
    measure5: {
      name: "Single Item",
      quantity: validateQuantity("1"),
      unit: "single",
    },
    measure6: {
      name: "Bottle",
      quantity: validateQuantity("1"),
      unit: "single",
    },
    measure7: {
      name: "Shot",
      quantity: validateQuantity("25"),
      unit: "ml",
    },
    measure8: {
      name: "Pack",
      quantity: validateQuantity("1"),
      unit: "single",
    },
    measure9: {
      name: "Piece",
      quantity: validateQuantity("1"),
      unit: "single",
    },
    measure10: {
      name: "Portion",
      quantity: validateQuantity("1"),
      unit: "single",
    },
  }

  try {
    await set(measuresRef, sampleMeasures)
    console.log("createSampleMeasures - Sample measures created successfully!")
  } catch (error) {
    console.error("createSampleMeasures - Error creating sample measures:", error)
    throw error
  }
}

// Function to get all measures for a company/site
export const fetchAllMeasures = async (companyID: string, siteID: string): Promise<Measure[]> => {
  if (!companyID || !siteID) {
    console.warn("fetchAllMeasures - Missing companyID or siteID")
    return []
  }

  try {
    const measuresRef = ref(db, `companies/${companyID}/sites/${siteID}/data/stock/measures`)
    const snapshot = await get(measuresRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      const measures: Measure[] = Object.entries(data).map(([id, measureData]: [string, any]) => ({
        id,
        name: measureData.name || `Measure ${id}`,
        quantity: validateQuantity(measureData.quantity || "1"),
        unit: measureData.unit || "unit",
      }))

      console.log("fetchAllMeasures - Fetched measures:", measures.length)
      return measures
    } else {
      console.warn("fetchAllMeasures - No measures found, creating sample data...")
      await createSampleMeasures(companyID, siteID)

      // Fetch again after creating sample data
      const newSnapshot = await get(measuresRef)
      if (newSnapshot.exists()) {
        const data = newSnapshot.val()
        const measures: Measure[] = Object.entries(data).map(([id, measureData]: [string, any]) => ({
          id,
          name: measureData.name || `Measure ${id}`,
          quantity: validateQuantity(measureData.quantity || "1"),
          unit: measureData.unit || "unit",
        }))

        console.log("fetchAllMeasures - Created and fetched measures:", measures.length)
        return measures
      }
    }
  } catch (error) {
    console.error("fetchAllMeasures - Error fetching measures:", error)
  }

  return []
}
