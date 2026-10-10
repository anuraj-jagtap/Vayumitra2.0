import { FileBarChart, Download, FileText } from 'lucide-react'

const REPORTS = [
  { title: 'Monthly AQI Summary — October 2026', type: 'PDF', size: '2.4 MB', date: '10 Oct 2026' },
  { title: 'Health Impact Analysis Q3 2026',     type: 'PDF', size: '4.1 MB', date: '01 Oct 2026' },
  { title: 'Station Data Export — September',   type: 'CSV', size: '12.8 MB', date: '30 Sep 2026' },
  { title: 'Policy Intervention Evaluation',    type: 'PDF', size: '3.2 MB', date: '28 Sep 2026' },
]

export default function Reports() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-3">
        <FileBarChart className="w-5 h-5 text-[#2563EB]" />
        <div>
          <h1 className="text-base font-semibold text-slate-800">Reports & Exports</h1>
          <p className="text-sm text-slate-500">Download official AQI reports, health summaries, and raw data exports.</p>
        </div>
      </div>

      {/* Generate report button */}
      <button className="self-start flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm">
        <FileText className="w-4 h-4" /> Generate New Report
      </button>

      {/* Report list */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Available Reports</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {REPORTS.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <FileBarChart className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.type} · {r.size} · {r.date}</p>
              </div>
              <button className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium shrink-0">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
