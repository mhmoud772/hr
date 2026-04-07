import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../src/index.css';
import '../src/i18n/i18n'; // Force i18n initialization

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => {
      return (
        <div className="p-4 bg-background text-foreground min-h-screen">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
