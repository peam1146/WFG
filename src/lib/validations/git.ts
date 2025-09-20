// Zod validation schemas for Git Log Viewer
// Provides type-safe validation for form inputs and data

import { z } from 'zod';
import { subDays } from 'date-fns';

/**
 * Schema for validating Git filter criteria from forms
 */
export const FilterCriteriaSchema = z.object({
  author: z.string()
    .min(1, "Author name is required")
    .max(255, "Author name must be less than 255 characters")
    .trim(),
  since: z.date()
    .max(new Date(), "Date cannot be in the future")
    .refine(
      date => date >= subDays(new Date(), 31),
      "Date must be within last 31 days"
    )
});

/**
 * Schema for validating form data from Server Actions
 */
export const GitFilterFormSchema = z.object({
  author: z.string()
    .min(1, "Author name is required")
    .max(255, "Author name must be less than 255 characters")
    .trim(),
  since: z.string()
    .min(1, "Since date is required")
    .refine(
      dateString => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      "Invalid date format"
    )
    .transform(dateString => new Date(dateString))
    .refine(
      date => date <= new Date(),
      "Date cannot be in the future"
    )
    .refine(
      date => date >= subDays(new Date(), 31),
      "Date must be within last 31 days"
    )
});

/**
 * Schema for validating daily summary data
 */
export const DailySummarySchema = z.object({
  authorName: z.string().min(1).max(255),
  summaryDate: z.date(),
  summaryText: z.string().min(1, "Summary text is required"),
  repositoryUrl: z.string().url("Invalid repository URL")
});

/**
 * Schema for validating summary generation form data
 */
export const SummaryGenerationFormSchema = z.object({
  author: z.string()
    .min(1, "Author name is required")
    .max(255, "Author name must be less than 255 characters")
    .trim(),
  since: z.string()
    .min(1, "Since date is required")
    .refine(
      dateString => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      },
      "Invalid date format"
    )
    .transform(dateString => new Date(dateString))
    .refine(
      date => date <= new Date(),
      "Date cannot be in the future"
    )
    .refine(
      date => date >= subDays(new Date(), 31),
      "Date must be within last 31 days"
    ),
  refresh: z.string()
    .nullable()
    .optional()
    .transform(val => val === 'true'),
  useAI: z.string()
    .nullable()
    .optional()
    .transform(val => val !== 'false')
});

/**
 * Schema for validating Git commit data
 */
export const GitCommitSchema = z.object({
  hash: z.string().min(1, "Commit hash is required"),
  author: z.string().min(1, "Author name is required"),
  email: z.string().email("Invalid email format"),
  date: z.date(),
  message: z.string().min(1, "Commit message is required"),
  isMerge: z.boolean()
});

// Type exports for use in components and services
export type FilterCriteriaInput = z.input<typeof FilterCriteriaSchema>;
export type FilterCriteriaOutput = z.output<typeof FilterCriteriaSchema>;
export type GitFilterFormInput = z.input<typeof GitFilterFormSchema>;
export type GitFilterFormOutput = z.output<typeof GitFilterFormSchema>;
export type SummaryGenerationFormInput = z.input<typeof SummaryGenerationFormSchema>;
export type SummaryGenerationFormOutput = z.output<typeof SummaryGenerationFormSchema>;
