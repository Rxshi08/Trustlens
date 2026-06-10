import { useEffect, useState } from "react";
import API from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import StatCard from "../components/dashboard/StatCard";
import ChartCard from "../components/dashboard/ChartCard";
import { ChartIcon, UsersIcon, CheckIcon, AlertIcon } from "../components/dashboard/DashboardIcons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/verification/analytics");
      setData(res.data);
    } catch {
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="animate-pulse p-8 space-y-6">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const riskData = [
    { name: "Low Risk", value: data.byRisk.low },
    { name: "Medium Risk", value: data.byRisk.medium },
    { name: "High Risk", value: data.byRisk.high }
  ];

  const recruiterData = [
    { name: "Pending", value: data.byRecruiterStatus.pending },
    { name: "Approved", value: data.byRecruiterStatus.approved },
    { name: "Rejected", value: data.byRecruiterStatus.rejected },
    { name: "Clarification", value: data.byRecruiterStatus.clarification }
  ];

  return (
    <AppLayout>
      <PageHeader
        badge="Analytics"
        title="Platform Intelligence"
        description="Deep insights into verification trends, risk distribution, and recruiter pipeline."
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Verifications" value={data.total} accent="indigo" icon={<UsersIcon />} />
          <StatCard label="Avg Trust Score" value={`${data.avgScore}/100`} accent="sky" icon={<ChartIcon />} />
          <StatCard label="Pass Rate" value={`${data.passRate}%`} accent="emerald" icon={<CheckIcon />} />
          <StatCard label="Last 7 Days" value={data.last7Days} sublabel="New verifications" accent="amber" icon={<AlertIcon />} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Monthly Trend" description="Verifications over the last 6 months">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Risk Distribution" description="Current risk classification breakdown">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} label>
                    {riskData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <h3 className="font-semibold text-slate-900">Recommendations</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Verified", value: data.byRecommendation.verified, color: "bg-emerald-500" },
                { label: "Manual Review", value: data.byRecommendation.manualReview, color: "bg-amber-500" },
                { label: "Rejected", value: data.byRecommendation.rejected, color: "bg-rose-500" }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: data.total ? `${(item.value / data.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-slate-900">Recruiter Pipeline</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruiterData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default Analytics;
