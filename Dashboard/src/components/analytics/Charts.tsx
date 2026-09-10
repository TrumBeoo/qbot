// src/components/analytics/Charts.jsx
import type { RechartsTooltipProps } from '../../types/api';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 2
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

// Line Chart Component
export const ConversationTrendChart = ({ data, title = "Xu hướng cuộc trò chuyện" }) => {
  const theme = useTheme();

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="date" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="conversations"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Area Chart Component
export const MessageVolumeChart = ({ data, title = "Khối lượng tin nhắn" }) => {
  const theme = useTheme();

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="date" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="messages"
              stroke={theme.palette.success.main}
              fill={alpha(theme.palette.success.main, 0.3)}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Bar Chart Component
export const DocumentTypeChart = ({ data, title = "Phân bố loại tài liệu" }) => {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="type" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Pie Chart Component
export const LanguageDistributionChart = ({ data, title = "Phân bố ngôn ngữ" }) => {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Performance Metrics Chart
export const PerformanceChart = ({ data, title = "Hiệu suất hệ thống" }) => {
  const theme = useTheme();

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="time" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="responseTime"
              stackId="1"
              stroke={theme.palette.primary.main}
              fill={alpha(theme.palette.primary.main, 0.3)}
              name="Thời gian phản hồi (ms)"
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stackId="2"
              stroke={theme.palette.success.main}
              fill={alpha(theme.palette.success.main, 0.3)}
              name="Độ chính xác (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Hourly Activity Chart
export const HourlyActivityChart = ({ data, title = "Hoạt động theo giờ" }) => {
  const theme = useTheme();

  return (
    <Card elevation={1}>
      <CardHeader title={title} />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="hour" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="activity" 
              fill={alpha(theme.palette.secondary.main, 0.8)}
              radius={[2, 2, 0, 0]}
              name="Số lượng hoạt động"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default {
  ConversationTrendChart,
  MessageVolumeChart,
  DocumentTypeChart,
  LanguageDistributionChart,
  PerformanceChart,
  HourlyActivityChart
};