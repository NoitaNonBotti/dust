import { Link } from "react-router";

export function AccessNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-slate-600 mb-5">{message}</p>
        <Link
          to="/login"
          className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
