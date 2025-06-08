/**
 * Result type for consistent error handling
 * Inspired by Rust's Result<T, E> type
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

/**
 * Create a failed result
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Check if a result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true
}

/**
 * Check if a result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false
}

/**
 * Map a successful result to a new value
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data))
  }
  return result
}

/**
 * Map an error result to a new error
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * Unwrap a result or provide a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue
}

/**
 * Convert a Promise to a Result
 */
export async function fromPromise<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await promise
    return ok(data)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Combine multiple results into a single result
 */
export function combine<T extends ReadonlyArray<Result<any, any>>>(
  results: T
): Result<{ [K in keyof T]: T[K] extends Result<infer U, any> ? U : never }, Error> {
  const errors = results.filter(isErr)
  if (errors.length > 0) {
    const errorMessages = errors.map(e => String(e.error)).join(', ')
    return err(new Error(`Multiple errors: ${errorMessages}`))
  }
  
  const data = results.map(r => (r as { success: true; data: any }).data)
  return ok(data as any)
}