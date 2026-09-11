// src/components/analytics/AdvancedCharts.jsx
import React from 'react';
import type { RechartsTooltipProps } from '../../types/api';
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
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  // MUI v7 doi Grid sang API moi (size={{xs,lg}}) va bo item/xs/lg.
  // Code nay viet theo API v5/v6 nen tren v7 cac prop do bi BO AM THAM
  // -> moi o xep full-width thay vi chia cot. GridLegacy la ban Grid cu,
  // giu dung layout ma code mong doi.
  // TODO: migrate sang Grid moi: <Grid size={{ xs: 12, lg: 6 }}> khong co item.
  GridLegacy as Grid,
  Typography,
  useTheme,
  alpha
} from '@mui/material';

const AdvancedCharts = ({ analyticsData }) => {
  const theme = useTheme();

  // Colors for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main
  };

  const pieColors = [colors.primary, colors.secondary, colors.success, colors.warning, colors.error, colors.info];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[4]
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
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

  // Format daily stats for charts
  const dailyStatsData = analyticsData?.daily_stats?.map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    conversations: day.conversations,
    messages: day.messages,
    users: day.unique_users
  })) || [];

  // Format hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourData = analyticsData?.hourly_distribution?.find(h => h.hour === hour);
    return {
      hour: `${hour}:00`,
      messages: hourData?.count || 0
    };
  });

  // Format language distribution for pie chart
  const languageData = analyticsData?.language_distribution?.map(lang => ({
    name: lang.language === 'vi' ? 'Tiếng Việt' : 'English',
    value: lang.count,
    percentage: Math.round((lang.count / analyticsData.language_distribution.reduce((sum, l) => sum + l.count, 0)) * 100)
  })) || [];

  return (
    <Grid container spacing={3}>
      {/* Daily Activity Trend */}
      <Grid item xs={12} lg={8}>
        <Card elevation={1}>
          <CardHeader 
            title="Xu hướng hoạt động hàng ngày"
            subheader="Cuộc trò chuyện và tin nhắn trong 30 ngày qua"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStatsData}>
                <defs>
                  <linearGradient id="conversationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke={colors.primary}
                  fillOpacity={1}
                  fill="url(#conversationsGradient)"
                  name="Cuộc trò chuyện"
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke={colors.secondary}
                  fillOpacity={1}
                  fill="url(#messagesGradient)"
                  name="Tin nhắn"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Language Distribution */}
      <Grid item xs={12} lg={4}>
        <Card elevation={1}>
          <CardHeader 
            title="Phân bố ngôn ngữ"
            subheader="Tỷ lệ sử dụng ngôn ngữ"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // percentage la field cua chinh du lieu (tinh o tren), khong
                  // phai cua recharts. PieLabelRenderProps khong khai bao field
                  // tuy y nen phai chi kieu ro rang.
                  label={({ name, percentage }: { name?: string; percentage?: number }) =>
                    `${name} (${percentage}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Hourly Activity Pattern */}
      <Grid item xs={12}>
        <Card elevation={1}>
          <CardHeader 
            title="Mẫu hoạt động theo giờ"
            subheader="Số lượng tin nhắn theo từng giờ trong ngày"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                <XAxis 
                  dataKey="hour" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="messages" 
                  fill={colors.success}
                  name="Tin nhắn"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* User Activity Comparison */}
      <Grid item xs={12} md={6}>
        <Card elevation={1}>
          <CardHeader 
            title="So sánh hoạt động người dùng"
            subheader="Cuộc trò chuyện vs Người dùng hoạt động"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="conversations"
                  stroke={colors.primary}
                  strokeWidth={3}
                  dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                  name="Cuộc trò chuyện"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke={colors.warning}
                  strokeWidth={3}
                  dot={{ fill: colors.warning, strokeWidth: 2, r: 4 }}
                  name="Người dùng hoạt động"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Message Volume Trend */}
      <Grid item xs={12} md={6}>
        <Card elevation={1}>
          <CardHeader 
            title="Xu hướng khối lượng tin nhắn"
            subheader="Tổng số tin nhắn theo ngày"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyStatsData}>
                <defs>
                  <linearGradient id="messageVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.info} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.info} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke={colors.info}
                  fillOpacity={1}
                  fill="url(#messageVolumeGradient)"
                  name="Tin nhắn"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AdvancedCharts;