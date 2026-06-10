import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge, { riskBadge, recommendationBadge } from "../components/ui/Badge";
import StatCard from "../components/dashboard/StatCard";
import { getCandidateName } from "../utils/verification";
import { UsersIcon, CheckIcon, AlertIcon, ChartIcon } from "../components/dashboard/DashboardIcons";

function RecruiterDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await API.get("/verification/all");
      setRecords(res.data);
    } catch {
      alert("Failed to fetch recruiter records");
    } finally {
      setLoading(false);
    }
  };

  const pending = records.filter((r) => (r.recruiterStatus || "Pending Review") === "Pending Review").length;
  const approved = records.filter((r) => r.recruiterStatus === "Approved").length;
  const highRisk = records.filter((r) => r.riskLevel === "High Risk").length;

  const filtered = records.filter((r) => {
    if (filter === "All") return true;
    if (filter === "Pending") return (r.recruiterStatus || "Pending Review") === "Pending Review";
    if (filter === "High Risk") return r.riskLevel === "High Risk";
    return r.recruiterStatus === filter;
  });

  const statusVariant = (status) => {
    if (status === "Approved") return "success";
    if (status === "Rejected") return "danger";
    if (status === "Needs Clarification") return "warning";
    return "neutral";
  };

  return (
    <AppLayout>
      <PageHeader
        badge="Recruiter Portal"
        title="Candidate Review Queue"
        description="Review verification results, inspect trust scores, and make hiring decisions."
        actions={
          <button
            onClick={fetchRecords}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            Refresh
          </button>
        }
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Candidates" value={records.length} accent="indigo" icon={<UsersIcon />} />
          <StatCard label="Pending Review" value={pending} accent="amber" icon={<AlertIcon />} />
          <StatCard label="Approved" value={approved} accent="emerald" icon={<CheckIcon />} />
          <StatCard label="High Risk" value={highRisk} accent="rose" icon={<ChartIcon />} />
        </div>

        <Card>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Review Queue</h3>
              <p className="text-sm text-slate-500">{filtered.length} candidates</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "High Risk", "Approved", "Rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === f
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((record, index) => (
                <div
                  key={record._id}
                  className="animate-slide-up flex flex-col gap-4 rounded-xl border border-slate-100 p-5 transition hover:border-indigo-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                      {record.trustScore}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{getCandidateName(record)}</p>
                      <p className="text-xs text-slate-400">{new Date(record.createdAt).toLocaleString()}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={riskBadge(record.riskLevel)}>{record.riskLevel}</Badge>
                        <Badge variant={recommendationBadge(record.recommendation)}>{record.recommendation}</Badge>
                        <Badge variant={statusVariant(record.recruiterStatus)}>
                          {record.recruiterStatus || "Pending Review"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/verification/${record._id}`}
                    className="shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Review Candidate
                  </Link>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-16 text-center text-slate-500">
                  No candidates match this filter.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

export default RecruiterDashboard;
