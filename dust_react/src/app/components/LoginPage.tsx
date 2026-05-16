import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            }
          ) => void;
        };
      };
    };
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const { loginGbox, loginAdmin, continueAsGuest } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const googleClientId =
    (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
      ?.VITE_GOOGLE_CLIENT_ID || "";

  const handleGuest = () => {
    continueAsGuest();
    navigate("/");
  };

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        if (attempts > 40) {
          window.clearInterval(intervalId);
          setError("Google sign-in script did not load. Check your network connection.");
        }
        return;
      }

      window.clearInterval(intervalId);
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google did not return a sign-in credential.");
            return;
          }

          try {
            setError("");
            await loginGbox({ credential: response.credential });
            navigate("/");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to login with GBox.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 280,
        text: "signin_with",
      });
      setGoogleReady(true);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [googleClientId, loginGbox, navigate]);

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginAdmin({ username: adminUsername, password: adminPassword });
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login as admin.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Access DUST</h1>
        <p className="text-slate-600">
          Choose how you want to enter the lost-and-found system.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserRound className="size-6 text-slate-600" />
            <h2 className="text-xl font-semibold">Continue as Guest</h2>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Browse lost item listings and send lower-priority assistance requests to admins. Guests cannot report found items.
          </p>
          <button
            type="button"
            onClick={handleGuest}
            className="w-full px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            View Listings
          </button>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold">Login with GBox</h2>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Use the official Google/GBox sign-in popup. Django verifies the Google credential before creating a student session.
          </p>
          {googleClientId ? (
            <>
              <div ref={googleButtonRef} className="min-h-10" />
              {!googleReady && (
                <p className="text-xs text-slate-500 mt-3">Loading Google sign-in...</p>
              )}
            </>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900">
              Missing <code>VITE_GOOGLE_CLIENT_ID</code>. Add a Google OAuth Client ID to enable the GBox popup.
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="size-6 text-green-700" />
            <h2 className="text-xl font-semibold">Login as Admin</h2>
          </div>
          <form onSubmit={handleAdmin} className="space-y-3">
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="Admin username"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
            >
              Login as Admin
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            Admin accounts are created/deleted from the Django console only.
          </p>
        </section>
      </div>
    </div>
  );
}
