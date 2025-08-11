/**
 * Accessibility Utilities
 * 
 * Utilities for implementing WCAG 2.1 AA compliance across the FreeSign application.
 * This module provides tools for ARIA labels, keyboard navigation, screen reader
 * support, and accessibility testing.
 * 
 * Features:
 * - ARIA label generation
 * - Keyboard navigation helpers
 * - Focus management
 * - Screen reader support
 * - Color contrast utilities
 * - Accessibility testing helpers
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * ARIA Label Generator
 */
export class AriaLabelGenerator {
  /**
   * Generate descriptive label for signature elements
   */
  static getSignatureLabel(elementType: string, recipientName?: string): string {
    const baseLabel = `${elementType} field`;
    return recipientName ? `${baseLabel} for ${recipientName}` : baseLabel;
  }

  /**
   * Generate label for PDF page
   */
  static getPageLabel(pageNumber: number, totalPages: number): string {
    return `Page ${pageNumber} of ${totalPages}`;
  }

  /**
   * Generate label for zoom controls
   */
  static getZoomLabel(currentZoom: number): string {
    return `Zoom level ${Math.round(currentZoom * 100)}%`;
  }

  /**
   * Generate label for navigation controls
   */
  static getNavigationLabel(direction: 'previous' | 'next', currentPage: number): string {
    return `Go to ${direction} page (currently on page ${currentPage})`;
  }

  /**
   * Generate label for form fields
   */
  static getFormFieldLabel(fieldName: string, required: boolean = false): string {
    const requiredText = required ? ' (required)' : '';
    return `${fieldName}${requiredText}`;
  }

  /**
   * Generate label for buttons
   */
  static getButtonLabel(action: string, context?: string): string {
    return context ? `${action} ${context}` : action;
  }
}

/**
 * Keyboard Navigation Helpers
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ): boolean {
    switch (event.key) {
      case 'ArrowUp':
        if (onUp) {
          event.preventDefault();
          onUp();
          return true;
        }
        break;
      case 'ArrowDown':
        if (onDown) {
          event.preventDefault();
          onDown();
          return true;
        }
        break;
      case 'ArrowLeft':
        if (onLeft) {
          event.preventDefault();
          onLeft();
          return true;
        }
        break;
      case 'ArrowRight':
        if (onRight) {
          event.preventDefault();
          onRight();
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Handle enter and space key activation
   */
  static handleActivationKeys(
    event: KeyboardEvent,
    onActivate: () => void
  ): boolean {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
      return true;
    }
    return false;
  }

  /**
   * Handle escape key
   */
  static handleEscape(event: KeyboardEvent, onEscape: () => void): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
      return true;
    }
    return false;
  }

  /**
   * Handle tab navigation
   */
  static handleTab(event: KeyboardEvent, onTab?: () => void): boolean {
    if (event.key === 'Tab') {
      if (onTab) {
        onTab();
      }
      return true;
    }
    return false;
  }
}

/**
 * Focus Management
 */
export class FocusManagement {
  /**
   * Trap focus within a container
   */
  static trapFocus(containerRef: React.RefObject<HTMLElement>): void {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Focus first focusable element in container
   */
  static focusFirst(containerRef: React.RefObject<HTMLElement>): void {
    const container = containerRef.current;
    if (!container) return;

    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    focusableElement?.focus();
  }

  /**
   * Focus last focusable element in container
   */
  static focusLast(containerRef: React.RefObject<HTMLElement>): void {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastElement?.focus();
  }
}

/**
 * Screen Reader Support
 */
export class ScreenReaderSupport {
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Announce page change
   */
  static announcePageChange(pageNumber: number, totalPages: number): void {
    this.announce(`Page ${pageNumber} of ${totalPages}`);
  }

  /**
   * Announce zoom change
   */
  static announceZoomChange(zoomLevel: number): void {
    this.announce(`Zoom level ${Math.round(zoomLevel * 100)}%`);
  }

  /**
   * Announce element selection
   */
  static announceElementSelection(elementType: string, recipientName?: string): void {
    const label = AriaLabelGenerator.getSignatureLabel(elementType, recipientName);
    this.announce(`Selected ${label}`);
  }
}

/**
 * Color Contrast Utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance
   */
  static getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio
   */
  static getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standards
   */
  static meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
  }

  /**
   * Check if contrast meets WCAG AAA standards
   */
  static meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  }
}

/**
 * Accessibility Hooks
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    return FocusManagement.trapFocus(containerRef);
  }, [containerRef]);
}

export function useKeyboardNavigation(
  onUp?: () => void,
  onDown?: () => void,
  onLeft?: () => void,
  onRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (KeyboardNavigation.handleArrowKeys(event, onUp, onDown, onLeft, onRight)) {
      return;
    }

    if (onEnter && KeyboardNavigation.handleActivationKeys(event, onEnter)) {
      return;
    }

    if (onEscape && KeyboardNavigation.handleEscape(event, onEscape)) {
      return;
    }
  }, [onUp, onDown, onLeft, onRight, onEnter, onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useScreenReaderAnnouncement() {
  return useCallback((message: string, priority?: 'polite' | 'assertive') => {
    ScreenReaderSupport.announce(message, priority);
  }, []);
}

export function useSkipLink() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const handleSkipLink = useCallback(() => {
    skipLinkRef.current?.focus();
  }, []);

  return { skipLinkRef, handleSkipLink };
}

/**
 * Accessibility Testing Helpers
 */
export class AccessibilityTesting {
  /**
   * Check if element has proper ARIA attributes
   */
  static validateAriaAttributes(element: HTMLElement): string[] {
    const issues: string[] = [];

    // Check for required ARIA attributes
    if (element.hasAttribute('aria-label') && !element.getAttribute('aria-label')?.trim()) {
      issues.push('aria-label is empty');
    }

    if (element.hasAttribute('aria-describedby')) {
      const describedBy = element.getAttribute('aria-describedby');
      const describedElement = document.getElementById(describedBy || '');
      if (!describedElement) {
        issues.push('aria-describedby references non-existent element');
      }
    }

    // Check for proper role usage
    if (element.hasAttribute('role')) {
      const role = element.getAttribute('role');
      const validRoles = [
        'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox',
        'listbox', 'option', 'tab', 'tabpanel', 'dialog', 'alert',
        'status', 'progressbar', 'slider', 'spinbutton', 'tree', 'treeitem'
      ];
      if (role && !validRoles.includes(role)) {
        issues.push(`Invalid role: ${role}`);
      }
    }

    return issues;
  }

  /**
   * Check if element is keyboard accessible
   */
  static validateKeyboardAccessibility(element: HTMLElement): string[] {
    const issues: string[] = [];

    // Check if interactive element is keyboard accessible
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      if (!element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '0') {
        issues.push('Button should be keyboard accessible');
      }
    }

    // Check for proper focus indicators
    const computedStyle = window.getComputedStyle(element);
    const outline = computedStyle.outline;
    const boxShadow = computedStyle.boxShadow;
    
    if (outline === 'none' && !boxShadow.includes('rgb')) {
      issues.push('Element should have visible focus indicator');
    }

    return issues;
  }

  /**
   * Check color contrast
   */
  static validateColorContrast(element: HTMLElement): string[] {
    const issues: string[] = [];
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // Parse colors (simplified - would need more robust color parsing)
    const bgMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

    if (bgMatch && colorMatch) {
      const bgLuminance = ColorContrast.getRelativeLuminance(
        parseInt(bgMatch[1]),
        parseInt(bgMatch[2]),
        parseInt(bgMatch[3])
      );
      const colorLuminance = ColorContrast.getRelativeLuminance(
        parseInt(colorMatch[1]),
        parseInt(colorMatch[2]),
        parseInt(colorMatch[3])
      );

      const contrastRatio = ColorContrast.getContrastRatio(bgLuminance, colorLuminance);
      
      if (!ColorContrast.meetsWCAGAA(contrastRatio)) {
        issues.push(`Insufficient color contrast: ${contrastRatio.toFixed(2)}:1`);
      }
    }

    return issues;
  }
}

/**
 * Accessibility Constants
 */
export const ACCESSIBILITY_CONSTANTS = {
  // ARIA roles
  ROLES: {
    BUTTON: 'button',
    LINK: 'link',
    TEXTBOX: 'textbox',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
    DIALOG: 'dialog',
    ALERT: 'alert',
    STATUS: 'status',
    PROGRESSBAR: 'progressbar',
    SLIDER: 'slider',
    TAB: 'tab',
    TABPANEL: 'tabpanel'
  },

  // ARIA states
  STATES: {
    EXPANDED: 'aria-expanded',
    SELECTED: 'aria-selected',
    CHECKED: 'aria-checked',
    PRESSED: 'aria-pressed',
    HIDDEN: 'aria-hidden',
    DISABLED: 'aria-disabled'
  },

  // Keyboard shortcuts
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight'
  }
} as const;
