import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { reportUrl } from "../config";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge, { riskBadge, recommendationBadge } from "../components/ui/Badge";
import { getCandidateName } from "../utils/verification";

function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await API.get("/verification/my");
      setRecords(res.data);
    } catch {
      alert("Failed to load verification history");
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    return getCandidateName(r).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout>
      <PageHeader
        badge="Verification History"
        title="Your Verification Timeline"
        description="Complete history of all your document verifications and trust scores."
      />

      <div className="p-8">
        <Card>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{filtered.length} verifications</h3>
              <p className="text-sm text-slate-500">Sorted by most recent</p>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 sm:w-64"
            />
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No verification history found.</p>
              <Link to="/upload" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
                Upload documents →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((record, index) => (
                <div
                  key={record._id}
                  className="animate-slide-up flex flex-col gap-4 rounded-xl border border-slate-100 p-5 transition hover:border-indigo-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${index * 50}ms` }}
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
                        {record.recruiterStatus && record.recruiterStatus !== "Pending Review" && (
                          <Badge variant="info">{record.recruiterStatus}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/verification/${record._id}`}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Details
                    </Link>
                    <a
                      href={reportUrl(record.reportPath)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Report
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

export default History;
