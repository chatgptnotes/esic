import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface PatientDataRequest {
  mobile: string;
}

interface PatientDataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Parse request body
    const requestBody: PatientDataRequest = await req.json();
    
    if (!requestBody.mobile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mobile number is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate mobile number (should be 10 digits)
    if (!/^\d{10}$/.test(requestBody.mobile)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid mobile number format. Must be 10 digits.' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('🔄 Fetching patient data for mobile:', requestBody.mobile);

    // Call the external API
    const externalApiResponse = await fetch('https://hopesoftwares.com/hims/patient_details_esic_only', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile: requestBody.mobile
      })
    });

    console.log('📥 External API response status:', externalApiResponse.status);

    if (!externalApiResponse.ok) {
      throw new Error(`External API error: ${externalApiResponse.status} ${externalApiResponse.statusText}`);
    }

    const externalData = await externalApiResponse.json();
    console.log('📋 External API response data:', externalData);

    // Return the data with CORS headers
    const response: PatientDataResponse = {
      success: true,
      data: externalData
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error in fetch-patient-data function:', error);
    
    const errorResponse: PatientDataResponse = {
      success: false,
      error: error.message || 'Internal server error'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
