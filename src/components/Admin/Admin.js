import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, MapPin, Users, Gift, LogOut, Camera } from 'react-feather';
import './Admin.css';

const Admin = () => {
  const [currentSection, setCurrentSection] = useState('discounts');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [discounts, setDiscounts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currentDiscount, setCurrentDiscount] = useState({
    id: null,
    title: '',
    description: '',
    coordinates: '',
    category: 'food',
    discountValue: '',
    isActive: true
  });
  const [currentProfile, setCurrentProfile] = useState({
    id: null,
    name: '',
    telegram: '',
    photo: null,
    photoPreview: null,
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Загрузка данных
  useEffect(() => {
    if (!isAuthenticated) return;

    const savedDiscounts = localStorage.getItem('youthCouncilDiscounts');
    if (savedDiscounts) {
      setDiscounts(JSON.parse(savedDiscounts));
    }

    const savedProfiles = localStorage.getItem('youthCouncilProfiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, [isAuthenticated]);

  // Сохранение данных
  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('youthCouncilDiscounts', JSON.stringify(discounts));
  }, [discounts, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('youthCouncilProfiles', JSON.stringify(profiles));
  }, [profiles, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      alert('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  // Функции для управления скидками
  const handleDiscountSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      setDiscounts(discounts.map(d => 
        d.id === currentDiscount.id ? currentDiscount : d
      ));
    } else {
      const newDiscount = {
        ...currentDiscount,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setDiscounts([...discounts, newDiscount]);
    }
    
    resetDiscountForm();
  };

  const resetDiscountForm = () => {
    setCurrentDiscount({
      id: null,
      title: '',
      description: '',
      coordinates: '',
      category: 'food',
      discountValue: '',
      isActive: true
    });
    setIsEditing(false);
  };

  const editDiscount = (discount) => {
    setCurrentDiscount(discount);
    setIsEditing(true);
  };

  const deleteDiscount = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту скидку?')) {
      setDiscounts(discounts.filter(d => d.id !== id));
    }
  };

  const toggleDiscountActive = (id) => {
    setDiscounts(discounts.map(d => 
      d.id === id ? { ...d, isActive: !d.isActive } : d
    ));
  };

  // Функции для управления анкетами
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    if (isEditingProfile) {
      setProfiles(profiles.map(p => 
        p.id === currentProfile.id ? currentProfile : p
      ));
    } else {
      const newProfile = {
        ...currentProfile,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        position: 'Участник совета молодежи' // Фиксированная должность
      };
      setProfiles([...profiles, newProfile]);
    }
    
    resetProfileForm();
  };

  const resetProfileForm = () => {
    setCurrentProfile({
      id: null,
      name: '',
      telegram: '',
      photo: null,
      photoPreview: null,
      isActive: true
    });
    setIsEditingProfile(false);
  };

  const editProfile = (profile) => {
    setCurrentProfile({
      ...profile,
      photoPreview: profile.photo
    });
    setIsEditingProfile(true);
  };

  const deleteProfile = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту анкету?')) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const toggleProfileActive = (id) => {
    setProfiles(profiles.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentProfile({
          ...currentProfile,
          photo: e.target.result,
          photoPreview: e.target.result
        });
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
  };

  const categories = [
    { value: 'food', label: 'Еда' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'education', label: 'Образование' },
    { value: 'sports', label: 'Спорт' },
    { value: 'shopping', label: 'Шоппинг' },
    { value: 'other', label: 'Другое' }
  ];

  // Если не аутентифицирован, показываем форму входа
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>Панель управления</h1>
            <p>Дом молодежи - Административная панель</p>
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
              />
            </div>
            
            <button type="submit" className="btn-primary">
              Войти
            </button>
            
            <div className="login-hint">
              <strong>Тестовые данные:</strong><br />
              Логин: admin<br />
              Пароль: admin123
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Основной интерфейс админки
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
        {/* Раздел управления скидками */}
        {currentSection === 'discounts' && (
          <>
            <div className="form-section">
              <h2>{isEditing ? 'Редактировать скидку' : 'Добавить новую скидку'}</h2>
              <form onSubmit={handleDiscountSubmit} className="discount-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Название предложения *</label>
                    <input
                      type="text"
                      value={currentDiscount.title}
                      onChange={(e) => setCurrentDiscount({ ...currentDiscount, title: e.target.value })}
                      placeholder="Например: Скидка в кафе 'Вкусно и точка'"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Категория *</label>
                    <select
                      value={currentDiscount.category}
                      onChange={(e) => setCurrentDiscount({ ...currentDiscount, category: e.target.value })}
                      required
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
                    placeholder="Подробное описание скидки, условий и правил использования..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Размер скидки *</label>
                  <input
                    type="text"
                    value={currentDiscount.discountValue}
                    onChange={(e) => setCurrentDiscount({ ...currentDiscount, discountValue: e.target.value })}
                    placeholder="10%, 15% или специальное предложение"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Координаты на карте (широта, долгота)</label>
                  <input
                    type="text"
                    value={currentDiscount.coordinates}
                    onChange={(e) => setCurrentDiscount({ ...currentDiscount, coordinates: e.target.value })}
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
                    <button type="button" onClick={resetDiscountForm} className="btn-secondary">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="discounts-section">
              <div className="section-header">
                <h2>Активные скидки ({discounts.filter(d => d.isActive).length})</h2>
                <div className="stats">
                  Всего: {discounts.length} | Активные: {discounts.filter(d => d.isActive).length}
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
                    <div key={discount.id} className={`discount-card ${!discount.isActive ? 'inactive' : ''}`}>
                      <div className="discount-header">
                        <div className="discount-title">
                          <h3>{discount.title}</h3>
                          <span className={`category-badge ${discount.category}`}>
                            {categories.find(c => c.value === discount.category)?.label}
                          </span>
                        </div>
                        <div className="discount-actions">
                          <button 
                            className="icon-btn edit-btn"
                            onClick={() => editDiscount(discount)}
                            title="Редактировать"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn"
                            onClick={() => deleteDiscount(discount.id)}
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
                              onChange={() => toggleDiscountActive(discount.id)}
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
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Раздел управления анкетами */}
        {currentSection === 'profiles' && (
          <>
            <div className="form-section">
              <h2>{isEditingProfile ? 'Редактировать анкету' : 'Добавить новую анкету'}</h2>
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-group">
                  <label>ФИО участника *</label>
                  <input
                    type="text"
                    value={currentProfile.name}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telegram username *</label>
                  <input
                    type="text"
                    value={currentProfile.telegram}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, telegram: e.target.value })}
                    placeholder="@username"
                    required
                  />
                  <small>В формате @username</small>
                </div>

                <div className="form-group">
                  <label>Фото профиля</label>
                  <div className="photo-upload-section">
                    {currentProfile.photoPreview ? (
                      <div className="photo-preview">
                        <img src={currentProfile.photoPreview} alt="Preview" />
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
                    {isEditingProfile ? 'Обновить анкету' : 'Добавить анкету'}
                  </button>
                  {isEditingProfile && (
                    <button type="button" onClick={resetProfileForm} className="btn-secondary">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="profiles-section">
              <div className="section-header">
                <h2>Активные анкеты ({profiles.filter(p => p.isActive).length})</h2>
                <div className="stats">
                  Всего: {profiles.length} | Активные: {profiles.filter(p => p.isActive).length}
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
                    <div key={profile.id} className={`profile-card ${!profile.isActive ? 'inactive' : ''}`}>
                      <div className="profile-header">
                        <div className="profile-info">
                          <div className="profile-avatar">
                            {profile.photo ? (
                              <img src={profile.photo} alt={profile.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                            onClick={() => editProfile(profile)}
                            title="Редактировать"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn"
                            onClick={() => deleteProfile(profile.id)}
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
                              onChange={() => toggleProfileActive(profile.id)}
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