# HMRC SDST (Software Developer Support Team) Registration Guide

## Overview

For RTI (Real Time Information) submissions, HMRC requires registration with the Software Developer Support Team (SDST) and submission via the **Transaction Engine** (XML-based), not REST APIs.

---

## 🔴 Critical Requirements

### 1. Register with SDST
**Priority: CRITICAL**

- **Email:** sdsteam@hmrc.gov.uk
- **Purpose:** Get Vendor ID and test credentials
- **What you'll receive:**
  - Vendor ID
  - Test credentials (SenderID, Value/Password)
  - Access to test services (TPVS, ETS)

### 2. Transaction Engine Submission

RTI submissions must use:
- **URL:** `https://test-transaction-engine.tax.service.gov.uk/submission` (test)
- **URL:** `https://transaction-engine.tax.service.gov.uk/submission` (production)
- **Format:** XML with GOVTalk envelope wrapper
- **Protocol:** Transaction Engine: Document Submission Protocol

### 3. Required Components

#### A. GOVTalk Envelope
Your RTI XML (`IRenvelope`) must be wrapped in GOVTalk envelope format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<GovTalkMessage xmlns="http://www.govtalk.gov.uk/schemas/govtalk/govtalkheader">
  <EnvelopeVersion>2.0</EnvelopeVersion>
  <Header>
    <MessageDetails>
      <Class>HMRC-PAYE-RTI</Class>
      <Qualifier>request</Qualifier>
      <Function>submit</Function>
      <CorrelationID>unique-id-here</CorrelationID>
    </MessageDetails>
    <SenderDetails>
      <IDAuthentication>
        <SenderID>Your-Vendor-ID</SenderID>
        <Authentication>
          <Method>clear</Method>
          <Value>Your-Password</Value>
        </Authentication>
      </IDAuthentication>
    </SenderDetails>
  </Header>
  <GovTalkDetails>
    <Keys>
      <Key Type="TaxOfficeNumber">123</Key>
      <Key Type="TaxOfficeReference">AB45678</Key>
    </Keys>
  </GovTalkDetails>
  <Body>
    <!-- Your RTI XML (IRenvelope) goes here -->
  </Body>
</GovTalkMessage>
```

#### B. IRmark/HMRCmark Generation
**Required for digital receipts and proof of submission**

- Calculate hash of the `<Body>` content
- Generate IRmark/HMRCmark string
- Include in GOVTalk envelope

#### C. Class Names
For RTI submissions, use:
- **FPS:** `HMRC-PAYE-RTI-FPS` (or with version suffix)
- **EPS:** `HMRC-PAYE-RTI-EPS`
- **EYU:** `HMRC-PAYE-RTI-EYU`
- **Test in Live:** Add `-TIL` suffix (e.g., `HMRC-PAYE-RTI-FPS-TIL`)

#### D. GatewayTest Flag
- **Test/ETS:** `<GatewayTest>1</GatewayTest>` (or omit)
- **Production:** `<GatewayTest>0</GatewayTest>` (or omit)

---

## 📋 Registration Steps

### Step 1: Contact SDST
Email: **sdsteam@hmrc.gov.uk**

**Include in your email:**
- Company name
- Software product name
- Intended service (RTI/PAYE)
- Request for Vendor ID and test credentials

### Step 2: Receive Credentials
SDST will provide:
- **Vendor ID** (SenderID)
- **Test Password** (Value)
- **Access to test services**

### Step 3: Test with ETS (External Test Service)
- Submit test RTI XML to: `https://test-transaction-engine.tax.service.gov.uk/submission`
- Test credentials will be validated
- XML will be validated against schema and business rules

### Step 4: Complete Recognition Process
- Submit test scenarios provided by SDST
- Send XML outputs to SDST for review
- Address any feedback
- Receive recognition approval

**Timeline:** SDST aims to complete recognition within 10 working days

---

## 🧪 Test Services

### Third Party Validation Service (TPVS)
- **Purpose:** Validate XML body only
- **URL:** See technical pack for service-specific URL
- **Limitation:** No Transaction Engine functionality

### External Test Service (ETS)
- **Purpose:** Full end-to-end testing
- **URL:** `https://test-transaction-engine.tax.service.gov.uk/submission`
- **Poll URL:** `https://test-transaction-engine.tax.service.gov.uk/poll`
- **Features:**
  - Validates GOVTalk Header
  - Verifies test credentials
  - Handles messaging process
  - Routes to TPVS for XML validation
  - Returns pass/fail response

### Test in Live (TIL)
- Use `-TIL` suffix in Class name
- Validates with live credentials
- No data sent to HMRC backend systems
- Useful for testing before release

---

## 📚 Technical Packs

SDST provides technical packs containing:

1. **Transaction Engine: Document Submission Protocol**
   - Required reading before development
   - Explains request/response handling

2. **XML Schema**
   - Format and structure
   - Data types
   - Validation rules

3. **Business Rules Validation (BVR) Document**
   - Cross-field validation rules
   - Schematron files (for RIM services)

4. **IRmark/HMRCmark Technical Pack**
   - Digital signature generation
   - Hash calculation
   - Receipt verification

5. **How to Use the Test Service**
   - Testing guide
   - Example submissions

---

## 🔧 Implementation Requirements

### What Needs to Be Updated

1. **Transaction Engine Wrapper**
   - Create GOVTalk envelope generator
   - Wrap existing RTI XML (IRenvelope)
   - Include MessageDetails, SenderDetails, Keys

2. **IRmark/HMRCmark Generator**
   - Calculate hash of Body content
   - Generate mark string
   - Include in envelope

3. **Submission Endpoint**
   - Update to use Transaction Engine URLs
   - Handle GOVTalk protocol
   - Implement polling for responses

4. **Credential Management**
   - Store Vendor ID (SenderID)
   - Store test/live passwords
   - Manage per environment

5. **Response Handling**
   - Parse GOVTalk response
   - Extract digital receipt
   - Handle errors appropriately

---

## 🚀 Next Steps

### Immediate (To Test OAuth):
- ✅ Updated code to use `hello` scope for Hello World API
- ✅ Environment variables configured
- Test OAuth connection now

### Short Term (For RTI):
1. Email SDST: sdsteam@hmrc.gov.uk
2. Request Vendor ID and test credentials
3. Implement Transaction Engine wrapper
4. Add IRmark/HMRCmark generation
5. Update submission endpoints
6. Test with ETS

### Medium Term (Recognition):
1. Complete test scenarios
2. Submit XML outputs to SDST
3. Address feedback
4. Receive recognition
5. Go live with production credentials

---

## 📞 Support

**SDST Email:** sdsteam@hmrc.gov.uk  
**Response Time:** Within 2 working days  
**Test Service Support:** Monday-Friday, 9am-5pm

---

## 📝 Notes

- **Transaction Engine is required** for RTI submissions (not optional)
- **REST API approach** we implemented may not be applicable for RTI
- **Vendor ID** is required before any RTI testing
- **Digital receipts** (IRmark/HMRCmark) are critical for compliance
- **Recognition process** must be completed before production use

---

**Status:** OAuth testing ready. Transaction Engine integration pending SDST registration.
