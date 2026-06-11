const express = require("express");
const multer = require("multer");

const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const {
  verifyDocuments,
  getAllVerifications,
  getMyVerifications,
  getAnalytics,
  getVerificationById,
  updateRecruiterReview,
  deleteVerification
} = require("../controllers/verificationController");

const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, PDF and DOCX files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post(
  "/verify",
  authenticate,
  authorize("candidate", "admin"),
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "marksheet", maxCount: 1 }
  ]),
  verifyDocuments
);

router.get("/analytics", authenticate, authorize("admin", "recruiter"), getAnalytics);
router.get("/my", authenticate, authorize("candidate"), getMyVerifications);
router.get("/all", authenticate, authorize("admin", "recruiter"), getAllVerifications);
router.get("/:id", authenticate, getVerificationById);
router.put("/:id/review", authenticate, authorize("recruiter", "admin"), updateRecruiterReview);
router.delete("/:id", authenticate, authorize("admin"), deleteVerification);

module.exports = router;