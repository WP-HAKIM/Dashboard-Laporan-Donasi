interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePaymentMethodData {
  name: string;
  description?: string;
  is_active: boolean;
}

interface UpdatePaymentMethodData {
  name: string;
  description?: string;
  is_active: boolean;
}

class PaymentMethodService {
  private baseUrl = 'http://localhost:8000/api';

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAll(): Promise<PaymentMethod[]> {
    const response = await fetch(`${this.baseUrl}/payment-methods`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    const result = await response.json();
    return result.data || result; // Handle both new and old response formats
  }

  async getAllPublic(): Promise<PaymentMethod[]> {
    const response = await fetch(`${this.baseUrl}/payment-methods`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    const result = await response.json();
    return result.data || result; // Handle both new and old response formats
  }

  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const response = await fetch(`${this.baseUrl}/payment-methods`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors) {
        // Handle validation errors
        const errorMessages = Object.values(errorData.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(errorData.message || 'Failed to create payment method');
    }

    const result = await response.json();
    return result.data || result; // Handle both new and old response formats
  }

  async update(id: number, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const response = await fetch(`${this.baseUrl}/payment-methods/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors) {
        // Handle validation errors
        const errorMessages = Object.values(errorData.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(errorData.message || 'Failed to update payment method');
    }

    const result = await response.json();
    return result.data || result; // Handle both new and old response formats
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/payment-methods/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete payment method');
    }

    // No need to return data for delete operation
  }
}

export const paymentMethodService = new PaymentMethodService();
export type { PaymentMethod, CreatePaymentMethodData, UpdatePaymentMethodData };