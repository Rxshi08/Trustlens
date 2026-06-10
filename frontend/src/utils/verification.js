export function getCandidateName(record) {
  return (
    record?.extractedData?.aadhaar?.name ||
    record?.extractedData?.pan?.name ||
    record?.extractedData?.resume?.name ||
    "Unknown"
  );
}

export function scoreColor(score) {
  if (score >= 80) return "from-emerald-500 to-teal-500";
  if (score >= 50) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-red-500";
}
