// src/components/dashboard/QuickActionCard.jsx
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  useTheme,
  alpha
} from '@mui/material';

const QuickActionCard = ({ 
  title, 
  subtitle, 
  icon: IconComponent, 
  action,
  disabled = false 
}) => {
  const theme = useTheme();

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        opacity: disabled ? 0.6 : 1,
        '&:hover': disabled ? {} : {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
          borderColor: alpha(theme.palette.primary.main, 0.3)
        }
      }}
      onClick={disabled ? undefined : action}
    >
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: '100%',
        p: 2,
        '&:last-child': { pb: 2 }
      }}>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            mr: 2,
            width: 48,
            height: 48
          }}
        >
          <IconComponent sx={{ fontSize: 24, color: theme.palette.primary.main }} />
        </Avatar>
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;