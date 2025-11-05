import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Слушаем все интерфейсы
// Разрешаем CORS для разработки
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Ваши данные (оставляем как есть)
const discounts = [
  {
    id: 1,
    title: 'Кофейня "Кофе Хаус"',
    description: 'Скидка 15% на все напитки при предъявлении студенческого билета. Действует с понедельника по пятницу с 9:00 до 18:00.\n\nУсловия:\n• Предъявите студенческий билет\n• Скидка действует на все напитки меню\n• Не распространяется на кондитерские изделия',
    coordinates: '60.711503, 28.748026',
    category: 'food',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Кинотеатр "Синема Парк"',
    description: 'Специальное предложение для членов молодежного совета: 2 билета по цене одного на вечерние сеансы.\n\nУсловия:\n• Акция действует с понедельника по четверг\n• На один студенческий билет два билета\n• Бронирование за 2 часа до сеанса',
    coordinates: '60.712345, 28.749876',
    category: 'entertainment',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const profiles = [
  {
    id: 1,
    name: 'Иванов Алексей Петрович',
    telegram: 'alex_ivanov',
    phone: '+7 (912) 345-67-89',
    photo: null,
    position: 'Председатель совета молодежи',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Петрова Мария Сергеевна',
    telegram: 'maria_petrova',
    phone: '+7 (923) 456-78-90',
    photo: null,
    position: 'Заместитель председателя',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    discounts: discounts.length,
    profiles: profiles.length,
    serverInfo: {
      internalIP: '192.168.0.62',
      externalIP: '176.125.135.115',
      port: PORT
    }
  });
});

// === API ROUTES ===
// (Все ваши роуты остаются без изменений)

// Discounts
app.get('/api/discounts', (req, res) => {
  res.json(discounts);
});

app.get('/api/discounts/active', (req, res) => {
  const activeDiscounts = discounts.filter(d => d.isActive);
  res.json(activeDiscounts);
});

app.get('/api/discounts/:id', (req, res) => {
  const discount = discounts.find(d => d.id === parseInt(req.params.id));
  if (!discount) {
    return res.status(404).json({ error: 'Discount not found' });
  }
  res.json(discount);
});

app.post('/api/discounts', (req, res) => {
  const newDiscount = {
    id: discounts.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  discounts.push(newDiscount);
  res.json(newDiscount);
});

app.put('/api/discounts/:id', (req, res) => {
  const index = discounts.findIndex(d => d.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Discount not found' });
  }
  
  discounts[index] = {
    ...discounts[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(discounts[index]);
});

app.delete('/api/discounts/:id', (req, res) => {
  const index = discounts.findIndex(d => d.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Discount not found' });
  }
  
  discounts.splice(index, 1);
  res.json({ success: true });
});

// Profiles
app.get('/api/profiles', (req, res) => {
  res.json(profiles);
});

app.get('/api/profiles/active', (req, res) => {
  const activeProfiles = profiles.filter(p => p.isActive);
  res.json(activeProfiles);
});

app.get('/api/profiles/:id', (req, res) => {
  const profile = profiles.find(p => p.id === parseInt(req.params.id));
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

app.post('/api/profiles', (req, res) => {
  const newProfile = {
    id: profiles.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  profiles.push(newProfile);
  res.json(newProfile);
});

app.put('/api/profiles/:id', (req, res) => {
  const index = profiles.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  profiles[index] = {
    ...profiles[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(profiles[index]);
});

app.delete('/api/profiles/:id', (req, res) => {
  const index = profiles.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  profiles.splice(index, 1);
  res.json({ success: true });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Demo authentication
  if (username === 'admin' && password === 'admin') {
    res.json({
      success: true,
      token: 'demo-jwt-token-12345',
      user: { 
        username: 'admin',
        role: 'administrator'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Неверный логин или пароль'
    });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token === 'demo-jwt-token-12345') {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Stats
app.get('/api/stats', (req, res) => {
  res.json({
    totalDiscounts: discounts.length,
    activeDiscounts: discounts.filter(d => d.isActive).length,
    totalProfiles: profiles.length,
    activeProfiles: profiles.filter(p => p.isActive).length,
    lastUpdate: new Date().toISOString()
  });
});

// The "catchall" handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Запуск сервера на всех интерфейсах
app.listen(PORT, HOST, () => {
  console.log('🚀 Сервер успешно запущен!');
  console.log(`📍 Локальный доступ: http://localhost:${PORT}`);
  console.log(`📍 Внутренняя сеть: http://192.168.0.62:${PORT}`);
  console.log(`🌐 Внешний доступ: http://176.125.135.115:${PORT}`);
  console.log(`📊 API Health: http://176.125.135.115:${PORT}/api/health`);
});