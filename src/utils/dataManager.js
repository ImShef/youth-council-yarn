// utils/dataManager.js
import ApiManager from './apiManager.js';

class DataManager {
  constructor() {
    this.storageKeys = {
      DISCOUNTS: 'youthCouncil_discounts',
      PROFILES: 'youthCouncil_profiles',
      SETTINGS: 'youthCouncil_settings',
      ADMIN_AUTH: 'youthCouncil_adminAuth'
    };
    
    this.demoData = {
      discounts: [
        {
          id: this.generateId(),
          title: 'Кофейня "Кофе Хаус"',
          description: 'Скидка 15% на все напитки при предъявлении студенческого билета. Действует с понедельника по пятницу с 9:00 до 18:00.\n\nУсловия:\n• Предъявите студенческий билет\n• Скидка действует на все напитки меню\n• Не распространяется на кондитерские изделия',
          coordinates: '60.711503, 28.748026',
          category: 'food',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      profiles: [
        {
          id: this.generateId(),
          name: 'Иванов Алексей Петрович',
          telegram: 'alex_ivanov',
          phone: '+7 (912) 345-67-89',
          photo: null,
          position: 'Председатель совета молодежи',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
    
    this.useAPI = true;
    this.apiManager = new ApiManager();
    this.serverAvailable = true;
    
    this.init();
  }

  async init() {
    try {
      await this.testServerConnection();
      
      if (!this.serverAvailable) {
        console.warn('Server is unavailable, switching to local mode');
        this.useAPI = false;
      }
      
      if (!this.useAPI && !this.getData(this.storageKeys.SETTINGS)) {
        this.setData(this.storageKeys.SETTINGS, {
          initialized: true,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          lastBackup: null,
          useLocalMode: true
        });
      }
      
      this.initializeDemoData();
    } catch (error) {
      console.error('Initialization error:', error);
      this.useAPI = false;
      this.serverAvailable = false;
    }
  }

  async testServerConnection() {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        this.serverAvailable = true;
        this.useAPI = true;
        return true;
      }
    } catch (error) {
      console.warn('Server connection test failed:', error);
      this.serverAvailable = false;
      this.useAPI = false;
    }
    return false;
  }

  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading data from ${key}:`, error);
      return null;
    }
  }

  setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving data to ${key}:`, error);
      return false;
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  initializeDemoData() {
    if (this.useAPI) return;
    
    const settings = this.getData(this.storageKeys.SETTINGS) || {};
    
    if (!settings.demoDataInitialized) {
      console.log('Initializing demo data in local mode...');
      
      this.setData(this.storageKeys.DISCOUNTS, this.demoData.discounts);
      this.setData(this.storageKeys.PROFILES, this.demoData.profiles);
      
      settings.demoDataInitialized = true;
      settings.demoDataInitializedAt = new Date().toISOString();
      settings.useLocalMode = true;
      this.setData(this.storageKeys.SETTINGS, settings);
      
      console.log('Demo data initialized successfully in local mode');
    }
  }

  async loadAllDiscounts() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.loadAllDiscounts();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for loadAllDiscounts:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        return this.getData(this.storageKeys.DISCOUNTS) || [];
      }
    }
    return this.getData(this.storageKeys.DISCOUNTS) || [];
  }

  async getActiveDiscounts() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.getActiveDiscounts();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for getActiveDiscounts:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        return discounts.filter(discount => discount.isActive);
      }
    }
    const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
    return discounts.filter(discount => discount.isActive);
  }

  async getDiscountById(id) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.getDiscountById(id);
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for getDiscountById:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        return discounts.find(discount => discount.id === id);
      }
    }
    const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
    return discounts.find(discount => discount.id === id);
  }

  async addDiscount(discount) {
    if (this.useAPI) {
      try {
        const newDiscount = {
          ...discount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const result = await this.apiManager.addDiscount(newDiscount);
        this.serverAvailable = true;
        
        const localDiscounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        localDiscounts.push({...newDiscount, id: result.id || newDiscount.id});
        this.setData(this.storageKeys.DISCOUNTS, localDiscounts);
        
        return result;
      } catch (error) {
        console.error('API failed for addDiscount:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
          this.useAPI = false;
        }
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        const newDiscount = {
          ...discount,
          id: this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        discounts.push(newDiscount);
        this.setData(this.storageKeys.DISCOUNTS, discounts);
        return newDiscount;
      }
    }
    
    const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
    const newDiscount = {
      ...discount,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    discounts.push(newDiscount);
    this.setData(this.storageKeys.DISCOUNTS, discounts);
    return newDiscount;
  }

  async updateDiscount(id, updatedData) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.updateDiscount(id, updatedData);
        this.serverAvailable = true;
        
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        const index = discounts.findIndex(discount => discount.id === id);
        if (index !== -1) {
          discounts[index] = {
            ...discounts[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };
          this.setData(this.storageKeys.DISCOUNTS, discounts);
        }
        
        return result;
      } catch (error) {
        console.error('API failed for updateDiscount:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        const index = discounts.findIndex(discount => discount.id === id);
        if (index !== -1) {
          discounts[index] = {
            ...discounts[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };
          this.setData(this.storageKeys.DISCOUNTS, discounts);
          return discounts[index];
        }
        return false;
      }
    }
    
    const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
    const index = discounts.findIndex(discount => discount.id === id);
    if (index !== -1) {
      discounts[index] = {
        ...discounts[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.setData(this.storageKeys.DISCOUNTS, discounts);
      return discounts[index];
    }
    return false;
  }

  async deleteDiscount(id) {
    if (this.useAPI) {
      try {
        await this.apiManager.deleteDiscount(id);
        this.serverAvailable = true;
        
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        const filteredDiscounts = discounts.filter(discount => discount.id !== id);
        this.setData(this.storageKeys.DISCOUNTS, filteredDiscounts);
        
        return true;
      } catch (error) {
        console.error('API failed for deleteDiscount:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
        const filteredDiscounts = discounts.filter(discount => discount.id !== id);
        if (filteredDiscounts.length !== discounts.length) {
          this.setData(this.storageKeys.DISCOUNTS, filteredDiscounts);
          return true;
        }
        return false;
      }
    }
    
    const discounts = this.getData(this.storageKeys.DISCOUNTS) || [];
    const filteredDiscounts = discounts.filter(discount => discount.id !== id);
    if (filteredDiscounts.length !== discounts.length) {
      this.setData(this.storageKeys.DISCOUNTS, filteredDiscounts);
      return true;
    }
    return false;
  }

  async loadAllProfiles() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.loadAllProfiles();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for loadAllProfiles:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        return this.getData(this.storageKeys.PROFILES) || [];
      }
    }
    return this.getData(this.storageKeys.PROFILES) || [];
  }

  async getActiveProfiles() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.getActiveProfiles();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for getActiveProfiles:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        return profiles.filter(profile => profile.isActive);
      }
    }
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    return profiles.filter(profile => profile.isActive);
  }

  async getProfileById(id) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.getProfileById(id);
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for getProfileById:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        return profiles.find(profile => profile.id === id);
      }
    }
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    return profiles.find(profile => profile.id === id);
  }

  async findProfileByTelegram(telegram) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.findProfileByTelegram(telegram);
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for findProfileByTelegram:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        return profiles.find(profile => 
          profile.telegram && profile.telegram.toLowerCase().includes(telegram.toLowerCase())
        );
      }
    }
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    return profiles.find(profile => 
      profile.telegram && profile.telegram.toLowerCase().includes(telegram.toLowerCase())
    );
  }

  async addProfile(profile) {
    if (this.useAPI) {
      try {
        const newProfile = {
          ...profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const result = await this.apiManager.addProfile(newProfile);
        this.serverAvailable = true;
        
        const localProfiles = this.getData(this.storageKeys.PROFILES) || [];
        localProfiles.push({...newProfile, id: result.id || newProfile.id});
        this.setData(this.storageKeys.PROFILES, localProfiles);
        
        return result;
      } catch (error) {
        console.error('API failed for addProfile:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
          this.useAPI = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        const newProfile = {
          ...profile,
          id: this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        profiles.push(newProfile);
        this.setData(this.storageKeys.PROFILES, profiles);
        return newProfile;
      }
    }
    
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    const newProfile = {
      ...profile,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    this.setData(this.storageKeys.PROFILES, profiles);
    return newProfile;
  }

  async updateProfile(id, updatedData) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.updateProfile(id, updatedData);
        this.serverAvailable = true;
        
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        const index = profiles.findIndex(profile => profile.id === id);
        if (index !== -1) {
          profiles[index] = {
            ...profiles[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };
          this.setData(this.storageKeys.PROFILES, profiles);
        }
        
        return result;
      } catch (error) {
        console.error('API failed for updateProfile:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        const index = profiles.findIndex(profile => profile.id === id);
        if (index !== -1) {
          profiles[index] = {
            ...profiles[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };
          this.setData(this.storageKeys.PROFILES, profiles);
          return profiles[index];
        }
        return false;
      }
    }
    
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    const index = profiles.findIndex(profile => profile.id === id);
    if (index !== -1) {
      profiles[index] = {
        ...profiles[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.setData(this.storageKeys.PROFILES, profiles);
      return profiles[index];
    }
    return false;
  }

  async deleteProfile(id) {
    if (this.useAPI) {
      try {
        await this.apiManager.deleteProfile(id);
        this.serverAvailable = true;
        
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        const filteredProfiles = profiles.filter(profile => profile.id !== id);
        this.setData(this.storageKeys.PROFILES, filteredProfiles);
        
        return true;
      } catch (error) {
        console.error('API failed for deleteProfile:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const profiles = this.getData(this.storageKeys.PROFILES) || [];
        const filteredProfiles = profiles.filter(profile => profile.id !== id);
        if (filteredProfiles.length !== profiles.length) {
          this.setData(this.storageKeys.PROFILES, filteredProfiles);
          return true;
        }
        return false;
      }
    }
    
    const profiles = this.getData(this.storageKeys.PROFILES) || [];
    const filteredProfiles = profiles.filter(profile => profile.id !== id);
    if (filteredProfiles.length !== profiles.length) {
      this.setData(this.storageKeys.PROFILES, filteredProfiles);
      return true;
    }
    return false;
  }

  async checkAdminAuth() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.checkAdminAuth();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for checkAdminAuth:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        return this.getData(this.storageKeys.ADMIN_AUTH) || false;
      }
    }
    return this.getData(this.storageKeys.ADMIN_AUTH) || false;
  }

  async setAdminAuth(isAuthenticated) {
    if (this.useAPI) {
      return true;
    }
    return this.setData(this.storageKeys.ADMIN_AUTH, isAuthenticated);
  }

  async adminLogin(credentials) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.adminLogin(credentials);
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for adminLogin:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
          this.useAPI = false;
        }
        try {
          const { validateCredentials } = await import('../config/auth.js');
          const isValid = validateCredentials(credentials.username, credentials.password);
          if (isValid) {
            await this.setAdminAuth(true);
            return { success: true };
          }
          return { success: false, error: 'Неверный логин или пароль' };
        } catch (authError) {
          return { success: false, error: 'Ошибка аутентификации' };
        }
      }
    }
    
    try {
      const { validateCredentials } = await import('../config/auth.js');
      const isValid = validateCredentials(credentials.username, credentials.password);
      if (isValid) {
        await this.setAdminAuth(true);
        return { success: true };
      }
      return { success: false, error: 'Неверный логин или пароль' };
    } catch (error) {
      return { success: false, error: 'Ошибка аутентификации' };
    }
  }

  async exportAllData() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.exportAllData();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for exportAllData:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        return {
          discounts: await this.loadAllDiscounts(),
          profiles: await this.loadAllProfiles(),
          settings: this.getData(this.storageKeys.SETTINGS),
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        };
      }
    }
    
    return {
      discounts: await this.loadAllDiscounts(),
      profiles: await this.loadAllProfiles(),
      settings: this.getData(this.storageKeys.SETTINGS),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  async importAllData(data) {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.importAllData(data);
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for importAllData:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        try {
          if (data.discounts) {
            this.setData(this.storageKeys.DISCOUNTS, data.discounts);
          }
          if (data.profiles) {
            this.setData(this.storageKeys.PROFILES, data.profiles);
          }
          if (data.settings) {
            this.setData(this.storageKeys.SETTINGS, data.settings);
          }
          return true;
        } catch (fallbackError) {
          console.error('Fallback import failed:', fallbackError);
          return false;
        }
      }
    }
    
    try {
      if (data.discounts) {
        this.setData(this.storageKeys.DISCOUNTS, data.discounts);
      }
      if (data.profiles) {
        this.setData(this.storageKeys.PROFILES, data.profiles);
      }
      if (data.settings) {
        this.setData(this.storageKeys.SETTINGS, data.settings);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  async restoreDefaultData() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.restoreDefaultData();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for restoreDefaultData:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        try {
          this.setData(this.storageKeys.DISCOUNTS, this.demoData.discounts);
          this.setData(this.storageKeys.PROFILES, this.demoData.profiles);
          return true;
        } catch (fallbackError) {
          console.error('Fallback restore failed:', fallbackError);
          return false;
        }
      }
    }
    
    try {
      this.setData(this.storageKeys.DISCOUNTS, this.demoData.discounts);
      this.setData(this.storageKeys.PROFILES, this.demoData.profiles);
      return true;
    } catch (error) {
      console.error('Error restoring default data:', error);
      return false;
    }
  }

  async clearAllData() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.clearAllData();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for clearAllData:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        try {
          this.setData(this.storageKeys.DISCOUNTS, []);
          this.setData(this.storageKeys.PROFILES, []);
          return true;
        } catch (fallbackError) {
          console.error('Fallback clear failed:', fallbackError);
          return false;
        }
      }
    }
    
    try {
      this.setData(this.storageKeys.DISCOUNTS, []);
      this.setData(this.storageKeys.PROFILES, []);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  async getStats() {
    if (this.useAPI) {
      try {
        const result = await this.apiManager.getStats();
        this.serverAvailable = true;
        return result;
      } catch (error) {
        console.error('API failed for getStats:', error);
        if (error.message === 'SERVER_OFFLINE') {
          this.serverAvailable = false;
        }
        const discounts = await this.loadAllDiscounts();
        const profiles = await this.loadAllProfiles();
        
        return {
          totalDiscounts: discounts.length,
          activeDiscounts: discounts.filter(d => d.isActive).length,
          totalProfiles: profiles.length,
          activeProfiles: profiles.filter(p => p.isActive).length,
          lastUpdate: new Date().toISOString()
        };
      }
    }
    
    const discounts = await this.loadAllDiscounts();
    const profiles = await this.loadAllProfiles();
    
    return {
      totalDiscounts: discounts.length,
      activeDiscounts: discounts.filter(d => d.isActive).length,
      totalProfiles: profiles.length,
      activeProfiles: profiles.filter(p => p.isActive).length,
      lastUpdate: new Date().toISOString()
    };
  }

  async checkServerStatus() {
    return await this.testServerConnection();
  }

  setMode(useAPI) {
    this.useAPI = useAPI;
    if (!useAPI) {
      this.serverAvailable = false;
    }
  }

  getStatus() {
    return {
      useAPI: this.useAPI,
      serverAvailable: this.serverAvailable,
      mode: this.useAPI ? (this.serverAvailable ? 'API' : 'API (offline)') : 'Local'
    };
  }
}

const dataManagerInstance = new DataManager();
export default dataManagerInstance;