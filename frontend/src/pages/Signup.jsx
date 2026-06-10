import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/auth/signup", form);
      alert("Account created! Please sign in.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 lg:flex">
        <h1 className="text-4xl font-bold text-white">Join TrustLens</h1>
        <p className="mt-4 max-w-md text-indigo-100">
          Create your account as a candidate or recruiter. Get instant document verification with AI-powered trust scores.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-indigo-100">
          <li className="flex items-center gap-2">✓ 4-document verification pipeline</li>
          <li className="flex items-center gap-2">✓ Real-time trust scoring</li>
          <li className="flex items-center gap-2">✓ PDF verification reports</li>
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <form
          onSubmit={handleSubmit}
          className="animate-slide-up w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80"
        >
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">Start verifying documents in minutes</p>

          <div className="mt-6 space-y-4">
            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "Rahul Sharma" },
              { key: "email", label: "Email", type: "email", placeholder: "you@company.com" },
              { key: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" }
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {field.label}
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  required
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-indigo-600/40 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
