import Papa from 'papaparse';

export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1aACnoFoY5cBDSZDOX16EAj2ItCvxeYdeOFrIoYwGHoA/export?format=csv&gid=715235473';

export const SPREADSHEET_ID = '1aACnoFoY5cBDSZDOX16EAj2ItCvxeYdeOFrIoYwGHoA';
export const SHEET_GID = '715235473';

export type PortfolioData = Record<string, string>;

export interface PortfolioRow extends PortfolioData {
  'Cover Photo'?: string;
}

export async function fetchPortfolioData(): Promise<PortfolioData | null> {
  try {
    const response = await fetch(`${SHEET_URL}&_t=${new Date().getTime()}`, { cache: 'no-store' });
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length < 2) {
            // It has headers but no data row yet, or is empty
            if (results.data.length === 1) {
                // Initialize an empty object with headers as keys
                const emptyData: PortfolioData = {};
                results.data[0].forEach((header) => {
                    emptyData[header.trim()] = "";
                });
                resolve(emptyData);
                return;
            }
            resolve(null);
            return;
          }
          
          const headers = results.data[0].map(h => h.trim());
          const values = results.data[1]; // We take the first data row
          
          const data: PortfolioData = {};
          headers.forEach((header, index) => {
            if (header) {
              data[header] = values[index] || "";
            }
          });
          
          resolve(data);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Failed to fetch sheet content Data:", error);
    return null;
  }
}

export async function updateSheetValue(fullName: string, field: string, value: string) {
  const url = "https://script.google.com/macros/s/AKfycbw9DedjbjOOGjLGjol4op1DWb_lUfGoDTgChSLrvSYUC41HcQaf6CzNLRqtILfTIqR5/exec";
  const payload = {
    action: "UPDATE",
    gid: SHEET_GID,
    spreadsheetId: SPREADSHEET_ID,
    data: { [field]: value },
    idKey: "Name",
    idValue: fullName
  };

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain" }
  });
}
