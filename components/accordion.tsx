'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  isFixed?: boolean;
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  className = '',
  isFixed = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  if (isFixed) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        {/* オーバーレイ */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleAccordion}
            />
          )}
        </AnimatePresence>

        {/* ドロアコンテンツ */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
          }}
          className="max-h-[80vh] relative bg-neutral-900/10 backdrop-blur-xs border-t border-neutral-700 overflow-y-auto"
        >
          {/* ヘッダー - sticky */}
          <div
            className={`sticky top-0 z-50 border-b border-neutral-700 ${
              isOpen
                ? 'bg-neutral-900/60 backdrop-blur-xl'
                : 'bg-neutral-900/10 backdrop-blur-xs'
            }`}
          >
            <button
              onClick={toggleAccordion}
              className="w-full px-6 py-4 text-left hover:bg-neutral-800/50 transition-colors duration-200 flex items-center justify-between"
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="text-sm md:text-base font-medium text-neutral-100">
                {title}
              </span>
              <ChevronUpIcon
                className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* コンテンツ */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">{children}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`border border-neutral-700 overflow-hidden backdrop-blur-xs ${className}`}
    >
      <button
        onClick={toggleAccordion}
        className="w-full px-6 py-4 text-left bg-neutral-900/10 hover:bg-neutral-700/10 transition-colors duration-200 flex items-center justify-between"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="text-lg font-medium text-neutral-100">{title}</span>
        <ChevronDownIcon
          className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'h-fit opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-4 bg-neutral-900/10">{children}</div>
      </div>
    </div>
  );
}
