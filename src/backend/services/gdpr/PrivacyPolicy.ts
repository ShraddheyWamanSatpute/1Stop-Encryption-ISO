/**
 * Privacy Policy Service
 *
 * Manages privacy policy content, versioning, and display in compliance with UK GDPR.
 * Includes lawful basis documentation as required by ICO guidance.
 *
 * Reference: ICO Lawful Basis Guide, ICO Privacy Notices Guide
 */

export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface PrivacyPolicyData {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  companyName: string;
  companyAddress: string;
  dataProtectionOfficer: {
    name: string;
    email: string;
    phone?: string;
  };
  sections: PrivacyPolicySection[];
}

/**
 * Privacy Policy Service
 * Provides structured privacy policy content for UK GDPR compliance
 */
export class PrivacyPolicyService {
  private currentVersion = '2.0.0';
  private effectiveDate = '2025-01-01';
  private lastUpdated = '2025-01-19';

  /**
   * Get the complete privacy policy
   */
  getPrivacyPolicy(companyInfo: {
    companyName: string;
    companyAddress: string;
    dpoName: string;
    dpoEmail: string;
    dpoPhone?: string;
  }): PrivacyPolicyData {
    return {
      version: this.currentVersion,
      effectiveDate: this.effectiveDate,
      lastUpdated: this.lastUpdated,
      companyName: companyInfo.companyName,
      companyAddress: companyInfo.companyAddress,
      dataProtectionOfficer: {
        name: companyInfo.dpoName,
        email: companyInfo.dpoEmail,
        phone: companyInfo.dpoPhone,
      },
      sections: this.getPolicySections(companyInfo.companyName),
    };
  }

  /**
   * Get all privacy policy sections
   */
  private getPolicySections(companyName: string): PrivacyPolicySection[] {
    return [
      this.getIntroductionSection(companyName),
      this.getDataControllerSection(companyName),
      this.getDataCollectedSection(),
      this.getLawfulBasisSection(),
      this.getHMRCDataProcessingSection(),
      this.getDataSharingSection(),
      this.getDataRetentionSection(),
      this.getDataSecuritySection(),
      this.getYourRightsSection(),
      this.getAutomatedDecisionMakingSection(),
      this.getInternationalTransfersSection(),
      this.getCookiesSection(),
      this.getDataBreachSection(),
      this.getChangesToPolicySection(),
      this.getContactSection(),
      this.getComplaintsSection(),
    ];
  }

  private getIntroductionSection(companyName: string): PrivacyPolicySection {
    return {
      id: 'introduction',
      title: '1. Introduction',
      content: `
${companyName} ("we", "us", "our") is committed to protecting and respecting your privacy in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

This privacy policy explains:
- What personal data we collect about you
- How we use your personal data
- The lawful basis for processing your data
- Who we share your data with
- How long we keep your data
- Your rights regarding your personal data

This policy applies to all employees, contractors, and users of our payroll and HR management system, including data submitted to HM Revenue & Customs (HMRC) through Real Time Information (RTI) submissions.

By using our services, you acknowledge that you have read and understood this privacy policy.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataControllerSection(companyName: string): PrivacyPolicySection {
    return {
      id: 'data-controller',
      title: '2. Data Controller',
      content: `
${companyName} is the data controller responsible for your personal data.

We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions in relation to this privacy policy. If you have any questions about this privacy policy, including any requests to exercise your legal rights, please contact the DPO using the details provided in the Contact section.

For HMRC-related data processing, we act as a data processor on behalf of employer companies who use our platform. Each employer company is the data controller for their employees' payroll data.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataCollectedSection(): PrivacyPolicySection {
    return {
      id: 'data-collected',
      title: '3. Personal Data We Collect',
      content: `
We collect and process the following categories of personal data:

**Identity Data:**
- Full name (first name, middle name, last name)
- Date of birth
- Gender
- National Insurance Number
- Passport/ID document details (where required)

**Contact Data:**
- Home address
- Email address
- Telephone numbers
- Emergency contact details

**Employment Data:**
- Employee ID/Works number
- Job title and department
- Employment start and end dates
- Employment type (full-time, part-time, casual)
- Working hours and schedules
- Performance reviews
- Training records

**Financial Data:**
- Bank account details (account number, sort code)
- Salary/wage information
- Tax code
- National Insurance category
- Student loan plan type
- Pension contributions
- Benefits in kind
- Expenses and allowances

**Tax and Payroll Data:**
- PAYE reference
- Tax calculations and deductions
- National Insurance contributions
- Year-to-date earnings
- P45/P60 information
- Statutory payments (SSP, SMP, etc.)

**Technical Data:**
- IP address (partially masked for privacy)
- Browser type and version
- Device information
- Login timestamps
- Audit trail data

**Special Category Data (where applicable):**
- Health information (for statutory sick pay)
- Disability status (for reasonable adjustments)

We do not collect personal data about criminal convictions unless required for specific role requirements and with appropriate safeguards.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getLawfulBasisSection(): PrivacyPolicySection {
    return {
      id: 'lawful-basis',
      title: '4. Lawful Basis for Processing',
      content: `
Under UK GDPR, we must have a valid lawful basis for processing your personal data. We rely on the following lawful bases:

**Legal Obligation (Article 6(1)(c)):**
We process certain data because we are legally required to do so:
- HMRC Real Time Information (RTI) submissions (FPS, EPS, EYU)
- Tax and National Insurance calculations and reporting
- Pension auto-enrolment compliance
- Statutory payment calculations (SSP, SMP, SPP, etc.)
- P45/P60 generation and distribution
- Retention of payroll records for 6 years (HMRC requirement)
- Responding to HMRC enquiries
- Compliance with employment law requirements

**Contract (Article 6(1)(b)):**
We process data necessary to fulfil our contractual obligations:
- Processing payroll and making salary payments
- Managing employee benefits
- Administering pension contributions
- Providing employment-related services

**Legitimate Interests (Article 6(1)(f)):**
We may process data where it is in our legitimate interests:
- Maintaining system security and preventing fraud
- Improving our services
- Internal auditing and record-keeping
- Business analytics (using anonymised data)

Our legitimate interests do not override your fundamental rights and freedoms.

**Consent (Article 6(1)(a)):**
For certain processing activities, we will seek your explicit consent:
- Marketing communications
- Sharing data with third parties not required for payroll
- Processing for purposes beyond the original collection purpose

You may withdraw consent at any time by contacting us.

**Special Category Data:**
For special category data (e.g., health information for SSP), we rely on:
- Article 9(2)(b): Employment, social security, and social protection law
- Article 9(2)(h): Health or social care purposes
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getHMRCDataProcessingSection(): PrivacyPolicySection {
    return {
      id: 'hmrc-processing',
      title: '5. HMRC Data Processing',
      content: `
We submit payroll data to HMRC through the Real Time Information (RTI) system. This is a legal requirement under UK tax law.

**Data Submitted to HMRC:**
- Employee names and addresses
- National Insurance numbers
- Tax codes
- Gross pay and taxable pay
- Tax deducted
- National Insurance contributions (employee and employer)
- Student loan deductions
- Pension contributions
- Statutory payments
- Employment start/leaving dates
- Hours worked (where variable)

**Submission Types:**
- **Full Payment Submission (FPS):** Submitted on or before each payday
- **Employer Payment Summary (EPS):** Monthly submission for adjustments
- **Earlier Year Update (EYU):** Corrections to previous tax years

**HMRC as Joint Controller:**
For RTI submissions, HMRC acts as a joint data controller. HMRC's privacy policy applies to data they hold. See: https://www.gov.uk/government/publications/data-protection-act-dpa-information-hm-revenue-and-customs-hold-about-you

**Fraud Prevention:**
We are required to submit fraud prevention headers with HMRC API calls. This includes:
- Device identifiers
- IP address information
- Browser/application details
- Timezone information

This data helps HMRC prevent tax fraud and is required for API access.

**HMRC Data Retention:**
HMRC retains RTI submission data according to their own retention policies. We retain our copy for 6 years as legally required.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataSharingSection(): PrivacyPolicySection {
    return {
      id: 'data-sharing',
      title: '6. Data Sharing',
      content: `
We may share your personal data with the following parties:

**Statutory Bodies:**
- HM Revenue & Customs (HMRC) - For tax and National Insurance
- The Pensions Regulator - For pension compliance
- Department for Work and Pensions (DWP) - For statutory payment verification

**Service Providers:**
- Cloud hosting providers (Firebase/Google Cloud) - Data storage
- Payment processors - For BACS payments
- Pension providers - For contribution submissions
- Email service providers - For payslip delivery

**Your Employer:**
If you are an employee using this system, your employer has access to your payroll and employment data as your employer is the data controller.

**Legal Requirements:**
We may disclose your data if required by law, court order, or to:
- Comply with legal obligations
- Protect our rights or property
- Prevent fraud or security threats
- Respond to government requests

**Business Transfers:**
In the event of a merger, acquisition, or sale of assets, personal data may be transferred. We will notify you of any such change.

**We Never:**
- Sell your personal data
- Share data with third parties for their marketing purposes without your explicit consent
- Use HMRC logos or imply HMRC endorsement
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataRetentionSection(): PrivacyPolicySection {
    return {
      id: 'data-retention',
      title: '7. Data Retention',
      content: `
We retain personal data only for as long as necessary for the purposes for which it was collected, or as required by law.

**Statutory Retention Periods:**

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Payroll records | 6 years after tax year end | HMRC requirements |
| HMRC submissions | 6 years | HMRC requirements |
| P45/P60 copies | 6 years | HMRC requirements |
| Tax calculations | 6 years | HMRC requirements |
| Pension records | 6 years after employment ends | Pensions Act |
| Employee contracts | 6 years after employment ends | Limitation Act |
| Accident/injury records | 3 years (or until age 21 if minor) | Health & Safety |
| Statutory sick pay | 3 years | SSP Regulations |
| Audit logs | 6-7 years | Compliance/Security |

**After Retention Period:**
- Data is securely deleted or anonymised
- Deletion is logged in our audit trail
- Backups are updated within 30 days

**Employee Departure:**
When employment ends:
- Active access is removed immediately
- Data is retained per statutory requirements
- Final P45 is generated and provided
- Data is marked for retention review

**Your Rights:**
You can request deletion of data not subject to legal retention requirements. See "Your Rights" section.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataSecuritySection(): PrivacyPolicySection {
    return {
      id: 'data-security',
      title: '8. Data Security',
      content: `
We implement appropriate technical and organisational measures to protect your personal data:

**Encryption:**
- Data in transit: TLS 1.3 encryption for all connections
- Data at rest: AES-256-GCM encryption for sensitive data
- Database encryption: Firebase encryption at rest
- OAuth tokens: Encrypted before storage

**Access Controls:**
- Role-based access control (RBAC)
- Principle of least privilege
- Multi-factor authentication (where available)
- Session timeout enforcement
- IP logging and monitoring

**Infrastructure Security:**
- Firebase/Google Cloud security standards
- Regular security updates and patches
- Firewall protection
- DDoS protection
- Regular vulnerability assessments

**Operational Security:**
- Staff security training
- Background checks for personnel with data access
- Incident response procedures
- Regular security audits
- Penetration testing

**Data Masking:**
- National Insurance numbers: Partially masked in logs
- Bank details: Last 4 digits only in displays
- Email addresses: Masked in audit logs
- IP addresses: Partially masked for privacy

**OAuth Security (HMRC):**
- Credentials stored server-side only (Firebase Secrets)
- Never exposed to client applications
- Token refresh handled server-side
- Automatic credential rejection from client requests

**Audit Trail:**
All access to sensitive data is logged, including:
- Who accessed the data
- When it was accessed
- What action was performed
- IP address (masked) and user agent
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getYourRightsSection(): PrivacyPolicySection {
    return {
      id: 'your-rights',
      title: '9. Your Rights',
      content: `
Under UK GDPR, you have the following rights regarding your personal data:

**Right of Access (Subject Access Request - SAR):**
- Request a copy of your personal data
- We will respond within 1 month (extendable to 3 months for complex requests)
- First copy is free; reasonable fee for additional copies
- Submit requests to our Data Protection Officer

**Right to Rectification:**
- Request correction of inaccurate data
- Request completion of incomplete data
- We will respond within 1 month

**Right to Erasure (Right to be Forgotten):**
- Request deletion of your personal data
- This right does not apply where we have legal obligations (e.g., HMRC retention)
- We will inform you which data can/cannot be deleted

**Right to Restrict Processing:**
- Request limitation of how we use your data
- Applicable while we verify accuracy or assess erasure requests

**Right to Data Portability:**
- Receive your data in a structured, machine-readable format
- Request transfer to another controller
- Applies to data processed by automated means based on consent/contract

**Right to Object:**
- Object to processing based on legitimate interests
- Object to direct marketing (absolute right)
- Object to processing for research/statistics

**Rights Related to Automated Decision-Making:**
- Not be subject to decisions based solely on automated processing
- Request human intervention
- Express your point of view and contest decisions

**How to Exercise Your Rights:**
1. Contact our Data Protection Officer
2. Verify your identity (we may request proof)
3. We will acknowledge within 5 working days
4. We will respond within 1 month

**No Fee Usually Required:**
You will not have to pay a fee to exercise your rights. However, we may charge a reasonable fee if your request is clearly unfounded, repetitive, or excessive.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getAutomatedDecisionMakingSection(): PrivacyPolicySection {
    return {
      id: 'automated-decisions',
      title: '10. Automated Decision-Making',
      content: `
**Payroll Calculations:**
Our system performs automated calculations for:
- Tax deductions (PAYE)
- National Insurance contributions
- Student loan deductions
- Pension contributions
- Statutory payments

These calculations follow HMRC-mandated formulas and are not discretionary decisions. They are based on:
- Your tax code (set by HMRC)
- Your earnings
- Statutory rates and thresholds

**No Profiling:**
We do not use your personal data for profiling or automated decision-making that produces legal effects or significantly affects you.

**Human Review:**
- All payroll runs are reviewed before submission
- Anomalies are flagged for human review
- You can request human review of any calculation
- Errors can be corrected via supplementary submissions

**Your Rights:**
If you believe an automated calculation is incorrect:
1. Contact your employer's payroll administrator
2. Request a review of the calculation
3. We will explain the logic and correct any errors
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getInternationalTransfersSection(): PrivacyPolicySection {
    return {
      id: 'international-transfers',
      title: '11. International Data Transfers',
      content: `
**Data Location:**
Your personal data is primarily stored and processed within the United Kingdom and European Economic Area (EEA).

**Cloud Services:**
We use Google Cloud Platform (Firebase) which may process data in:
- United Kingdom
- European Union
- United States (with appropriate safeguards)

**Transfer Safeguards:**
When data is transferred outside the UK/EEA, we ensure protection through:
- UK-approved Standard Contractual Clauses (SCCs)
- Adequacy decisions by the UK Government
- Binding Corporate Rules (where applicable)
- Certification schemes (e.g., EU-US Data Privacy Framework)

**Google Cloud Compliance:**
Google maintains compliance certifications including:
- ISO 27001, 27017, 27018
- SOC 1, SOC 2, SOC 3
- UK Government G-Cloud framework

**Your Rights:**
You may request details of safeguards in place for international transfers by contacting our Data Protection Officer.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getCookiesSection(): PrivacyPolicySection {
    return {
      id: 'cookies',
      title: '12. Cookies and Similar Technologies',
      content: `
**Essential Cookies:**
We use essential cookies for:
- Authentication and session management
- Security features
- Load balancing

These cookies are necessary for the system to function and cannot be disabled.

**Analytics Cookies:**
With your consent, we may use analytics cookies to:
- Understand how users interact with our system
- Improve user experience
- Identify and fix issues

**Cookie Management:**
- You can manage cookie preferences in your browser settings
- Blocking essential cookies may prevent access to the system
- We provide a cookie consent banner on first visit

**Third-Party Cookies:**
Firebase may set cookies for:
- Authentication
- Performance monitoring
- Analytics (if enabled)

See Google's privacy policy for details on their cookie usage.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getDataBreachSection(): PrivacyPolicySection {
    return {
      id: 'data-breach',
      title: '13. Data Breach Notification',
      content: `
**Our Commitment:**
We take data security seriously and have procedures in place to detect, report, and investigate data breaches.

**Breach Response Plan:**
1. **Detection & Containment:** Immediate action to stop the breach
2. **Assessment:** Evaluate severity, data affected, and risk to individuals
3. **Notification:** Notify relevant parties within required timeframes
4. **Documentation:** Record all breaches in our breach register
5. **Remediation:** Implement measures to prevent recurrence

**ICO Notification:**
We will notify the Information Commissioner's Office (ICO) within 72 hours if a breach is likely to result in a risk to your rights and freedoms.

**HMRC Notification:**
If the breach involves payroll or tax data, we will notify HMRC within 72 hours.

**Individual Notification:**
We will notify you directly and without undue delay if a breach is likely to result in a high risk to your rights and freedoms. Notification will include:
- Nature of the breach
- Data categories affected
- Likely consequences
- Measures taken to address the breach
- Steps you can take to protect yourself

**Reporting a Concern:**
If you believe there has been a data breach or security incident, please report it immediately to our Data Protection Officer.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getChangesToPolicySection(): PrivacyPolicySection {
    return {
      id: 'policy-changes',
      title: '14. Changes to This Policy',
      content: `
**Policy Updates:**
We may update this privacy policy from time to time. Changes may be necessary due to:
- Changes in law or regulation
- Changes in our services
- Feedback from users or regulators
- Security improvements

**Notification of Changes:**
- Significant changes will be communicated via email or system notification
- The updated policy will be posted on our platform
- The "Last Updated" date will be revised
- Previous versions will be archived for reference

**Your Continued Use:**
Continued use of our services after policy changes constitutes acceptance of the updated policy.

**Review Schedule:**
This policy is reviewed at least annually and updated as needed.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getContactSection(): PrivacyPolicySection {
    return {
      id: 'contact',
      title: '15. Contact Us',
      content: `
**Data Protection Officer:**
For all privacy-related enquiries, including exercising your rights:

Email: [DPO Email - configured per company]
Phone: [DPO Phone - configured per company]
Address: [Company Address - configured per company]

**Response Times:**
- Acknowledgement: Within 5 working days
- Full response: Within 1 month (extendable for complex requests)

**What to Include:**
When contacting us, please provide:
- Your full name
- Your employee ID (if applicable)
- Company name (if applicable)
- Details of your request
- Preferred contact method

**Identity Verification:**
We may request proof of identity before processing your request to protect your data from unauthorised access.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  private getComplaintsSection(): PrivacyPolicySection {
    return {
      id: 'complaints',
      title: '16. Complaints',
      content: `
**Internal Complaints:**
If you are unhappy with how we have handled your personal data or responded to your request, please contact our Data Protection Officer first. We will investigate and respond within 1 month.

**Supervisory Authority:**
You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you believe your data protection rights have been violated.

**Information Commissioner's Office:**
Website: https://ico.org.uk
Helpline: 0303 123 1113
Address:
Wycliffe House
Water Lane
Wilmslow
Cheshire
SK9 5AF

**When to Complain:**
You can complain to the ICO at any time, but we encourage you to contact us first as we may be able to resolve your concern more quickly.
      `.trim(),
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Get privacy policy as HTML
   */
  getPrivacyPolicyHTML(companyInfo: {
    companyName: string;
    companyAddress: string;
    dpoName: string;
    dpoEmail: string;
    dpoPhone?: string;
  }): string {
    const policy = this.getPrivacyPolicy(companyInfo);
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - ${policy.companyName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #007bff; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    strong { color: #333; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <div class="meta">
    <p><strong>Company:</strong> ${policy.companyName}</p>
    <p><strong>Version:</strong> ${policy.version}</p>
    <p><strong>Effective Date:</strong> ${policy.effectiveDate}</p>
    <p><strong>Last Updated:</strong> ${policy.lastUpdated}</p>
    <p><strong>Data Protection Officer:</strong> ${policy.dataProtectionOfficer.name} (${policy.dataProtectionOfficer.email})</p>
  </div>
`;

    for (const section of policy.sections) {
      html += `
  <div class="section" id="${section.id}">
    <h2>${section.title}</h2>
    <div>${this.markdownToHTML(section.content)}</div>
  </div>
`;
    }

    html += `
</body>
</html>
`;
    return html;
  }

  /**
   * Simple markdown to HTML converter
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.some(c => c.includes('---'))) {
          return '';
        }
        const tag = match.includes('---') ? 'th' : 'td';
        return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
      })
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    return `<p>${html}</p>`;
  }

  /**
   * Get current policy version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Check if user has accepted current policy version
   */
  hasAcceptedCurrentVersion(acceptedVersion: string): boolean {
    return acceptedVersion === this.currentVersion;
  }
}

// Export singleton instance
export const privacyPolicyService = new PrivacyPolicyService();
