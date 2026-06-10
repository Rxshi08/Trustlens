const styles = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20"
};

export function riskBadge(risk) {
  if (risk === "Low Risk") return "success";
  if (risk === "Medium Risk") return "warning";
  return "danger";
}

export function recommendationBadge(rec) {
  if (rec === "Verified") return "success";
  if (rec === "Needs Manual Review") return "warning";
  return "danger";
}

function Badge({ children, variant = "neutral" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
