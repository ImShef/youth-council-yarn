import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, User, MapPin, Grid, Moon, Sun, Loader, Frown
} from 'react-feather';
import { QRCodeSVG } from 'qrcode.react';
import DataManager from '../utils/dataManager.js';
import '../styles/App.css';

const ClientApp = () => {
  const [state, setState] = useState({
    currentTab: 'feed',
    splashVisible: true,
    isTelegram: false,
    theme: 'light',
    mapInitialized: false,
    mapLoading: false,
    mapError: false,
    dataLoaded: false,
    loadingError: null
  });

  const [userData, setUserData] = useState({
    firstName: "Гость",
    status: "Пользователь",
    isMember: false,
    memberProfileId: null
  });

  const [feedItems, setFeedItems] = useState([]);
  const [appSettings] = useState({ appName: 'Дом молодежи' });

  const splashTimerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarksRef = useRef([]);
  const mapScriptRef = useRef(null);
  const isMapLoadingRef = useRef(false);

  // Инициализация темы
  useEffect(() => {
    const savedTheme = localStorage.getItem('youthCouncilTheme') || 'light';
    setState(prev => ({ ...prev, theme: savedTheme }));
    document.body.className = `client-app theme-${savedTheme}`;
  }, []);

  // Применяем тему при изменении
  useEffect(() => {
    document.body.className = `client-app theme-${state.theme}`;
  }, [state.theme]);

  // Загрузка данных приложения
  const loadAppData = useCallback(async () => {
    try {
      console.log('Загрузка данных приложения...');
      
      const activeDiscounts = await DataManager.getActiveDiscounts();

      const items = activeDiscounts.map(discount => ({
        id: discount.id,
        title: discount.title,
        description: discount.description,
        category: discount.category,
        coordinates: discount.coordinates
      }));

      setFeedItems(items);
      
      console.log('Данные успешно загружены:', {
        discounts: items.length
      });

      return { items };
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      throw error;
    }
  }, []);

  // Основная инициализация приложения
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загружаем данные перед инициализацией интерфейса
        const { items } = await loadAppData();
        
        // После загрузки данных инициализируем пользователя
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          const tgUser = tg.initDataUnsafe?.user;
          
          if (tgUser) {
            const userProfile = await DataManager.findProfileByTelegram(tgUser.username);
            
            if (userProfile) {
              setUserData({
                firstName: tgUser.first_name || userProfile.name.split(' ')[0] || "Пользователь",
                status: "Участник совета молодежи",
                photoUrl: tgUser.photo_url || userProfile.photo || null,
                isMember: true,
                memberProfileId: userProfile.id
              });
            } else {
              setUserData({
                firstName: tgUser.first_name || "Пользователь",
                status: "Пользователь",
                photoUrl: tgUser.photo_url || null,
                isMember: false,
                memberProfileId: null
              });
            }
          }
          
          setState(prev => ({ ...prev, isTelegram: true }));
          tg.expand();
        } else {
          // Демо-данные для браузера
          setUserData({
            firstName: "Иван",
            status: "Пользователь",
            isMember: false,
            memberProfileId: null
          });
        }

        // Помечаем данные как загруженные
        setState(prev => ({ 
          ...prev, 
          dataLoaded: true,
          loadingError: null 
        }));

      } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        setState(prev => ({ 
          ...prev, 
          dataLoaded: true,
          loadingError: 'Не удалось загрузить данные. Пожалуйста, проверьте подключение.' 
        }));
      } finally {
        // Скрываем сплеш-скрин после попытки загрузки
        setState(prev => ({ ...prev, splashVisible: false }));
      }
    };

    initializeApp();

    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, [loadAppData]);

  // Функции для работы с картой
  const getPlacemarkColor = () => {
    return state.theme === 'dark' ? 'islands#darkVioletIcon' : 'islands#violetIcon';
  };

  const getBalloonContent = (item) => {
    return state.theme === 'dark' 
      ? `
        <div style="padding: 10px; color: #ffffff !important; background: #1e1e1e;">
          <h3 style="margin: 0 0 5px; color: #ffffff !important; font-weight: bold;">${item.title}</h3>
          <p style="margin: 0; color: #e0e0e0 !important; white-space: pre-line;">${item.description}</p>
        </div>
      `
      : `
        <div style="padding: 10px; color: #000000 !important;">
          <h3 style="margin: 0 0 5px; color: #000000 !important; font-weight: bold;">${item.title}</h3>
          <p style="margin: 0; color: #333333 !important; white-space: pre-line;">${item.description}</p>
        </div>
      `;
  };

  const initializeMap = useCallback(() => {
    if (!window.ymaps || mapInstanceRef.current || isMapLoadingRef.current || !state.dataLoaded) return;

    try {
      isMapLoadingRef.current = true;
      setState(prev => ({ ...prev, mapLoading: true, mapError: false }));

      window.ymaps.ready(() => {
        if (mapInstanceRef.current) {
          setState(prev => ({ ...prev, mapLoading: false }));
          isMapLoadingRef.current = false;
          return;
        }

        const mapContainer = document.getElementById('yandex-map');
        if (!mapContainer) {
          console.error('Контейнер карты не найден');
          setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
          isMapLoadingRef.current = false;
          return;
        }

        mapInstanceRef.current = new window.ymaps.Map("yandex-map", {
          center: [60.710474, 28.749282],
          zoom: 14,
          controls: ['typeSelector', 'fullscreenControl']
        });
        
        // Добавляем метки только если есть данные
        feedItems.forEach(item => {
          if (item.coordinates) {
            try {
              const [lat, lng] = item.coordinates.split(',').map(coord => parseFloat(coord.trim()));
              
              const placemark = new window.ymaps.Placemark([lat, lng], {
                balloonContent: getBalloonContent(item),
                hintContent: item.title
              }, {
                preset: getPlacemarkColor(),
                balloonCloseButton: true,
                hideIconOnBalloonOpen: false
              });

              mapInstanceRef.current.geoObjects.add(placemark);
              placemarksRef.current.push({
                placemark,
                id: item.id,
                coordinates: [lat, lng]
              });
            } catch (coordError) {
              console.error('Ошибка парсинга координат:', item.coordinates, coordError);
            }
          }
        });

        setState(prev => ({ 
          ...prev, 
          mapInitialized: true,
          mapLoading: false 
        }));
        isMapLoadingRef.current = false;
      });
    } catch (error) {
      console.error('Ошибка инициализации карты:', error);
      setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
      isMapLoadingRef.current = false;
    }
  }, [feedItems, state.theme, state.dataLoaded]);

  // Обновление меток при смене темы
  useEffect(() => {
    if (mapInstanceRef.current && window.ymaps && placemarksRef.current.length > 0 && state.dataLoaded) {
      placemarksRef.current.forEach(item => {
        const feedItem = feedItems.find(fi => fi.id === item.id);
        if (feedItem) {
          item.placemark.options.set('preset', getPlacemarkColor());
          item.placemark.properties.set('balloonContent', getBalloonContent(feedItem));
        }
      });
    }
  }, [state.theme, feedItems, state.dataLoaded]);

  const centerMapOnPlacemark = useCallback((coordinates) => {
    if (!mapInstanceRef.current || !coordinates || !state.dataLoaded) return;
    
    try {
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      mapInstanceRef.current.setCenter([lat, lng], 16);
      
      const placemark = placemarksRef.current.find(p => 
        p.coordinates[0] === lat && p.coordinates[1] === lng
      );
      if (placemark) {
        placemark.placemark.balloon.open();
      }
    } catch (error) {
      console.error('Ошибка центрирования карты:', error);
    }
  }, [state.dataLoaded]);

  const loadYandexMaps = useCallback(() => {
    if (window.ymaps || mapScriptRef.current || !state.dataLoaded) return;

    return new Promise((resolve, reject) => {
      try {
        mapScriptRef.current = document.createElement('script');
        mapScriptRef.current.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
        mapScriptRef.current.async = true;
        
        mapScriptRef.current.onload = () => {
          console.log('Yandex Maps успешно загружены');
          setTimeout(resolve, 100);
        };
        
        mapScriptRef.current.onerror = () => {
          console.error('Ошибка загрузки Yandex Maps');
          reject(new Error('Не удалось загрузить Yandex Maps'));
        };
        
        document.head.appendChild(mapScriptRef.current);
      } catch (error) {
        reject(error);
      }
    });
  }, [state.dataLoaded]);

  // Управление картой при смене вкладки и после загрузки данных
  useEffect(() => {
    const manageMap = async () => {
      if (state.currentTab === 'feed' && !state.mapInitialized && !state.mapLoading && state.dataLoaded) {
        try {
          setState(prev => ({ ...prev, mapLoading: true }));
          
          if (!window.ymaps) {
            await loadYandexMaps();
          }
          
          setTimeout(() => {
            initializeMap();
          }, 500);
          
        } catch (error) {
          console.error('Ошибка загрузки карты:', error);
          setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
        }
      }
    };

    manageMap();
  }, [state.currentTab, state.mapInitialized, state.mapLoading, state.dataLoaded, loadYandexMaps, initializeMap]);

  // Автоматическое скрытие сплеш-скрина через 5 секунд (fallback)
  useEffect(() => {
    splashTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, splashVisible: false }));
    }, 5000);

    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, []);

  // Основные функции
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState(prev => ({ ...prev, theme: newTheme }));
    localStorage.setItem('youthCouncilTheme', newTheme);
  };

  const switchTab = (tabId) => {
    setState(prev => ({ 
      ...prev, 
      currentTab: tabId
    }));
  };

  // Утилиты для пользователя
  const getUserInitials = () => {
    const { firstName } = userData;
    return firstName ? firstName.charAt(0).toUpperCase() : 'Г';
  };

  const getDisplayName = () => {
    return userData.firstName || "Пользователь";
  };

  const userInitials = getUserInitials();
  const displayName = getDisplayName();

  // Компоненты QR-кода
  const UserQRCode = ({ size = 200 }) => {
    const qrValue = window.location.origin + window.location.pathname;
    
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
      </div>
    );
  };

  // Компонент загрузки
  const LoadingScreen = () => (
    <div className="loading-screen">
      <div className="loading-content">
        <Loader size={48} className="loading-spinner" />
        <h3>Загрузка данных...</h3>
        <p>Пожалуйста, подождите</p>
        {state.loadingError && (
          <div className="loading-error">
            <p>{state.loadingError}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Рендер контента только после загрузки данных
  const renderFeedContent = () => {
    if (!state.dataLoaded) {
      return <LoadingScreen />;
    }

    return (
      <div className="feed">
        <div className="feed-item map-feed-item">
          <div className="map-container">
            <div id="yandex-map"></div>
            {state.mapLoading && (
              <div className="map-loading-overlay">
                <div className="map-loading-content">
                  <MapPin size={32} className="map-loading-icon" />
                  <Loader size={24} className="map-loading-spinner" />
                  <p>Загружаем карту...</p>
                </div>
              </div>
            )}
            {state.mapError && (
              <div className="empty-map-message">
                <MapPin size={48} />
                <p>Не удалось загрузить карту</p>
                <p>Проверьте подключение к интернету</p>
              </div>
            )}
            {!state.mapLoading && !state.mapError && feedItems.length === 0 && (
              <div className="empty-map-message">
                <MapPin size={48} />
                <p>Пока нет партнерских заведений</p>
                <p>Предложения появятся здесь после добавления в админке</p>
              </div>
            )}
          </div>
          <div className="feed-content">
            <h3 className="feed-title">
              <MapPin size={20} className="title-icon" />
              Партнерские заведения
            </h3>
            <p className="feed-description">Найдите ближайшие места с выгодными предложениями</p>
          </div>
        </div>

        {feedItems.length === 0 ? (
          <div className="feed-item empty-state">
            <div className="feed-content">
              <div className="empty-state-icon">
                <Frown size={48} />
              </div>
              <h3 className="feed-title">Пока нет предложений</h3>
              <p className="feed-description">
                Предложения скоро появятся.<br />
                Администратор добавит их в панели управления.
              </p>
            </div>
          </div>
        ) : (
          feedItems.map((item, index) => (
            <div key={index} className="feed-item">
              <div className="feed-content">
                <h3 className="feed-title">{item.title}</h3>
                <p className="feed-description">{item.description}</p>
                {item.coordinates && (
                  <button 
                    className="map-button" 
                    onClick={() => centerMapOnPlacemark(item.coordinates)}
                    disabled={!state.mapInitialized}
                  >
                    <MapPin size={16} />
                    {state.mapInitialized ? 'Показать на карте' : 'Загрузка карты...'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderProfileContent = () => {
    if (!state.dataLoaded) {
      return <LoadingScreen />;
    }

    return (
      <div className="profile-card">
        <div className="profile-avatar">
          {userData.photoUrl ? (
            <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
          ) : (
            userInitials
          )}
        </div>
        <div className="profile-name">{displayName}</div>
        <div className={`profile-status ${userData.isMember ? 'member' : 'user'}`}>
          {userData.status}
        </div>
        
        <div className="profile-qr-section">
          <h3 className="qr-title">QR-код приложения</h3>
          
          <UserQRCode size={240} />
          
          <p className="qr-description">
            Отсканируйте QR-код для перехода в приложение
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="client-app">
      {/* Splash Screen */}
      {state.splashVisible && (
        <div className="splash-screen">
          <div className="splash-content">
            <div className="splash-logo">
              <Home size={80} />
            </div>
            <div className="splash-text">Добро пожаловать</div>
            <div className="splash-username">{displayName}</div>
            <div className="loading-spinner">
              <Loader size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Основной интерфейс */}
      {!state.splashVisible && (
        <>
          <header className="header">
            <div className="header-content">
              <div className="logo">
                <Home size={24} />
                <span>{appSettings.appName}</span>
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
            </div>
          </header>

          <main className="container">
            <div className={`tab-content ${state.currentTab === 'feed' ? 'active' : ''}`}>
              {renderFeedContent()}
            </div>

            <div className={`tab-content ${state.currentTab === 'profile' ? 'active' : ''}`}>
              {renderProfileContent()}
            </div>
          </main>

          <footer className="footer">
            <div className={`footer-item ${state.currentTab === 'feed' ? 'active' : ''}`} onClick={() => switchTab('feed')}>
              <Grid size={20} />
              <span className="footer-text">Лента</span>
            </div>
            <div className={`footer-item ${state.currentTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
              <User size={20} />
              <span className="footer-text">Профиль</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default ClientApp;