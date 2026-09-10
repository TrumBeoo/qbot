// src/components/dashboard/StatsCard.jsx
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: IconComponent, 
  color, 
  bgColor,
  trend = 'up' 
}) => {
  const theme = useTheme();

  return (
    <Card 
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
          borderColor: alpha(color, 0.3),
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: color, 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 500
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {subtitle}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: bgColor, 
              width: 64, 
              height: 64,
              boxShadow: `0 4px 14px ${alpha(color, 0.2)}`
            }}
          >
            <IconComponent sx={{ color: color, fontSize: 32 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;