import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, User, MapPin, Grid, Moon, Sun, Loader, Frown, Users, ArrowLeft
} from 'react-feather';
import { QRCodeSVG } from 'qrcode.react';
import Admin from './components/Admin/Admin';
import './App.css';

// Функция для загрузки данных скидок из localStorage
const loadDiscounts = () => {
  try {
    const savedDiscounts = localStorage.getItem('youthCouncilDiscounts');
    return savedDiscounts ? JSON.parse(savedDiscounts) : [];
  } catch (error) {
    console.error('Ошибка загрузки скидок:', error);
    return [];
  }
};

// Функция для загрузки анкет из localStorage
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
  // ✅ ВСЕ ХУКИ ВЫЗЫВАЮТСЯ ПЕРВЫМИ В ОДИНАКОВОМ ПОРЯДКЕ
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
    firstName: "Вася",
    lastName: "Пупкин",
    username: "@vasya_the_best",
    status: "Участник совета молодежи",
    photoUrl: null
  });

  const [feedItems, setFeedItems] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const mapInstanceRef = useRef(null);
  const placemarksRef = useRef({});

  // ✅ ВСЕ useCallback ВЫЗЫВАЮТСЯ СРАЗУ ПОСЛЕ ДРУГИХ ХУКОВ
  const getContrastColor = useCallback((hexcolor) => {
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  }, []);

  const applyTelegramButtonColor = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const systemTheme = tg.colorScheme === 'dark' ? 'theme-dark' : 'theme-light';
    document.body.className = systemTheme;
    
    if (tg.themeParams?.button_color) {
      const buttonColor = tg.themeParams.button_color;
      document.documentElement.style.setProperty('--tg-button-color', buttonColor);
      
      const buttonTextColor = getContrastColor(buttonColor);
      document.documentElement.style.setProperty('--tg-button-text-color', buttonTextColor);
    }
    
    console.log('Telegram button color applied');
  }, [getContrastColor]);

  const initTelegram = useCallback(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      console.log('Telegram Web App detected');
      
      setState(prev => ({
        ...prev,
        tg: tg,
        isTelegram: true
      }));

      tg.expand();
      tg.enableClosingConfirmation();

      if (tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        
        const photoUrl = tgUser.photo_url || null;
        
        setUserData(prev => ({
          ...prev,
          firstName: tgUser.first_name || "Пользователь",
          lastName: tgUser.last_name || "",
          username: tgUser.username ? `@${tgUser.username}` : "@username",
          photoUrl: photoUrl
        }));
      }

      applyTelegramButtonColor();
      
    } else {
      console.log('Running in browser, using light theme');
      setState(prev => ({ ...prev, isTelegram: false }));
      document.body.className = 'theme-light';
    }
  }, [applyTelegramButtonColor]);

  const hideSplashScreen = useCallback(() => {
    setState(prev => ({ ...prev, splashVisible: false }));
  }, []);

  const initApp = useCallback(() => {
    initTelegram();
    setTimeout(() => {
      hideSplashScreen();
    }, 2000);
  }, [initTelegram, hideSplashScreen]);

  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState(prev => ({ ...prev, theme: newTheme }));
    document.body.className = `theme-${newTheme}`;
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

  // ✅ Функция для получения ссылки на анкету участника
  const getMemberProfileUrl = useCallback((memberId) => {
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}?profile=${memberId}`;
  }, []);

  // ✅ Функция для генерации QR-кода участника
  const MemberQRCode = useCallback(({ memberId, size = 200 }) => {
    const qrValue = getMemberProfileUrl(memberId);
    
    return (
      <div className="qr-code-container">
        <QRCodeSVG 
          value={qrValue}
          size={size}
          level="M"
          includeMargin={true}
          bgColor="var(--card-bg)"
          fgColor="var(--text-color)"
        />
        <div className="qr-link-info">
          <small>Ссылка: {qrValue}</small>
        </div>
      </div>
    );
  }, [getMemberProfileUrl]);

  // ✅ Обработка URL параметров при загрузке
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('profile');
    
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

  const getUserInitials = useCallback(() => {
    const { firstName, lastName } = userData;
    if (!firstName) return 'ИИ';
    const firstInitial = firstName.charAt(0).toUpperCase();
    return lastName ? firstInitial + lastName.charAt(0).toUpperCase() : firstInitial;
  }, [userData]);

  const showMapError = useCallback(() => {
    const mapElement = document.getElementById('yandex-map');
    if (mapElement && !mapElement.querySelector('.map-placeholder')) {
      mapElement.innerHTML = `
        <div class="map-placeholder">
          <p>Не удалось загрузить карту</p>
          <p>Проверьте подключение к интернету</p>
        </div>
      `;
    }
  }, []);

  const addMapLocations = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const discounts = loadDiscounts().filter(d => d.isActive && d.coordinates);
    
    const locations = discounts.map(discount => {
      const [lat, lng] = discount.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      return {
        id: discount.id,
        coords: [lat, lng],
        name: discount.title,
        description: `${discount.description}\n\nСкидка: ${discount.discountValue}`
      };
    });

    locations.forEach(location => {
      const placemark = new window.ymaps.Placemark(location.coords, {
        balloonContent: `
          <div style="padding: 10px; color: #000000 !important;">
            <h3 style="margin: 0 0 5px; color: #000000 !important; font-weight: bold;">${location.name}</h3>
            <p style="margin: 0; color: #000000 !important; white-space: pre-line;">${location.description}</p>
          </div>
        `
      }, {
        preset: 'islands#violetIcon'
      });

      mapInstanceRef.current.geoObjects.add(placemark);
      placemarksRef.current[location.id] = placemark;
    });

    if (locations.length === 0 && mapInstanceRef.current) {
      const mapElement = document.getElementById('yandex-map');
      if (mapElement && !mapElement.querySelector('.empty-map-message')) {
        mapElement.innerHTML = `
          <div class="empty-map-message">
            <Frown size={48} />
            <p>Пока нет партнерских заведений</p>
            <p>Скидки появятся здесь после добавления в админке</p>
          </div>
        `;
      }
    }
  }, []);

  const initMap = useCallback(() => {
    if (state.mapInitialized || typeof window.ymaps === 'undefined') {
      return;
    }

    window.ymaps.ready(() => {
      try {
        if (mapInstanceRef.current) return;

        mapInstanceRef.current = new window.ymaps.Map("yandex-map", {
          center: [60.710474, 28.749282],
          zoom: 14,
          controls: ['typeSelector', 'fullscreenControl']
        });
        
        addMapLocations();
        setState(prev => ({ ...prev, mapInitialized: true }));
      } catch (error) {
        console.error('Ошибка при инициализации карты:', error);
        showMapError();
      }
    });
  }, [state.mapInitialized, addMapLocations, showMapError]);

  const scrollToMap = useCallback(() => {
    const mapFeedItem = document.getElementById('map-feed-item');
    mapFeedItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const showOnMap = useCallback((locationId) => {
    if (!mapInstanceRef.current || !placemarksRef.current[locationId]) return;
    const placemark = placemarksRef.current[locationId];
    mapInstanceRef.current.setCenter(placemark.geometry.getCoordinates(), 16);
    placemark.balloon.open();
    if (state.currentTab !== 'feed') {
      switchTab('feed');
      setTimeout(scrollToMap, 300);
    } else {
      scrollToMap();
    }
  }, [state.currentTab, switchTab, scrollToMap]);

  // ✅ ВСЕ useEffect ВЫЗЫВАЮТСЯ СРАЗУ ПОСЛЕ useCallback
  useEffect(() => {
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

    const activeProfiles = loadProfiles().filter(profile => profile.isActive);
    setProfiles(activeProfiles);

    initApp();
  }, [initApp]);

  useEffect(() => {
    if (state.currentTab === 'feed' && !state.mapInitialized) {
      setTimeout(initMap, 500);
    }
  }, [state.currentTab, state.mapInitialized, initMap]);

  // ✅ Проверка на админку ПОСЛЕ ВСЕХ хуков
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === 'true';

  if (isAdmin) {
    return <Admin />;
  }

  // ✅ ОСТАЛЬНАЯ ЛОГИКА КОМПОНЕНТА
  const userInitials = getUserInitials();
  const userName = `${userData.firstName} ${userData.lastName}`;

  return (
    <div className="app">
      {/* Splash Screen */}
      {state.splashVisible && (
        <div className="splash-screen">
          <div className="splash-logo">
            <Home size={80} />
          </div>
          <div className="splash-text">Добро пожаловать</div>
          <div className="splash-username">{userData.username}</div>
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
        {/* Вкладка Лента */}
        <div className={`tab-content ${state.currentTab === 'feed' ? 'active' : ''}`}>
          <div className="feed">
            <div className="feed-item map-feed-item" id="map-feed-item">
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
                  <h3 className="feed-title">😔 Пока нет скидок</h3>
                  <p className="feed-description">
                    Скидки появятся здесь после добавления в админ-панели.<br />
                    Зайдите в админку по адресу: <strong>?admin=true</strong>
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
                    <button className="map-button" onClick={() => showOnMap(item.location)}>
                      <MapPin size={16} />
                      На карте
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Вкладка Участники - СПИСОК */}
        <div className={`tab-content ${state.currentTab === 'profiles' ? 'active' : ''}`}>
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
                <p>Анкеты появятся здесь после добавления в админ-панели</p>
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
        </div>

        {/* ✅ Вкладка Детальная анкета участника */}
        <div className={`tab-content ${state.currentTab === 'member' ? 'active' : ''}`}>
          {state.selectedMember && (
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
          )}
        </div>

        {/* Вкладка Профиль */}
        <div className={`tab-content ${state.currentTab === 'profile' ? 'active' : ''}`}>
          <div className="profile-card">
            <div className="profile-avatar">
              {userData.photoUrl ? (
                <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
              ) : (
                userInitials
              )}
            </div>
            <div className="profile-name">{userName}</div>
            <div className="profile-status">{userData.status}</div>
            
            <div className="profile-qr-section">
              <h3 className="qr-title">Ваш QR-код</h3>
              <div className="qr-code-placeholder">
                <div className="qr-pattern"></div>
              </div>
              <p className="qr-description">
                Покажите этот QR-код для показа вашей анкеты
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ Футер не показываем на детальной странице участника */}
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