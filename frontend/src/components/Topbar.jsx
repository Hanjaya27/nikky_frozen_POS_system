import { useEffect, useMemo, useState } from "react";

function Topbar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("nikky_user");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        setCurrentUser(null);
      }
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const userInitial = useMemo(() => {
    if (!currentUser?.name) return "NF";

    return currentUser.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const displayName = currentUser?.name || "Guest User";
  const displayRole = currentUser?.role === "owner" ? "Owner" : "Kasir";
  const displayBranch = currentUser?.branch || "-";
  const displayShift = currentUser?.shift || "-";
  const isOwner = currentUser?.role === "owner";

  const notifications = useMemo(() => {
    if (isOwner) {
      return [
        {
          id: 1,
          title: "Monitoring cabang aktif",
          description: "Owner dapat memantau Cabang 1 dan Cabang 2.",
          type: "info",
        },
        {
          id: 2,
          title: "Stok perlu dipantau",
          description: "Beberapa produk mendekati batas minimum.",
          type: "warning",
        },
        {
          id: 3,
          title: "Aktivitas login tersedia",
          description: "Riwayat login kasir dapat dilihat di dashboard owner.",
          type: "success",
        },
      ];
    }

    return [
      {
        id: 1,
        title: "Shift kasir",
        description: `${displayShift} sedang digunakan untuk ${displayBranch}.`,
        type: "info",
      },
      {
        id: 2,
        title: "Transaksi kasir",
        description: "Pastikan shift sudah dibuka sebelum melakukan transaksi.",
        type: "warning",
      },
    ];
  }, [isOwner, displayBranch, displayShift]);

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-white px-6 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Nikky Frozen POS System
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isOwner
            ? "Dashboard owner untuk memantau transaksi, stok, kasir, cabang, dan laporan toko."
            : "Sistem kasir untuk transaksi, stok, shift, dan operasional toko."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-right">
          <p className="text-xs capitalize text-slate-500">{formattedDate}</p>
          <p className="text-sm font-bold text-slate-800">{formattedTime}</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotification(!showNotification)}
            className="relative rounded-2xl bg-slate-100 px-4 py-3 text-lg transition hover:bg-slate-200"
          >
            🔔
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotification && (
            <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Notifikasi
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNotification(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl px-4 py-3 ${
                      notification.type === "warning"
                        ? "bg-yellow-50"
                        : notification.type === "success"
                        ? "bg-green-50"
                        : "bg-blue-50"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${
                        notification.type === "warning"
                          ? "text-yellow-700"
                          : notification.type === "success"
                          ? "text-green-700"
                          : "text-blue-700"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        notification.type === "warning"
                          ? "text-yellow-600"
                          : notification.type === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {notification.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
              isOwner ? "bg-purple-600" : "bg-blue-600"
            }`}
          >
            {userInitial}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500">
              {displayRole} • {displayBranch}
            </p>
            <p className="text-xs text-slate-400">{displayShift}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;