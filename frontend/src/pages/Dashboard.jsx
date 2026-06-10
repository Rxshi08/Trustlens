import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { reportUrl } from "../config";
import { saveAs } from "file-saver";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import ChartCard from "../components/dashboard/ChartCard";
import {
  ShieldIcon,
  ChartIcon,
  CheckIcon,
  XIcon,
  AlertIcon,
  UsersIcon,
  RefreshIcon,
  DownloadIcon,
  SearchIcon
} from "../components/dashboard/DashboardIcons";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";

const CHART_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  primary: "#4f46e5",
  secondary: "#0ea5e9",
  accent: "#8b5cf6"
};

const RISK_COLORS = [CHART_COLORS.low, CHART_COLORS.medium, CHART_COLORS.high];

function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await API.get("/verification/all");
      setRecords(res.data);
    } catch (error) {
      alert("Failed to fetch dashboard records");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this verification record?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/verification/${id}`);

      setRecords((prev) =>
        prev.filter((record) => record._id !== id)
      );

      alert("Record deleted successfully");
    } catch (error) {
      alert("Failed to delete record");
    }
  };

  const total = records.length;
  const lowRisk = records.filter((r) => r.riskLevel === "Low Risk").length;
  const mediumRisk = records.filter((r) => r.riskLevel === "Medium Risk").length;
  const highRisk = records.filter((r) => r.riskLevel === "High Risk").length;

  const verified = records.filter((r) => r.recommendation === "Verified").length;
  const manualReview = records.filter((r) => r.recommendation === "Needs Manual Review").length;
  const rejected = records.filter((r) => r.recommendation === "Rejected").length;

  const avgScore =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.trustScore, 0) / records.length)
      : 0;

  const riskChartData = [
    { name: "Low Risk", value: lowRisk },
    { name: "Medium Risk", value: mediumRisk },
    { name: "High Risk", value: highRisk }
  ];

  const scoreChartData = records.slice(0, 10).map((record, index) => ({
    name: `V${index + 1}`,
    score: record.trustScore
  }));

  const trendChartData = [...records]
    .reverse()
    .slice(0, 10)
    .map((record, index) => ({
      name: `R${index + 1}`,
      score: record.trustScore
    }));

  const skillCounts = {};

  records.forEach((record) => {
    const skills = record.extractedData?.resume?.skills || [];

    skills.forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  const skillChartData = Object.keys(skillCounts).map((skill) => ({
    skill,
    count: skillCounts[skill]
  }));

  const candidateRankingData = [...records]
    .map((record) => ({
      name:
        record.extractedData?.aadhaar?.name ||
        record.extractedData?.pan?.name ||
        record.extractedData?.resume?.name ||
        "Unknown",
      trustScore: record.trustScore || 0,
      employabilityScore: record.extractedData?.resume?.employabilityScore || 0,
      finalScore: Math.round(
        ((record.trustScore || 0) +
          (record.extractedData?.resume?.employabilityScore || 0)) /
          2
      )
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);

  const fraudAlerts = records
    .filter(
      (record) =>
        record.riskLevel === "High Risk" ||
        record.checks?.duplicateDocument ||
        !record.checks?.nameMatch ||
        !record.checks?.dobMatch ||
        record.checks?.missingFields ||
        record.checks?.blurryDocument
    )
    .slice(0, 6);

  const filteredRecords = records.filter((record) => {
    const candidateName =
      record.extractedData?.aadhaar?.name ||
      record.extractedData?.pan?.name ||
      record.extractedData?.resume?.name ||
      "";

    const searchMatch = candidateName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const riskMatch =
      riskFilter === "All"
        ? true
        : record.riskLevel === riskFilter;

    const statusMatch =
      statusFilter === "All"
        ? true
        : record.recommendation === statusFilter;

    return searchMatch && riskMatch && statusMatch;
  });

  const getAlertReasons = (record) => {
    const reasons = [];

    if (record.riskLevel === "High Risk") reasons.push("High risk verification");
    if (record.checks?.duplicateDocument) reasons.push("Duplicate document detected");
    if (!record.checks?.nameMatch) reasons.push("Name mismatch");
    if (!record.checks?.dobMatch) reasons.push("DOB mismatch");
    if (record.checks?.missingFields) reasons.push("Missing mandatory fields");
    if (record.checks?.blurryDocument) reasons.push("Blurry/poor quality document");

    return reasons;
  };

  const getRiskBadge = (risk) => {
    if (risk === "Low Risk") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (risk === "Medium Risk") return "bg-amber-50 text-amber-700 ring-amber-600/20";
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No records to export");
      return;
    }

    const rows = filteredRecords.map((record) => ({
      Candidate:
        record.extractedData?.aadhaar?.name ||
        record.extractedData?.pan?.name ||
        record.extractedData?.resume?.name ||
        "Unknown",

      TrustScore: record.trustScore,

      RiskLevel: record.riskLevel,

      Recommendation: record.recommendation,

      NameMatch: record.checks?.nameMatch,

      DOBMatch: record.checks?.dobMatch,

      Duplicate: record.checks?.duplicateDocument,

      Date: new Date(record.createdAt).toLocaleString()
    }));

    const csv =
      [
        Object.keys(rows[0]).join(","),
        ...rows.map((r) => Object.values(r).join(","))
      ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    saveAs(blob, "trustlens_report.csv");
  };

  const getRecommendationBadge = (rec) => {
    if (rec === "Verified") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    if (rec === "Needs Manual Review") return "bg-amber-50 text-amber-700 ring-amber-600/20";
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  };

  const getCandidateName = (record) =>
    record.extractedData?.aadhaar?.name ||
    record.extractedData?.pan?.name ||
    record.extractedData?.resume?.name ||
    "Unknown";

  const rankMedals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <AppLayout>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 rounded-2xl bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="bg-slate-50">
      {/* Hero header */}
      <div className="border-b border-indigo-900/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                TrustLens Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Verification Command Center
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                Monitor verification records, trust scores, fraud signals, skills analytics, and candidate rankings in real time.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
              >
                <DownloadIcon />
                Export CSV
              </button>
              <button
                onClick={fetchRecords}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
              >
                <RefreshIcon />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Verifications"
            value={total}
            sublabel="All-time records"
            accent="indigo"
            icon={<UsersIcon />}
          />
          <StatCard
            label="Average Trust Score"
            value={`${avgScore}/100`}
            sublabel="Across all candidates"
            accent="sky"
            icon={<ChartIcon />}
          />
          <StatCard
            label="Verified Candidates"
            value={verified}
            sublabel={`${total > 0 ? Math.round((verified / total) * 100) : 0}% pass rate`}
            accent="emerald"
            icon={<CheckIcon />}
          />
          <StatCard
            label="Rejected Candidates"
            value={rejected}
            sublabel={`${manualReview} pending manual review`}
            accent="rose"
            icon={<XIcon />}
          />
        </div>

        {/* Risk breakdown strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Low Risk", value: lowRisk, color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
            { label: "Medium Risk", value: mediumRisk, color: "border-amber-200 bg-amber-50 text-amber-800" },
            { label: "High Risk", value: highRisk, color: "border-rose-200 bg-rose-50 text-rose-800" },
            { label: "Manual Review", value: manualReview, color: "border-sky-200 bg-sky-50 text-sky-800" }
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border px-4 py-3 ${item.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Risk Distribution" description="Breakdown by risk classification">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                  >
                    {riskChartData.map((_, index) => (
                      <Cell key={index} fill={RISK_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Recent Trust Scores" description="Last 10 verification scores">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Bar dataKey="score" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Score Trend" description="Trust score progression">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS.accent, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Skills + Ranking */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Resume Skills Analytics" description="Most frequently detected skills">
            <div className="h-72">
              {skillChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillChartData} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.low} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No skill data available yet
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard title="Top Candidate Ranking" description="Combined trust + employability score">
            <div className="space-y-3">
              {candidateRankingData.length > 0 ? (
                candidateRankingData.map((candidate, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg">
                      {rankMedals[index] || `#${index + 1}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {candidate.name}
                      </p>
                      <div className="mt-1 flex gap-3 text-xs text-slate-500">
                        <span>Trust: {candidate.trustScore}</span>
                        <span>Employability: {candidate.employabilityScore}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                          style={{ width: `${candidate.finalScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">
                        {candidate.finalScore}
                      </p>
                      <p className="text-xs text-slate-400">Final</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-12 text-center text-sm text-slate-400">
                  No ranking data available.
                </p>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Fraud alerts */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-rose-50/50 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertIcon />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Fraud Alerts Panel</h3>
              <p className="text-xs text-slate-500">
                {fraudAlerts.length} active alert{fraudAlerts.length !== 1 ? "s" : ""} requiring attention
              </p>
            </div>
          </div>

          <div className="p-6">
            {fraudAlerts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {fraudAlerts.map((record) => (
                  <div
                    key={record._id}
                    className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-rose-900">
                          {getCandidateName(record)}
                        </p>
                        <p className="mt-0.5 text-xs text-rose-600">
                          Score {record.trustScore}/100 · {record.riskLevel}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {getAlertReasons(record).map((reason, index) => (
                            <li key={index} className="flex items-start gap-1.5 text-xs text-rose-700">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <a
                        href={reportUrl(record.reportPath)}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                      >
                        Report
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldIcon />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">All clear</p>
                <p className="mt-1 text-xs text-slate-400">
                  No fraud alerts found. Recent verifications look safe.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h3 className="text-base font-semibold text-slate-900">Search & Filters</h3>
          <p className="mt-1 text-sm text-slate-500">Narrow down verification records</p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search candidate name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option>All</option>
              <option>Low Risk</option>
              <option>Medium Risk</option>
              <option>High Risk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option>All</option>
              <option>Verified</option>
              <option>Needs Manual Review</option>
              <option>Rejected</option>
            </select>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Showing {filteredRecords.length} of {total} records
          </p>
        </div>

        {/* Data table */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-base font-semibold text-slate-900">
              Recent Verification Records
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest candidate verification history
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Candidate</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Risk</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">DOB</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Dup.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Report</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">
                        {getCandidateName(record)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
                        {record.trustScore}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getRiskBadge(
                          record.riskLevel
                        )}`}
                      >
                        {record.riskLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getRecommendationBadge(
                          record.recommendation
                        )}`}
                      >
                        {record.recommendation}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={record.checks?.nameMatch ? "text-emerald-600" : "text-rose-600"}>
                        {record.checks?.nameMatch ? "✓" : "✗"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={record.checks?.dobMatch ? "text-emerald-600" : "text-rose-600"}>
                        {record.checks?.dobMatch ? "✓" : "✗"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={record.checks?.duplicateDocument ? "text-rose-600" : "text-emerald-600"}>
                        {record.checks?.duplicateDocument ? "✓" : "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <a
                        href={reportUrl(record.reportPath)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                      >
                        Download
                      </a>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <Link
                        to={`/verification/${record._id}`}
                        className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => deleteRecord(record._id)}
                        className="inline-flex rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-16 text-center"
                    >
                      <p className="text-sm font-medium text-slate-500">No verification records found</p>
                      <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}

export default Dashboard;
