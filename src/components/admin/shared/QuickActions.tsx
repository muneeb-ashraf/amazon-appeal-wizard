'use client';

// ============================================================================
// QUICK ACTIONS MENU
// Dropdown menu for common actions (duplicate, delete, export, etc.)
// ============================================================================

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
  divider?: boolean; // Add divider after this action
}

interface QuickActionsProps {
  actions: QuickAction[];
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  position?: 'left' | 'right';
}

export default function QuickActions({
  actions,
  buttonLabel,
  buttonIcon,
  position = 'right',
}: QuickActionsProps) {
  const defaultIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
        {buttonIcon || defaultIcon}
        {buttonLabel && <span>{buttonLabel}</span>}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute ${
            position === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-56 origin-top-${position} divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
        >
          <div className="py-1">
            {actions.map((action, index) => (
              <Fragment key={index}>
                <Menu.Item disabled={action.disabled}>
                  {({ active }) => (
                    <button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`${
                        active
                          ? action.variant === 'danger'
                            ? 'bg-red-50 text-red-700'
                            : action.variant === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-900'
                          : action.variant === 'danger'
                          ? 'text-red-600'
                          : action.variant === 'success'
                          ? 'text-green-600'
                          : 'text-gray-700'
                      } ${
                        action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      } group flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors`}
                    >
                      {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                      <span>{action.label}</span>
                    </button>
                  )}
                </Menu.Item>
                {action.divider && <div className="h-px bg-gray-200 my-1" />}
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
