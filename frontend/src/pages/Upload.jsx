import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { reportUrl } from "../config";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge, { riskBadge, recommendationBadge } from "../components/ui/Badge";
import { scoreColor } from "../utils/verification";

function Upload() {
  const [files, setFiles] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [e.target.name]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.aadhaar || !files.pan || !files.resume || !files.marksheet) {
      alert("Please select all 4 documents before verification");
      return;
    }

    const formData = new FormData();
    formData.append("aadhaar", files.aadhaar);
    formData.append("pan", files.pan);
    formData.append("resume", files.resume);
    formData.append("marksheet", files.marksheet);

    try {
      setLoading(true);
      const res = await API.post("/verification/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data.verification);
    } catch (error) {
      alert(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const docs = [
    { label: "Aadhaar Card", name: "aadhaar", icon: "🪪", desc: "JPG, PNG or PDF" },
    { label: "PAN Card", name: "pan", icon: "💳", desc: "JPG, PNG or PDF" },
    { label: "Resume", name: "resume", icon: "📋", desc: "PDF or DOCX" },
    { label: "Marksheet", name: "marksheet", icon: "🎓", desc: "PDF or Image" }
  ];

  const DataCard = ({ title, data }) => (
    <Card hover>
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        <p><span className="font-medium text-slate-800">Name:</span> {data?.name || "—"}</p>
        <p><span className="font-medium text-slate-800">DOB:</span> {data?.dob || "—"}</p>
        <p><span className="font-medium text-slate-800">ID:</span> {data?.idNumber || "—"}</p>
        <p><span className="font-medium text-slate-800">Authenticity:</span> {data?.authenticityScore || 0}/100</p>
        <p><span className="font-medium text-slate-800">Quality:</span> {data?.qualityScore || 0}/100</p>
        {data?.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.skills.map((s, i) => (
              <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{s}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <PageHeader
        badge="Document Verification"
        title="Upload & Verify"
        description="Upload all four documents to generate an AI-powered trust score and verification report."
      />

      <div className="p-8 space-y-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {docs.map((doc) => (
              <label
                key={doc.name}
                className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all duration-200 ${
                  files[doc.name]
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl group-hover:bg-indigo-100">
                    {doc.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{doc.label}</p>
                    <p className="text-xs text-slate-500">{doc.desc}</p>
                    <input
                      type="file"
                      name={doc.name}
                      accept=".jpg,.jpeg,.png,.pdf,.docx"
                      onChange={handleFileChange}
                      className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-500"
                    />
                    {files[doc.name] && (
                      <p className="mt-2 text-xs font-medium text-emerald-600">✓ {files[doc.name].name}</p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-600/40 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying Documents...
              </span>
            ) : (
              "Verify Documents"
            )}
          </button>
        </form>

        {result && (
          <div className="animate-slide-up space-y-6">
            <Card className="overflow-hidden !p-0">
              <div className={`bg-gradient-to-r p-8 text-white ${scoreColor(result.trustScore)}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Verification Complete</p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-6xl font-bold">{result.trustScore}</p>
                    <p className="text-sm text-white/80">Trust Score / 100</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={riskBadge(result.riskLevel)}>{result.riskLevel}</Badge>
                    <Badge variant={recommendationBadge(result.recommendation)}>{result.recommendation}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-5">
                {[
                  { label: "Name Match", ok: result.checks.nameMatch },
                  { label: "DOB Match", ok: result.checks.dobMatch },
                  { label: "Complete", ok: !result.checks.missingFields },
                  { label: "Quality", ok: !result.checks.blurryDocument },
                  { label: "Unique", ok: !result.checks.duplicateDocument }
                ].map((c) => (
                  <div key={c.label} className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className={`mt-1 text-xl font-bold ${c.ok ? "text-emerald-600" : "text-rose-600"}`}>
                      {c.ok ? "✓" : "✗"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-4">
                <a
                  href={reportUrl(result.reportPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Download PDF Report
                </a>
                <Link
                  to={`/verification/${result._id}`}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View Full Details
                </Link>
              </div>
            </Card>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Extracted OCR Data</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DataCard title="Aadhaar" data={result.extractedData.aadhaar} />
                <DataCard title="PAN" data={result.extractedData.pan} />
                <DataCard title="Resume" data={result.extractedData.resume} />
                <DataCard title="Marksheet" data={result.extractedData.marksheet} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Upload;
