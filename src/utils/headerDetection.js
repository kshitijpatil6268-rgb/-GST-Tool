/**
 * Flexible header detection and column mapping for GSTR-2B and Books Excel sheets.
 */

// Field definitions and synonyms for GSTR-2B
export const GSTR2B_FIELD_PATTERNS = {
  invoiceNumber: {
    required: true,
    label: "Invoice Number",
    patterns: [
      /^invoice\s*(number|no\.?|#)?$/i,
      /^inv\s*(number|no\.?|#)?$/i,
      /^invoice\s*num$/i,
      /^suppl(ier)?\s*inv(oice)?\s*(no\.?|number|#)?$/i,
      /invoice\s*no/i,
      /invoice\s*number/i
    ]
  },
  supplierGstin: {
    required: false,
    label: "Supplier GSTIN",
    patterns: [
      /^gstin(\s*of\s*supplier)?$/i,
      /^supplier\s*gstin$/i,
      /^gstin$/i,
      /^gstin\/uin(\s*of\s*supplier)?$/i,
      /gstin/i
    ]
  },
  supplierName: {
    required: false,
    label: "Supplier Name",
    patterns: [
      /^trade\s*\/?\s*legal\s*name$/i,
      /^supplier\s*name$/i,
      /^legal\s*name(\s*of\s*supplier)?$/i,
      /^trade\s*name$/i,
      /^vendor\s*name$/i,
      /supplier\s*name/i,
      /trade.*name/i
    ]
  },
  invoiceDate: {
    required: false,
    label: "Invoice Date",
    patterns: [
      /^invoice\s*date$/i,
      /^inv\s*date$/i,
      /^date$/i,
      /invoice\s*date/i
    ]
  },
  invoiceType: {
    required: false,
    label: "Invoice Type",
    patterns: [
      /^invoice\s*type$/i,
      /^inv\s*type$/i,
      /^type$/i,
      /invoice\s*type/i
    ]
  },
  invoiceValue: {
    required: false,
    label: "Invoice Value",
    patterns: [
      /^invoice\s*value$/i,
      /^inv\s*value$/i,
      /^total\s*invoice\s*value$/i,
      /^total\s*value$/i,
      /^invoice\s*amount$/i,
      /invoice\s*val/i
    ]
  },
  taxableValue: {
    required: false,
    label: "Taxable Value",
    patterns: [
      /^taxable\s*value$/i,
      /^taxable\s*amount$/i,
      /taxable\s*val/i
    ]
  },
  igst: {
    required: false,
    label: "Integrated Tax (IGST)",
    patterns: [
      /^integrated\s*tax(\s*amount)?$/i,
      /^igst(\s*amount)?$/i,
      /^igst$/i
    ]
  },
  cgst: {
    required: false,
    label: "Central Tax (CGST)",
    patterns: [
      /^central\s*tax(\s*amount)?$/i,
      /^cgst(\s*amount)?$/i,
      /^cgst$/i
    ]
  },
  sgst: {
    required: false,
    label: "State/UT Tax (SGST)",
    patterns: [
      /^state\s*\/?\s*ut\s*tax(\s*amount)?$/i,
      /^sgst(\s*amount)?$/i,
      /^sgst$/i
    ]
  }
};

// Field definitions and synonyms for Books (Payable Details)
export const BOOKS_FIELD_PATTERNS = {
  transactionNumber: {
    required: true,
    label: "Transaction/Invoice Number",
    patterns: [
      /^transaction\s*#?$/i,
      /^transaction\s*number$/i,
      /^trans\s*#?$/i,
      /^invoice\s*(number|no\.?|#)?$/i,
      /^bill\s*(number|no\.?|#)?$/i,
      /transaction\s*#/i,
      /transaction\s*no/i,
      /transaction/i
    ]
  },
  vendorName: {
    required: false,
    label: "Vendor Name",
    patterns: [
      /^vendor\s*name$/i,
      /^supplier\s*name$/i,
      /^party\s*name$/i,
      /vendor\s*name/i,
      /supplier\s*name/i
    ]
  },
  date: {
    required: false,
    label: "Invoice Date",
    patterns: [
      /^date$/i,
      /^invoice\s*date$/i,
      /^bill\s*date$/i,
      /^trans(action)?\s*date$/i,
      /date/i
    ]
  },
  transactionType: {
    required: false,
    label: "Transaction Type",
    patterns: [
      /^transaction\s*type$/i,
      /^trans\s*type$/i,
      /^type$/i,
      /^bill\s*type$/i,
      /transaction\s*type/i
    ]
  },
  itemName: {
    required: false,
    label: "Item Name",
    patterns: [
      /^item\s*name$/i,
      /^product\s*name$/i,
      /^item\s*description$/i,
      /^description$/i,
      /item\s*name/i
    ]
  },
  itemAmount: {
    required: false,
    label: "Item Amount",
    patterns: [
      /^item\s*amount\s*(\(.*\))?$/i,
      /^item\s*amount$/i,
      /^item\s*amt$/i,
      /^amount$/i,
      /item\s*amount/i
    ]
  },
  sgstAmount: {
    required: false,
    label: "SGST Amount",
    patterns: [
      /^sgst\s*amount$/i,
      /^sgst$/i,
      /sgst\s*amount/i
    ]
  },
  cgstAmount: {
    required: false,
    label: "CGST Amount",
    patterns: [
      /^cgst\s*amount$/i,
      /^cgst$/i,
      /cgst\s*amount/i
    ]
  },
  igstAmount: {
    required: false,
    label: "IGST Amount",
    patterns: [
      /^igst\s*amount$/i,
      /^igst$/i,
      /igst\s*amount/i
    ]
  },
  billAmount: {
    required: false,
    label: "Bill Amount",
    patterns: [
      /^bill\s*amount\s*(\(.*\))?$/i,
      /^bill\s*amount$/i,
      /^total\s*bill\s*amount$/i,
      /^total\s*amount$/i,
      /^invoice\s*amount$/i,
      /bill\s*amount/i
    ]
  },
  status: {
    required: false,
    label: "Status",
    patterns: [
      /^status$/i,
      /^bill\s*status$/i,
      /^payment\s*status$/i
    ]
  }
};

/**
 * Normalises a header string for comparison.
 */
function cleanHeader(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Checks if a cell string matches any pattern for a given field.
 */
function matchesPattern(headerText, patterns) {
  if (!headerText) return false;
  return patterns.some(pattern => pattern.test(headerText));
}

/**
 * Scans a 2D array representing an Excel worksheet to detect the actual header row
 * and mapped column indices for specified field definitions.
 *
 * @param {Array<Array<any>>} sheetData - 2D array of rows
 * @param {Object} fieldDefinitions - Patterns for fields (GSTR2B_FIELD_PATTERNS or BOOKS_FIELD_PATTERNS)
 * @param {string} fileType - 'GSTR-2B' or 'Books' for error reporting
 * @returns {{
 *   headerRowIndex: number,
 *   columnMap: Object.<string, number>,
 *   detectedHeaders: Object.<string, string>,
 *   matchedFieldsCount: number
 * }}
 */
export function detectHeaders(sheetData, fieldDefinitions, fileType = 'File') {
  if (!sheetData || sheetData.length === 0) {
    throw new Error(`The uploaded ${fileType} sheet is empty.`);
  }

  const maxScanRows = Math.min(sheetData.length, 25);
  let bestRowIndex = -1;
  let bestMatchCount = -1;
  let bestColumnMap = {};
  let bestDetectedHeaders = {};

  // Check rows 0..maxScanRows
  for (let r = 0; r < maxScanRows; r++) {
    const row = sheetData[r] || [];
    const nextRow = sheetData[r + 1] || [];
    const columnMap = {};
    const detectedHeaders = {};
    let matchCount = 0;

    // For each target field definition
    for (const [fieldKey, fieldDef] of Object.entries(fieldDefinitions)) {
      let foundCol = -1;
      let foundHeaderName = '';

      // First check single row cell matches
      for (let c = 0; c < row.length; c++) {
        const text = cleanHeader(row[c]);
        if (text && matchesPattern(text, fieldDef.patterns)) {
          foundCol = c;
          foundHeaderName = text;
          break;
        }
      }

      // If not found and nextRow exists, check combination (e.g. multi-row header where r is category, r+1 is subheader)
      if (foundCol === -1 && nextRow.length > 0) {
        for (let c = 0; c < Math.max(row.length, nextRow.length); c++) {
          const topText = cleanHeader(row[c]);
          const bottomText = cleanHeader(nextRow[c]);
          const combined = `${topText} ${bottomText}`.trim();

          if (bottomText && matchesPattern(bottomText, fieldDef.patterns)) {
            foundCol = c;
            foundHeaderName = bottomText;
            break;
          } else if (combined && matchesPattern(combined, fieldDef.patterns)) {
            foundCol = c;
            foundHeaderName = combined;
            break;
          }
        }
      }

      if (foundCol !== -1) {
        columnMap[fieldKey] = foundCol;
        detectedHeaders[fieldKey] = foundHeaderName;
        matchCount++;
      }
    }

    // Must match at least the required identifier column (invoiceNumber or transactionNumber) to qualify
    const requiredField = Object.entries(fieldDefinitions).find(([, def]) => def.required);
    const hasRequiredField = requiredField ? columnMap[requiredField[0]] !== undefined : false;

    if (hasRequiredField && matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestRowIndex = r;
      bestColumnMap = columnMap;
      bestDetectedHeaders = detectedHeaders;
    }
  }

  // If no row matched the required field
  const requiredDef = Object.entries(fieldDefinitions).find(([, def]) => def.required);
  if (bestRowIndex === -1 || !bestColumnMap[requiredDef[0]]) {
    const expectedName = requiredDef ? requiredDef[1].label : 'Invoice Number / Transaction#';
    throw new Error(
      `Could not identify the required "${expectedName}" column in the uploaded ${fileType} file. ` +
      `Please ensure the sheet contains valid column headers.`
    );
  }

  return {
    headerRowIndex: bestRowIndex,
    columnMap: bestColumnMap,
    detectedHeaders: bestDetectedHeaders,
    matchedFieldsCount: bestMatchCount
  };
}

