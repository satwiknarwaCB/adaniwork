import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// Convert fiscal year data to table row format
const convertToTableRow = (item: any, index: number) => {
  // Handle different possible field names for PSS
  let pssValue = '';
  if (item["PSS"]) {
    pssValue = item["PSS"];
  } else if (item["PSS -"]) {
    pssValue = item["PSS -"];
  } else if (item["PSS-"]) {
    pssValue = item["PSS-"];
  }
  
  return {
    id: index + 1,
    sno: item["Sl No"] || index + 1,
    capacity: typeof item["Capacity"] === 'number' ? item["Capacity"] : 
              (typeof item["Capacity"] === 'string' && !isNaN(parseFloat(item["Capacity"])) ? parseFloat(item["Capacity"]) : null),
    group: item["Group"] || '',
    ppaMerchant: item["PPA/Merchant"] || '',
    type: item["Type"] || '',
    solar: typeof item["Solar"] === 'number' ? item["Solar"] : 
           (typeof item["Solar"] === 'string' && !isNaN(parseFloat(item["Solar"])) ? parseFloat(item["Solar"]) : null),
    wind: typeof item["Wind"] === 'number' ? item["Wind"] : 
          (typeof item["Wind"] === 'string' && !isNaN(parseFloat(item["Wind"])) ? parseFloat(item["Wind"]) : null),
    hydro: typeof item["Hydro"] === 'number' ? item["Hydro"] : 
           (typeof item["Hydro"] === 'string' && !isNaN(parseFloat(item["Hydro"])) ? parseFloat(item["Hydro"]) : null),
    pss: pssValue,
    locationCode: item["Location Code"] || '',
    location: item["Location"] || '',
    connectivity: item["Connectivity"] || '',
    cod: item["COD"] || '',
    discom: item["DISCOM"] || '',
    total: typeof item["Total"] === 'number' ? item["Total"] : 
           (typeof item["Total"] === 'string' && !isNaN(parseFloat(item["Total"])) ? parseFloat(item["Total"]) : null)
  };
};

// POST /api/import-data - Import data for all fiscal years
// This endpoint now triggers the backend to import default data from its own database
export async function POST() {
  try {
    // Call FastAPI backend to import default data
    const response = await fetch(`${API_BASE_URL}/import-default-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to import data' },
        { status: response.status }
      );
    }
    

  } catch (error: any) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}