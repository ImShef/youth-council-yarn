import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Trash2, Plus, MapPin, Users, Gift, LogOut, Camera } from 'react-feather';
import { ADMIN_CREDENTIALS } from '../config/auth';
import './Admin.css';

// Константы
const STORAGE_KEYS = {
  DISCOUNTS: 'youthCouncilDiscounts',
  PROFILES: 'youthCouncilProfiles',
  AUTH: 'adminAuth'
};

const CATEGORIES = [
  { value: 'food', label: 'Еда' },
  { value: 'entertainment', label: 'Развлечения' },
  { value: 'education', label: 'Образование' },
  { value: 'sports', label: 'Спорт' },
  { value: 'shopping', label: 'Шоппинг' },
  { value: 'other', label: 'Другое' }
];

const INITIAL_DISCOUNT = {
  id: null,
  title: '',
  description: '',
  coordinates: '',
  category: 'food',
  discountValue: '',
  isActive: true
};

const INITIAL_PROFILE = {
  id: null,
  name: '',
  telegram: '',
  photo: null,
  photoPreview: null,
  isActive: true
};

// Кастомный хук для localStorage
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue];
};

// Компонент логина
const AdminLogin = ({ onLogin }) => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginData.username === ADMIN_CREDENTIALS.username && 
        loginData.password === ADMIN_CREDENTIALS.password) {
      onLogin();
    } else {
      alert('Неверный логин или пароль');
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Панель управления</h1>
          <p>Дом молодежи - Административная панель</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Введите логин"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Введите пароль"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

// Компонент формы скидки
const DiscountForm = ({ discount, isEditing, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(discount);

  useEffect(() => {
    setFormData(discount);
  }, [discount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="form-section">
      <h2>{isEditing ? 'Редактировать скидку' : 'Добавить новую скидку'}</h2>
      <form onSubmit={handleSubmit} className="discount-form">
        <div className="form-row">
          <div className="form-group">
            <label>Название предложения *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Например: Скидка в кафе 'Вкусно и точка'"
              required
            />
          </div>

          <div className="form-group">
            <label>Категория *</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Описание предложения *</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Подробное описание скидки, условий и правил использования..."
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>Размер скидки *</label>
          <input
            type="text"
            value={formData.discountValue}
            onChange={(e) => handleChange('discountValue', e.target.value)}
            placeholder="10%, 15% или специальное предложение"
            required
          />
        </div>

        <div className="form-group">
          <label>Координаты на карте (широта, долгота)</label>
          <input
            type="text"
            value={formData.coordinates}
            onChange={(e) => handleChange('coordinates', e.target.value)}
            placeholder="60.711503, 28.748026"
          />
          <small>Необязательное поле. Формат: широта, долгота через запятую</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <Save size={16} />
            {isEditing ? 'Обновить скидку' : 'Добавить скидку'}
          </button>
          {isEditing && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Компонент формы профиля
const ProfileForm = ({ profile, isEditing, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleChange('photo', e.target.result);
        handleChange('photoPreview', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    handleChange('photo', null);
    handleChange('photoPreview', null);
  };

  return (
    <div className="form-section">
      <h2>{isEditing ? 'Редактировать анкету' : 'Добавить новую анкету'}</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>ФИО участника *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Иванов Иван Иванович"
            required
          />
        </div>

        <div className="form-group">
          <label>Telegram username *</label>
          <input
            type="text"
            value={formData.telegram}
            onChange={(e) => handleChange('telegram', e.target.value)}
            placeholder="@username"
            required
          />
          <small>В формате @username</small>
        </div>

        <div className="form-group">
          <label>Фото профиля</label>
          <div className="photo-upload-section">
            {formData.photoPreview ? (
              <div className="photo-preview">
                <img src={formData.photoPreview} alt="Preview" />
                <button type="button" onClick={removePhoto} className="remove-photo-btn">
                  Удалить фото
                </button>
              </div>
            ) : (
              <div className="photo-upload-placeholder">
                <label htmlFor="photo-upload" className="photo-upload-label">
                  <Camera size={32} />
                  <span>Загрузить фото</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="photo-input"
                  />
                </label>
              </div>
            )}
          </div>
          <small>Рекомендуемый размер: 400x400px</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <Save size={16} />
            {isEditing ? 'Обновить анкету' : 'Добавить анкету'}
          </button>
          {isEditing && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Компонент карточки скидки
const DiscountCard = React.memo(({ discount, onEdit, onDelete, onToggle }) => {
  const categoryLabel = CATEGORIES.find(c => c.value === discount.category)?.label;

  return (
    <div className={`discount-card ${!discount.isActive ? 'inactive' : ''}`}>
      <div className="discount-header">
        <div className="discount-title">
          <h3>{discount.title}</h3>
          <span className={`category-badge ${discount.category}`}>
            {categoryLabel}
          </span>
        </div>
        <div className="discount-actions">
          <button 
            className="icon-btn edit-btn"
            onClick={() => onEdit(discount)}
            title="Редактировать"
          >
            <Save size={16} />
          </button>
          <button 
            className="icon-btn delete-btn"
            onClick={() => onDelete(discount.id)}
            title="Удалить"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="discount-body">
        <p className="discount-description">{discount.description}</p>
        
        <div className="discount-details">
          <div className="detail-item">
            <strong>Скидка:</strong>
            <span className="discount-value">{discount.discountValue}</span>
          </div>
          
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
              checked={discount.isActive}
              onChange={() => onToggle(discount.id)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {discount.isActive ? 'Активна' : 'Неактивна'}
            </span>
          </label>
        </div>
        <div className="discount-date">
          Добавлено: {new Date(discount.createdAt).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
});

// Компонент карточки профиля
const ProfileCard = React.memo(({ profile, onEdit, onDelete, onToggle }) => {
  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div key={profile.id} className={`profile-card ${!profile.isActive ? 'inactive' : ''}`}>
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">
                {initials}
              </div>
            )}
          </div>
          <div className="profile-title">
            <h3>{profile.name}</h3>
            <span className="position-badge">
              Участник совета молодежи
            </span>
            {profile.telegram && (
              <div className="telegram-link">
                @{profile.telegram.replace('@', '')}
              </div>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <button 
            className="icon-btn edit-btn"
            onClick={() => onEdit(profile)}
            title="Редактировать"
          >
            <Save size={16} />
          </button>
          <button 
            className="icon-btn delete-btn"
            onClick={() => onDelete(profile.id)}
            title="Удалить"
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
              checked={profile.isActive}
              onChange={() => onToggle(profile.id)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {profile.isActive ? 'Активна' : 'Неактивна'}
            </span>
          </label>
        </div>
        <div className="profile-date">
          Добавлено: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
        </div>
      </div>
    </div>
  );
});

// Основной компонент админки
const Admin = () => {
  const [currentSection, setCurrentSection] = useState('discounts');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discounts, setDiscounts] = useLocalStorage(STORAGE_KEYS.DISCOUNTS, []);
  const [profiles, setProfiles] = useLocalStorage(STORAGE_KEYS.PROFILES, []);
  const [currentDiscount, setCurrentDiscount] = useState(INITIAL_DISCOUNT);
  const [currentProfile, setCurrentProfile] = useState(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Проверка аутентификации
  useEffect(() => {
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
    setIsAuthenticated(auth === 'true');
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }, []);

  // Функции для скидок
  const handleDiscountSubmit = useCallback((discountData) => {
    if (isEditing) {
      setDiscounts(prev => prev.map(d => 
        d.id === discountData.id ? discountData : d
      ));
    } else {
      const newDiscount = {
        ...discountData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setDiscounts(prev => [...prev, newDiscount]);
    }
    resetDiscountForm();
  }, [isEditing, setDiscounts]);

  const resetDiscountForm = useCallback(() => {
    setCurrentDiscount(INITIAL_DISCOUNT);
    setIsEditing(false);
  }, []);

  const editDiscount = useCallback((discount) => {
    setCurrentDiscount(discount);
    setIsEditing(true);
  }, []);

  const deleteDiscount = useCallback((id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту скидку?')) {
      setDiscounts(prev => prev.filter(d => d.id !== id));
    }
  }, [setDiscounts]);

  const toggleDiscountActive = useCallback((id) => {
    setDiscounts(prev => prev.map(d => 
      d.id === id ? { ...d, isActive: !d.isActive } : d
    ));
  }, [setDiscounts]);

  // Функции для профилей
  const handleProfileSubmit = useCallback((profileData) => {
    if (isEditingProfile) {
      setProfiles(prev => prev.map(p => 
        p.id === profileData.id ? profileData : p
      ));
    } else {
      const newProfile = {
        ...profileData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        position: 'Участник совета молодежи'
      };
      setProfiles(prev => [...prev, newProfile]);
    }
    resetProfileForm();
  }, [isEditingProfile, setProfiles]);

  const resetProfileForm = useCallback(() => {
    setCurrentProfile(INITIAL_PROFILE);
    setIsEditingProfile(false);
  }, []);

  const editProfile = useCallback((profile) => {
    setCurrentProfile({
      ...profile,
      photoPreview: profile.photo
    });
    setIsEditingProfile(true);
  }, []);

  const deleteProfile = useCallback((id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту анкету?')) {
      setProfiles(prev => prev.filter(p => p.id !== id));
    }
  }, [setProfiles]);

  const toggleProfileActive = useCallback((id) => {
    setProfiles(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  }, [setProfiles]);

  // Мемоизированные значения
  const activeDiscountsCount = useMemo(() => 
    discounts.filter(d => d.isActive).length, [discounts]
  );

  const activeProfilesCount = useMemo(() => 
    profiles.filter(p => p.isActive).length, [profiles]
  );

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Панель управления</h1>
            <p>Дом молодежи - Административная панель</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-url-info">
              <strong>Текущий раздел:</strong> {currentSection === 'discounts' ? 'Скидки' : 'Анкеты'}
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`nav-btn ${currentSection === 'discounts' ? 'active' : ''}`}
            onClick={() => setCurrentSection('discounts')}
          >
            <Gift size={18} />
            Управление скидками
          </button>
          <button 
            className={`nav-btn ${currentSection === 'profiles' ? 'active' : ''}`}
            onClick={() => setCurrentSection('profiles')}
          >
            <Users size={18} />
            Управление анкетами
          </button>
        </nav>
      </header>

      <div className="admin-container">
        {currentSection === 'discounts' && (
          <>
            <DiscountForm
              discount={currentDiscount}
              isEditing={isEditing}
              onSubmit={handleDiscountSubmit}
              onCancel={resetDiscountForm}
            />

            <div className="discounts-section">
              <div className="section-header">
                <h2>Активные скидки ({activeDiscountsCount})</h2>
                <div className="stats">
                  Всего: {discounts.length} | Активные: {activeDiscountsCount}
                </div>
              </div>

              {discounts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Plus size={48} />
                  </div>
                  <h3>Нет добавленных скидок</h3>
                  <p>Добавьте первую скидку, используя форму выше</p>
                </div>
              ) : (
                <div className="discounts-grid">
                  {discounts.map(discount => (
                    <DiscountCard
                      key={discount.id}
                      discount={discount}
                      onEdit={editDiscount}
                      onDelete={deleteDiscount}
                      onToggle={toggleDiscountActive}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentSection === 'profiles' && (
          <>
            <ProfileForm
              profile={currentProfile}
              isEditing={isEditingProfile}
              onSubmit={handleProfileSubmit}
              onCancel={resetProfileForm}
            />

            <div className="profiles-section">
              <div className="section-header">
                <h2>Активные анкеты ({activeProfilesCount})</h2>
                <div className="stats">
                  Всего: {profiles.length} | Активные: {activeProfilesCount}
                </div>
              </div>

              {profiles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Users size={48} />
                  </div>
                  <h3>Нет добавленных анкет</h3>
                  <p>Добавьте первую анкету, используя форму выше</p>
                </div>
              ) : (
                <div className="profiles-grid">
                  {profiles.map(profile => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onEdit={editProfile}
                      onDelete={deleteProfile}
                      onToggle={toggleProfileActive}
                    />
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