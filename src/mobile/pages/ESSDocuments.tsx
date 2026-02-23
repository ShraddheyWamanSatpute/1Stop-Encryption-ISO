/**
 * ESS Documents Page
 * 
 * Employee documents:
 * - Contracts
 * - Policies
 * - Training materials
 * - Personal documents
 */

"use client"

import React, { useState, useMemo } from "react"
import {
  Box,
  Card,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Avatar,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material"
import {
  Description as DocumentIcon,
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Article as ArticleIcon,
  Visibility as ViewIcon,
  Description as ContractIcon,
  Edit as EditIcon,
  School as TrainingIcon,
  Verified as CertificationIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"
import { useHR } from "../../backend/context/HRContext"
import { ESSEmptyState } from "../components"
import type { Document } from "../../backend/interfaces/HRs"

const ESSDocuments: React.FC = () => {
  const theme = useTheme()
  const { state: essState } = useESS()
  const { state: hrState } = useHR()
  const [tabValue, setTabValue] = useState(0)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [signature, setSignature] = useState("")

  // Get documents from employee and contracts from HR context
  const allDocuments = useMemo(() => {
    const docs: Array<Document & { category: string; needsSignature?: boolean }> = []
    
    // Get contracts from HR context (filtered by employee)
    if (hrState.contracts && essState.employeeId) {
      const employeeContracts = hrState.contracts
        .filter((contract: any) => contract.employeeId === essState.employeeId)
        .map((contract: any) => ({
          id: contract.id || contract.contractId,
          name: contract.name || contract.title || "Contract",
          type: contract.type || "pdf",
          url: contract.url || contract.fileUrl || "",
          uploadedAt: contract.uploadedAt || contract.createdAt || Date.now(),
          expiryDate: contract.expiryDate,
          category: "contract",
          needsSignature: !contract.signedAt || !contract.signature, // Check if signature is missing
          signature: contract.signature,
          signedAt: contract.signedAt,
        }))
      docs.push(...employeeContracts)
    }
    
    // Get training documents from employee object (filter by category)
    if (essState.currentEmployee?.documents) {
      const employeeDocs = (essState.currentEmployee.documents as Document[]).map((doc) => {
        // Determine category based on document name or type
        let category = "training"
        const docName = (doc.name || "").toLowerCase()
        if (docName.includes("certif") || docName.includes("license") || docName.includes("qualification")) {
          category = "certification"
        } else if (docName.includes("training") || docName.includes("course")) {
          category = "training"
        }
        
        return {
          ...doc,
          category,
        }
      })
      docs.push(...employeeDocs)
    }
    
    return docs
  }, [essState.currentEmployee?.documents, hrState.contracts, essState.employeeId])

  const categories = [
    { label: "Contracts", value: "contract" },
    { label: "Training", value: "training" },
    { label: "Certification", value: "certification" },
  ]

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => doc.category === categories[tabValue].value)
  }, [allDocuments, tabValue, categories])

  const getDocumentIcon = (type: string, category: string) => {
    if (category === "contract") {
      return <ContractIcon sx={{ color: theme.palette.primary.main }} />
    }
    if (category === "training") {
      return <TrainingIcon sx={{ color: theme.palette.info.main }} />
    }
    if (category === "certification") {
      return <CertificationIcon sx={{ color: theme.palette.success.main }} />
    }
    switch (type?.toLowerCase()) {
      case "pdf":
        return <PdfIcon sx={{ color: theme.palette.error.main }} />
      case "doc":
      case "docx":
        return <ArticleIcon sx={{ color: theme.palette.primary.main }} />
      default:
        return <DocumentIcon color="action" />
    }
  }

  const handleSignContract = (contract: any) => {
    setSelectedContract(contract)
    setSignatureDialogOpen(true)
    setSignature("")
  }

  const handleSaveSignature = async () => {
    if (!signature.trim() || !selectedContract) return
    
    // TODO: Implement signature saving to Firebase
    // This would update the contract with the signature and signedAt timestamp
    console.log("Saving signature for contract:", selectedContract.id, signature)
    
    // For now, just close the dialog
    // In production, you would:
    // 1. Save signature to contract document in Firebase
    // 2. Update signedAt timestamp
    // 3. Refresh the documents list
    
    setSignatureDialogOpen(false)
    setSelectedContract(null)
    setSignature("")
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleViewDocument = (doc: Document & { category: string; needsSignature?: boolean }) => {
    if (doc.category === "contract" && doc.needsSignature) {
      handleSignContract(doc)
    } else if (doc.url) {
      window.open(doc.url, "_blank")
    }
  }

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 },
      pb: { xs: 12, sm: 4 },
      maxWidth: "100%",
      overflowX: "hidden",
    }}>
      {/* Category Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {categories.map((cat) => (
          <Tab key={cat.value} label={cat.label} />
        ))}
      </Tabs>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {filteredDocuments.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    sx={{ py: 2 }}
                    onClick={() => handleViewDocument(doc)}
                    disabled={!doc.url}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: theme.palette.grey[100] }}>
                        {getDocumentIcon(doc.type, doc.category)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={
                        <>
                          Uploaded {formatDate(doc.uploadedAt)}
                          {doc.expiryDate && (
                            <> • Expires {formatDate(doc.expiryDate)}</>
                          )}
                        </>
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    {doc.category === "contract" && doc.needsSignature ? (
                      <Chip
                        icon={<EditIcon />}
                        label="Sign"
                        size="small"
                        color="primary"
                        variant="contained"
                        clickable
                      />
                    ) : doc.url ? (
                      <Chip
                        icon={<ViewIcon />}
                        label="View"
                        size="small"
                        variant="outlined"
                        clickable
                      />
                    ) : null}
                  </ListItemButton>
                </ListItem>
                {index < filteredDocuments.length - 1 && <Box sx={{ px: 2 }}><hr style={{ border: 'none', borderTop: '1px solid #eee' }} /></Box>}
              </React.Fragment>
            ))}
          </List>
        </Card>
      ) : (
        <ESSEmptyState
          icon={<FolderIcon sx={{ fontSize: 48 }} />}
          title="No Documents"
          description="You don't have any documents in this category yet. Documents uploaded by your employer will appear here."
        />
      )}

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Sign Contract: {selectedContract?.name}
          <IconButton onClick={() => setSignatureDialogOpen(false)} size="small">
            <EditIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Digital Signature"
              placeholder="Type your full name to sign"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              fullWidth
              required
              helperText="By typing your name, you are providing your digital signature"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSignatureDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSignature}
            disabled={!signature.trim()}
          >
            Sign Contract
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ESSDocuments