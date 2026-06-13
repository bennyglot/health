import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { Reading } from '../types';

interface Props {
  readings: Reading[];
}

export default function HeartRateChart({ readings }: Props) {
  const data = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleString(),
    bpm: r.heartRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis domain={[40, 160]} tick={{ fontSize: 11 }} unit=" bpm" />
        <Tooltip formatter={(val: number) => [`${val} bpm`, 'Heart Rate']} />
        <ReferenceLine y={100} stroke="#e53e3e" strokeDasharray="4 4" label={{ value: '100 bpm', fill: '#e53e3e', fontSize: 11 }} />
        <Line type="monotone" dataKey="bpm" stroke="#3182ce" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
