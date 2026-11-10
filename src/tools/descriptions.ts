export const descriptions = {
  list_documents: [
    'List documents (issued/received invoices, receipts).',
    'Costs 1 API unit per document read, so always narrow with dateFrom/dateTo + dateType, resourceSubType or identificationNumber (counterparty IČO).',
    'Max 2000 per call. Set orderBy.',
    'Returns { documents, searchAfter }: for the next page repeat the same request with that searchAfter array unchanged.',
    'An empty documents array means no more pages, and each extra page costs units too, so only page when needed.',
  ].join(' '),

  get_document:
    'Get one document with full detail by documentId. Costs 1 API unit.',

  issue_invoice: [
    'Issue a new invoice (uses the paid "Vystavenie faktúr cez API" module).',
    'Number and variable symbol come from the default number series when omitted.',
    'Always pass full customer data (name, address, lowercase countryCode like "sk"), IČO alone is not matched to a saved partner.',
    'dueDate defaults to the issue date, so set it.',
    'paymentInfo.iban is required when the organization has no default bank account.',
    'Credit/debit notes need an explicit number unless a series exists for that type.',
    'For foreign B2B customers set reverseCharge: true, customer.icDph and vatPayer: true, which prints "Reverse Charge" on the PDF.',
  ].join(' '),

  update_issued_invoice:
    'Update an issued invoice. Dates must be plain YYYY-MM-DD. Costs 1 API unit.',

  get_invoice_pdf:
    'Download the invoice PDF to ~/Downloads and return its path. Costs 1 API unit.',

  send_invoice_by_email:
    'Generate the invoice PDF and email it to recipients. Pass subject and message, the default template can be missing. Costs 1 API unit.',

  einvoice_lookup:
    'Check whether a Slovak company can receive e-invoices (e-faktúra) via Peppol, by DIČ (with or without SK prefix). found:false is a normal answer, not an error.',

  send_einvoice: [
    'Send an e-invoice (e-faktúra) over Peppol.',
    'xml must be a complete Peppol BIS Billing 3.0 UBL Invoice or CreditNote, built from the invoice data (get_document) with the same number, dates, parties, items and totals as the Doklado invoice.',
    'Pattern that passes Doklado BIS3 validation:',
    'CustomizationID urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0,',
    'ProfileID urn:fdc:peppol.eu:2017:poacc:billing:01:1.0,',
    'InvoiceTypeCode 380 (credit note: CreditNote root, 381),',
    'BuyerReference = invoice number,',
    'both parties EndpointID schemeID="0245" = DIČ without SK,',
    'seller DIČ as PartyTaxScheme with TaxScheme ID "TAX",',
    'IČO in PartyLegalEntity/CompanyID,',
    'PaymentMeansCode 58 + PaymentID = variable symbol + IBAN,',
    'units as UN/ECE codes (HUR hour, MON month, C62 piece).',
    'Non-VAT-payer: TaxCategory O with TaxExemptionReasonCode VATEX-EU-O and reason "Neplatiteľ DPH", 0.00 tax, no Percent, no seller/buyer VAT IDs.',
    'The receiver is looked up by DIČ first.',
    'Response 202/ACCEPTED only means Doklado accepted it for processing, not delivered: check delivery in the Doklado web app.',
    'Resending the same invoice number to the same customer is safe, it is never delivered twice (same Idempotency-Key).',
    'A 422 lists validation errors to fix.',
  ].join(' '),

  einvoice_list_received:
    'List e-invoices received via Peppol (metadata only). status RECEIVED = not yet acknowledged. For the next page pass nextPageToken as pageToken. No nextPageToken means no more pages.',

  einvoice_get_received:
    'Download a received e-invoice XML to ~/Downloads and return its path and metadata. Does not acknowledge it.',

  einvoice_acknowledge:
    'Mark a received e-invoice as processed (ACKNOWLEDGED). Only call after it was saved or booked. Idempotent.',
} as const;

export type ToolName = keyof typeof descriptions;
