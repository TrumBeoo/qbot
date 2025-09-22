import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Alert
} from '@mui/material';
import { useState } from 'react';

const UserPermissions = ({ open, onClose, user, onSave }) => {
  const [permissions, setPermissions] = useState({
    dashboard: {
      view: true,
      edit: false
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false
    },
    data: {
      view: true,
      upload: false,
      delete: false
    },
    analytics: {
      view: true,
      export: false
    },
    services: {
      view: true,
      create: false,
      edit: false,
      delete: false
    }
  });

  const handlePermissionChange = (module, permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: checked
      }
    }));
  };

  const handleSave = () => {
    onSave(user.id, permissions);
    onClose();
  };

  const permissionModules = [
    {
      key: 'dashboard',
      name: 'Dashboard',
      permissions: [
        { key: 'view', name: 'Xem' },
        { key: 'edit', name: 'Chỉnh sửa' }
      ]
    },
    {
      key: 'users',
      name: 'Quản lý người dùng',
      permissions: [
        { key: 'view', name: 'Xem danh sách' },
        { key: 'create', name: 'Tạo mới' },
        { key: 'edit', name: 'Chỉnh sửa' },
        { key: 'delete', name: 'Xóa' }
      ]
    },
    {
      key: 'data',
      name: 'Quản lý dữ liệu',
      permissions: [
        { key: 'view', name: 'Xem' },
        { key: 'upload', name: 'Tải lên' },
        { key: 'delete', name: 'Xóa' }
      ]
    },
    {
      key: 'analytics',
      name: 'Phân tích',
      permissions: [
        { key: 'view', name: 'Xem báo cáo' },
        { key: 'export', name: 'Xuất dữ liệu' }
      ]
    },
    {
      key: 'services',
      name: 'Dịch vụ',
      permissions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Tạo mới' },
        { key: 'edit', name: 'Chỉnh sửa' },
        { key: 'delete', name: 'Xóa' }
      ]
    }
  ];

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Phân quyền cho {user.name}
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Cấu hình quyền truy cập cho người dùng. Những thay đổi sẽ có hiệu lực ngay lập tức.
        </Alert>
        
        {permissionModules.map((module, index) => (
          <Box key={module.key} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {module.name}
            </Typography>
            <FormGroup row>
              {module.permissions.map((permission) => (
                <FormControlLabel
                  key={permission.key}
                  control={
                    <Checkbox
                      checked={permissions[module.key]?.[permission.key] || false}
                      onChange={(e) => handlePermissionChange(
                        module.key, 
                        permission.key, 
                        e.target.checked
                      )}
                    />
                  }
                  label={permission.name}
                />
              ))}
            </FormGroup>
            {index < permissionModules.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserPermissions;