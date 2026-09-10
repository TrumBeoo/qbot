import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';

const UserFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Vai trò</InputLabel>
          <Select
            value={filters.role || ''}
            label="Vai trò"
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="moderator">Moderator</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={filters.status || ''}
            label="Trạng thái"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="inactive">Không hoạt động</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default UserFilters;