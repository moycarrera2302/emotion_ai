import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { EmotionDistribution } from '../types/emotions';
import { EMOTION_COLORS, THEME } from '../utils/colors';

interface Props {
  distribution: EmotionDistribution | null;
}

export function EmotionChart({ distribution }: Props) {
  if (!distribution) {
    return (
      <div style={cardStyle}>
        <p style={{ color: THEME.textMuted, textAlign: 'center', padding: 20, fontSize: 13 }}>
          No data yet
        </p>
      </div>
    );
  }

  const data = Object.entries(distribution)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value * 100),
      key: name as keyof EmotionDistribution,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={cardStyle}>
      <h2 style={headerStyle}>Emotion Distribution</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map(entry => (
                  <Cell key={entry.key} fill={EMOTION_COLORS[entry.key]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: THEME.bgCard,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: THEME.shadowMd,
                }}
                formatter={(value) => [`${value}%`, 'Probability']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.borderLight} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: THEME.textMuted }} />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10, fill: THEME.textSecondary }} />
              <Tooltip
                contentStyle={{
                  background: THEME.bgCard,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}%`, 'Probability']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                {data.map(entry => (
                  <Cell key={entry.key} fill={EMOTION_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: THEME.bgCard,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${THEME.border}`,
  boxShadow: THEME.shadow,
};

const headerStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 600,
  color: THEME.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 1,
};
