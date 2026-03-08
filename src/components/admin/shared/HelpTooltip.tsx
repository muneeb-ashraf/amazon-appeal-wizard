'use client';

// ============================================================================
// HELP TOOLTIP
// Provides contextual help throughout the admin panel
// ============================================================================

import { Fragment, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function HelpTooltip({
  content,
  position = 'top',
  title,
  size = 'md',
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <Popover className="relative inline-block">
      {({ open }) => (
        <>
          <Popover.Button
            className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full transition-colors"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </Popover.Button>

          <Transition
            show={isOpen || open}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              static
              className={`absolute z-50 ${sizeClasses[size]} ${positionClasses[position]}`}
            >
              <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 leading-relaxed">
                {title && <div className="font-semibold mb-1 text-blue-300">{title}</div>}
                <div className="text-gray-200">{content}</div>
                {/* Arrow */}
                <div
                  className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                    position === 'top'
                      ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1'
                      : position === 'bottom'
                      ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1'
                      : position === 'left'
                      ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1'
                      : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1'
                  }`}
                />
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
