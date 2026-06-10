import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { reportUrl } from "../config";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge, { riskBadge, recommendationBadge } from "../components/ui/Badge";
import StatCard from "../components/dashboard/StatCard";
import { getCandidateName, scoreColor } from "../utils/verification";
import { getUser } from "../utils/auth";
import { CheckIcon, ChartIcon, AlertIcon } from "../components/dashboard/DashboardIcons";

function CandidateDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await API.get("/verification/my");
      setRecords(res.data);
    } catch {
      alert("Failed to load your verifications");
    } finally {
      setLoading(false);
    }
  };

  const latest = records[0];
  const avgScore =
    records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.trustScore, 0) / records.length)
      : 0;
  const verified = records.filter((r) => r.recommendation === "Verified").length;

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8 space-y-6">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        badge="Candidate Portal"
        title={`Welcome, ${user?.name?.split(" ")[0] || "Candidate"}`}
        description="Track your document verifications, trust scores, and recruiter decisions."
        actions={
          <Link
            to="/upload"
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            Upload Documents
          </Link>
        }
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Verifications" value={records.length} accent="indigo" icon={<ChartIcon />} />
          <StatCard label="Average Score" value={`${avgScore}/100`} accent="sky" icon={<CheckIcon />} />
          <StatCard label="Verified" value={verified} sublabel="Successful verifications" accent="emerald" icon={<CheckIcon />} />
        </div>

        {latest ? (
          <Card className="overflow-hidden !p-0">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Latest Verification</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-bold">{latest.trustScore}</p>
                  <p className="text-sm text-indigo-200">Trust Score / 100</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant={riskBadge(latest.riskLevel)}>{latest.riskLevel}</Badge>
                  <Badge variant={recommendationBadge(latest.recommendation)}>{latest.recommendation}</Badge>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreColor(latest.trustScore)} transition-all duration-700`}
                  style={{ width: `${latest.trustScore}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-5">
              {[
                { label: "Name Match", ok: latest.checks?.nameMatch },
                { label: "DOB Match", ok: latest.checks?.dobMatch },
                { label: "Complete", ok: !latest.checks?.missingFields },
                { label: "Quality", ok: !latest.checks?.blurryDocument },
                { label: "Unique", ok: !latest.checks?.duplicateDocument }
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className={`mt-1 text-lg font-bold ${c.ok ? "text-emerald-600" : "text-rose-600"}`}>
                    {c.ok ? "✓" : "✗"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-4">
              <Link
                to={`/verification/${latest._id}`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                View Details
              </Link>
              <a
                href={reportUrl(latest.reportPath)}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download Report
              </a>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">📄</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No verifications yet</h3>
            <p className="mt-2 text-sm text-slate-500">Upload your documents to get your first trust score.</p>
            <Link
              to="/upload"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start Verification
            </Link>
          </Card>
        )}

        {latest?.recruiterStatus && latest.recruiterStatus !== "Pending Review" && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <AlertIcon />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Recruiter Decision: {latest.recruiterStatus}</p>
                {latest.recruiterNotes && (
                  <p className="mt-1 text-sm text-slate-500">{latest.recruiterNotes}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {records.length > 1 && (
          <Card>
            <h3 className="font-semibold text-slate-900">Recent History</h3>
            <div className="mt-4 space-y-3">
              {records.slice(1, 4).map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{getCandidateName(r)}</p>
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600">{r.trustScore}</span>
                    <Link to={`/verification/${r._id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/history" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              View full history →
            </Link>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default CandidateDashboard;
