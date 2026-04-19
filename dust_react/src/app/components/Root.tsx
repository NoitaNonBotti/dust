import { Outlet, Link, useLocation } from "react-router";
import { Package, ShieldCheck, FileText } from "lucide-react";

export function Root() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <Package className="size-8 text-blue-600" />
                <span className="font-semibold text-xl">Lost & Found</span>
              </Link>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    location.pathname === "/"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Lost Items
                </Link>
                <Link
                  to="/report"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === "/report"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="size-4" />
                  Report Item
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === "/admin"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}