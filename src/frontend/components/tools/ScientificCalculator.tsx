"use client"

import type React from "react"
import { Box } from "@mui/material"
import ReusableModal from "../reusable/ReusableModal"
import SimpleCalculatorWidget from "./SimpleCalculatorWidget"

interface ScientificCalculatorProps {
  open: boolean
  onClose: () => void
}

const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ open, onClose }) => {
  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Calculator"
      initialSize={{ width: 280, height: 420 }}
      minSize={{ width: 240, height: 360 }}
      maxSize={{ width: 400, height: 600 }}
      initialPosition={{ x: 50, y: 50 }}
      resizable={true}
      draggable={true}
      showMinimizeButton={true}
    >
      <Box sx={{ height: '100%', width: '100%', p: 0 }}>
        <SimpleCalculatorWidget onClose={onClose} />
      </Box>
    </ReusableModal>
  )
}

export default ScientificCalculator
