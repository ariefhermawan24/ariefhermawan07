document.addEventListener('DOMContentLoaded', () => {
  const countrySelect = document.getElementById('country');
  const genreSelect = document.getElementById('genre');
  const loadBtn = document.getElementById('loadBtn');
  const radioList = document.getElementById('radioList');
  const nowPlaying = document.getElementById('nowPlaying');
  const audioPlayer = document.getElementById('audioPlayer');

  const floatingPlayer = document.getElementById('floatingPlayer');
  const togglePlayBtn = document.getElementById('togglePlayBtn');
  const minimizedTogglePlayBtn = document.getElementById('minimizedtogglePlayBtn');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const exitBtn = document.getElementById('exitBtn');
  const minTitle = document.getElementById('minTitle');
  const minDescription = document.getElementById('minDescription');
  // Elemen tambahan
  const currentTimeDisplay = document.getElementById('currentTime');
  const muteBtn = document.getElementById('muteBtn');

  const navbarToggler = document.getElementById('navbarToggler');
  const icon = navbarToggler.querySelector('i');
  const navbarContent = document.getElementById('navbarContent');

  let animating = false;

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function animateIconChange(newClass) {
    if (animating) return; // blok jika masih animasi
    animating = true;

    // Fade out + rotate
    icon.style.opacity = 0;
    icon.style.transform = 'rotate(90deg)';

    await delay(300); // tunggu fade out selesai

    // Ganti class icon
    if (!icon.classList.contains(newClass)) {
      icon.classList.remove('fa-bars', 'fa-times');
      icon.classList.add(newClass);
    }

    // Paksa browser render style dulu
    requestAnimationFrame(() => {
      // Fade in + reset rotate
      icon.style.opacity = 1;
      icon.style.transform = 'rotate(0deg)';
    });

    animating = false;
  }

  navbarContent.addEventListener('show.bs.collapse', () => {
    animateIconChange('fa-times');
  });

  navbarContent.addEventListener('hide.bs.collapse', () => {
    animateIconChange('fa-bars');
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
      const res = await fetch('https://de1.api.radio-browser.info/json/stations/topclick/50');
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
  loadTopGenres(400); // Ambil 20 genre terpopuler

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

  document.getElementById('searchForm').addEventListener('submit', handleSearch);

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

  function setPlayButtonsState(state) {
    const icons = [togglePlayBtn, minimizedTogglePlayBtn];
    icons.forEach(icon => {
      icon.classList.remove('disabled-icon', 'error-icon');
      if (state === 'disabled') {
        icon.classList.add('disabled-icon');
        icon.style.pointerEvents = 'none';
      } else if (state === 'error') {
        icon.classList.add('error-icon');
        icon.style.pointerEvents = 'none';
      } else {
        icon.style.pointerEvents = 'auto';
      }
    });

  }

  function playStation(station) {
    if (
      !station.url_resolved ||
      (!station.url_resolved.startsWith("http://") &&
        !station.url_resolved.startsWith("https://"))
    ) {
      showErrorModal();
      setPlayButtonsState("error");
      return;
    }

    nowPlaying.textContent = `🎶 ${station.name} (${station.country})`;
    updateMinimizedInfo(station);

    // Ubah ikon jadi pause + disable klik sementara
    togglePlayBtn.classList.replace("fa-play", "fa-pause");
    minimizedTogglePlayBtn.classList.replace("fa-play", "fa-pause");
    setPlayButtonsState("disabled");

    floatingPlayer.classList.remove("d-none", "minimized");
    isMinimized = false;
    updateMinimizeIcon();
    setTimeout(() => floatingPlayer.classList.add("show"), 50);

    // Hapus event listener lama supaya tidak menumpuk
    audioPlayer.removeEventListener("canplaythrough", onCanPlayThrough);

    function onCanPlayThrough() {
      setPlayButtonsState(null);
      audioPlayer.play().catch((error) => {
        console.error("Error saat memutar setelah canplaythrough:", error);
        setPlayButtonsState("error");
        showErrorModal();
      });
      audioPlayer.removeEventListener("canplaythrough", onCanPlayThrough);
    }

    audioPlayer.addEventListener("canplaythrough", onCanPlayThrough);

    // Deteksi error awal sebelum atau sesudah set src
    function handlePlayError(error) {
      console.error("Error saat mencoba memutar:", error);
      setPlayButtonsState("error");
      showErrorModal();
    }

    // 🔽 Highlight radio aktif
    document.querySelectorAll('.list-group-item').forEach(li => {
      li.classList.remove('active-station');
    });

    const stationItems = document.querySelectorAll('.list-group-item');
    stationItems.forEach(li => {
      if (li.textContent.includes(station.name)) {
        li.classList.add('active-station');
      }
    });

    if (audioPlayer.src !== station.url_resolved) {
      audioPlayer.src = station.url_resolved;
      // Langsung coba play() untuk trigger error lebih awal jika ada
      audioPlayer
        .play()
        .then(() => setPlayButtonsState(null))
        .catch(handlePlayError);
    } else {
      audioPlayer
        .play()
        .then(() => setPlayButtonsState(null))
        .catch(handlePlayError);
    }

    // Tambahkan ini agar mute button selalu sinkron
    muteBtn.classList.toggle('fa-volume-high', !audioPlayer.muted);
    muteBtn.classList.toggle('fa-volume-xmark', audioPlayer.muted);
  }

  // Event listener play/pause tombol
  togglePlayBtn.addEventListener('click', () => {
    if (!togglePlayBtn.classList.contains('disabled-btn') && !togglePlayBtn.classList.contains('error-btn')) {
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    }
  });

  minimizedTogglePlayBtn.addEventListener('click', () => {
    if (!minimizedTogglePlayBtn.classList.contains('disabled-btn') && !minimizedTogglePlayBtn.classList.contains('error-btn')) {
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    }
  });

  // Sinkronisasi ikon
  audioPlayer.addEventListener('play', () => {
    togglePlayBtn.classList.replace('fa-play', 'fa-pause');
    minimizedTogglePlayBtn.classList.replace('fa-play', 'fa-pause');
  });

  audioPlayer.addEventListener('pause', () => {
    togglePlayBtn.classList.replace('fa-pause', 'fa-play');
    minimizedTogglePlayBtn.classList.replace('fa-pause', 'fa-play');
  });

  // Mute/Unmute
  muteBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted;
    muteBtn.classList.toggle('fa-volume-high', !audioPlayer.muted);
    muteBtn.classList.toggle('fa-volume-xmark', audioPlayer.muted);
  });

  // Update current time
  audioPlayer.addEventListener('timeupdate', () => {
    const minutes = Math.floor(audioPlayer.currentTime / 60);
    const seconds = Math.floor(audioPlayer.currentTime % 60);
    currentTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  function updateMinimizedInfo(station) {
    minTitle.textContent = station.name || "Tidak ada lagu";
    minDescription.textContent = station.country || "Deskripsi tidak tersedia";
  }

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

  function showErrorModal() {
    const modal = new bootstrap.Modal(document.getElementById('failModal'));
    modal.show();
  }


  // Init
  fetchCountries();
  fetchStarterStations(); // tampilkan starter saat awal buka

});