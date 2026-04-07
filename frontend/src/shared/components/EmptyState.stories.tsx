import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import { FolderOpen, Users, AlertTriangle } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: ['FolderOpen', 'Users', 'AlertTriangle'] },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No Data Available',
    description: 'There are currently no records to display in this list.',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Folder is Empty',
    description: 'Create a new item to get started.',
    icon: FolderOpen,
  },
};

export const WithAction: Story = {
  args: {
    title: 'No Employees Found',
    description: 'You haven\'t added any employees to the system yet.',
    icon: Users,
    actionLabel: 'Add Employee',
    onAction: () => alert('Action clicked!'),
  },
};

export const ErrorState: Story = {
  args: {
    title: 'Failed to load data',
    description: 'Please check your connection and try again.',
    icon: AlertTriangle,
    actionLabel: 'Retry',
    onAction: () => alert('Retry clicked!'),
  },
};
