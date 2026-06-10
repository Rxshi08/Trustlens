from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import pytesseract
from PIL import Image
import fitz
import re
import os
import cv2
import numpy as np
import tempfile
import shutil
from pdf2image import convert_from_path
from docx import Document

app = FastAPI()

TESSERACT_CMD = os.environ.get("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

POPPLER_PATH = os.environ.get("POPPLER_PATH")


class OCRRequest(BaseModel):
    filePath: str
    docType: str


def clean_text(text):
    return re.sub(r"\n+", "\n", text).strip()


def extract_text_from_image(file_path):
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image)
    return clean_text(text)


def extract_text_from_pdf(file_path):
    text = ""

    try:
        pdf = fitz.open(file_path)
        for page in pdf:
            text += page.get_text()
    except Exception:
        text = ""

    if len(text.strip()) < 20:
        kwargs = {"poppler_path": POPPLER_PATH} if POPPLER_PATH else {}
        pages = convert_from_path(file_path, **kwargs)
        for page in pages:
            text += pytesseract.image_to_string(page)

    return clean_text(text)


def extract_text_from_docx(file_path):
    doc = Document(file_path)
    text = ""

    for para in doc.paragraphs:
        text += para.text + "\n"

    return clean_text(text)


def check_image_quality(file_path):
    if file_path.lower().endswith((".pdf", ".docx")):
        return {
            "isBlurry": False,
            "qualityScore": 85,
            "qualityRemark": "Text document processed"
        }

    image = cv2.imread(file_path)

    if image is None:
        return {
            "isBlurry": False,
            "qualityScore": 70,
            "qualityRemark": "Unable to read image quality"
        }

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)

    score = 100

    if blur_score < 80:
        score -= 35

    if brightness < 60:
        score -= 25

    if brightness > 220:
        score -= 15

    score = max(score, 0)

    return {
        "isBlurry": blur_score < 80,
        "qualityScore": score,
        "qualityRemark": "Good" if score >= 75 else "Poor quality document"
    }


def extract_dob(text):
    patterns = [
        r"(?:DOB|Date of Birth|Birth Date|D\.O\.B)\s*[:\-]?\s*(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})",
        r"\b(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\b",
        r"(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).replace(".", "/").replace("-", "/")

    return ""


def extract_pan_number(text):
    match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text.upper())
    return match.group(0) if match else ""


def extract_aadhaar_number(text):
    patterns = [
        r"\b\d{4}\s\d{4}\s\d{4}\b",
        r"\b\d{4}-\d{4}-\d{4}\b",
        r"\b\d{12}\b",
        r"\bX{4}\sX{4}\s\d{4}\b",
        r"\bXXXX\sXXXX\s\d{4}\b"
    ]

    for pattern in patterns:
        match = re.search(pattern, text.upper())
        if match:
            return match.group(0)

    return ""


def extract_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


def extract_phone(text):
    match = re.search(r"\b[6-9]\d{9}\b", text)
    return match.group(0) if match else ""


def extract_skills(text):
    skills_db = [
        "React", "Node.js", "MongoDB", "PostgreSQL", "MySQL", "Python",
        "Java", "C++", "JavaScript", "HTML", "CSS", "Express.js",
        "Flask", "Django", "Git", "GitHub", "Docker", "AWS", "SQL",
        "DSA", "OOP", "DBMS", "REST API", "JWT", "Operating Systems",
        "Computer Networks"
    ]

    found = []
    lower = text.lower()

    for skill in skills_db:
        if skill.lower().replace(".js", "") in lower or skill.lower() in lower:
            found.append(skill)

    return list(set(found))


def calculate_employability_score(skills):
    score = 40
    skill_count = len(skills)

    if skill_count >= 8:
        score += 35
    elif skill_count >= 5:
        score += 25
    elif skill_count >= 3:
        score += 15
    elif skill_count >= 1:
        score += 10

    priority_skills = [
        "React", "Node.js", "MongoDB", "PostgreSQL",
        "SQL", "JavaScript", "Python", "Java"
    ]

    for skill in priority_skills:
        if skill in skills:
            score += 3

    return min(score, 100)

def generate_candidate_insights(skills):
    strengths = []
    weaknesses = []
    recommended_roles = []

    if "React" in skills or "JavaScript" in skills or "HTML" in skills or "CSS" in skills:
        strengths.append("Strong frontend development skills")
        recommended_roles.append("Frontend Developer")

    if "Node.js" in skills or "Express.js" in skills:
        strengths.append("Backend API development knowledge")
        recommended_roles.append("Backend Developer")

    if "MongoDB" in skills or "PostgreSQL" in skills or "SQL" in skills or "MySQL" in skills:
        strengths.append("Database handling skills")

    if "React" in skills and ("Node.js" in skills or "Express.js" in skills) and ("MongoDB" in skills or "SQL" in skills):
        recommended_roles.append("Full Stack Developer")
        strengths.append("Good full-stack development profile")

    if "Python" in skills or "Machine Learning" in skills:
        recommended_roles.append("AI/ML Intern")

    if "Docker" not in skills:
        weaknesses.append("Docker/containerization skill not found")

    if "AWS" not in skills:
        weaknesses.append("Cloud deployment skill not found")

    if "Git" not in skills and "GitHub" not in skills:
        weaknesses.append("Version control skill not found")

    if len(skills) < 5:
        weaknesses.append("Limited technical skills detected in resume")

    if not recommended_roles:
        recommended_roles.append("Software Engineer Trainee")

    return {
        "strengths": list(set(strengths)),
        "weaknesses": list(set(weaknesses)),
        "recommendedRoles": list(set(recommended_roles))
    }

def is_possible_name(line):
    bad_words = [
        "government", "india", "income", "tax", "department", "aadhaar",
        "unique", "identification", "authority", "dob", "birth", "male",
        "female", "permanent", "account", "number", "resume", "curriculum",
        "vitae", "marksheet", "certificate", "university", "college",
        "secondary", "higher", "semester", "grade", "cgpa", "address",
        "mobile", "email", "signature", "father", "mother", "skills",
        "uidai", "gov", "enrolment", "vid", "year"
    ]

    lower = line.lower()

    if any(word in lower for word in bad_words):
        return False

    if re.search(r"\d", line):
        return False

    if len(line.split()) < 2:
        return False

    if not re.match(r"^[A-Za-z .]+$", line):
        return False

    return True


def extract_name(text, doc_type):
    lines = [line.strip() for line in text.split("\n") if len(line.strip()) > 1]

    name_patterns = [
        r"(?:Name)\s*[:\-]\s*([A-Za-z .]+)",
        r"(?:Candidate Name)\s*[:\-]\s*([A-Za-z .]+)",
        r"(?:Student Name)\s*[:\-]\s*([A-Za-z .]+)"
    ]

    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if is_possible_name(name):
                return name

    if doc_type == "resume":
        for line in lines[:10]:
            if is_possible_name(line):
                return line

    for line in lines:
        if is_possible_name(line):
            return line

    return ""


def detect_document_type(text):
    lower = text.lower()

    if "aadhaar" in lower or "uidai" in lower or "unique identification authority" in lower:
        return "aadhaar"

    if "income tax" in lower or "permanent account number" in lower or extract_pan_number(text):
        return "pan"

    if "marksheet" in lower or "semester" in lower or "cgpa" in lower or "university" in lower:
        return "marksheet"

    if "resume" in lower or "curriculum vitae" in lower or "skills" in lower or "experience" in lower:
        return "resume"

    return "unknown"


def calculate_authenticity_score(text, expected_doc_type):
    lower = text.lower()
    score = 0
    checks = []

    if expected_doc_type == "aadhaar":
        if "aadhaar" in lower:
            score += 25
            checks.append("Aadhaar keyword found")
        if "government of india" in lower or "uidai" in lower:
            score += 25
            checks.append("Government/UIDAI keyword found")
        if extract_aadhaar_number(text):
            score += 30
            checks.append("Aadhaar number pattern found")
        if extract_dob(text):
            score += 20
            checks.append("DOB found")

    elif expected_doc_type == "pan":
        if "income tax" in lower:
            score += 25
            checks.append("Income Tax keyword found")
        if "permanent account number" in lower:
            score += 25
            checks.append("PAN label found")
        if extract_pan_number(text):
            score += 35
            checks.append("PAN number pattern found")
        if extract_dob(text):
            score += 15
            checks.append("DOB found")

    elif expected_doc_type == "marksheet":
        if "university" in lower or "college" in lower:
            score += 25
            checks.append("University/college keyword found")
        if "semester" in lower or "year" in lower:
            score += 20
            checks.append("Semester/year found")
        if "cgpa" in lower or "percentage" in lower or "grade" in lower:
            score += 30
            checks.append("Academic score found")
        if extract_name(text, "marksheet"):
            score += 25
            checks.append("Student name found")

    elif expected_doc_type == "resume":
        if "skills" in lower:
            score += 25
            checks.append("Skills section found")
        if extract_email(text):
            score += 25
            checks.append("Email found")
        if extract_name(text, "resume"):
            score += 25
            checks.append("Candidate name found")
        if "education" in lower or "experience" in lower or "project" in lower:
            score += 25
            checks.append("Resume section found")

    return {
        "authenticityScore": min(score, 100),
        "authenticityChecks": checks
    }


def extract_fields(text, doc_type, file_path):
    doc_type = doc_type.lower()

    detected_type = detect_document_type(text)
    quality = check_image_quality(file_path)
    authenticity = calculate_authenticity_score(text, doc_type)

    id_number = ""
    if doc_type == "pan":
        id_number = extract_pan_number(text)
    elif doc_type == "aadhaar":
        id_number = extract_aadhaar_number(text)

    skills = []
    employability_score = 0
    candidate_insights = {
        "strengths": [],
        "weaknesses": [],
        "recommendedRoles": []
    }

    if doc_type == "resume":
        skills = extract_skills(text)
        employability_score = calculate_employability_score(skills)
        candidate_insights = generate_candidate_insights(skills)

    return {
        "docType": doc_type,
        "detectedType": detected_type,
        "documentTypeMatch": detected_type == doc_type,
        "rawText": text,
        "name": extract_name(text, doc_type),
        "dob": extract_dob(text),
        "idNumber": id_number,
        "email": extract_email(text),
        "phone": extract_phone(text),
        "qualityScore": quality["qualityScore"],
        "isBlurry": quality["isBlurry"],
        "qualityRemark": quality["qualityRemark"],
        "authenticityScore": authenticity["authenticityScore"],
        "authenticityChecks": authenticity["authenticityChecks"],
        "skills": skills,
        "employabilityScore": employability_score,
        "candidateInsights": candidate_insights
    }


@app.get("/")
def home():
    return {"message": "TrustLens OCR Service Running"}


@app.post("/ocr/upload")
async def ocr_upload(file: UploadFile = File(...), docType: str = Form(...)):
    suffix = os.path.splitext(file.filename or "")[1] or ".tmp"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(file.file, tmp)
        tmp.close()
        text = extract_document_text(tmp.name)
        return extract_fields(text, docType.lower(), tmp.name)
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)


def extract_document_text(file_path):
    if file_path.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    if file_path.lower().endswith(".docx"):
        return extract_text_from_docx(file_path)
    return extract_text_from_image(file_path)


@app.post("/ocr")
def ocr(request: OCRRequest):
    file_path = request.filePath
    doc_type = request.docType.lower()

    try:
        if not os.path.exists(file_path):
            return {
                "docType": doc_type,
                "detectedType": "unknown",
                "documentTypeMatch": False,
                "name": "",
                "dob": "",
                "idNumber": "",
                "email": "",
                "phone": "",
                "qualityScore": 0,
                "isBlurry": True,
                "qualityRemark": "File not found",
                "authenticityScore": 0,
                "authenticityChecks": [],
                "skills": [],
                "employabilityScore": 0,
                "rawText": "File not found"
            }

        try:
            text = extract_document_text(file_path)
        except Exception as e:
            return {
                "docType": doc_type,
                "detectedType": "unknown",
                "documentTypeMatch": False,
                "name": "",
                "dob": "",
                "idNumber": "",
                "email": "",
                "phone": "",
                "qualityScore": 0,
                "isBlurry": True,
                "qualityRemark": "Could not read document",
                "authenticityScore": 0,
                "authenticityChecks": [f"OCR failed: {str(e)}"],
                "skills": [],
                "employabilityScore": 0,
                "rawText": ""
            }

        try:
            return extract_fields(text, doc_type, file_path)
        except Exception as e:
            return {
                "docType": doc_type,
                "detectedType": "unknown",
                "documentTypeMatch": False,
                "name": "",
                "dob": "",
                "idNumber": "",
                "email": "",
                "phone": "",
                "qualityScore": 0,
                "isBlurry": True,
                "qualityRemark": "Could not extract fields",
                "authenticityScore": 0,
                "authenticityChecks": [f"Extraction failed: {str(e)}"],
                "skills": [],
                "employabilityScore": 0,
                "rawText": text[:500] if text else ""
            }

    except Exception as e:
        return {
            "docType": doc_type,
            "detectedType": "unknown",
            "documentTypeMatch": False,
            "name": "",
            "dob": "",
            "idNumber": "",
            "email": "",
            "phone": "",
            "qualityScore": 0,
            "isBlurry": True,
            "qualityRemark": "Unexpected OCR service error",
            "authenticityScore": 0,
            "authenticityChecks": [f"Unexpected error: {str(e)}"],
            "skills": [],
            "employabilityScore": 0,
            "rawText": ""
        }