// components/Admin.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, Trash2, MapPin, Users, Gift, LogOut, Camera, 
  Loader, Moon, Sun, Phone, Home, LogIn,
  Image, User, X, AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff
} from 'react-feather';
import DataManager from '../utils/dataManager.js';
import { validateCredentials } from '../config/auth.js';
import '../styles/Admin.css';

const Admin = () => {
  const [currentSection, setCurrentSection] = useState('discounts');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currentDiscount, setCurrentDiscount] = useState({
    id: null,
    title: '',
    description: '',
    coordinates: '',
    category: 'food',
    isActive: true
  });
  const [currentProfile, setCurrentProfile] = useState({
    id: null,
    name: '',
    telegram: '',
    phone: '',
    photo: null,
    photoPreview: null,
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const autoRefreshRef = React.useRef(null);
  const dataUpdateTimeRef = React.useRef(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    document.body.className = `admin-panel theme-${newTheme}`;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  const checkConnectionStatus = useCallback(async () => {
    try {
      const status = await DataManager.checkServerStatus();
      if (status) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'light';
    setTheme(savedTheme);
    document.body.className = `admin-panel theme-${savedTheme}`;

    const savedAutoRefresh = localStorage.getItem('admin-auto-refresh');
    if (savedAutoRefresh !== null) {
      setAutoRefresh(JSON.parse(savedAutoRefresh));
    }

    checkConnectionStatus();
  }, [checkConnectionStatus]);

  useEffect(() => {
    localStorage.setItem('admin-auto-refresh', JSON.stringify(autoRefresh));
  }, [autoRefresh]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const [discountsData, profilesData, statsData] = await Promise.all([
        DataManager.loadAllDiscounts(),
        DataManager.loadAllProfiles(),
        DataManager.getStats()
      ]);
      
      setDiscounts(discountsData);
      setProfiles(profilesData);
      setStats(statsData);
      
      const status = await DataManager.checkServerStatus();
      setConnectionStatus(status ? 'connected' : 'disconnected');
      
      const now = new Date();
      setLastUpdate(now);
      dataUpdateTimeRef.current = now;
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Ошибка загрузки данных', 'error');
      setConnectionStatus('error');
      
      try {
        const localDiscounts = DataManager.getData(DataManager.storageKeys.DISCOUNTS) || [];
        const localProfiles = DataManager.getData(DataManager.storageKeys.PROFILES) || [];
        setDiscounts(localDiscounts);
        setProfiles(localProfiles);
        updateStats(localDiscounts, localProfiles);
      } catch (fallbackError) {
        console.error('Fallback data error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      return;
    }

    loadData();

    autoRefreshRef.current = setInterval(() => {
      console.log('Auto-refreshing data...');
      loadData();
    }, 30000);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [isAuthenticated, autoRefresh, loadData]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await DataManager.checkAdminAuth();
        if (auth) {
          setIsAuthenticated(true);
          const status = await DataManager.checkServerStatus();
          setConnectionStatus(status ? 'connected' : 'disconnected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setConnectionStatus('error');
      }
    };
    
    checkAuth();
  }, []);

  const updateStats = (discountsData, profilesData) => {
    const activeDiscounts = discountsData.filter(d => d.isActive).length;
    const activeProfiles = profilesData.filter(p => p.isActive).length;
    
    setStats({
      totalDiscounts: discountsData.length,
      activeDiscounts,
      totalProfiles: profilesData.length,
      activeProfiles,
      lastUpdate: new Date().toISOString()
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    try {
      const result = await DataManager.adminLogin(loginData);
      if (result.success) {
        setIsAuthenticated(true);
        DataManager.setAdminAuth(true);
        showNotification('Успешный вход в систему');
        await checkConnectionStatus();
      } else {
        setLoginError(result.error || 'Неверный логин или пароль');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    
    setIsAuthenticated(false);
    DataManager.setAdminAuth(false);
    setLoginData({ username: '', password: '' });
    setLoginError('');
    showNotification('Вы вышли из системы');
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      if (isEditing) {
        await DataManager.updateDiscount(currentDiscount.id, currentDiscount);
        showNotification('Предложение успешно обновлено');
      } else {
        const newDiscount = {
          ...currentDiscount,
          id: DataManager.generateId(),
          createdAt: new Date().toISOString()
        };
        await DataManager.addDiscount(newDiscount);
        showNotification('Предложение успешно добавлено');
      }
      
      resetDiscountForm();
      await loadData();
    } catch (error) {
      console.error('Error saving discount:', error);
      showNotification('Ошибка при сохранении предложения: ' + error.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const resetDiscountForm = () => {
    setCurrentDiscount({
      id: null,
      title: '',
      description: '',
      coordinates: '',
      category: 'food',
      isActive: true
    });
    setIsEditing(false);
  };

  const editDiscount = (discount) => {
    setCurrentDiscount({
      ...discount,
      coordinates: discount.coordinates || '',
      category: discount.category || 'food'
    });
    setIsEditing(true);
  };

  const deleteDiscount = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это предложение?')) {
      try {
        await DataManager.deleteDiscount(id);
        showNotification('Предложение успешно удалено');
        await loadData();
      } catch (error) {
        console.error('Error deleting discount:', error);
        showNotification('Ошибка при удалении предложения: ' + error.message, 'error');
      }
    }
  };

  const toggleDiscountActive = async (id) => {
    const discount = discounts.find(d => d.id === id);
    if (!discount) return;

    try {
      await DataManager.updateDiscount(id, { 
        ...discount, 
        isActive: !discount.isActive 
      });
      showNotification(`Предложение ${!discount.isActive ? 'активировано' : 'деактивировано'}`);
      await loadData();
    } catch (error) {
      console.error('Error toggling discount:', error);
      showNotification('Ошибка при обновлении предложения: ' + error.message, 'error');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      if (isEditingProfile) {
        await DataManager.updateProfile(currentProfile.id, currentProfile);
        showNotification('Анкета успешно обновлена');
      } else {
        const newProfile = {
          ...currentProfile,
          id: DataManager.generateId(),
          createdAt: new Date().toISOString()
        };
        await DataManager.addProfile(newProfile);
        showNotification('Анкета успешно добавлена');
      }
      
      resetProfileForm();
      await loadData();
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Ошибка при сохранении анкеты: ' + error.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const resetProfileForm = () => {
    setCurrentProfile({
      id: null,
      name: '',
      telegram: '',
      phone: '',
      photo: null,
      photoPreview: null,
      isActive: true
    });
    setIsEditingProfile(false);
  };

  const editProfile = (profile) => {
    setCurrentProfile({
      ...profile,
      phone: profile.phone || '',
      photoPreview: profile.photo
    });
    setIsEditingProfile(true);
  };

  const deleteProfile = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту анкету?')) {
      try {
        await DataManager.deleteProfile(id);
        showNotification('Анкета успешно удалена');
        await loadData();
      } catch (error) {
        console.error('Error deleting profile:', error);
        showNotification('Ошибка при удалении анкеты: ' + error.message, 'error');
      }
    }
  };

  const toggleProfileActive = async (id) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;

    try {
      await DataManager.updateProfile(id, { 
        ...profile, 
        isActive: !profile.isActive 
      });
      showNotification(`Анкета ${!profile.isActive ? 'активирована' : 'деактивирована'}`);
      await loadData();
    } catch (error) {
      console.error('Error toggling profile:', error);
      showNotification('Ошибка при обновлении анкеты: ' + error.message, 'error');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Размер файла не должен превышать 5MB', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification('Пожалуйста, выберите изображение', 'error');
        return;
      }

      setPhotoUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentProfile({
          ...currentProfile,
          photo: e.target.result,
          photoPreview: e.target.result
        });
        setPhotoUploading(false);
        showNotification('Фото успешно загружено');
      };
      
      reader.onerror = () => {
        showNotification('Ошибка при загрузке изображения', 'error');
        setPhotoUploading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setCurrentProfile({
      ...currentProfile,
      photo: null,
      photoPreview: null
    });
    showNotification('Фото удалено');
  };

  const refreshData = async () => {
    await loadData();
    showNotification('Данные обновлены');
  };

  const toggleAutoRefresh = () => {
    const newAutoRefresh = !autoRefresh;
    setAutoRefresh(newAutoRefresh);
    showNotification(`Автообновление ${newAutoRefresh ? 'включено' : 'выключено'}`);
  };

  const categories = [
    { value: 'food', label: 'Еда' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'sports', label: 'Спорт' },
    { value: 'shopping', label: 'Шоппинг' },
    { value: 'other', label: 'Другое' }
  ];

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Никогда';
    
    const now = new Date();
    const diff = now - lastUpdate;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин назад`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    
    return lastUpdate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const ConnectionStatus = () => {
    const getStatusInfo = () => {
      switch (connectionStatus) {
        case 'connected':
          return { 
            color: '#10b981', 
            text: 'Подключено к БД', 
            icon: <CheckCircle size={14} /> 
          };
        case 'disconnected':
          return { 
            color: '#f59e0b', 
            text: 'Локальный режим', 
            icon: <AlertCircle size={14} /> 
          };
        case 'error':
          return { 
            color: '#ef4444', 
            text: 'Ошибка подключения', 
            icon: <AlertCircle size={14} /> 
          };
        default:
          return { 
            color: '#6b7280', 
            text: 'Проверка подключения...', 
            icon: <Loader size={14} className="spinner" /> 
          };
      }
    };

    const status = getStatusInfo();

    return (
      <div className="connection-status">
        <div className="connection-info" style={{ color: status.color }}>
          {status.icon}
          <span>{status.text}</span>
        </div>
        
        {isAuthenticated && (
          <div className="auto-refresh-controls">
            <button 
              onClick={toggleAutoRefresh}
              className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
              title={autoRefresh ? 'Выключить автообновление' : 'Включить автообновление'}
            >
              {autoRefresh ? <Wifi size={12} /> : <WifiOff size={12} />}
            </button>
            
            <button 
              onClick={refreshData}
              className="refresh-btn"
              title="Обновить сейчас"
              disabled={loading}
            >
              <RefreshCw size={12} />
            </button>
            
            <span className="last-update-time" title={lastUpdate ? lastUpdate.toLocaleString('ru-RU') : ''}>
              {formatLastUpdate()}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-login">
          <div className="login-container">
            <div className="login-header">
              <h1>Панель управления</h1>
              <p>Дом молодежи - Административная панель</p>
              <ConnectionStatus />
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Логин</label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Введите логин"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Введите пароль"
                  required
                  disabled={loading}
                />
              </div>

              {loginError && (
                <div className="login-error">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}
              
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Войти
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification({ show: false, message: '', type: '' })} className="notification-close">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Панель управления</h1>
            <p>Дом молодежи - Административная панель</p>
            <ConnectionStatus />
            {loading && (
              <div className="loading-indicator">
                <Loader size={16} className="spinner" />
                <span>Загрузка данных...</span>
              </div>
            )}
          </div>
          
          <div className="admin-controls">
            <div className="admin-stats">
              <span>Предложения: {stats.activeDiscounts || 0}/{stats.totalDiscounts || 0}</span>
              <span>Анкеты: {stats.activeProfiles || 0}/{stats.totalProfiles || 0}</span>
            </div>
            
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              disabled={loading}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span className="theme-toggle-text">
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </span>
            </button>

            <button 
              className="btn-secondary"
              onClick={() => window.open('/', '_blank')}
              disabled={loading}
            >
              <Home size={16} />
              На сайт
            </button>

            <button className="logout-btn" onClick={handleLogout} disabled={loading}>
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`nav-btn ${currentSection === 'discounts' ? 'active' : ''}`}
            onClick={() => setCurrentSection('discounts')}
            disabled={loading}
          >
            <Gift size={18} />
            Управление предложениями
          </button>
          <button 
            className={`nav-btn ${currentSection === 'profiles' ? 'active' : ''}`}
            onClick={() => setCurrentSection('profiles')}
            disabled={loading}
          >
            <Users size={18} />
            Управление анкетами
          </button>
        </nav>
      </header>

      <div className="admin-container">
        {currentSection === 'discounts' && (
          <>
            <div className="form-section">
              <h2>{isEditing ? 'Редактировать предложение' : 'Добавить новое предложение'}</h2>
              <form onSubmit={handleDiscountSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Название предложения *</label>
                    <input
                      type="text"
                      value={currentDiscount.title}
                      onChange={(e) => setCurrentDiscount({ ...currentDiscount, title: e.target.value })}
                      placeholder="Например: Кофейня 'Кофе Хаус'"
                      required
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Категория *</label>
                    <select
                      value={currentDiscount.category}
                      onChange={(e) => setCurrentDiscount({ ...currentDiscount, category: e.target.value })}
                      required
                      disabled={saveLoading}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание предложения *</label>
                  <textarea
                    value={currentDiscount.description}
                    onChange={(e) => setCurrentDiscount({ ...currentDiscount, description: e.target.value })}
                    placeholder="Подробное описание условий и правил использования..."
                    rows="4"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Координаты на карте (широта, долгота)</label>
                  <input
                    type="text"
                    value={currentDiscount.coordinates}
                    onChange={(e) => setCurrentDiscount({ ...currentDiscount, coordinates: e.target.value })}
                    placeholder="60.711503, 28.748026"
                    disabled={saveLoading}
                  />
                  <small>Необязательное поле. Формат: широта, долгота через запятую</small>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <>
                        <Loader size={16} className="spinner" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {isEditing ? 'Обновить предложение' : 'Добавить предложение'}
                      </>
                    )}
                  </button>
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={resetDiscountForm} 
                      className="btn-secondary"
                      disabled={saveLoading}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="discounts-section">
              <div className="section-header">
                <h2>Активные предложения ({discounts.filter(d => d.isActive).length})</h2>
                <div className="section-stats">
                  Всего: {discounts.length} | Активные: {discounts.filter(d => d.isActive).length}
                  {autoRefresh && <span className="auto-refresh-badge">Автообновление</span>}
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <Loader size={48} className="spinner" />
                  <p>Загрузка предложений...</p>
                </div>
              ) : discounts.length === 0 ? (
                <div className="empty-state">
                  <Gift size={48} />
                  <h3>Нет добавленных предложений</h3>
                  <p>Добавьте первое предложение, используя форму выше</p>
                </div>
              ) : (
                <div className="discounts-grid">
                  {discounts.map(discount => (
                    <div key={discount.id} className={`discount-card ${!discount.isActive ? 'inactive' : ''}`}>
                      <div className="discount-header">
                        <div className="discount-title">
                          <h3>{discount.title}</h3>
                          <span className="category-badge">
                            {categories.find(c => c.value === discount.category)?.label}
                          </span>
                        </div>
                        <div className="discount-actions">
                          <button 
                            className="icon-btn edit-btn"
                            onClick={() => editDiscount(discount)}
                            title="Редактировать"
                            disabled={loading}
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn"
                            onClick={() => deleteDiscount(discount.id)}
                            title="Удалить"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="discount-body">
                        <p className="discount-description">{discount.description}</p>
                        
                        <div className="discount-details">
                          {discount.coordinates && (
                            <div className="detail-item">
                              <strong>Координаты:</strong>
                              <span className="coordinates">
                                <MapPin size={12} />
                                {discount.coordinates}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="discount-footer">
                        <div className="status-toggle">
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={discount.isActive || false}
                              onChange={() => toggleDiscountActive(discount.id)}
                              disabled={loading}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-text">
                              {discount.isActive ? 'Активно' : 'Неактивно'}
                            </span>
                          </label>
                        </div>
                        <div className="discount-date">
                          {discount.createdAt && (
                            <>Добавлено: {new Date(discount.createdAt).toLocaleDateString('ru-RU')}</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentSection === 'profiles' && (
          <>
            <div className="form-section">
              <h2>{isEditingProfile ? 'Редактировать анкету' : 'Добавить новую анкету'}</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label>ФИО участника *</label>
                  <input
                    type="text"
                    value={currentProfile.name}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Telegram username *</label>
                    <input
                      type="text"
                      value={currentProfile.telegram}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, telegram: e.target.value })}
                      placeholder="@username"
                      required
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Номер телефона</label>
                    <input
                      type="tel"
                      value={currentProfile.phone}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                      disabled={saveLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Фото профиля</label>
                  <div className="photo-upload-section">
                    {currentProfile.photoPreview ? (
                      <div className="photo-preview">
                        <img src={currentProfile.photoPreview} alt="Preview" />
                        <button 
                          type="button" 
                          onClick={removePhoto} 
                          className="remove-photo-btn"
                          disabled={saveLoading}
                        >
                          <X size={16} />
                          Удалить фото
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-placeholder">
                        <label htmlFor="photo-upload" className="photo-upload-label">
                          {photoUploading ? (
                            <Loader size={48} className="spinner" />
                          ) : (
                            <>
                              <Image size={48} />
                              <span>Нажмите для загрузки фото</span>
                              <small>Рекомендуемый размер: 500x500px</small>
                            </>
                          )}
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="photo-input"
                            disabled={photoUploading || saveLoading}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <>
                        <Loader size={16} className="spinner" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {isEditingProfile ? 'Обновить анкету' : 'Добавить анкету'}
                      </>
                    )}
                  </button>
                  {isEditingProfile && (
                    <button 
                      type="button" 
                      onClick={resetProfileForm} 
                      className="btn-secondary"
                      disabled={saveLoading}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="profiles-section">
              <div className="section-header">
                <h2>Активные анкеты ({profiles.filter(p => p.isActive).length})</h2>
                <div className="section-stats">
                  Всего: {profiles.length} | Активные: {profiles.filter(p => p.isActive).length}
                  {autoRefresh && <span className="auto-refresh-badge">Автообновление</span>}
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <Loader size={48} className="spinner" />
                  <p>Загрузка анкет...</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} />
                  <h3>Нет добавленных анкет</h3>
                  <p>Добавьте первую анкету, используя форму выше</p>
                </div>
              ) : (
                <div className="profiles-grid">
                  {profiles.map(profile => (
                    <div key={profile.id} className={`profile-card ${!profile.isActive ? 'inactive' : ''}`}>
                      <div className="profile-header">
                        <div className="profile-info-container">
                          <div className="profile-avatar">
                            {profile.photo ? (
                              <img src={profile.photo} alt={profile.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                <User size={24} />
                              </div>
                            )}
                          </div>
                          <div className="profile-title">
                            <h3>{profile.name}</h3>
                            <div className="profile-contacts">
                              {profile.telegram && (
                                <div className="contact-item">
                                  <span className="telegram-link">@{profile.telegram.replace('@', '')}</span>
                                </div>
                              )}
                              {profile.phone && (
                                <div className="contact-item">
                                  <Phone size={12} />
                                  <span className="phone-link">{profile.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="profile-actions">
                          <button 
                            className="icon-btn edit-btn"
                            onClick={() => editProfile(profile)}
                            title="Редактировать"
                            disabled={loading}
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn"
                            onClick={() => deleteProfile(profile.id)}
                            title="Удалить"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="profile-footer">
                        <div className="status-toggle">
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={profile.isActive || false}
                              onChange={() => toggleProfileActive(profile.id)}
                              disabled={loading}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-text">
                              {profile.isActive ? 'Активна' : 'Неактивна'}
                            </span>
                          </label>
                        </div>
                        <div className="profile-date">
                          {profile.createdAt && (
                            <>Добавлено: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}</>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;