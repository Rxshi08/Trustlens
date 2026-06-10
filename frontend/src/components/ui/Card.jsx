function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 ${
        hover ? "transition hover:shadow-md hover:ring-indigo-200/60" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
