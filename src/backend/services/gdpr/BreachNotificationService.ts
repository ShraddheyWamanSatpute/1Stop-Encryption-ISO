/**
 * Breach Notification Service
 *
 * Generates notification content for ICO, HMRC, and affected individuals.
 * Ensures compliance with UK GDPR notification requirements.
 *
 * UK GDPR Requirements:
 * - ICO: Notify within 72 hours if risk to individuals (Article 33)
 * - Individuals: Notify without undue delay if high risk (Article 34)
 *
 * References:
 * - ICO Personal Data Breach Reporting
 * - ICO Guide to the UK GDPR
 */

import { DataBreachIncident } from './types';

/**
 * ICO Notification Content
 * Based on ICO's breach reporting requirements
 */
export interface ICONotificationContent {
  // Organisation details
  organisationName: string;
  organisationAddress: string;
  registrationNumber?: string; // ICO registration (if applicable)
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Breach details
  breachDescription: string;
  dateTimeOfBreach?: string;
  dateTimeDiscovered: string;
  ongoingBreach: boolean;

  // Data categories
  categoriesOfData: string[];
  specialCategoryData: boolean;
  specialCategoryTypes?: string[];

  // Individuals affected
  approximateNumberAffected: number;
  categoriesOfIndividuals: string[];

  // Consequences
  likelyConsequences: string[];
  severityAssessment: string;

  // Measures taken
  measuresTakenToAddress: string[];
  measuresTakenToMitigate: string[];

  // Communication with individuals
  individualNotificationRequired: boolean;
  individualNotificationPlanned: boolean;
  notificationMethod?: string;
  reasonForNotNotifying?: string;

  // Additional information
  additionalInformation?: string;
  crossBorderBreach: boolean;
  leadSupervisoryAuthority?: string;
}

/**
 * Individual Notification Content
 */
export interface IndividualNotificationContent {
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;

  // Company details
  companyName: string;
  dpoName: string;
  dpoEmail: string;
  dpoPhone?: string;

  // Breach details
  breachDescription: string;
  dateOfBreach: string;
  dataAffected: string[];

  // Impact
  potentialConsequences: string[];

  // Actions taken
  actionsTaken: string[];

  // Recommendations
  recommendedActions: string[];

  // Contact information
  furtherInfoUrl?: string;
  supportPhone?: string;
  supportEmail?: string;
}

/**
 * HMRC Notification Content
 */
export interface HMRCNotificationContent {
  organisationName: string;
  payeReference: string;
  accountsOfficeReference?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  breachDescription: string;
  dateDiscovered: string;
  dataTypes: string[];
  numberOfRecordsAffected: number;

  measuresTaken: string[];
  additionalInformation?: string;
}

/**
 * Breach Notification Service
 */
export class BreachNotificationService {
  /**
   * Generate ICO notification content
   */
  generateICONotification(
    breach: DataBreachIncident,
    organisationDetails: {
      name: string;
      address: string;
      registrationNumber?: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    }
  ): ICONotificationContent {
    const specialCategoryTypes = this.identifySpecialCategoryData(breach.dataCategories);

    return {
      organisationName: organisationDetails.name,
      organisationAddress: organisationDetails.address,
      registrationNumber: organisationDetails.registrationNumber,
      contactName: organisationDetails.contactName,
      contactEmail: organisationDetails.contactEmail,
      contactPhone: organisationDetails.contactPhone,

      breachDescription: breach.description,
      dateTimeOfBreach: undefined, // Often unknown
      dateTimeDiscovered: new Date(breach.detectedAt).toISOString(),
      ongoingBreach: breach.status !== 'resolved' && breach.status !== 'closed',

      categoriesOfData: breach.dataCategories,
      specialCategoryData: specialCategoryTypes.length > 0,
      specialCategoryTypes: specialCategoryTypes.length > 0 ? specialCategoryTypes : undefined,

      approximateNumberAffected: breach.estimatedRecordsAffected,
      categoriesOfIndividuals: ['employees'], // Default for payroll system

      likelyConsequences: breach.potentialConsequences,
      severityAssessment: this.getSeverityDescription(breach.severity, breach.riskToIndividuals),

      measuresTakenToAddress: breach.remediationActions || [],
      measuresTakenToMitigate: breach.preventiveMeasures || [],

      individualNotificationRequired: breach.requiresUserNotification,
      individualNotificationPlanned: breach.requiresUserNotification,
      notificationMethod: breach.requiresUserNotification ? 'Email and written letter' : undefined,
      reasonForNotNotifying: !breach.requiresUserNotification
        ? 'Risk to individuals assessed as unlikely based on data categories and security measures in place.'
        : undefined,

      crossBorderBreach: false,
    };
  }

  /**
   * Generate individual notification letter/email
   */
  generateIndividualNotification(
    breach: DataBreachIncident,
    recipient: {
      name: string;
      email?: string;
      address?: string;
    },
    companyDetails: {
      name: string;
      dpoName: string;
      dpoEmail: string;
      dpoPhone?: string;
      supportUrl?: string;
    }
  ): IndividualNotificationContent {
    return {
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientAddress: recipient.address,

      companyName: companyDetails.name,
      dpoName: companyDetails.dpoName,
      dpoEmail: companyDetails.dpoEmail,
      dpoPhone: companyDetails.dpoPhone,

      breachDescription: this.getSimplifiedBreachDescription(breach),
      dateOfBreach: new Date(breach.detectedAt).toLocaleDateString('en-GB'),
      dataAffected: this.getDataAffectedDescriptions(breach.dataCategories),

      potentialConsequences: this.getConsequenceDescriptions(breach.potentialConsequences),

      actionsTaken: this.getActionsTakenDescriptions(breach.remediationActions || []),

      recommendedActions: this.getRecommendedActionsForIndividual(breach.dataCategories),

      furtherInfoUrl: companyDetails.supportUrl,
      supportEmail: companyDetails.dpoEmail,
      supportPhone: companyDetails.dpoPhone,
    };
  }

  /**
   * Generate individual notification letter text
   */
  generateIndividualNotificationLetter(
    content: IndividualNotificationContent
  ): string {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `
${content.companyName}
${date}

Dear ${content.recipientName},

IMPORTANT: Notification of Personal Data Breach

We are writing to inform you of a personal data breach that may affect your information. We take the protection of your personal data very seriously and want to be transparent about what has happened.

WHAT HAPPENED
${content.breachDescription}

The breach was discovered on ${content.dateOfBreach}.

WHAT DATA WAS AFFECTED
The following categories of your personal data may have been affected:
${content.dataAffected.map(d => `• ${d}`).join('\n')}

WHAT WE ARE DOING
We have taken immediate steps to address this breach:
${content.actionsTaken.map(a => `• ${a}`).join('\n')}

WHAT THIS MEANS FOR YOU
${content.potentialConsequences.map(c => `• ${c}`).join('\n')}

WHAT YOU CAN DO
We recommend you take the following precautionary steps:
${content.recommendedActions.map(r => `• ${r}`).join('\n')}

CONTACT US
If you have any questions or concerns about this breach, please contact our Data Protection Officer:

Name: ${content.dpoName}
Email: ${content.dpoEmail}
${content.dpoPhone ? `Phone: ${content.dpoPhone}` : ''}

YOUR RIGHTS
You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been infringed.

ICO Website: https://ico.org.uk
ICO Helpline: 0303 123 1113

We sincerely apologise for any concern this may cause you and assure you that we are taking all necessary steps to prevent similar incidents in the future.

Yours sincerely,

${content.dpoName}
Data Protection Officer
${content.companyName}
    `.trim();
  }

  /**
   * Generate individual notification email HTML
   */
  generateIndividualNotificationEmail(
    content: IndividualNotificationContent
  ): { subject: string; html: string; text: string } {
    const subject = `Important: Personal Data Breach Notification from ${content.companyName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #d32f2f; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    ul { padding-left: 20px; }
    .contact-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #1976d2; }
    .ico-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Personal Data Breach Notification</h1>
    <p>Important information about your personal data</p>
  </div>

  <div class="content">
    <p>Dear ${content.recipientName},</p>

    <p>We are writing to inform you of a personal data breach that may affect your information. We take the protection of your personal data very seriously and want to be transparent about what has happened.</p>

    <div class="section">
      <div class="section-title">What Happened</div>
      <p>${content.breachDescription}</p>
      <p><strong>Date discovered:</strong> ${content.dateOfBreach}</p>
    </div>

    <div class="section">
      <div class="section-title">Data Affected</div>
      <p>The following categories of your personal data may have been affected:</p>
      <ul>
        ${content.dataAffected.map(d => `<li>${d}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">What We Are Doing</div>
      <p>We have taken immediate steps to address this breach:</p>
      <ul>
        ${content.actionsTaken.map(a => `<li>${a}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Potential Impact</div>
      <ul>
        ${content.potentialConsequences.map(c => `<li>${c}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Recommended Actions for You</div>
      <ul>
        ${content.recommendedActions.map(r => `<li>${r}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="contact-box">
      <strong>Contact Our Data Protection Officer</strong><br>
      Name: ${content.dpoName}<br>
      Email: <a href="mailto:${content.dpoEmail}">${content.dpoEmail}</a><br>
      ${content.dpoPhone ? `Phone: ${content.dpoPhone}` : ''}
    </div>

    <div class="ico-box">
      <strong>Your Rights</strong><br>
      You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been infringed.<br><br>
      <strong>ICO Website:</strong> <a href="https://ico.org.uk">https://ico.org.uk</a><br>
      <strong>ICO Helpline:</strong> 0303 123 1113
    </div>

    <p>We sincerely apologise for any concern this may cause you and assure you that we are taking all necessary steps to prevent similar incidents in the future.</p>

    <p>Yours sincerely,<br>
    <strong>${content.dpoName}</strong><br>
    Data Protection Officer<br>
    ${content.companyName}</p>
  </div>

  <div class="footer">
    <p>This is an important notification about your personal data. Please do not ignore this message.</p>
  </div>
</body>
</html>
    `.trim();

    // Plain text version
    const text = this.generateIndividualNotificationLetter(content);

    return { subject, html, text };
  }

  /**
   * Generate HMRC notification content
   */
  generateHMRCNotification(
    breach: DataBreachIncident,
    organisationDetails: {
      name: string;
      payeReference: string;
      accountsOfficeReference?: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    }
  ): HMRCNotificationContent {
    return {
      organisationName: organisationDetails.name,
      payeReference: organisationDetails.payeReference,
      accountsOfficeReference: organisationDetails.accountsOfficeReference,
      contactName: organisationDetails.contactName,
      contactEmail: organisationDetails.contactEmail,
      contactPhone: organisationDetails.contactPhone,

      breachDescription: breach.description,
      dateDiscovered: new Date(breach.detectedAt).toISOString(),
      dataTypes: breach.dataCategories.filter(c =>
        c.includes('payroll') ||
        c.includes('tax') ||
        c.includes('paye') ||
        c.includes('ni_number') ||
        c.includes('salary') ||
        c.includes('national_insurance')
      ),
      numberOfRecordsAffected: breach.estimatedRecordsAffected,

      measuresTaken: breach.remediationActions || [],
      additionalInformation: breach.rootCause
        ? `Root cause identified: ${breach.rootCause}`
        : undefined,
    };
  }

  /**
   * Get ICO notification form data (for web form submission)
   */
  getICOFormData(content: ICONotificationContent): Record<string, string> {
    return {
      organisation_name: content.organisationName,
      organisation_address: content.organisationAddress,
      registration_number: content.registrationNumber || '',
      contact_name: content.contactName,
      contact_email: content.contactEmail,
      contact_phone: content.contactPhone,
      breach_description: content.breachDescription,
      date_discovered: content.dateTimeDiscovered,
      ongoing: content.ongoingBreach ? 'yes' : 'no',
      data_categories: content.categoriesOfData.join(', '),
      special_category: content.specialCategoryData ? 'yes' : 'no',
      special_category_types: content.specialCategoryTypes?.join(', ') || '',
      number_affected: content.approximateNumberAffected.toString(),
      individual_categories: content.categoriesOfIndividuals.join(', '),
      consequences: content.likelyConsequences.join('; '),
      severity: content.severityAssessment,
      measures_address: content.measuresTakenToAddress.join('; '),
      measures_mitigate: content.measuresTakenToMitigate.join('; '),
      notify_individuals: content.individualNotificationRequired ? 'yes' : 'no',
      notification_method: content.notificationMethod || '',
      reason_not_notifying: content.reasonForNotNotifying || '',
      cross_border: content.crossBorderBreach ? 'yes' : 'no',
    };
  }

  /**
   * Calculate notification deadline
   */
  getNotificationDeadline(breachDetectedAt: number): {
    deadline: Date;
    hoursRemaining: number;
    isOverdue: boolean;
  } {
    const deadlineMs = breachDetectedAt + (72 * 60 * 60 * 1000);
    const deadline = new Date(deadlineMs);
    const now = Date.now();
    const hoursRemaining = Math.max(0, Math.floor((deadlineMs - now) / (60 * 60 * 1000)));
    const isOverdue = now > deadlineMs;

    return { deadline, hoursRemaining, isOverdue };
  }

  /**
   * Identify special category data from categories
   */
  private identifySpecialCategoryData(categories: string[]): string[] {
    const specialCategoryKeywords: Record<string, string> = {
      health: 'Health data',
      medical: 'Health data',
      sickness: 'Health data',
      disability: 'Health data',
      race: 'Racial or ethnic origin',
      ethnicity: 'Racial or ethnic origin',
      religion: 'Religious beliefs',
      political: 'Political opinions',
      union: 'Trade union membership',
      biometric: 'Biometric data',
      genetic: 'Genetic data',
      sexual: 'Sex life/sexual orientation',
      criminal: 'Criminal convictions',
    };

    const found: Set<string> = new Set();

    for (const category of categories) {
      const lowerCategory = category.toLowerCase();
      for (const [keyword, specialType] of Object.entries(specialCategoryKeywords)) {
        if (lowerCategory.includes(keyword)) {
          found.add(specialType);
        }
      }
    }

    return Array.from(found);
  }

  /**
   * Get severity description for ICO
   */
  private getSeverityDescription(
    severity: string,
    riskToIndividuals: string
  ): string {
    const severityDescriptions: Record<string, string> = {
      critical: 'Critical - Significant harm to large number of individuals likely',
      high: 'High - Substantial harm to individuals possible',
      medium: 'Medium - Some harm to individuals possible',
      low: 'Low - Minimal risk to individuals',
    };

    const riskDescriptions: Record<string, string> = {
      highly_likely: 'Harm to affected individuals is highly likely.',
      likely: 'Harm to affected individuals is likely.',
      possible: 'Harm to affected individuals is possible but not certain.',
      unlikely: 'Harm to affected individuals is unlikely.',
    };

    return `${severityDescriptions[severity] || severity}. ${riskDescriptions[riskToIndividuals] || ''}`;
  }

  /**
   * Get simplified breach description for individuals
   */
  private getSimplifiedBreachDescription(breach: DataBreachIncident): string {
    // Create a simplified, non-technical description
    return breach.description
      .replace(/unauthorized/gi, 'unauthorised')
      .replace(/\btechnical\b/gi, '')
      .replace(/\bsystem(s)?\b/gi, 'computer system')
      .replace(/\bdata\b/gi, 'information');
  }

  /**
   * Get human-readable data affected descriptions
   */
  private getDataAffectedDescriptions(categories: string[]): string[] {
    const descriptions: Record<string, string> = {
      name: 'Your name',
      email: 'Your email address',
      address: 'Your home address',
      phone: 'Your phone number',
      dob: 'Your date of birth',
      date_of_birth: 'Your date of birth',
      ni_number: 'Your National Insurance number',
      national_insurance: 'Your National Insurance number',
      bank: 'Your bank account details',
      salary: 'Your salary information',
      payroll: 'Your payroll information',
      tax: 'Your tax information',
      tax_code: 'Your tax code',
      paye: 'Your PAYE information',
      pension: 'Your pension information',
      employment: 'Your employment details',
      health: 'Health-related information',
      medical: 'Medical information',
    };

    const result: string[] = [];

    for (const category of categories) {
      const lowerCategory = category.toLowerCase();
      for (const [keyword, description] of Object.entries(descriptions)) {
        if (lowerCategory.includes(keyword) && !result.includes(description)) {
          result.push(description);
        }
      }
    }

    // If no matches, return generic
    if (result.length === 0) {
      result.push('Personal information held in our systems');
    }

    return result;
  }

  /**
   * Get human-readable consequence descriptions
   */
  private getConsequenceDescriptions(consequences: string[]): string[] {
    const descriptions: Record<string, string> = {
      identity_theft: 'There is a risk of identity theft or fraud using your personal details',
      financial_loss: 'There may be a risk of financial loss',
      unauthorized_access: 'Your personal information may have been accessed without permission',
      data_exposure: 'Your personal information may have been exposed',
      phishing: 'You may receive fraudulent emails or messages',
      spam: 'You may receive unwanted communications',
      reputational: 'There may be reputational implications',
      discrimination: 'The information could potentially be used in a discriminatory way',
    };

    const result: string[] = [];

    for (const consequence of consequences) {
      const lowerConsequence = consequence.toLowerCase().replace(/[_-]/g, '_');
      if (descriptions[lowerConsequence]) {
        result.push(descriptions[lowerConsequence]);
      } else {
        result.push(consequence);
      }
    }

    if (result.length === 0) {
      result.push('We are assessing the potential impact and will update you if necessary');
    }

    return result;
  }

  /**
   * Get actions taken descriptions
   */
  private getActionsTakenDescriptions(actions: string[]): string[] {
    if (actions.length === 0) {
      return [
        'Secured affected systems to prevent further unauthorised access',
        'Launched a full investigation into the cause',
        'Notified relevant authorities (ICO)',
        'Implemented additional security measures',
      ];
    }

    // Clean up technical jargon
    return actions.map(action =>
      action
        .replace(/\[.*?\]/g, '') // Remove timestamps
        .replace(/unauthorized/gi, 'unauthorised')
        .trim()
    ).filter(a => a.length > 0);
  }

  /**
   * Get recommended actions based on data types affected
   */
  private getRecommendedActionsForIndividual(dataCategories: string[]): string[] {
    const recommendations: string[] = [
      'Be vigilant about unexpected communications asking for personal information',
    ];

    const hasFinancial = dataCategories.some(c =>
      c.toLowerCase().includes('bank') ||
      c.toLowerCase().includes('financial') ||
      c.toLowerCase().includes('salary')
    );

    const hasCredentials = dataCategories.some(c =>
      c.toLowerCase().includes('password') ||
      c.toLowerCase().includes('credential')
    );

    const hasNI = dataCategories.some(c =>
      c.toLowerCase().includes('ni_number') ||
      c.toLowerCase().includes('national_insurance')
    );

    const hasIdentity = dataCategories.some(c =>
      c.toLowerCase().includes('dob') ||
      c.toLowerCase().includes('date_of_birth') ||
      c.toLowerCase().includes('address')
    );

    if (hasFinancial) {
      recommendations.push(
        'Monitor your bank accounts and credit card statements for unusual activity',
        'Consider placing a fraud alert or credit freeze with credit reference agencies (Experian, Equifax, TransUnion)'
      );
    }

    if (hasCredentials) {
      recommendations.push(
        'Change your password immediately if you use the same password elsewhere',
        'Enable two-factor authentication where available'
      );
    }

    if (hasNI) {
      recommendations.push(
        'Check your personal tax account on gov.uk for any unexpected changes',
        'Report any suspicious HMRC communications to HMRC directly'
      );
    }

    if (hasIdentity) {
      recommendations.push(
        'Consider signing up for a free credit monitoring service',
        'Report any suspicious identity-related activity to Action Fraud (0300 123 2040)'
      );
    }

    recommendations.push(
      'Report any suspicious emails to report@phishing.gov.uk'
    );

    return recommendations;
  }
}

// Export singleton instance
export const breachNotificationService = new BreachNotificationService();
