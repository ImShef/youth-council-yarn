// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { 
//   Home, User, MapPin, Grid, Moon, Sun, Loader, Frown, Users, ArrowLeft, Phone
// } from 'react-feather';
// import { QRCodeSVG } from 'qrcode.react';
// import Admin from './components/Admin/Admin.js';
// import DataManager from './utils/dataManager.js';
// import './styles/App.css';

// const App = () => {
//   const [state, setState] = useState({
//     currentTab: 'feed',
//     splashVisible: true,
//     isTelegram: false,
//     theme: 'light',
//     selectedMember: null,
//     mapInitialized: false,
//     mapLoading: false,
//     mapError: false
//   });

//   const [userData, setUserData] = useState({
//     firstName: "Гость",
//     status: "Пользователь",
//     isMember: false,
//     memberProfileId: null
//   });

//   const [feedItems, setFeedItems] = useState([]);
//   const [profiles, setProfiles] = useState([]);
//   const [appSettings] = useState({ appName: 'Дом молодежи' });

//   const splashTimerRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const placemarksRef = useRef([]);
//   const mapScriptRef = useRef(null);
//   const isMapLoadingRef = useRef(false);

//   // Инициализация темы
//   useEffect(() => {
//     const savedTheme = localStorage.getItem('youthCouncilTheme') || 'light';
//     setState(prev => ({ ...prev, theme: savedTheme }));
//     document.body.className = `theme-${savedTheme}`;
//   }, []);

//   // Загрузка данных
//   const loadAppData = useCallback(() => {
//     try {
//       const activeDiscounts = DataManager.getActiveDiscounts();
//       const items = activeDiscounts.map(discount => ({
//         id: discount.id,
//         title: discount.title,
//         description: discount.description,
//         discountValue: discount.discountValue,
//         category: discount.category,
//         coordinates: discount.coordinates
//       }));
//       setFeedItems(items);

//       const activeProfiles = DataManager.getActiveProfiles();
//       setProfiles(activeProfiles);

//       return activeProfiles;
//     } catch (error) {
//       console.error('Error loading app data:', error);
//       return [];
//     }
//   }, []);

//   // Основная инициализация
//   useEffect(() => {
//     const initializeApp = () => {
//       try {
//         const loadedProfiles = loadAppData();

//         // Инициализация пользователя
//         if (window.Telegram?.WebApp) {
//           const tg = window.Telegram.WebApp;
//           const tgUser = tg.initDataUnsafe?.user;
          
//           if (tgUser) {
//             const userProfile = DataManager.findProfileByTelegram(tgUser.username);
            
//             if (userProfile) {
//               setUserData({
//                 firstName: tgUser.first_name || userProfile.name.split(' ')[0] || "Пользователь",
//                 status: "Участник совета молодежи",
//                 photoUrl: tgUser.photo_url || userProfile.photo || null,
//                 isMember: true,
//                 memberProfileId: userProfile.id
//               });
//             } else {
//               setUserData({
//                 firstName: tgUser.first_name || "Пользователь",
//                 status: "Пользователь",
//                 photoUrl: tgUser.photo_url || null,
//                 isMember: false,
//                 memberProfileId: null
//               });
//             }
//           }
          
//           setState(prev => ({ ...prev, isTelegram: true }));
//           tg.expand();
//         } else {
//           // Демо-данные для браузера
//           setUserData({
//             firstName: "Иван",
//             status: "Участник совета молодежи",
//             isMember: true,
//             memberProfileId: loadedProfiles.length > 0 ? loadedProfiles[0].id : null
//           });
//         }

//       } catch (error) {
//         console.error('App initialization error:', error);
//       }
//     };

//     initializeApp();

//     return () => {
//       if (splashTimerRef.current) {
//         clearTimeout(splashTimerRef.current);
//       }
//     };
//   }, [loadAppData]);

//   // Обработка URL параметров
//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const profileId = urlParams.get('profile');
//     const isAdmin = urlParams.get('admin') === 'true';
    
//     if (isAdmin) return;
    
//     if (profileId && profiles.length > 0) {
//       const member = profiles.find(p => p.id === profileId);
//       if (member) {
//         setState(prev => ({ 
//           ...prev, 
//           selectedMember: member,
//           currentTab: 'member'
//         }));
//       }
//     }
//   }, [profiles]);

//   // Инициализация карты
//   const initializeMap = useCallback(() => {
//     if (!window.ymaps || mapInstanceRef.current || isMapLoadingRef.current) return;

//     try {
//       isMapLoadingRef.current = true;
//       setState(prev => ({ ...prev, mapLoading: true, mapError: false }));

//       window.ymaps.ready(() => {
//         if (mapInstanceRef.current) {
//           setState(prev => ({ ...prev, mapLoading: false }));
//           isMapLoadingRef.current = false;
//           return;
//         }

//         // Создаем карту только если контейнер существует
//         const mapContainer = document.getElementById('yandex-map');
//         if (!mapContainer) {
//           console.error('Map container not found');
//           setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
//           isMapLoadingRef.current = false;
//           return;
//         }

//         mapInstanceRef.current = new window.ymaps.Map("yandex-map", {
//           center: [60.710474, 28.749282],
//           zoom: 14,
//           controls: ['typeSelector', 'fullscreenControl']
//         });
        
//         // Добавление локаций из feedItems
//         feedItems.forEach(item => {
//           if (item.coordinates) {
//             try {
//               const [lat, lng] = item.coordinates.split(',').map(coord => parseFloat(coord.trim()));
//               const placemark = new window.ymaps.Placemark([lat, lng], {
//                 balloonContent: `
//                   <div style="padding: 10px; color: #000000 !important;">
//                     <h3 style="margin: 0 0 5px; color: #000000 !important; font-weight: bold;">${item.title}</h3>
//                     <p style="margin: 0; color: #000000 !important; white-space: pre-line;">${item.description}</p>
//                     <p style="margin: 5px 0 0; color: #000000 !important; font-weight: bold;">Скидка: ${item.discountValue}</p>
//                   </div>
//                 `
//               }, {
//                 preset: 'islands#violetIcon'
//               });

//               mapInstanceRef.current.geoObjects.add(placemark);
//               placemarksRef.current.push({
//                 placemark,
//                 id: item.id,
//                 coordinates: [lat, lng]
//               });
//             } catch (coordError) {
//               console.error('Error parsing coordinates:', item.coordinates, coordError);
//             }
//           }
//         });

//         setState(prev => ({ 
//           ...prev, 
//           mapInitialized: true,
//           mapLoading: false 
//         }));
//         isMapLoadingRef.current = false;
//       });
//     } catch (error) {
//       console.error('Error initializing map:', error);
//       setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
//       isMapLoadingRef.current = false;
//     }
//   }, [feedItems]);

//   // Функция для центрирования карты на метке
//   const centerMapOnPlacemark = useCallback((coordinates) => {
//     if (!mapInstanceRef.current || !coordinates) return;
    
//     try {
//       const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
//       mapInstanceRef.current.setCenter([lat, lng], 16);
      
//       // Открываем балун метки
//       const placemark = placemarksRef.current.find(p => 
//         p.coordinates[0] === lat && p.coordinates[1] === lng
//       );
//       if (placemark) {
//         placemark.placemark.balloon.open();
//       }
//     } catch (error) {
//       console.error('Error centering map:', error);
//     }
//   }, []);

//   // Загрузка Яндекс Карт
//   const loadYandexMaps = useCallback(() => {
//     if (window.ymaps || mapScriptRef.current) return;

//     return new Promise((resolve, reject) => {
//       try {
//         mapScriptRef.current = document.createElement('script');
//         mapScriptRef.current.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
//         mapScriptRef.current.async = true;
        
//         mapScriptRef.current.onload = () => {
//           console.log('Yandex Maps loaded successfully');
//           setTimeout(resolve, 100);
//         };
        
//         mapScriptRef.current.onerror = () => {
//           console.error('Failed to load Yandex Maps');
//           reject(new Error('Failed to load Yandex Maps'));
//         };
        
//         document.head.appendChild(mapScriptRef.current);
//       } catch (error) {
//         reject(error);
//       }
//     });
//   }, []);

//   // Управление картой при смене вкладки
//   useEffect(() => {
//     const manageMap = async () => {
//       if (state.currentTab === 'feed' && !state.mapInitialized && !state.mapLoading) {
//         try {
//           setState(prev => ({ ...prev, mapLoading: true }));
          
//           if (!window.ymaps) {
//             await loadYandexMaps();
//           }
          
//           // Даем время для загрузки API
//           setTimeout(() => {
//             initializeMap();
//           }, 500);
          
//         } catch (error) {
//           console.error('Error loading map:', error);
//           setState(prev => ({ ...prev, mapLoading: false, mapError: true }));
//         }
//       }
//     };

//     manageMap();
//   }, [state.currentTab, state.mapInitialized, state.mapLoading, loadYandexMaps, initializeMap]);

//   // Скрытие сплеш-скрина
//   useEffect(() => {
//     splashTimerRef.current = setTimeout(() => {
//       setState(prev => ({ ...prev, splashVisible: false }));
//     }, 2500);

//     return () => {
//       if (splashTimerRef.current) {
//         clearTimeout(splashTimerRef.current);
//       }
//     };
//   }, []);

//   // Основные функции
//   const toggleTheme = () => {
//     const newTheme = state.theme === 'light' ? 'dark' : 'light';
//     setState(prev => ({ ...prev, theme: newTheme }));
//     localStorage.setItem('youthCouncilTheme', newTheme);
//     document.body.className = `theme-${newTheme}`;
//   };

//   const switchTab = (tabId) => {
//     setState(prev => ({ 
//       ...prev, 
//       currentTab: tabId,
//       selectedMember: null
//     }));
//   };

//   const selectMember = (member) => {
//     setState(prev => ({ 
//       ...prev, 
//       selectedMember: member,
//       currentTab: 'member'
//     }));
//   };

//   const goBack = () => {
//     setState(prev => ({ 
//       ...prev, 
//       selectedMember: null,
//       currentTab: 'profiles'
//     }));
//   };

//   // Утилиты для пользователя
//   const getUserInitials = () => {
//     const { firstName } = userData;
//     return firstName ? firstName.charAt(0).toUpperCase() : 'Г';
//   };

//   const getDisplayName = () => {
//     return userData.firstName || "Пользователь";
//   };

//   const userInitials = getUserInitials();
//   const displayName = getDisplayName();

//   // Компоненты QR-кода
//   const MemberQRCode = ({ memberId, size = 200 }) => {
//     const baseUrl = window.location.origin + window.location.pathname;
//     const qrValue = `${baseUrl}?profile=${memberId}`;
    
//     return (
//       <div className="qr-code-container">
//         <QRCodeSVG 
//           value={qrValue}
//           size={size}
//           level="M"
//           includeMargin={true}
//           bgColor="#ffffff"
//           fgColor="#000000"
//         />
//       </div>
//     );
//   };

//   const UserQRCode = ({ size = 200 }) => {
//     const qrValue = window.location.origin + window.location.pathname;
    
//     return (
//       <div className="qr-code-container">
//         <QRCodeSVG 
//           value={qrValue}
//           size={size}
//           level="M"
//           includeMargin={true}
//           bgColor="#ffffff"
//           fgColor="#000000"
//         />
//       </div>
//     );
//   };

//   // Функция для форматирования Telegram username
//   const formatTelegram = (telegram) => {
//     if (!telegram) return '';
//     return `@${telegram.replace(/^@/, '')}`;
//   };

//   // Функция для форматирования номера телефона
//   const formatPhone = (phone) => {
//     if (!phone) return '';
//     // Просто возвращаем номер как есть, можно добавить форматирование при необходимости
//     return phone;
//   };

//   // Рендер контента
//   const renderFeedContent = () => (
//     <div className="feed">
//       <div className="feed-item map-feed-item">
//         <div className="map-container">
//           <div id="yandex-map"></div>
//           {state.mapLoading && (
//             <div className="map-loading-overlay">
//               <div className="map-loading-content">
//                 <MapPin size={32} className="map-loading-icon" />
//                 <Loader size={24} className="map-loading-spinner" />
//                 <p>Загружаем карту...</p>
//               </div>
//             </div>
//           )}
//           {state.mapError && (
//             <div className="empty-map-message">
//               <MapPin size={48} />
//               <p>Не удалось загрузить карту</p>
//               <p>Проверьте подключение к интернету</p>
//             </div>
//           )}
//           {!state.mapLoading && !state.mapError && feedItems.length === 0 && (
//             <div className="empty-map-message">
//               <MapPin size={48} />
//               <p>Пока нет партнерских заведений</p>
//               <p>Скидки появятся здесь после добавления в админке</p>
//             </div>
//           )}
//         </div>
//         <div className="feed-content">
//           <h3 className="feed-title">
//             <MapPin size={20} className="title-icon" />
//             Партнерские заведения
//           </h3>
//           <p className="feed-description">Найдите ближайшие места с выгодными предложениями</p>
//         </div>
//       </div>

//       {feedItems.length === 0 ? (
//         <div className="feed-item empty-state">
//           <div className="feed-content">
//             <div className="empty-state-icon">
//               <Frown size={48} />
//             </div>
//             <h3 className="feed-title">Пока нет скидок</h3>
//             <p className="feed-description">
//               Скидки скоро появятся.<br />
//               Администратор добавит их в панели управления.
//             </p>
//           </div>
//         </div>
//       ) : (
//         feedItems.map((item, index) => (
//           <div key={index} className="feed-item">
//             <div className="feed-content">
//               <h3 className="feed-title">{item.title}</h3>
//               <p className="feed-description">{item.description}</p>
//               {item.discountValue && (
//                 <div className="discount-badge">
//                   Скидка: {item.discountValue}
//                 </div>
//               )}
//               {item.coordinates && (
//                 <button 
//                   className="map-button" 
//                   onClick={() => centerMapOnPlacemark(item.coordinates)}
//                   disabled={!state.mapInitialized}
//                 >
//                   <MapPin size={16} />
//                   {state.mapInitialized ? 'Показать на карте' : 'Загрузка карты...'}
//                 </button>
//               )}
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   );

//   const renderProfilesContent = () => (
//     <div className="profiles-page">
//       <div className="page-header">
//         <h2 className="page-title">
//           <Users size={24} className="title-icon" />
//           Участники совета молодежи
//         </h2>
//         <p className="page-description">Знакомьтесь с активными участниками нашей команды</p>
//       </div>

//       {profiles.length === 0 ? (
//         <div className="empty-profiles-state">
//           <div className="empty-state-icon">
//             <Frown size={64} />
//           </div>
//           <h3>Пока нет участников</h3>
//           <p>Анкеты скоро появятся.</p>
//         </div>
//       ) : (
//         <div className="members-list">
//           {profiles.map(profile => (
//             <div 
//               key={profile.id} 
//               className="member-list-item"
//               onClick={() => selectMember(profile)}
//             >
//               <div className="member-avatar-small">
//                 {profile.photo ? (
//                   <img src={profile.photo} alt={profile.name} className="avatar-image" />
//                 ) : (
//                   <div className="avatar-placeholder">
//                     {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//                   </div>
//                 )}
//               </div>
//               <div className="member-info">
//                 <h3 className="member-name">{profile.name}</h3>
//                 <p className="member-position">{profile.position || 'Участник совета молодежи'}</p>
//                 <div className="member-contacts">
//                   {profile.telegram && (
//                     <p className="member-telegram">{formatTelegram(profile.telegram)}</p>
//                   )}
//                   {profile.phone && (
//                     <p className="member-phone">
//                       <Phone size={12} />
//                       {formatPhone(profile.phone)}
//                     </p>
//                   )}
//                 </div>
//               </div>
//               <div className="member-arrow">
//                 <span>➔</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   const renderMemberDetail = () => (
//     state.selectedMember && (
//       <div className="member-detail-page">
//         <div className="member-detail-card">
//           <div className="member-detail-avatar">
//             {state.selectedMember.photo ? (
//               <img src={state.selectedMember.photo} alt={state.selectedMember.name} className="avatar-image" />
//             ) : (
//               <div className="avatar-placeholder-large">
//                 {state.selectedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//               </div>
//             )}
//           </div>
          
//           <div className="member-detail-info">
//             <h1 className="member-detail-name">{state.selectedMember.name}</h1>
//             <div className="member-detail-position">
//               {state.selectedMember.position || 'Участник совета молодежи'}
//             </div>
            
//             <div className="member-detail-contacts">
//               {state.selectedMember.telegram && (
//                 <div className="member-detail-contact-item">
//                   <div className="contact-label">Telegram:</div>
//                   <div className="contact-value telegram-value">
//                     {formatTelegram(state.selectedMember.telegram)}
//                   </div>
//                 </div>
//               )}
              
//               {state.selectedMember.phone && (
//                 <div className="member-detail-contact-item">
//                   <div className="contact-label">Телефон:</div>
//                   <div className="contact-value phone-value">
//                     <Phone size={16} />
//                     {formatPhone(state.selectedMember.phone)}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="member-detail-qr">
//               <h3 className="qr-title">QR-код анкеты</h3>
//               <MemberQRCode memberId={state.selectedMember.id} size={240} />
//               <p className="qr-description">
//                 Отсканируйте QR-код для просмотра этой анкеты
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   );

//   const renderProfileContent = () => (
//     <div className="profile-card">
//       <div className="profile-avatar">
//         {userData.photoUrl ? (
//           <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
//         ) : (
//           userInitials
//         )}
//       </div>
//       <div className="profile-name">{displayName}</div>
//       <div className={`profile-status ${userData.isMember ? 'member' : 'user'}`}>
//         {userData.status}
//       </div>
      
//       <div className="profile-qr-section">
//         <h3 className="qr-title">
//           {userData.isMember ? 'QR-код вашей анкеты' : 'QR-код приложения'}
//         </h3>
        
//         {userData.isMember ? (
//           <MemberQRCode memberId={userData.memberProfileId} size={240} />
//         ) : (
//           <UserQRCode size={240} />
//         )}
        
//         <p className="qr-description">
//           {userData.isMember 
//             ? "Отсканируйте QR-код для просмотра вашей анкеты"
//             : "Отсканируйте QR-код для перехода в приложение"
//           }
//         </p>
//       </div>
//     </div>
//   );

//   // Проверка на админку
//   const urlParams = new URLSearchParams(window.location.search);
//   const isAdmin = urlParams.get('admin') === 'true';

//   if (isAdmin) {
//     return <Admin onDataUpdate={loadAppData} />;
//   }

//   return (
//     <div className="app">
//       {/* Splash Screen */}
//       {state.splashVisible && (
//         <div className="splash-screen">
//           <div className="splash-content">
//             <div className="splash-logo">
//               <Home size={80} />
//             </div>
//             <div className="splash-text">Добро пожаловать</div>
//             <div className="splash-username">{displayName}</div>
//             <div className="loading-spinner">
//               <Loader size={40} />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Основной интерфейс */}
//       {!state.splashVisible && (
//         <>
//           <header className="header">
//             <div className="header-content">
//               {state.currentTab === 'member' ? (
//                 <>
//                   <button className="back-button" onClick={goBack}>
//                     <ArrowLeft size={24} />
//                   </button>
//                   <div className="header-title">
//                     <span>Анкета участника</span>
//                   </div>
//                   <div className="header-actions">
//                     <button className="theme-toggle" onClick={toggleTheme}>
//                       {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <div className="logo">
//                     <Home size={24} />
//                     <span>{appSettings.appName}</span>
//                   </div>
//                   <div className="header-actions">
//                     <button className="theme-toggle" onClick={toggleTheme}>
//                       {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
//                     </button>
                    
//                     <div className="user-avatar">
//                       {userData.photoUrl ? (
//                         <img src={userData.photoUrl} alt="Profile" className="avatar-image" />
//                       ) : (
//                         userInitials
//                       )}
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           </header>

//           <main className="container">
//             <div className={`tab-content ${state.currentTab === 'feed' ? 'active' : ''}`}>
//               {renderFeedContent()}
//             </div>

//             <div className={`tab-content ${state.currentTab === 'profiles' ? 'active' : ''}`}>
//               {renderProfilesContent()}
//             </div>

//             <div className={`tab-content ${state.currentTab === 'member' ? 'active' : ''}`}>
//               {renderMemberDetail()}
//             </div>

//             <div className={`tab-content ${state.currentTab === 'profile' ? 'active' : ''}`}>
//               {renderProfileContent()}
//             </div>
//           </main>

//           {state.currentTab !== 'member' && (
//             <footer className="footer">
//               <div className={`footer-item ${state.currentTab === 'feed' ? 'active' : ''}`} onClick={() => switchTab('feed')}>
//                 <Grid size={20} />
//                 <span className="footer-text">Лента</span>
//               </div>
//               <div className={`footer-item ${state.currentTab === 'profiles' ? 'active' : ''}`} onClick={() => switchTab('profiles')}>
//                 <Users size={20} />
//                 <span className="footer-text">Участники</span>
//               </div>
//               <div className={`footer-item ${state.currentTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
//                 <User size={20} />
//                 <span className="footer-text">Профиль</span>
//               </div>
//             </footer>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default App;