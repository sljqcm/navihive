import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { useTheme, CustomThemeColors } from '../contexts/ThemeContext';

interface ThemeCustomizerProps {
  open: boolean;
  onClose: () => void;
}

// Preset color schemes
const PRESET_SCHEMES: Array<{ name: string; colors: CustomThemeColors }> = [
  {
    name: '海洋蓝',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
    },
  },
  {
    name: '森林绿',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#064e3b',
    },
  },
  {
    name: '日落橙',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#7c2d12',
    },
  },
  {
    name: '紫罗兰',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      background: '#faf5ff',
      surface: '#ffffff',
      text: '#4c1d95',
    },
  },
];

export default function ThemeCustomizer({ open, onClose }: ThemeCustomizerProps) {
  const { customColors, setCustomColors, resetToDefault } = useTheme();

  // Local state for preview
  const [previewColors, setPreviewColors] = useState<CustomThemeColors>({
    primary: '#0f766e',
    secondary: '#ea580c',
    background: '#edf7f5',
    surface: '#ffffff',
    text: '#0f172a',
  });

  const [error, setError] = useState<string | null>(null);

  // Initialize preview colors when dialog opens
  useEffect(() => {
    if (open) {
      if (customColors) {
        setPreviewColors(customColors);
      } else {
        // Use default light theme colors
        setPreviewColors({
          primary: '#0f766e',
          secondary: '#ea580c',
          background: '#edf7f5',
          surface: '#ffffff',
          text: '#0f172a',
        });
      }
      setError(null);
    }
  }, [open, customColors]);

  const handleColorChange = (field: keyof CustomThemeColors, value: string) => {
    setPreviewColors((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSave = () => {
    // Validate colors
    const colorValues = Object.values(previewColors);
    const allValid = colorValues.every((color) => {
      // Basic validation for hex colors
      return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color) || /^rgba?\([\d\s,./]+\)$/.test(color);
    });

    if (!allValid) {
      setError('请输入有效的颜色值（如 #ff0000 或 rgb(255, 0, 0)）');
      return;
    }

    setCustomColors(previewColors);
    onClose();
  };

  const handleReset = () => {
    resetToDefault();
    setPreviewColors({
      primary: '#0f766e',
      secondary: '#ea580c',
      background: '#edf7f5',
      surface: '#ffffff',
      text: '#0f172a',
    });
    setError(null);
  };

  const handlePresetSelect = (preset: CustomThemeColors) => {
    setPreviewColors(preset);
    setError(null);
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth='sm' fullWidth>
      <DialogTitle>自定义主题颜色</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity='error'>{error}</Alert>}

          {/* Preset schemes */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              预设方案
            </Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              {PRESET_SCHEMES.map((preset) => (
                <Chip
                  key={preset.name}
                  label={preset.name}
                  onClick={() => handlePresetSelect(preset.colors)}
                  sx={{
                    bgcolor: preset.colors.primary,
                    color: '#fff',
                    '&:hover': {
                      bgcolor: preset.colors.primary,
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Color pickers */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              自定义颜色
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: previewColors.primary,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  label='主色'
                  value={previewColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  size='small'
                  fullWidth
                  placeholder='#0f766e'
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: previewColors.secondary,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  label='辅助色'
                  value={previewColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  size='small'
                  fullWidth
                  placeholder='#ea580c'
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: previewColors.background,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  label='背景色'
                  value={previewColors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  size='small'
                  fullWidth
                  placeholder='#edf7f5'
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: previewColors.surface,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  label='表面色'
                  value={previewColors.surface}
                  onChange={(e) => handleColorChange('surface', e.target.value)}
                  size='small'
                  fullWidth
                  placeholder='#ffffff'
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: previewColors.text,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  label='文字色'
                  value={previewColors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  size='small'
                  fullWidth
                  placeholder='#0f172a'
                />
              </Box>
            </Stack>
          </Box>

          {/* Preview */}
          <Box>
            <Typography variant='subtitle2' gutterBottom>
              预览
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: previewColors.background,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: previewColors.surface,
                  color: previewColors.text,
                }}
              >
                <Typography variant='h6' sx={{ color: previewColors.primary, mb: 1 }}>
                  主标题示例
                </Typography>
                <Typography variant='body2' sx={{ color: previewColors.text, mb: 1 }}>
                  这是正文文字的预览效果
                </Typography>
                <Button
                  variant='contained'
                  size='small'
                  sx={{
                    bgcolor: previewColors.primary,
                    color: '#fff',
                    mr: 1,
                    '&:hover': {
                      bgcolor: previewColors.primary,
                      opacity: 0.9,
                    },
                  }}
                >
                  主按钮
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  sx={{
                    borderColor: previewColors.secondary,
                    color: previewColors.secondary,
                  }}
                >
                  辅助按钮
                </Button>
              </Box>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color='inherit'>
          重置为默认
        </Button>
        <Button onClick={handleCancel}>取消</Button>
        <Button onClick={handleSave} variant='contained'>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
