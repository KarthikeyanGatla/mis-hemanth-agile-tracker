"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CfdPoint, BurndownPoint } from "@/lib/reports";

function Box({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <section className="rounded-lg border border-current/20 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function BurndownChart({ data }: { data: BurndownPoint[] }) {
  return (
    <Box title="Burndown (story points remaining)">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Line dataKey="ideal" name="Ideal" stroke="#9ca3af" strokeDasharray="5 5" dot={false} />
        <Line
          dataKey="remaining"
          name="Remaining"
          stroke="#2563eb"
          strokeWidth={2}
          connectNulls={false}
        />
      </LineChart>
    </Box>
  );
}

export function VelocityChart({
  data,
}: {
  data: { sprint: string; committed: number; completed: number }[];
}) {
  return (
    <Box title="Velocity per sprint">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="sprint" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="committed" name="Committed" fill="#9ca3af" />
        <Bar dataKey="completed" name="Completed" fill="#16a34a" />
      </BarChart>
    </Box>
  );
}

export function CfdChart({ data }: { data: CfdPoint[] }) {
  return (
    <Box title="Cumulative flow">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Area dataKey="DONE" name="Done" stackId="1" stroke="#16a34a" fill="#16a34a" />
        <Area dataKey="REVIEW" name="Review" stackId="1" stroke="#9333ea" fill="#9333ea" />
        <Area
          dataKey="IN_PROGRESS"
          name="In Progress"
          stackId="1"
          stroke="#2563eb"
          fill="#2563eb"
        />
        <Area dataKey="TODO" name="To Do" stackId="1" stroke="#9ca3af" fill="#9ca3af" />
      </AreaChart>
    </Box>
  );
}
