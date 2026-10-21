import type { weeklyGrid } from "@/lib/services/timetable";


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function TimetableGrid({ grid }: { grid: ReturnType<typeof weeklyGrid> }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1 text-sm">
        <thead><tr><th className="p-2 text-left text-xs uppercase text-slate-500">Period</th>{DAYS.map((d) => <th key={d} className="p-2 text-left text-xs uppercase text-slate-500">{d}</th>)}</tr></thead>
        <tbody>
          {grid.map((row) => (
            <tr key={row.period}>
              <td className="whitespace-nowrap p-2 align-top text-xs text-slate-500">P{row.period}<br />{row.time}</td>
              {row.cells.map((c, i) => (
                <td key={i} className={`min-w-[120px] rounded-lg p-2 align-top ${c ? "bg-sky-soft text-navy-deep" : "bg-slate-50 text-slate-400"}`}>{c ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
