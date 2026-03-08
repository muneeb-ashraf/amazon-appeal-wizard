// ============================================================================
// VALIDATION UTILITIES
// Common validation functions for admin configurations
// ============================================================================

import type { AIInstructionsConfig, FormFieldsConfig, TemplatesConfig } from './admin-config-types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// AI INSTRUCTIONS VALIDATION
// ============================================================================

export function validateAIInstructions(config: AIInstructionsConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate sections
  if (!config.sections || config.sections.length === 0) {
    errors.push({ field: 'sections', message: 'At least one section is required' });
  } else {
    config.sections.forEach((section, index) => {
      // Validate section name
      if (!section.name || section.name.trim() === '') {
        errors.push({
          field: `sections[${index}].name`,
          message: `Section ${index + 1}: Name is required`,
        });
      }

      // Validate section prompt
      if (!section.userPromptTemplate || section.userPromptTemplate.trim() === '') {
        errors.push({
          field: `sections[${index}].userPromptTemplate`,
          message: `Section ${index + 1}: Prompt template is required`,
        });
      }

      // Validate prompt length
      if (section.userPromptTemplate && section.userPromptTemplate.length > 10000) {
        errors.push({
          field: `sections[${index}].userPromptTemplate`,
          message: `Section ${index + 1}: Prompt template too long (max 10,000 characters)`,
        });
      }

      // Validate token limits
      if (section.maxTokens < 100 || section.maxTokens > 4000) {
        errors.push({
          field: `sections[${index}].maxTokens`,
          message: `Section ${index + 1}: Max tokens must be between 100 and 4000`,
        });
      }

      // Validate order
      if (section.order < 1) {
        errors.push({
          field: `sections[${index}].order`,
          message: `Section ${index + 1}: Order must be at least 1`,
        });
      }
    });

    // Check for duplicate orders
    const orders = config.sections.map((s) => s.order);
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
    if (duplicateOrders.length > 0) {
      errors.push({
        field: 'sections',
        message: `Duplicate section orders found: ${duplicateOrders.join(', ')}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FORM FIELDS VALIDATION
// ============================================================================

export function validateFormFields(config: FormFieldsConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate appeal types
  if (!config.appealTypes || config.appealTypes.length === 0) {
    errors.push({ field: 'appealTypes', message: 'At least one appeal type is required' });
  } else {
    const enabledAppealTypes = config.appealTypes.filter((t) => t.enabled);
    if (enabledAppealTypes.length === 0) {
      errors.push({ field: 'appealTypes', message: 'At least one appeal type must be enabled' });
    }

    config.appealTypes.forEach((type, index) => {
      if (!type.value || type.value.trim() === '') {
        errors.push({
          field: `appealTypes[${index}].value`,
          message: `Appeal type ${index + 1}: Value is required`,
        });
      }
      if (!type.label || type.label.trim() === '') {
        errors.push({
          field: `appealTypes[${index}].label`,
          message: `Appeal type ${index + 1}: Label is required`,
        });
      }
    });
  }

  // Validate root causes
  if (!config.rootCauses || config.rootCauses.length === 0) {
    errors.push({ field: 'rootCauses', message: 'At least one root cause is required' });
  } else {
    config.rootCauses.forEach((cause, index) => {
      if (!cause.label || cause.label.trim() === '') {
        errors.push({
          field: `rootCauses[${index}].label`,
          message: `Root cause ${index + 1}: Label is required`,
        });
      }
      if (!cause.appealTypes || cause.appealTypes.length === 0) {
        errors.push({
          field: `rootCauses[${index}].appealTypes`,
          message: `Root cause ${index + 1}: Must be assigned to at least one appeal type`,
        });
      }
    });
  }

  // Validate corrective actions
  if (!config.correctiveActions || config.correctiveActions.length === 0) {
    errors.push({
      field: 'correctiveActions',
      message: 'At least one corrective action is required',
    });
  } else {
    config.correctiveActions.forEach((action, index) => {
      if (!action.label || action.label.trim() === '') {
        errors.push({
          field: `correctiveActions[${index}].label`,
          message: `Corrective action ${index + 1}: Label is required`,
        });
      }
    });
  }

  // Validate preventive measures
  if (!config.preventiveMeasures || config.preventiveMeasures.length === 0) {
    errors.push({
      field: 'preventiveMeasures',
      message: 'At least one preventive measure is required',
    });
  } else {
    config.preventiveMeasures.forEach((measure, index) => {
      if (!measure.label || measure.label.trim() === '') {
        errors.push({
          field: `preventiveMeasures[${index}].label`,
          message: `Preventive measure ${index + 1}: Label is required`,
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// TEMPLATES VALIDATION
// ============================================================================

export function validateTemplates(config: TemplatesConfig): ValidationResult {
  const errors: ValidationError[] = [];

  if (config.settings) {
    // Validate similarity threshold
    if (
      config.settings.similarityThreshold < 0 ||
      config.settings.similarityThreshold > 1
    ) {
      errors.push({
        field: 'settings.similarityThreshold',
        message: 'Similarity threshold must be between 0 and 1',
      });
    }

    // Validate max relevant documents
    if (
      config.settings.maxRelevantDocuments < 1 ||
      config.settings.maxRelevantDocuments > 20
    ) {
      errors.push({
        field: 'settings.maxRelevantDocuments',
        message: 'Max relevant documents must be between 1 and 20',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// GENERAL VALIDATION HELPERS
// ============================================================================

/**
 * Validate required string field
 */
export function validateRequired(value: string | undefined | null, fieldName: string): ValidationError | null {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (value.length < min) {
    return { field: fieldName, message: `${fieldName} must be at least ${min} characters` };
  }
  if (value.length > max) {
    return { field: fieldName, message: `${fieldName} must be at most ${max} characters` };
  }
  return null;
}

/**
 * Validate number range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null {
  if (value < min || value > max) {
    return { field: fieldName, message: `${fieldName} must be between ${min} and ${max}` };
  }
  return null;
}

/**
 * Validate configuration before saving
 */
export function validateConfiguration(
  configType: 'ai-instructions' | 'form-fields' | 'templates',
  config: any
): ValidationResult {
  switch (configType) {
    case 'ai-instructions':
      return validateAIInstructions(config);
    case 'form-fields':
      return validateFormFields(config);
    case 'templates':
      return validateTemplates(config);
    default:
      return { valid: true, errors: [] };
  }
}
