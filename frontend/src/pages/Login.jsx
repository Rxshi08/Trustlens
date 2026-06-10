import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { getDefaultRoute } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate(getDefaultRoute(res.data.user.role));
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-12 lg:flex">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
            TL
          </div>
          <h1 className="mt-8 text-4xl font-bold leading-tight text-white">
            AI-Powered Identity Verification
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Verify Aadhaar, PAN, resumes, and marksheets with intelligent OCR, trust scoring, and fraud detection.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {["OCR Engine", "Trust Score", "Fraud Alerts"].map((f) => (
            <div key={f} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-xs font-semibold text-indigo-300">{f}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <form
          onSubmit={handleSubmit}
          className="animate-slide-up w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80"
        >
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your TrustLens account</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="you@company.com"
                type="email"
                value={form.email}
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="••••••••"
                type="password"
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-600/40 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
