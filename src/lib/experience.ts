export function calculateTotalExperience(text: string): string {
  if (!text) return "";

  // Regex to match dates like "Oct 2021", "January 2020", "2020", etc.
  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const monthRegex = months.join("|");
  const datePattern = new RegExp(`(${monthRegex})?\\s*\\d{4}|\\d{4}-\\d{2}-\\d{2}`, "gi");
  
  const matches = text.match(datePattern);
  if (!matches || matches.length === 0) return "";

  const dates: Date[] = [];
  
  matches.forEach(match => {
    if (match.includes('-')) {
      const d = new Date(match);
      if (!isNaN(d.getTime())) dates.push(d);
      return;
    }
    // Basic parsing - could be improved but covers most cases
    const parts = match.split(/\s+/);
    let month = 0;
    let year = 0;

    if (parts.length === 2) {
      const monthStr = parts[0].toLowerCase();
      month = months.indexOf(monthStr);
      if (month > 11) month -= 12; // Handle full names
      year = parseInt(parts[1]);
    } else {
      year = parseInt(parts[0]);
    }

    if (!isNaN(year)) {
      dates.push(new Date(year, month));
    }
  });

  if (dates.length === 0) return "";

  // Today's date (based on metadata)
  const today = new Date(2026, 4, 18); // May 18, 2026
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));

  let years = today.getFullYear() - earliestDate.getFullYear();
  let monthsCount = today.getMonth() - earliestDate.getMonth();

  if (monthsCount < 0) {
    years--;
    monthsCount += 12;
  }

  const yearStr = years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : "";
  const monthStr = monthsCount > 0 ? `${monthsCount} ${monthsCount === 1 ? 'month' : 'months'}` : "";

  if (yearStr && monthStr) return `${yearStr} ${monthStr}`;
  return yearStr || monthStr || "0 months";
}
