function PageHeader({ badge, title, description, actions }) {
  return (
    <div className="border-b border-indigo-900/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="px-8 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-slide-up">
            {badge && (
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                {badge}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
