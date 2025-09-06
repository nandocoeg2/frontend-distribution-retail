const API_URL = 'http://localhost:5050/api/v1/purchase-orders';

const purchaseOrderService = {
  processPurchaseOrder: async (purchaseOrderId) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/process/${purchaseOrderId}`, {
      method: 'PATCH',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        statusId: 'cmf7row5z000u1vkxlo5mimm2'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process purchase order');
    }

    return response.json();
  }
};

export default purchaseOrderService;

