// utils/apiManager.js
class ApiManager {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.token = localStorage.getItem('admin_token');
    this.isOnline = true;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`API responded with error: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.isOnline = true;
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      this.isOnline = false;
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('SERVER_OFFLINE');
      }
      throw error;
    }
  }

  async checkServerStatus() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      this.isOnline = response.ok;
      return response.ok;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  // === МЕТОДЫ ДЛЯ ПРЕДЛОЖЕНИЙ ===
  async loadAllDiscounts() {
    return this.request('/discounts');
  }

  async getActiveDiscounts() {
    return this.request('/discounts/active');
  }

  async getDiscountById(id) {
    return this.request(`/discounts/${id}`);
  }

  async addDiscount(discount) {
    return this.request('/discounts', {
      method: 'POST',
      body: discount,
    });
  }

  async updateDiscount(id, updatedData) {
    return this.request(`/discounts/${id}`, {
      method: 'PUT',
      body: updatedData,
    });
  }

  async deleteDiscount(id) {
    return this.request(`/discounts/${id}`, {
      method: 'DELETE',
    });
  }

  // === МЕТОДЫ ДЛЯ ПРОФИЛЕЙ ===
  async loadAllProfiles() {
    return this.request('/profiles');
  }

  async getActiveProfiles() {
    return this.request('/profiles/active');
  }

  async getProfileById(id) {
    return this.request(`/profiles/${id}`);
  }

  async findProfileByTelegram(telegram) {
    const profiles = await this.loadAllProfiles();
    return profiles.find(profile => 
      profile.telegram && profile.telegram.toLowerCase().includes(telegram.toLowerCase())
    );
  }

  async addProfile(profile) {
    return this.request('/profiles', {
      method: 'POST',
      body: profile,
    });
  }

  async updateProfile(id, updatedData) {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: updatedData,
    });
  }

  async deleteProfile(id) {
    return this.request(`/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // === АУТЕНТИФИКАЦИЯ ===
  async adminLogin(credentials) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    if (result.token) {
      this.setToken(result.token);
    }
    
    return result;
  }

  async checkAdminAuth() {
    try {
      await this.request('/auth/verify');
      return true;
    } catch (error) {
      if (error.message === 'SERVER_OFFLINE') {
        const localToken = localStorage.getItem('admin_token');
        return !!localToken;
      }
      this.removeToken();
      return false;
    }
  }

  // === ЭКСПОРТ/ИМПОРТ ===
  async exportAllData() {
    return this.request('/export');
  }

  async importAllData(data) {
    return this.request('/import', {
      method: 'POST',
      body: data,
    });
  }

  async restoreDefaultData() {
    return this.request('/restore-defaults', {
      method: 'POST',
    });
  }

  async clearAllData() {
    return this.request('/clear', {
      method: 'POST',
    });
  }

  async getStats() {
    return this.request('/stats');
  }
}

export default ApiManager;