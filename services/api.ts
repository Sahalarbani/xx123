// IMPORTANT: Replace this URL with your published Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycby_REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec';

export const getDeviceId = (): string => {
  let id = localStorage.getItem('arb_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('arb_device_id', id);
  }
  return id;
};

export const callApi = async (action: string, payload: any = {}) => {
  // Always attach device ID for security context, except for purely admin unrelated calls
  const enhancedPayload = {
    ...payload,
    deviceId: getDeviceId()
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, payload: enhancedPayload }),
    });

    const json = await response.json();

    if (json.status === 'error') {
      throw new Error(json.message);
    }

    return json.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
