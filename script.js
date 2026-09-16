const API_KEY = 'd7fd736a86c5a16dd603c5d6ced81bbb';
const DEFAULT_CITY = 'Jakarta';

let currentUnit = 'metric';
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];
let currentCity = searchHistory.length > 0 ? searchHistory[0] : DEFAULT_CITY;

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const unitToggleBtn = document.getElementById('unit-toggle-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyContainer = document.getElementById('history-container');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
const weatherCard = document.getElementById('weather-card');
const forecastSection = document.getElementById('forecast-section');

const getWeatherEmoji = (iconCode) => {
  switch (iconCode) {
    case '01d': return '☀️';
    case '01n': return '🌙';
    case '02d':
    case '02n': return '⛅';
    case '03d':
    case '03n':
    case '04d':
    case '04n': return '☁️';
    case '09d':
    case '09n': return '🌧️';
    case '10d': return '🌦️';
    case '10n': return '🌧️';
    case '11d':
    case '11n': return '🌩️';
    case '13d':
    case '13n': return '❄️';
    case '50d':
    case '50n': return '🌀';
    default: return '☀️';
  }
};

const fetchWeatherData = async (city) => {
  showLoading(true);
  hideError();

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    if (weatherRes.status === 404) {
      throw new Error('Kota tidak ditemukan. Periksa kembali ejaan nama kota.');
    }

    if (!weatherRes.ok) {
      throw new Error(`Terjadi kesalahan server (${weatherRes.status})`);
    }

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    currentCity = city;
    updateHistory(city);
    renderWeather(weatherData);
    renderForecast(forecastData);

  } catch (error) {
    if (error.name === 'TypeError') {
      showError('Gagal terhubung ke jaringan. Periksa koneksi internet Anda.');
    } else {
      showError(error.message);
    }
  } finally {
    showLoading(false);
  }
};

const renderWeather = (data) => {
  const { name, main, weather } = data;
  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';

  document.getElementById('city-name').textContent = name;
  document.getElementById('weather-icon').textContent = getWeatherEmoji(weather[0].icon);
  document.getElementById('temperature').textContent = `${Math.round(main.temp)}${unitSymbol}`;
  document.getElementById('weather-desc').textContent = weather[0].description;
  document.getElementById('humidity').textContent = `${main.humidity}%`;
};

const renderForecast = (data) => {
  const forecastCardsEl = document.getElementById('forecast-cards');
  const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));

  forecastCardsEl.innerHTML = dailyForecasts.map(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('id-ID', { weekday: 'short' });
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;
    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';

    return `
      <div class="forecast-card">
        <p><strong>${date}</strong></p>
        <span class="forecast-emoji">${getWeatherEmoji(icon)}</span>
        <p class="temp-val">${temp}${unitSymbol}</p>
      </div>
    `;
  }).join('');
};

const updateHistory = (city) => {
  searchHistory = [city, ...searchHistory.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 4);
  localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
  renderHistory();
};

const renderHistory = () => {
  if (searchHistory.length === 0) {
    historyContainer.innerHTML = '';
    return;
  }
  historyContainer.innerHTML = searchHistory.map(city => `
    <button class="history-btn" type="button" onclick="fetchWeatherData('${city}')">${city}</button>
  `).join('');
};

const showLoading = (isLoading) => loadingEl.classList.toggle('hidden', !isLoading);
const showError = (msg) => {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
};
const hideError = () => errorEl.classList.add('hidden');

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherData(city);
    cityInput.value = '';
  }
});

unitToggleBtn.addEventListener('click', () => {
  currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  unitToggleBtn.textContent = currentUnit === 'metric' ? 'Ubah ke °F' : 'Ubah ke °C';
  fetchWeatherData(currentCity);
});

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggleBtn.textContent = '☀️';
}

renderHistory();
fetchWeatherData(currentCity);