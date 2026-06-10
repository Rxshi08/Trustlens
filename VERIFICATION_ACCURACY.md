# TrustLens — Verification Logic Analysis & Accuracy Improvements

## Current Verification Pipeline

```
Upload (4 docs) → OCR per document → Cross-document checks → Trust Score → PDF Report
```

### Trust Score Algorithm (backend)

Starting score: **100**, penalties applied:

| Check | Penalty |
|-------|---------|
| Name mismatch across docs | −20 |
| DOB mismatch (Aadhaar vs PAN) | −20 |
| Missing mandatory fields | −15 |
| Blurry/poor quality document | −10 |
| Duplicate Aadhaar/PAN in DB | −10 |
| Document type mismatch | −10 per doc |
| Low authenticity (<50) | −15 per doc |
| Medium authenticity (<75) | −8 per doc |
| Low quality (<50) | −10 per doc |
| Medium quality (<75) | −5 per doc |

**Risk mapping:** ≥80 Low / ≥50 Medium / <50 High

---

## Current OCR Capabilities

### Aadhaar
- Keyword detection (`aadhaar`, `uidai`, `government of india`)
- Regex for 12-digit number (with spaces/dashes/masked)
- DOB extraction via regex patterns
- Name extraction via label patterns + heuristics
- Blur detection (Laplacian variance via OpenCV)

### PAN
- Keyword detection (`income tax`, `permanent account number`)
- Regex: `[A-Z]{5}[0-9]{4}[A-Z]`
- DOB and name extraction (shared logic)

### Resume
- Skill matching against fixed keyword database (~25 skills)
- Email, phone, name extraction
- Employability score based on skill count
- Section detection (`skills`, `education`, `experience`)

### Marksheet
- University/college keyword detection
- CGPA/percentage/grade patterns
- Student name extraction

### Cross-Document Validation
- Name: normalized lowercase alpha comparison with substring matching
- DOB: exact string match between Aadhaar and PAN only
- Duplicate: MongoDB query on stored ID numbers

---

## Accuracy Limitations

| Issue | Impact |
|-------|--------|
| Heuristic OCR only | No government API verification |
| Name matching is substring-based | False positives on common names |
| DOB format inconsistency | `01/01/2000` vs `01-01-2000` fails match |
| Fixed skill database | Misses modern skills (Kubernetes, TypeScript) |
| No Aadhaar Verhoeff checksum | Invalid Aadhaar numbers accepted |
| No PAN 4th-char entity validation | Fake PAN patterns pass |
| PDF text extraction first | Scanned docs may get poor OCR |
| No marksheet institute verification | Cannot confirm university authenticity |
| Windows-hardcoded paths (fixed) | Was breaking on Linux servers |

---

## Recommended Improvements

### Aadhaar — Higher Accuracy

1. **Verhoeff checksum validation** on extracted 12-digit numbers
   ```python
   def validate_aadhaar(number):
       # Implement Verhoeff algorithm — rejects 90% of random numbers
   ```

2. **UIDAI offline XML verification** (e-Aadhaar with digital signature)
   - Parse XML/PDF QR code from e-Aadhaar
   - Verify digital signature against UIDAI certificate

3. **Aadhaar masking compliance** — only store last 4 digits; hash full number for duplicate check

4. **Layout-based extraction** — use template matching for standard Aadhaar card layout regions (photo area, QR code position)

5. **Government API** (production only):
   - UIDAI Aadhaar Authentication API (requires licensed KUA/KSA)
   - DigiLocker API for consent-based document fetch

### PAN — Higher Accuracy

1. **PAN format validation** — 4th character must match entity type:
   - `P` = Person, `C` = Company, `H` = HUF, etc.

2. **Income Tax e-Filing API** — PAN verification via NSDL/Income Tax portal (requires registration)

3. **Name fuzzy matching** — use Levenshtein distance with threshold (e.g. ≤2 edits) instead of substring:
   ```python
   from rapidfuzz import fuzz
   fuzz.ratio(normalize(aadhaar_name), normalize(pan_name)) >= 85
   ```

4. **Cross-check PAN name with Aadhaar** using token-based matching (handle middle name omissions)

### Resume — Higher Accuracy

1. **NLP-based skill extraction** — replace keyword list with:
   - spaCy NER for organizations, degrees
   - Embeddings similarity against skill ontology (ESCO database)

2. **Education verification** — extract degree, institution, year; cross-check with marksheet

3. **Experience timeline validation** — detect gaps, overlapping dates, future dates

4. **Resume fraud signals**:
   - Copy-paste detection across candidates
   - Inflated experience (dates vs graduation year)
   - Email domain validation (not disposable)

5. **LLM-assisted parsing** (optional) — structured JSON extraction from resume text via GPT/Claude API

### Marksheet — Higher Accuracy

1. **Institution database lookup** — verify university name against UGC/AICTE approved list

2. **Roll number / registration number** regex per university format

3. **CGPA range validation** — reject CGPA > 10 or < 0

4. **Cross-document checks**:
   - Marksheet name must match Aadhaar/PAN
   - Graduation year must be consistent with resume education section

5. **QR code / barcode scanning** on digital marksheets from DigiLocker

### Cross-Document Improvements

1. **Normalized DOB comparison**:
   ```python
   def normalize_dob(dob_str):
       # Parse DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY → datetime
   ```

2. **Phonetic name matching** — Soundex/Metaphone for Indian name variants

3. **Weighted scoring** instead of flat penalties — Aadhaar/PAN mismatch weighs more than resume formatting issues

4. **Per-candidate scoping** — duplicate check excludes own previous verifications

5. **Audit trail** — log who uploaded, who reviewed, timestamp each check result

---

## Implementation Priority

| Priority | Improvement | Effort | Impact |
|----------|------------|--------|--------|
| P0 | Verhoeff Aadhaar checksum | Low | High |
| P0 | PAN 4th-char validation | Low | High |
| P0 | Normalized DOB matching | Low | High |
| P1 | Fuzzy name matching (rapidfuzz) | Low | High |
| P1 | Expanded skill database | Low | Medium |
| P1 | DigiLocker integration | High | Very High |
| P2 | UGC university lookup | Medium | Medium |
| P2 | LLM resume parsing | Medium | High |
| P3 | UIDAI Authentication API | Very High | Very High |

---

## What TrustLens Currently Does Well

- Multi-document pipeline with consistent scoring
- Quality/blur detection prevents poor uploads
- Document type mismatch detection catches wrong file uploads
- Recruiter workflow for human-in-the-loop decisions
- PDF report generation for audit compliance
- Duplicate detection prevents re-submission fraud
