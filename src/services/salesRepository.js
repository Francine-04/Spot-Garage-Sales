import { salesData } from "../data/salesData";

// Database boundary: replace this implementation later with Supabase, Firebase,
// SQLite, or your API. The dashboard only depends on this function.
export async function getSalesRecords() {
  return salesData;
}
