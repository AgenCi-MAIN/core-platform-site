/**
 * Number formatting utilities for dashboard metrics
 */

/**
 * Format KPIs and large numbers to 2 decimal places
 * @param {number} value - The value to format
 * @returns {string} Formatted value with 2 decimals
 */
export const formatKPI = (value) => {
  if (typeof value !== 'number') return value;
  return parseFloat(value.toFixed(2));
};

/**
 * Format percentages to 1 decimal place
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage string (e.g., "95.8%")
 */
export const formatPercentage = (value) => {
  if (typeof value !== 'number') return value;
  return parseFloat(value.toFixed(1));
};

/**
 * Format gauge values as whole numbers (for percentages)
 * @param {number} value - The value to format
 * @returns {number} Rounded whole number
 */
export const formatGauge = (value) => {
  if (typeof value !== 'number') return value;
  return Math.round(value);
};

/**
 * Format currency values
 * @param {number} value - The amount in base units
 * @param {string} unit - The unit label (e.g., 'M' for millions)
 * @returns {string} Formatted currency string (e.g., "$2.40M")
 */
export const formatCurrency = (value, unit = '') => {
  if (typeof value !== 'number') return value;
  const formatted = parseFloat(value.toFixed(2));
  return `$${formatted}${unit}`;
};

/**
 * Format milliseconds for latency display
 * @param {number} value - Milliseconds value
 * @returns {number} Value with no unnecessary decimals
 */
export const formatLatency = (value) => {
  if (typeof value !== 'number') return value;
  return Math.round(value);
};

/**
 * Format throughput/requests per second
 * @param {number} value - Requests per second
 * @returns {number} Rounded value
 */
export const formatThroughput = (value) => {
  if (typeof value !== 'number') return value;
  return Math.round(value);
};

/**
 * Format large numbers with K, M, B notation
 * @param {number} num - The number to format
 * @returns {string} Formatted number (e.g., "1.5M", "500K")
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
