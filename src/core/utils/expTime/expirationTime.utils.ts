import { DateTime } from 'luxon';

/**
 * Converts a duration string (like '7d', '24h', '30m') to a future DateTime object using Luxon
 * @param duration A string like '7d', '24h', '30m', '60s', or '2w'
 * @returns A Luxon DateTime representing the expiration date
 */
export async function parseExpirationDate(duration: string): Promise<Date> {
  // Start with current date/time
  const now = DateTime.now();

  // Parse the duration string
  const matches = duration.match(/^(\d+)([smhdw])$/);

  if (!matches) {
    // Default to 7 days if format is invalid
    return now.plus({ days: 7 }).toJSDate();
  }

  const [_, value, unit] = matches;
  const amount = parseInt(value, 10);

  // Create the appropriate duration object
  const durationObj: Record<string, number> = {};
  switch (unit) {
    case 's':
      durationObj.seconds = amount;
      break;
    case 'm':
      durationObj.minutes = amount;
      break;
    case 'h':
      durationObj.hours = amount;
      break;
    case 'd':
      durationObj.days = amount;
      break;
    case 'w':
      durationObj.weeks = amount;
      break;
    default:
      durationObj.days = 7; // Default to 7 days
  }

  // Calculate the expiry date by adding the duration to now
  return now.plus(durationObj).toJSDate();
}
