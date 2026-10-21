/**
 * middleware/validate.js
 * Zod validation for POST /monitor batches; rejects unknown fields and returns 400 with field details. Exports monitorBatchSchema, validateBatch.
 */
const { z } = require('zod');
const { ApiError } = require('./errorHandler');

/** Schema for one API response record; records_returned may be null/missing (anomaly itself). */
const apiResponseSchema = z
  .object({
    api_name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z0-9_\- ]+$/, 'api_name may only contain letters, digits, spaces, _ and -'),
    response_time_ms: z.number().int().min(0),
    status_code: z.number().int().min(100).max(599),
    records_returned: z.number().int().min(0).nullish(),
  })
  .strict();

/** Schema for the batch accepted by POST /monitor. */
const monitorBatchSchema = z.array(apiResponseSchema).min(1).max(100);

/** Express middleware validating req.body against the batch schema. */
function validateBatch(req, res, next) {
  const result = monitorBatchSchema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '(body)',
      message: issue.message,
    }));
    return next(ApiError.badRequest('VALIDATION_ERROR', 'Invalid monitor payload', details));
  }
  req.body = result.data;
  return next();
}

module.exports = { monitorBatchSchema, apiResponseSchema, validateBatch };
