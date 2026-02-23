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
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        // Bold text
        const boldText = trimmed.slice(2, -2)
        elements.push(
          <Typography key={index} variant="subtitle2" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
            {boldText}
          </Typography>
        )
      } else if (trimmed.startsWith('- ')) {
        // Bullet point
        const bulletText = trimmed.slice(2)
        elements.push(
          <Typography key={index} variant="body2" component="li" sx={{ ml: 2, mb: 0.5 }}>
            {bulletText}
          </Typography>
        )
      } else if (trimmed.length > 0) {
        // Regular paragraph
        elements.push(
          <Typography key={index} variant="body2" paragraph>
            {trimmed}
          </Typography>
        )
      } else {
        // Empty line
        elements.push(<Box key={index} sx={{ mb: 1 }} />)
      }
    })
    
    return <Box>{elements}</Box>
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!policyData) {
    return (
      <Box p={3}>
        <Alert severity="warning">Privacy policy data not available</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Privacy Policy
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Version ${policyData.version}`} size="small" />
              <Chip 
                label={`Effective: ${new Date(policyData.effectiveDate).toLocaleDateString()}`} 
                size="small" 
              />
              <Chip 
                label={`Last Updated: ${new Date(policyData.lastUpdated).toLocaleDateString()}`} 
                size="small" 
              />
            </Box>
            <Divider />
          </Box>

          {/* Company Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Controller
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Company Name:</strong> {policyData.companyName}
            </Typography>
            {policyData.companyAddress && (
              <Typography variant="body2" paragraph>
                <strong>Address:</strong> {policyData.companyAddress}
              </Typography>
            )}
            <Typography variant="body2" paragraph>
              <strong>Data Protection Officer:</strong> {policyData.dataProtectionOfficer.name}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>DPO Email:</strong>{' '}
              <a href={`mailto:${policyData.dataProtectionOfficer.email}`}>
                {policyData.dataProtectionOfficer.email}
              </a>
            </Typography>
            {policyData.dataProtectionOfficer.phone && (
              <Typography variant="body2" paragraph>
                <strong>DPO Phone:</strong> {policyData.dataProtectionOfficer.phone}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Policy Sections */}
          {policyData.sections.map((section: any, index: number) => (
            <Box key={section.id} sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {section.title}
              </Typography>
              <Box sx={{ pl: 2 }}>
                {formatMarkdown(section.content)}
              </Box>
              {index < policyData.sections.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              This privacy policy is provided in compliance with UK GDPR and the Data Protection Act 2018.
              If you have any questions about this policy, please contact the Data Protection Officer.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PrivacyPolicy
