/**
 * Privacy Policy Page
 * Displays the company's privacy policy in compliance with UK GDPR
 */

import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Divider } from '@mui/material'
import { useCompany } from '../../backend/context/CompanyContext'
import { PrivacyPolicyService } from '../../backend/services/gdpr/PrivacyPolicy'

const PrivacyPolicy: React.FC = () => {
  const { state } = useCompany()
  const [loading, setLoading] = useState(true)
  const [policyData, setPolicyData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const privacyPolicyService = new PrivacyPolicyService()

  useEffect(() => {
    const loadPrivacyPolicy = () => {
      try {
        const company = state.company
        if (!company && !state.companyID) {
          setError('Company information not available')
          setLoading(false)
          return
        }

        const policy = privacyPolicyService.getPrivacyPolicy({
          companyName: company?.companyName || state.companyName || 'Company',
          companyAddress: company?.companyAddress || '',
          dpoName: 'Data Protection Officer',
          dpoEmail: company?.companyEmail || 'dpo@company.com',
          dpoPhone: company?.companyPhone
        })

        setPolicyData(policy)
      } catch (err) {
        console.error('Error loading privacy policy:', err)
        setError('Failed to load privacy policy')
      } finally {
        setLoading(false)
      }
    }

    loadPrivacyPolicy()
  }, [state.company, state.companyID, state.companyName])

  const formatMarkdown = (text: string): JSX.Element => {
    // Simple markdown-like formatting
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let inList = false

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        // Bold heading
        const text = trimmed.replace(/\*\*/g, '')
        elements.push(
          <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            {text}
          </Typography>
        )
        inList = false
      } else if (trimmed.startsWith('- ')) {
        // List item
        if (!inList) {
          inList = true
          currentList = []
        }
        currentList.push(trimmed.substring(2))
      } else if (trimmed === '' && inList) {
        // End of list
        elements.push(
          <Box key={`list-${index}`} component="ul" sx={{ pl: 3, mb: 2 }}>
            {currentList.map((item, i) => (
              <li key={i}>
                <Typography variant="body2">{item}</Typography>
              </li>
            ))}
          </Box>
        )
        currentList = []
        inList = false
      } else if (trimmed !== '') {
        // Regular paragraph
        if (inList) {
          // End list first
          elements.push(
            <Box key={`list-end-${index}`} component="ul" sx={{ pl: 3, mb: 2 }}>
              {currentList.map((item, i) => (
                <li key={i}>
                  <Typography variant="body2">{item}</Typography>
                </li>
              ))}
            </Box>
          )
          currentList = []
          inList = false
        }
        elements.push(
          <Typography key={index} variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {trimmed}
          </Typography>
        )
      }
    })

    // Handle any remaining list items
    if (inList && currentList.length > 0) {
      elements.push(
        <Box key="final-list" component="ul" sx={{ pl: 3, mb: 2 }}>
          {currentList.map((item, i) => (
            <li key={i}>
              <Typography variant="body2">{item}</Typography>
            </li>
          ))}
        </Box>
      )
    }

    return <>{elements}</>
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !policyData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Privacy policy not available'}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Privacy Policy
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Version ${policyData.version}`} size="small" color="primary" />
              <Chip 
                label={`Effective: ${policyData.effectiveDate}`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={`Last Updated: ${policyData.lastUpdated}`} 
                size="small" 
                variant="outlined" 
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Company:</strong> {policyData.companyName}
              </Typography>
              {policyData.companyAddress && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Address:</strong> {policyData.companyAddress}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Data Protection Officer:</strong> {policyData.dataProtectionOfficer.name}
                {' '}(<a href={`mailto:${policyData.dataProtectionOfficer.email}`}>
                  {policyData.dataProtectionOfficer.email}
                </a>)
                {policyData.dataProtectionOfficer.phone && (
                  <> - {policyData.dataProtectionOfficer.phone}</>
                )}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>

          {/* Policy Sections */}
          {policyData.sections.map((section: any, index: number) => (
            <Box key={section.id} id={section.id} sx={{ mb: 4 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mt: index > 0 ? 4 : 0
                }}
              >
                {section.title}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {formatMarkdown(section.content)}
              </Box>
              {index < policyData.sections.length - 1 && (
                <Divider sx={{ mt: 3 }} />
              )}
            </Box>
          ))}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              If you have any questions about this privacy policy or our data practices, 
              please contact our Data Protection Officer at{' '}
              <a href={`mailto:${policyData.dataProtectionOfficer.email}`}>
                {policyData.dataProtectionOfficer.email}
              </a>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PrivacyPolicy

