function PageHeader({
  title = "Judul Halaman",
  description = "Deskripsi halaman",
  actionLabel,
  onAction,
  actionIcon = "+",
}) {
  const savedUser = localStorage.getItem("nikky_user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {currentUser && (
          <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Login sebagai</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500">
              {currentUser.branch} • {currentUser.shift}
            </p>
          </div>
        )}

        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <span>{actionIcon}</span>
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;