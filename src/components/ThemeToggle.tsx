// src/components/ThemeToggle.tsx
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? '切换到浅色模式' : '切换到深色模式'}>
      <IconButton
        onClick={toggleMode}
        color='inherit'
        aria-label='切换主题'
        sx={{
          p: 1.4,
          borderRadius: 999,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.82)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)',
          boxShadow: isDark
            ? '0 18px 32px rgba(2, 6, 23, 0.24)'
            : '0 18px 32px rgba(15, 118, 110, 0.14)',
          color: 'text.primary',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.96)',
            transform: 'translateY(-2px)',
            boxShadow: isDark
              ? '0 22px 38px rgba(2, 6, 23, 0.28)'
              : '0 22px 38px rgba(15, 118, 110, 0.18)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }}
      >
        {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
