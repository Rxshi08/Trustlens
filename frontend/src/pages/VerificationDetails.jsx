import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { reportUrl } from "../config";
import { getUser } from "../utils/auth";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge, { riskBadge, recommendationBadge } from "../components/ui/Badge";
import { scoreColor } from "../utils/verification";

function VerificationDetails() {
  const { id } = useParams();
  const user = getUser();
  const [record, setRecord] = useState(null);
  const [recruiterStatus, setRecruiterStatus] = useState("Pending Review");
  const [recruiterNotes, setRecruiterNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const backRoute =
    user?.role === "admin" ? "/dashboard" :
    user?.role === "recruiter" ? "/recruiter" : "/candidate";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get(`/verification/${id}`);
      setRecord(res.data);
      setRecruiterStatus(res.data.recruiterStatus || "Pending Review");
      setRecruiterNotes(res.data.recruiterNotes || "");
    } catch {
      alert("Failed to load verification");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put(`/verification/${id}/review`, { recruiterStatus, recruiterNotes });
      setRecord(res.data.verification);
      alert("Review saved successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  if (!record) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </AppLayout>
    );
  }

  const docs = record.extractedData || {};
  const canReview = user?.role === "recruiter" || user?.role === "admin";

  const DocCard = ({ title, data }) => (
    <Card hover>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        <p><span className="font-medium text-slate-800">Name:</span> {data?.name || "—"}</p>
        <p><span className="font-medium text-slate-800">DOB:</span> {data?.dob || "—"}</p>
        <p><span className="font-medium text-slate-800">ID:</span> {data?.idNumber || "—"}</p>
        <p><span className="font-medium text-slate-800">Email:</span> {data?.email || "—"}</p>
        <p><span className="font-medium text-slate-800">Phone:</span> {data?.phone || "—"}</p>
        <p><span className="font-medium text-slate-800">Type Match:</span> {data?.documentTypeMatch ? "Yes" : "No"}</p>
        <p><span className="font-medium text-slate-800">Authenticity:</span> {data?.authenticityScore || 0}/100</p>
        <p><span className="font-medium text-slate-800">Quality:</span> {data?.qualityScore || 0}/100</p>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <PageHeader
        badge="Verification Details"
        title="Candidate Verification Report"
        description={`Submitted on ${new Date(record.createdAt).toLocaleString()}`}
        actions={
          <>
            <Link
              to={backRoute}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              ← Back
            </Link>
            <a
              href={reportUrl(record.reportPath)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Download Report
            </a>
          </>
        }
      />

      <div className="p-8 space-y-8">
        <Card className="overflow-hidden !p-0">
          <div className={`bg-gradient-to-r p-8 text-white ${scoreColor(record.trustScore)}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-6xl font-bold">{record.trustScore}</p>
                <p className="text-sm text-white/80">Trust Score / 100</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={riskBadge(record.riskLevel)}>{record.riskLevel}</Badge>
                <Badge variant={recommendationBadge(record.recommendation)}>{record.recommendation}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Name Match", ok: record.checks?.nameMatch },
            { label: "DOB Match", ok: record.checks?.dobMatch },
            { label: "Complete", ok: !record.checks?.missingFields },
            { label: "Quality", ok: !record.checks?.blurryDocument },
            { label: "Unique", ok: !record.checks?.duplicateDocument }
          ].map((c) => (
            <Card key={c.label} className="!p-4 text-center">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${c.ok ? "text-emerald-600" : "text-rose-600"}`}>
                {c.ok ? "✓" : "✗"}
              </p>
            </Card>
          ))}
        </div>

        {canReview && (
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Recruiter Review</h2>
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Decision
                </label>
                <select
                  value={recruiterStatus}
                  onChange={(e) => setRecruiterStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option>Pending Review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Needs Clarification</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </label>
                <textarea
                  value={recruiterNotes}
                  onChange={(e) => setRecruiterNotes(e.target.value)}
                  rows="4"
                  placeholder="Add recruiter notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Review"}
              </button>
            </form>
            {record.reviewedAt && (
              <p className="mt-3 text-xs text-slate-400">
                Last reviewed: {new Date(record.reviewedAt).toLocaleString()}
              </p>
            )}
          </Card>
        )}

        {!canReview && record.recruiterStatus && record.recruiterStatus !== "Pending Review" && (
          <Card>
            <h2 className="font-semibold text-slate-900">Recruiter Decision</h2>
            <p className="mt-2 text-lg font-medium text-indigo-600">{record.recruiterStatus}</p>
            {record.recruiterNotes && <p className="mt-2 text-sm text-slate-500">{record.recruiterNotes}</p>}
          </Card>
        )}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Extracted Document Data</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DocCard title="Aadhaar" data={docs.aadhaar} />
            <DocCard title="PAN" data={docs.pan} />
            <DocCard title="Resume" data={docs.resume} />
            <DocCard title="Marksheet" data={docs.marksheet} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default VerificationDetails;
