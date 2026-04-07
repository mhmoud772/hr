import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'file'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text...',
    type: 'text',
    className: 'max-w-xs',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Input disabled',
    disabled: true,
    className: 'max-w-xs',
  },
};

export const FileInput: Story = {
  args: {
    type: 'file',
    className: 'max-w-xs',
  },
};
