const countrySelect = document.getElementById('country');
const genreSelect = document.getElementById('genre');
const loadBtn = document.getElementById('loadBtn');
const radioList = document.getElementById('radioList');
const nowPlaying = document.getElementById('nowPlaying');
const audioPlayer = document.getElementById('audioPlayer');
const showAllBtn = document.getElementById('showAllBtn');

const floatingPlayer = document.getElementById('floatingPlayer');
const togglePlayBtn = document.getElementById('togglePlayBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const exitBtn = document.getElementById('exitBtn');
const minTitle = document.getElementById('minTitle');
const minDescription = document.getElementById('minDescription');

const navbarToggler = document.getElementById('navbarToggler');
const navbarContent = document.getElementById('navbarContent');

navbarToggler.addEventListener('click', () => {
  const icon = navbarToggler.querySelector('i');
  const isBars = icon.classList.contains('fa-bars');

  // Fade out
  icon.style.opacity = 0;
  icon.style.transform = 'rotate(90deg)';

  setTimeout(() => {
    if (isBars) {
      icon.classList.replace('fa-bars', 'fa-times');
    } else {
      icon.classList.replace('fa-times', 'fa-bars');
    }
    // Fade in balik
    icon.style.opacity = 1;
    icon.style.transform = 'rotate(0deg)';
  }, 300);
});

let isMinimized = false;

async function fetchCountries() {
  try {
    const response = await fetch('https://de1.api.radio-browser.info/json/countries');
    const countries = await response.json();

    countries.sort((a, b) => a.name.localeCompare(b.name));

    // Tambahkan opsi "Semua Negara" di paling atas
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Semua Negara';
    countrySelect.appendChild(allOption);

    // Tambahkan semua negara dari API
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.name;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Gagal mengambil data negara:', error);
  }
}


async function fetchStarterStations() {
  showLoading();
  try {
    const res = await fetch('https://de1.api.radio-browser.info/json/stations/topclick/20');
    const stations = await res.json();
    displayStations(stations.filter(s => s.url_resolved));
  } catch (error) {
    console.error('Gagal memuat starter station:', error);
    radioList.innerHTML = '<li class="list-group-item text-danger">Gagal memuat stasiun radio awal.</li>';
  } finally {
    hideLoading();
  }
}

async function loadTopGenres(limit = 400) {
  const genreSelect = document.getElementById('genre');

  try {
    const res = await fetch('https://de1.api.radio-browser.info/json/tags');
    const tags = await res.json();

    // Urutkan berdasarkan jumlah stasiun (paling populer)
    const sortedTags = tags
      .filter(tag => tag.name.trim() !== '') // buang yang kosong
      .sort((a, b) => b.stationcount - a.stationcount)
      .slice(0, limit); // ambil 20 teratas

    sortedTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag.name;
      option.textContent = tag.name.charAt(0).toUpperCase() + tag.name.slice(1);
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Gagal memuat genre:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTopGenres(400); // Ambil 20 genre terpopuler
});


loadBtn.addEventListener('click', async () => {
  const country = countrySelect.value;
  const genre = genreSelect.value.trim();

  let url = 'https://de1.api.radio-browser.info/json/stations/search?limit=1000';

  if (country !== '') {
    url += `&country=${encodeURIComponent(country)}`;
  }

  if (genre !== '') {
    url += `&tag=${encodeURIComponent(genre)}`;
  }

  showLoading();

  try {
    const res = await fetch(url);
    let stations = await res.json();

    // Filter stasiun yang punya URL valid
    const validStations = stations.filter(station => station.url_resolved);

    // Ambil hanya 50 stasiun pertama
    const topStations = validStations.slice(0, 50);

    displayStations(topStations);
  } catch (error) {
    console.error('Gagal memuat stasiun:', error);
    radioList.innerHTML = '<li class="list-group-item text-danger">Gagal memuat stasiun radio.</li>';
  } finally {
    hideLoading();
  }
});

async function handleSearch(event) {
  event.preventDefault();

  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  showLoading();

  const url = `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(query)}&limit=1000`;

  try {
    const res = await fetch(url);
    let stations = await res.json();

    // Filter stasiun yang memiliki URL valid
    const validStations = stations.filter(station => station.url_resolved);

    // Ambil maksimal 50 stasiun
    const topStations = validStations.slice(0, 50);

    if (topStations.length === 0) {
      radioList.innerHTML = `<li class="list-group-item text-warning">Tidak ada stasiun ditemukan untuk: "${query}"</li>`;
    } else {
      displayStations(topStations);
    }
  } catch (error) {
    console.error('Gagal mencari stasiun:', error);
    radioList.innerHTML = '<li class="list-group-item text-danger">Gagal mencari stasiun.</li>';
  } finally {
    hideLoading();
  }
}


function displayStations(stations) {
  radioList.innerHTML = '';
  if (!stations.length) {
    radioList.innerHTML = '<li class="list-group-item text-danger">Tidak ada stasiun ditemukan.</li>';
    return;
  }

  stations.forEach(station => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center flex-column flex-sm-row';
    li.innerHTML = `
      <span class="text-start w-100">
        <strong>${station.name}</strong><br>
        <small class="station-info">
          <div class="scroll-container">
            <div class="scroll-content">${station.country} • ${station.tags}</div>
          </div>
        </small>
      </span>
      <button class="btn btn-sm btn-success mt-2 mt-sm-0">Putar</button>
    `;

    li.querySelector('button').addEventListener('click', () => playStation(station));
    radioList.appendChild(li);

    // Contoh panggilannya untuk semua <li> setelah di-generate
    document.querySelectorAll('.list-group-item').forEach(li => {
      setupScrollingAnimation(li);
    });

  });
  
}

function setupScrollingAnimation(li) {
  const content = li.querySelector('.scroll-content');
  const container = li.querySelector('.scroll-container');

  function updateAnimation() {
    const containerWidth = container.clientWidth;
    const contentWidth = content.scrollWidth;

    if (contentWidth > containerWidth) {
      const overflow = containerWidth - contentWidth; // nilai negatif
      const speed = 30; // px per detik, atur sesuai keinginan
      const duration = Math.abs(overflow) / speed + 2; // +2 detik untuk pause

      // Set CSS custom property --scroll-distance dan durasi animasi
      content.style.setProperty('--scroll-distance', `${overflow}px`);
      content.style.animation = `scroll-text ${duration}s linear infinite`;
      content.style.animationPlayState = 'running';
    } else {
      // Kalau teks muat, stop animasi dan reset posisi
      content.style.animationPlayState = 'paused';
      content.style.animation = 'none';
      content.style.transform = 'translateX(0)';
    }
  }

  // Jalankan sekali saat setup
  updateAnimation();

  // Update lagi saat resize window supaya responsive
  window.addEventListener('resize', updateAnimation);
}

function playStation(station) {
  // Validasi URL: harus http atau https
  if (
    !station.url_resolved ||
    (!station.url_resolved.startsWith('http://') && !station.url_resolved.startsWith('https://'))
  ) {
    showErrorModal();
    return;
  }

  // ====== UI Langsung Diperbarui Sebelum Play ======
  nowPlaying.textContent = `🎶 ${station.name} (${station.country})`;
  updateMinimizedInfo(station);
  togglePlayBtn.classList.remove('fa-play');
  togglePlayBtn.classList.add('fa-pause');

  floatingPlayer.classList.remove('d-none');
  floatingPlayer.classList.remove('minimized');
  isMinimized = false;
  updateMinimizeIcon();
  setTimeout(() => floatingPlayer.classList.add('show'), 50);

  // ====== Hindari Set src Jika Tidak Berubah ======
  if (audioPlayer.src !== station.url_resolved) {
    audioPlayer.src = station.url_resolved;
  }

  // ====== Mainkan Audio ======
  audioPlayer.play()
    .catch(error => {
      console.error('Error saat memutar:', error);
      showErrorModal();
    });
}


function updateMinimizedInfo(station) {
  minTitle.textContent = station.name || "Tidak ada lagu";
  minDescription.textContent = station.country || "Deskripsi tidak tersedia";
}

function showErrorModal() {
  const modal = new bootstrap.Modal(document.getElementById('failModal'));
  modal.show();
}

togglePlayBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
});

// Sync ikon play/pause dengan status player
audioPlayer.addEventListener('play', () => {
  togglePlayBtn.classList.remove('fa-play');
  togglePlayBtn.classList.add('fa-pause');
});

audioPlayer.addEventListener('pause', () => {
  togglePlayBtn.classList.remove('fa-pause');
  togglePlayBtn.classList.add('fa-play');
});

// Minimize logic
minimizeBtn.addEventListener('click', () => {
  isMinimized = !isMinimized;
  floatingPlayer.classList.toggle('minimized');
  updateMinimizeIcon();
});

function updateMinimizeIcon() {
  minimizeBtn.classList.toggle('rotate-up', isMinimized);
  minimizeBtn.classList.toggle('rotate-down', !isMinimized);
}

// Exit logic
exitBtn.addEventListener('click', () => {
  floatingPlayer.classList.remove('show');
  setTimeout(() => floatingPlayer.classList.add('d-none'), 300);
  audioPlayer.pause();
  resetFloatingPlayerUI();
});

function resetFloatingPlayerUI() {
  floatingPlayer.classList.remove('minimized');
  isMinimized = false;
  updateMinimizeIcon();
  togglePlayBtn.classList.remove('fa-pause');
  togglePlayBtn.classList.add('fa-play');
  nowPlaying.textContent = 'Belum ada stasiun diputar.';
  audioPlayer.src = '';
  minTitle.textContent = '';
  minDescription.textContent = '';
}

function showLoading() {
  document.getElementById('loadingSpinner').classList.remove('d-none');
  radioList.innerHTML = '';
}

function hideLoading() {
  document.getElementById('loadingSpinner').classList.add('d-none');
}


// Init
fetchCountries();
fetchStarterStations(); // tampilkan starter saat awal buka
