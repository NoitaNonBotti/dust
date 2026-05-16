import { Outlet, Link, useLocation } from "react-router";
import { LogIn, LogOut, Package, ShieldCheck, FileText } from "lucide-react";
import { useAuth } from "../auth";

export function Root() {
  const location = useLocation();
  const { user, role, isAdmin, isGuest, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <Package className="size-8 text-blue-600" />
                <span className="font-semibold text-xl">DUST</span>
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
                {!isGuest && (
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
                )}
                {isAdmin && (
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
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {user ? `${user.name} (${role})` : "Guest"}
              </span>
              {isGuest ? (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100"
                >
                  <LogIn className="size-4" />
                  Login
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              )}
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
