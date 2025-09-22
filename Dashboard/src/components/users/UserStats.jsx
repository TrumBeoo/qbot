import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const UserStats = ({ users = [] }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const inactiveUsers = users.filter(user => user.status === 'inactive').length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  const stats = [
    {
      title: 'Tổng người dùng',
      value: totalUsers,
      icon: PeopleIcon,
      color: '#1976d2'
    },
    {
      title: 'Đang hoạt động',
      value: activeUsers,
      icon: PersonAddIcon,
      color: '#2e7d32'
    },
    {
      title: 'Không hoạt động',
      value: inactiveUsers,
      icon: BlockIcon,
      color: '#ed6c02'
    },
    {
      title: 'Quản trị viên',
      value: adminUsers,
      icon: AdminIcon,
      color: '#d32f2f'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                  <stat.icon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default UserStats;