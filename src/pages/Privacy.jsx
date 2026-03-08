import { useState } from "react";
import {
  Shield,
  FileText,
  FileSpreadsheet,
  Folder,
  Upload,
  CheckCircle2,
  XCircle,
  Lock,
  Key,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Trash2,
  ArrowRight
} from "lucide-react";

const dataSources = [
  {
    id: "bank",
    icon: <FileText className="w-8 h-8 text-[#2081C3]" />,
    name: "Bank Statement PDFs",
    description: "Upload bank statement exports from your bank",
    files: ["OCBC_Jan2025.pdf", "DBS_Feb2025.pdf"]
  },
  {
    id: "crypto",
    icon: <FileSpreadsheet className="w-8 h-8 text-[#2081C3]" />,
    name: "Crypto CSV Exports",
    description: "Upload transaction history exports from exchanges",
    files: ["binance_transactions.csv"]
  },
  {
    id: "assets",
    icon: <Folder className="w-8 h-8 text-[#2081C3]" />,
    name: "Manual Asset PDFs",
    description: "Upload documents for property or other assets",
    files: ["property_portfolio.pdf"]
  }
];

const permissions = [
  {
    source: "Bank Statement PDFs",
    status: "Active",
    lastSync: "2h ago",
    security: "Local processing"
  },
  {
    source: "Crypto CSV Exports",
    status: "Active",
    lastSync: "1h ago",
    security: "Local processing"
  },
  {
    source: "Manual Asset PDFs",
    status: "Active",
    lastSync: "Just now",
    security: "Local only"
  }
];

const canDo = [
  "Analyze balances",
  "Track portfolio value",
  "Generate financial insights",
  "Visualize wealth trends"
];

const cannotDo = [
  "Move money",
  "Execute trades",
  "Access bank accounts",
  "Modify financial records"
];

const protectionPoints = [
  "Uploaded files are encrypted during storage and processing.",
  "We never store banking credentials or login details.",
  "Documents are processed only to extract financial insights.",
  "Users can delete all uploaded documents anytime."
];

const trustBadges = [
  { icon: <Lock className="w-5 h-5" />, label: "Encrypted uploads" },
  { icon: <Key className="w-5 h-5" />, label: "User-controlled data" },
  { icon: <Eye className="w-5 h-5" />, label: "Read-only analysis" },
  { icon: <RefreshCw className="w-5 h-5" />, label: "Transparent processing" }
];

export default function Privacy() {
  const [openSource, setOpenSource] = useState(null);

  const toggleSource = (id) => {
    setOpenSource(openSource === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f8faff] font-sans">
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* HEADER */}

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#2081C3]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#2081C3]" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Trust & Security
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Transparency about how your financial documents are uploaded,
              processed and protected.
            </p>
          </div>
        </div>

        {/* DATA SOURCES */}

        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Data Sources
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {dataSources.map((src) => (
              <div
                key={src.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition"
              >
                <button
                  onClick={() => toggleSource(src.id)}
                  className="w-full flex flex-col items-center text-center gap-3"
                >

                  <div className="w-12 h-12 rounded-xl bg-[#2081C3]/10 flex items-center justify-center">
                    {src.icon}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {src.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {src.description}
                    </p>
                  </div>

                  {openSource === src.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}

                </button>

                {openSource === src.id && (
                  <div className="mt-4 border-t pt-4 space-y-3">

                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Uploaded Files
                    </p>

                    {src.files.map((file) => (
                      <div
                        key={file}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="text-gray-700">{file}</span>

                        <button className="text-red-500 hover:text-red-600">
                          Remove
                        </button>
                      </div>
                    ))}

                    <button className="flex items-center gap-2 text-xs font-semibold text-[#2081C3] hover:underline">
                      <Upload className="w-4 h-4" />
                      Upload new file
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>
        </section>

        {/* FILE PROCESSING EXPLANATION */}

        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            How File Processing Works
          </h3>

          <p className="text-sm text-gray-600 leading-relaxed">
            Uploaded PDFs and CSV files are parsed to extract balances,
            transactions and asset values. Our system analyzes these files
            to generate portfolio insights and financial visualizations.
            No banking credentials or direct bank connections are required.
          </p>
        </section>

        {/* DATA FLOW DIAGRAM */}

        <section className="bg-white border border-gray-100 rounded-2xl p-6">

          <h3 className="text-sm font-bold text-gray-900 mb-6">
            How Your Data Flows
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center">

            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-[#2081C3]" />
              <p className="text-xs font-medium text-gray-600">
                Upload Documents
              </p>
            </div>

            <ArrowRight className="text-gray-300" />

            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-[#2081C3]" />
              <p className="text-xs font-medium text-gray-600">
                Secure Processing
              </p>
            </div>

            <ArrowRight className="text-gray-300" />

            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-[#2081C3]" />
              <p className="text-xs font-medium text-gray-600">
                Portfolio Insights
              </p>
            </div>

          </div>

        </section>

        {/* PERMISSIONS TABLE */}

        <section>

          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            File Processing Status
          </h2>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">
                    Source
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">
                    Last Processed
                  </th>

                  <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">
                    Security
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {permissions.map((row) => (
                  <tr key={row.source} className="hover:bg-gray-50">

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {row.source}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        {row.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {row.lastSync}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-[#2081C3]/10 text-[#2081C3] px-2 py-1 rounded-lg text-xs font-semibold">
                        <Lock className="w-3 h-3" />
                        {row.security}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>

        </section>

        {/* CAN / CANNOT */}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="bg-white border border-gray-100 rounded-2xl p-6">

            <h3 className="font-bold text-gray-900 mb-4">
              What we can do
            </h3>

            <ul className="space-y-3">
              {canDo.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">

            <h3 className="font-bold text-gray-900 mb-4">
              What we cannot do
            </h3>

            <ul className="space-y-3">
              {cannotDo.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <XCircle className="w-4 h-4 text-red-400" />
                  {item}
                </li>
              ))}
            </ul>

          </div>

        </section>

        {/* DATA PROTECTION */}

        <section className="bg-white border border-gray-100 rounded-2xl p-6">

          <h3 className="font-bold text-gray-900 mb-4">
            How We Protect Your Data
          </h3>

          <ul className="space-y-2 text-sm text-gray-600">
            {protectionPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="w-1.5 h-1.5 bg-[#78D5D7] rounded-full mt-2"></span>
                {point}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t">

            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex flex-col items-center gap-2 text-center">

                <div className="w-9 h-9 bg-[#2081C3]/10 rounded-xl flex items-center justify-center text-[#2081C3]">
                  {badge.icon}
                </div>

                <span className="text-xs text-gray-500">
                  {badge.label}
                </span>

              </div>
            ))}

          </div>

          {/* DELETE ALL DATA */}

          <div className="mt-8 pt-6 border-t">

            <button className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
              Delete all uploaded documents
            </button>

          </div>

        </section>

        {/* SUPPORT */}

        <section className="bg-white border border-gray-100 rounded-2xl p-6">

          <div className="flex items-center gap-2 mb-2">
            <LifeBuoy className="w-4 h-4 text-[#2081C3]" />
            <h3 className="text-sm font-bold text-gray-900">
              Need Help?
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-5">
            If you have questions about file uploads, document parsing,
            or security, our support team is here to help.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="text-sm text-gray-600">
              Contact support:
              <span className="ml-1 font-semibold text-[#2081C3]">
                support@wealthwellness.ai
              </span>
            </div>

            <div className="flex gap-4 text-xs font-semibold text-[#2081C3]">

              <button className="hover:underline">
                Help Center
              </button>

              <button className="hover:underline">
                Privacy Policy
              </button>

              <button className="hover:underline">
                Terms
              </button>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}