import { toZonedTime } from 'node_modules/date-fns-tz/dist/cjs';

export default function NewDate() {
  const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires';
  return toZonedTime(new Date(), AR_TIME_ZONE);
}
