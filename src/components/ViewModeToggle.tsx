/**
 * View Mode Toggle Component
 * Allows users to switch between card and list view layouts
 */

import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { ViewModule as CardViewIcon, ViewList as ListViewIcon } from '@mui/icons-material';

export type ViewMode = 'card' | 'list';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleChange}
      size='small'
      aria-label='view mode'
    >
      <ToggleButton value='card' aria-label='card view'>
        <Tooltip title='卡片视图'>
          <CardViewIcon fontSize='small' />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value='list' aria-label='list view'>
        <Tooltip title='列表视图'>
          <ListViewIcon fontSize='small' />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewModeToggle;
