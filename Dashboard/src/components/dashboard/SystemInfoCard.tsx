// src/components/dashboard/SystemInfoCard.jsx
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Box,
  useTheme
} from '@mui/material';

const SystemInfoCard = ({ chatbotStats }) => {
  const theme = useTheme();

  const systemInfo = [
    {
      label: 'LLM Model',
      value: chatbotStats?.rag_system?.llm_model || 'N/A'
    },
    {
      label: 'Embedding Model',
      value: chatbotStats?.rag_system?.embedding_model?.split('/').pop() || 'N/A'
    },
    {
      label: 'Chunk Size',
      value: chatbotStats?.rag_system?.chunk_size || 'N/A'
    },
    {
      label: 'Chunk Overlap',
      value: chatbotStats?.rag_system?.chunk_overlap || 'N/A'
    }
  ];

  return (
    <Card 
      elevation={0} 
      sx={{ 
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      <CardHeader 
        title="Thông tin hệ thống"
        titleTypographyProps={{
          variant: 'h6',
          fontWeight: 600,
          color: theme.palette.text.primary
        }}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          {systemInfo.map((info, index) => (
            <Box key={index}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px'
                }}
              >
                {info.label}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mt: 0.5
                }}
              >
                {info.value}
              </Typography>
            </Box>
          ))}
          
          {chatbotStats?.rag_system?.last_build_time && (
            <Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px'
                }}
              >
                Cập nhật cuối
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mt: 0.5
                }}
              >
                {new Date(chatbotStats.rag_system.last_build_time * 1000).toLocaleString('vi-VN')}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SystemInfoCard;