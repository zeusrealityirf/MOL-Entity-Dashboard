import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
export default function EventChart({ timeline }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={timeline}>
        <CartesianGrid stroke="#dcd7d0" vertical={false} />
        <XAxis
          dataKey="date"
          minTickGap={35}
          tickFormatter={(s) => s.slice(5)}
        />
        <YAxis allowDecimals={false} width={35} />
        <Tooltip />
        <Area
          dataKey="events"
          type="stepAfter"
          stroke="#87263a"
          fill="#e4c0c8"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
