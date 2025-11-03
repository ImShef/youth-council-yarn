import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, User, MapPin, Grid, Moon, Sun, Loader, Frown, Users, ArrowLeft
} from 'react-feather';
import { QRCodeSVG } from 'qrcode.react';
import Admin from './components/Admin/Admin';
import './App.css';

// Функции для работы с localStorage
const loadDiscounts = () => {
  try {
    const savedDiscounts = localStorage.getItem('youthCouncilDiscounts');
    return savedDiscounts ? JSON.parse(savedDiscounts) : [];
  } catch (error) {
    console.error('Ошибка загрузки скидок:', error);
    return [];
  }
};

const loadProfiles = () => {
  try {
    const savedProfiles = localStorage.getItem('youthCouncilProfiles');
    return savedProfiles ? JSON.parse(savedProfiles) : [];
  } catch (error) {
    console.error('Ошибка загрузки анкет:', error);
    return [];
  }
};

const App = () => {
  const [state, setState] = useState({
    currentTab: 'feed',
    splashVisible: true,
    isTelegram: false,
    tg: null,
    mapInitialized: false,
    theme: 'light',
    selectedMember: null
  });

  const [userData, setUserData] = useState({
    firstName: "Гость",
    lastName: "",
    username: "",
    status: "Пользователь",
    photoUrl: null,
    isMember: false,
    memberProfileId: null
  });

  const [feedItems, setFeedItems] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const mapInstanceRef = useRef(null);
  const placemarksRef = useRef({});

  // Инициализация темы
  useEffect(() => {
    document.body.className = `theme-${state.theme}`;
  }, [state.theme]);

  // Получение базового URL
  const getBaseUrl = useCallback(() => {
    return window.location.origin + window.location.pathname;
  }, []);

  // Получение ссылки на анкету участника
  const getMemberProfileUrl = useCallback((memberId) => {
    const baseUrl = getBaseUrl();
    return `${baseUrl}?profile=${memberId}`;
  }, [getBaseUrl]);

  // Получение ссылки на профиль пользователя
  const getUserProfileUrl = useCallback(() => {
    if (userData.isMember && userData.memberProfileId) {
      return getMemberProfileUrl(userData.memberProfileId);
    }
    return getBaseUrl();
  }, [userData.isMember, userData.memberProfileId, getMemberProfileUrl, getBaseUrl]);

  // Компонент QR-кода для участника
  const MemberQRCode = useCallback(({ memberId, size = 200 }) => {
    const qrValue = getMemberProfileUrl(memberId);
    
    return (
      <div className="qr-code-container">
        <QRCodeSVG 
          value={qrValue}
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <div className="qr-link-info">
          <small>Ссылка на анкету: {qrValue}</small>
        </div>
      </div>
    );
  }, [getMemberProfileUrl]);

  // Компонент QR-кода для пользователя
  const UserQRCode = useCallback(({ size = 200 }) => {
    const qrValue = getUserProfileUrl();
    
    return (
      <div className="qr-code-container">
        <QRCodeSVG 
          value={qrValue}
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <div className="qr-link-info">
          <small>Ссылка: {qrValue}</small>
        </div>
      </div>
    );
  }, [getUserProfileUrl]);

  // Проверка, является ли пользователь участником
  const checkUserMembership = useCallback((profilesArray, tgUser) => {
    if (!tgUser || !tgUser.username) return null;

    const userProfile = profilesArray.find(profile => {
      const profileTelegram = profile.telegram?.replace('@', '').toLowerCase();
      const userTelegram = tgUser.username.toLowerCase();
      return profileTelegram === userTelegram;
    });

    return userProfile || null;
  }, []);

  // Обработка URL параметров
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('profile');
    const isAdmin = urlParams.get('admin') === 'true';
    
    if (isAdmin) return;
    
    if (profileId && profiles.length > 0) {
      const member = profiles.find(p => p.id === profileId);
      if (member) {
        setState(prev => ({ 
          ...prev, 
          selectedMember: member,
          currentTab: 'member'
        }));
      }
    }
  }, [profiles]);

  // Загрузка данных из localStorage
  useEffect(() => {
    // Загрузка скидок
    const discounts = loadDiscounts().filter(d => d.isActive);
    const items = discounts.map(discount => ({
      location: discount.id,
      title: discount.title,
      description: discount.description,
      discountValue: discount.discountValue,
      category: discount.category,
      coordinates: discount.coordinates
    }));
    setFeedItems(items);

    // Загрузка профилей
    const profilesData = loadProfiles().filter(profile => profile.isActive);
    setProfiles(profilesData);

    // Инициализация Telegram
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const tgUser = tg.initDataUnsafe?.user;
      
      if (tgUser) {
        const userProfile = checkUserMembership(profilesData, tgUser);
        
        if (userProfile) {
          setUserData(prev => ({
            ...prev,
            firstName: tgUser.first_name || userProfile.name.split(' ')[0] || "Пользователь",
            lastName: tgUser.last_name || userProfile.name.split(' ').slice(1).join(' ') || "",
            username: tgUser.username ? `@${tgUser.username}` : "",
            status: "Участник совета молодежи",
            photoUrl: tgUser.photo_url || userProfile.photo || null,
            isMember: true,
            memberProfileId: userProfile.id
          }));
        } else {
          setUserData(prev => ({
            ...prev,
            firstName: tgUser.first_name || "Пользователь",
            lastName: tgUser.last_name || "",
            username: tgUser.username ? `@${tgUser.username}` : "",
            status: "Пользователь",
            photoUrl: tgUser.photo_url || null,
            isMember: false,
            memberProfileId: null
          }));
        }
      }
      
      setState(prev => ({
        ...prev,
        tg: tg,
        isTelegram: true
      }));
      
      tg.expand();
      tg.enableClosingConfirmation();
    }

    // Скрытие splash screen
    const splashTimer = setTimeout(() => {
      setState(prev => ({ ...prev, splashVisible: false }));
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, [checkUserMembership]);

  // Инициализация карты
  const initializeMap = useCallback(() => {
    if (!window.ymaps) return;

    window.ymaps.ready(() => {
      try {
        if (mapInstanceRef.current) return;

        mapInstanceRef.current = new window.ymaps.Map("yandex-map", {
          center: [60.710474, 28.749282],
          zoom: 14,
          controls: ['typeSelector', 'fullscreenControl']
        });
        
        // Добавление локаций из feedItems
        feedItems.forEach(item => {
          if (item.coordinates) {
            const [lat, lng] = item.coordinates.split(',').map(coord => parseFloat(coord.trim()));
            const placemark = new window.ymaps.Placemark([lat, lng], {
              balloonContent: `
                <div style="padding: 10px; color: #000000 !important;">
                  <h3 style="margin: 0 0 5px; color: #000000 !important; font-weight: bold;">${item.title}</h3>
                  <p style="margin: 0; color: #000000 !important; white-space: pre-line;">${item.description}</p>
                  <p style="margin: 5px 0 0; color: #000000 !important; font-weight: bold;">Скидка: ${item.discountValue}</p>
                </div>
              `
            }, {
              preset: 'islands#violetIcon'
            });

            mapInstanceRef.current.geoObjects.add(placemark);
            placemarksRef.current[item.location] = placemark;
          }
        });

        if (feedItems.length === 0 || !feedItems.some(item => item.coordinates)) {
          const mapElement = document.getElementById('yandex-map');
          if (mapElement) {
            mapElement.innerHTML = `
              <div class="empty-map-message">
                <p>Пока нет партнерских заведений</p>
                <p>Скидки появятся здесь после добавления в админке</p>
              </div>
            `;
          }
        }

        setState(prev => ({ ...prev, mapInitialized: true }));
      } catch (error) {
        console.error('Ошибка при инициализации карты:', error);
      }
    });
  }, [feedItems]);

  useEffect(() => {
    if (state.currentTab === 'feed' && !state.mapInitialized && feedItems.length > 0) {
      const mapTimer = setTimeout(initializeMap, 500);
      return () => clearTimeout(mapTimer);
    }
  }, [state.currentTab, state.mapInitialized, feedItems, initializeMap]);

  // Проверка на админку
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === 'true';

  if (isAdmin) {
    return <Admin />;
  }

  // Основные функции
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState(prev => ({ ...prev, theme: newTheme }));
  }, [state.theme]);

  const switchTab = useCallback((tabId) => {
    setState(prev => ({ 
      ...prev, 
      currentTab: tabId,
      selectedMember: null
    }));
  }, []);

  const selectMember = useCallback((member) => {
    setState(prev => ({ 
      ...prev, 
      selectedMember: member,
      currentTab: 'member'
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      selectedMember: null,
      currentTab: 'profiles'
    }));
  }, []);

  // Утилиты для пользователя
  const getUserInitials = useCallback(() => {
    const { firstName, lastName } = userData;
    if (!firstName) return 'ИИ';
    const firstInitial = firstName.charAt(0).toUpperCase();
    return lastName ? firstInitial + lastName.charAt(0).toUpperCase() : firstInitial;
  }, [userData]);

  const getDisplayName = useCallback(() => {
    const { firstName, lastName, username } = userData;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (username) return username;
    return "Пользователь";
  }, [userData]);

  const userInitials = getUserInitials();
  const displayName = getDisplayName();

  // Рендер контента для вкладок
  const renderFeedContent = () => (
    <div className="feed">
      <div className="feed-item map-feed-item">
        <div className="map-container">
          <div id="yandex-map"></div>
        </div>
        <div className="feed-content">
          <h3 className="feed-title">Партнерские заведения</h3>
          <p className="feed-description">Найдите ближайшие места с выгодными предложениями</p>
        </div>
      </div>

      {feedItems.length === 0 ? (
        <div className="feed-item empty-state">
          <div className="feed-content">
            <div className="empty-state-icon">
              <Frown size={48} />
            </div>
            <h3 className="feed-title">Пока нет скидок</h3>
            <p className="feed-description">
              Скидки скоро появятся.<br />
            </p>
          </div>
        </div>
      ) : (
        feedItems.map((item, index) => (
          <div key={index} className="feed-item">
            <div className="feed-content">
              <h3 className="feed-title">{item.title}</h3>
              <p className="feed-description">{item.description}</p>
              {item.discountValue && (
                <div className="discount-badge">
                  Скидка: {item.discountValue}
                </div>
              )}
              <button className="map-button">
                <MapPin size={16} />
                На карте
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProfilesContent = () => (
    <div className="profiles-page">
      <div className="page-header">
        <h2 className="page-title">Участники совета молодежи</h2>
        <p className="page-description">Знакомьтесь с активными участниками нашей команды</p>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-profiles-state">
          <div className="empty-state-icon">
            <Frown size={64} />
          </div>
          <h3>Пока нет участников</h3>
          <p>Анкеты скоро появятся.</p>
        </div>
      ) : (
        <div className="members-list">
          {profiles.map(profile => (
            <div 
              key={profile.id} 
              className="member-list-item"
              onClick={() => selectMember(profile)}
            >
              <div className="member-avatar-small">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="member-info">
                <h3 className="member-name">{profile.name}</h3>
                <p className="member-position">Участник совета молодежи</p>
              </div>
              <div className="member-arrow">
                <span>➔</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMemberDetail = () => (
    state.selectedMember && (
      <div className="member-detail-page">
        <div className="member-detail-card">
          <div className="member-detail-avatar">
            {state.selectedMember.photo ? (
              <img src={state.selectedMember.photo} alt={state.selectedMember.name} className="avatar-image" />
            ) : (
              <div className="avatar-placeholder-large">
                {state.selectedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="member-detail-info">
            <h1 className="member-detail-name">{state.selectedMember.name}</h1>
            <div className="member-detail-position">
              Участник совета молодежи
            </div>
            
            {state.selectedMember.telegram && (
              <div className="member-detail-telegram">
                <div className="telegram-label">Telegram:</div>
                <div className="telegram-value">
                  {state.selectedMember.telegram.startsWith('@') 
                    ? state.selectedMember.telegram 
                    : `@${state.selectedMember.telegram}`
                  }
                </div>
              </div>
            )}

            <div className="member-detail-qr">
              <h3 className="qr-title">QR-код анкеты</h3>
              <MemberQRCode memberId={state.selectedMember.id} size={240} />
              <p className="qr-description">
                Отсканируйте QR-код для просмотра этой анкеты
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderProfileContent = () => (
    <div className="profile-card">
      <div className="profile-avatar">
        {userData.photoUrl ? (
          <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
        ) : (
          userInitials
        )}
      </div>
      <div className="profile-name">{displayName}</div>
      {userData.username && <div className="profile-username">{userData.username}</div>}
      <div className={`profile-status ${userData.isMember ? 'member' : 'user'}`}>
        {userData.status}
      </div>
      
      <div className="profile-qr-section">
        <h3 className="qr-title">
          {userData.isMember ? 'QR-код вашей анкеты' : 'QR-код приложения'}
        </h3>
        
        {userData.isMember ? (
          <MemberQRCode memberId={userData.memberProfileId} size={240} />
        ) : (
          <UserQRCode size={240} />
        )}
        
        <p className="qr-description">
          {userData.isMember 
            ? "Отсканируйте QR-код для просмотра вашей анкеты"
            : "Отсканируйте QR-код для перехода в приложение"
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="app">
      {/* Splash Screen */}
      {state.splashVisible && (
        <div className="splash-screen">
          <div className="splash-logo">
            <Home size={80} />
          </div>
          <div className="splash-text">Добро пожаловать</div>
          <div className="splash-username">{displayName}</div>
          <div className="loading-spinner">
            <Loader size={40} />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          {state.currentTab === 'member' ? (
            <>
              <button className="back-button" onClick={goBack}>
                <ArrowLeft size={24} />
              </button>
              <div className="header-title">
                <span>Анкета участника</span>
              </div>
              <div className="header-actions">
                <button className="theme-toggle" onClick={toggleTheme}>
                  {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="logo">
                <Home size={24} />
                <span>Дом молодежи</span>
              </div>
              <div className="header-actions">
                <button className="theme-toggle" onClick={toggleTheme}>
                  {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <div className="user-avatar">
                  {userData.photoUrl ? (
                    <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
                  ) : (
                    userInitials
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        <div className={`tab-content ${state.currentTab === 'feed' ? 'active' : ''}`}>
          {renderFeedContent()}
        </div>

        <div className={`tab-content ${state.currentTab === 'profiles' ? 'active' : ''}`}>
          {renderProfilesContent()}
        </div>

        <div className={`tab-content ${state.currentTab === 'member' ? 'active' : ''}`}>
          {renderMemberDetail()}
        </div>

        <div className={`tab-content ${state.currentTab === 'profile' ? 'active' : ''}`}>
          {renderProfileContent()}
        </div>
      </main>

      {/* Footer */}
      {state.currentTab !== 'member' && (
        <footer className="footer">
          <div className={`footer-item ${state.currentTab === 'feed' ? 'active' : ''}`} onClick={() => switchTab('feed')}>
            <Grid size={20} />
            <span className="footer-text">Лента</span>
          </div>
          <div className={`footer-item ${state.currentTab === 'profiles' ? 'active' : ''}`} onClick={() => switchTab('profiles')}>
            <Users size={20} />
            <span className="footer-text">Участники</span>
          </div>
          <div className={`footer-item ${state.currentTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
            <User size={20} />
            <span className="footer-text">Профиль</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;