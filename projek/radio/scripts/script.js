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

  function showToast(message) {
    const toast = document.getElementById("server-toast");
    toast.textContent = message;
    toast.classList.add("show");
    toast.classList.remove("hide");
  }

  function hideToast(delay = 1000) {
    const toast = document.getElementById("server-toast");
    setTimeout(() => {
      toast.classList.add("hide");
      toast.classList.remove("show");
    }, delay);
  }
  
  const serverList = [
    "https://de1.api.radio-browser.info/json/",
    "https://de2.api.radio-browser.info/json/",
    "https://fi1.api.radio-browser.info/json/"
  ];

  let selectedServer = ""; // akan diisi otomatis setelah pengecekan

  // ---------- Server Selection Logic ----------
  async function selectWorkingServer() {
    showToast("🔄 Fetching available servers...");
    for (const base of serverList) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // timeout 5 detik

        const resp = await fetch(base + "stations", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (resp.ok) {
          selectedServer = base;
          console.log(`✅ Connected to working server: ${base}`);
          showToast(`✅ Server loaded successfully`);
          hideToast(1500);
          return base;
        } else {
          console.warn(`⚠️ Server ${base} status ${resp.status}, mencoba berikutnya...`);
        }
      } catch (e) {
        console.warn(`❌ Gagal konek ke ${base}: ${e.message}`);
      }
    }
    showToast(`Sorry All Servers Unavailable :(`);
    throw new Error("🚨 Semua server Radio Browser gagal diakses.");
  }

  // ---------- Inisialisasi Aplikasi ----------
  (async () => {
    try {
      await selectWorkingServer(); // Jalankan 1x saja

      console.log("🎯 Active server:", selectedServer);

      // Setelah server aktif, langsung jalankan semua fungsi dependent
      await Promise.all([
        fetchCountries(),
        fetchStarterStations(),
        loadTopGenres(400),
        handleSearch()
      ]);
    } catch (err) {
      console.error("Gagal inisialisasi aplikasi:", err);
    }
  })();

  let animating = false;

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const filterBar = document.getElementById('filterBar');
  let isSticky = false;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 150) {
      if (!isSticky) {
        filterBar.classList.add('sticky-show');
        radioList.classList.add('mt-sticky');
        isSticky = true;
      }
    } else {
      if (isSticky) {
        filterBar.classList.remove('sticky-show');
        radioList.classList.remove('mt-sticky');
        isSticky = false;
      }
    }
  });

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
    radioList.classList.add('push-down');
    if (isSticky) {
      radioList.classList.add('mt-sticky');
    }
    filterBar.classList.add('push-down');
  });

  navbarContent.addEventListener('hide.bs.collapse', () => {
    animateIconChange('fa-bars');
    radioList.classList.remove('push-down');
    filterBar.classList.remove('push-down');
  });

  let isMinimized = false;
  let codeToCommonName = {};

  async function fetchCountries() {
    try {
      const [countriesRes, restCountriesRes] = await Promise.all([
        fetch(selectedServer + 'countries'),
        fetch('https://restcountries.com/v3.1/all?fields=cca2,name')
      ]);

      const countries = await countriesRes.json();
      const restCountriesRaw = await restCountriesRes.json();

      if (!Array.isArray(restCountriesRaw)) {
        console.error("API restcountries tidak mengembalikan array:", restCountriesRaw);
        return;
      }

      restCountriesRaw.forEach(country => {
        if (country.cca2 && country.name?.common) {
          codeToCommonName[country.cca2.toUpperCase()] = country.name.common;
        }
      });

      const excludedCountries = [
        // banned country
      ];

      // Proses dan filter negara
      const processed = countries
        .filter(c => c.iso_3166_1 && !excludedCountries.includes(c.name))
        .map(c => ({
          value: c.name,
          display: codeToCommonName[c.iso_3166_1.toUpperCase()] || c.iso_3166_1,
          code: c.iso_3166_1.toUpperCase()
        }))
        .sort((a, b) => a.display.localeCompare(b.display));

      // Clear sebelumnya
      countrySelect.innerHTML = '';
      const renderedValues = new Set();

      // Tambahkan "Semua Negara"
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'Semua Negara';
      countrySelect.appendChild(allOption);
      renderedValues.add(''); // tandai sudah ditambahkan

      // Render per batch
      let index = 0;
      const batchSize = 30;

      function renderNextBatch() {
        const batch = processed.slice(index, index + batchSize);
        batch.forEach(c => {
          if (!renderedValues.has(c.value)) {
            const option = document.createElement('option');
            option.value = c.value;
            option.textContent = c.display;
            option.dataset.code = c.code;
            countrySelect.appendChild(option);
            renderedValues.add(c.value);
          }
        });
        index += batchSize;
        if (index < processed.length) {
          // this 
          requestAnimationFrame(renderNextBatch);
        }
      }

      renderNextBatch();

    } catch (error) {
      console.error('Gagal memuat negara:', error);
    }
  }

  async function fetchStarterStations() {
    showLoading();
    try {
      const res = await fetch(selectedServer + 'stations/topclick/50');
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
      const res = await fetch(selectedServer + 'tags');
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
  loadTopGenres(400); 

  loadBtn.addEventListener('click', async () => {
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const countryCode = selectedOption?.dataset.code || '';
    const genre = genreSelect.value.trim();

    let url = selectedServer+'stations/search?limit=1000';

    if (countryCode !== '') {
      url += `&countrycode=${encodeURIComponent(countryCode)}`;
    }

    if (genre !== '') {
      url += `&tag=${encodeURIComponent(genre)}`;
    }

    showLoading();

    try {
      const res = await fetch(url);
      const stations = await res.json();

      const uniqueMap = new Map();
      for (const station of stations) {
        if (!station.url_resolved) continue;
        const key = `${station.name.trim().toLowerCase()}|${station.url_resolved.trim().toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, station);
        }
      }

      const uniqueStations = Array.from(uniqueMap.values());
      const topStations = uniqueStations.slice(0, 50);

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

    const url = selectedServer + `stations/search?name=${encodeURIComponent(query)}&limit=1000`;

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

    stations.forEach((station, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item flex-column justify-content-between align-items-start station-item';

      // Ambil nama negara umum dari kode
      const displayCountry =
        codeToCommonName[station.countrycode?.toUpperCase()] || station.country;

      li.innerHTML = `
  <div class="station-top-wrapper">
    <div class="station-logo">
      <img src="${station.favicon}" 
     onerror="this.onerror=null; this.src='./image/default-radio.png'" 
     alt="logo" 
     class="station-img" />
    </div>
    <div class="station-info">
      <strong>${station.name}</strong><br>
      <small>
        <div class="scroll-container">
          <div class="scroll-content">${displayCountry} • ${station.tags}</div>
        </div>
      </small>
    </div>
  </div>

  <div class="station-bottom d-flex justify-content-between align-items-center w-100 mt-1">
    <div class="d-flex align-items-center flex-wrap">
      ${station.bitrate ? `${station.bitrate} kbps` : '— kbps'}
      &nbsp;•&nbsp;
      <i class="fa-solid fa-wave-square" 
         title="HLS support"
         style="color: ${station.hls === 1 ? '#ffc107' : '#ccc'};"></i>
      &nbsp;•&nbsp;
      <i class="fa-${station.lastcheckok === 1 ? 'solid fa-circle-check' : 'solid fa-circle-xmark'}" 
         title="${station.lastcheckok === 1 ? 'OK' : 'Error'}"
         style="color: ${station.lastcheckok === 1 ? '#28a745' : '#dc3545'};"></i>
    </div>
    <button class="btn btn-sm btn-success">Putar</button>
  </div>
`;

      li.querySelector('button').addEventListener('click', () => playStation(station));
      radioList.appendChild(li);

      // Animasi: 1-per-1, lambat, terlihat urut
      li.style.opacity = 0;
      li.style.transform = 'translateY(30px)'; // lebih jauh biar lebih dramatis
      setTimeout(() => {
        li.style.transition = 'all 0.6s ease'; // lebih lambat
        li.style.opacity = 1;
        li.style.transform = 'translateY(0)';
      }, index * 150); // delay per item lebih besar agar tampak satu per satu

      setupScrollingAnimation(li);
    });
  }

  function setupScrollingAnimation(li, nowPlaying) {
    const containers = li.querySelectorAll('.scroll-container');

    containers.forEach(container => {
      const content = container.querySelector('.scroll-content');
      if (!content) return;

      function updateAnimation() {
        const containerWidth = container.clientWidth;
        const contentWidth = content.scrollWidth;

        if (contentWidth > containerWidth) {
          const overflow = containerWidth - contentWidth;
          const speed = 30; // px per detik
          const duration = Math.abs(overflow) / speed + 2;

          content.style.setProperty('--scroll-distance', `${overflow}px`);
          content.style.animation = `scroll-text ${duration}s linear infinite`;
          content.style.animationPlayState = 'running';
        } else {
          content.style.animationPlayState = 'paused';
          content.style.animation = 'none';
          content.style.transform = 'translateX(0)';
        }
      }

      // Jalankan saat setup
      updateAnimation();

      // Update animasi jika layar diubah ukurannya
      window.addEventListener('resize', updateAnimation);
    });
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

  const countryCache = {};

  async function getCountryNameFromCode(code) {
    if (!code) return 'Unknown';

    // Cek cache dulu
    if (countryCache[code]) return countryCache[code];

    try {
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
      const data = await res.json();

      if (Array.isArray(data) && data[0]?.name?.common) {
        const name = data[0].name.common;
        countryCache[code] = name;
        return name;
      }
    } catch (err) {
      console.warn('Gagal fetch negara dari kode:', code, err);
    }

    return code; // fallback ke kode-nya saja
  }

  async function playStation(station) {
    // Pastikan URL valid dan perbaiki jika masih pakai http://
  if (!station.url_resolved) {
    showErrorModal();
    setPlayButtonsState("error");
    return;
  }

  // Jika website kamu menggunakan HTTPS tapi stream masih HTTP,
  // ubah otomatis jadi HTTPS untuk menghindari mixed content error
  if (
    location.protocol === "https:" &&
    station.url_resolved.startsWith("http://")
  ) {
    const httpsUrl = station.url_resolved.replace("http://", "https://");
    console.log("URL diubah ke HTTPS:", httpsUrl);
    station.url_resolved = httpsUrl;
  }

  // Cek ulang apakah URL valid setelah konversi
  if (
    !station.url_resolved.startsWith("http://") &&
    !station.url_resolved.startsWith("https://")
  ) {
    showErrorModal();
    setPlayButtonsState("error");
    return;
  }

    const displayCountry = await getCountryNameFromCode(station.countrycode);

    nowPlaying.innerHTML = `
  <div class="d-flex flex-nowrap gap-3 align-items-start" style="min-height: 70px;">
        <div class="position-relative" style="min-width: 70px; width: 70px; height: 70px;">
      <img src="${station.favicon || './image/default-radio.png'}"
           alt="Logo"
           class="rounded border"
           style="width: 100%; height: 100%; object-fit: cover;"
           onerror="this.src='./image/default-radio.png'">

      ${
        station.homepage
          ? `<a href="${station.homepage}" target="_blank"
                class="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                style="
                  bottom: 4px;
                  right: 4px;
                  width: 16px;
                  height: 16px;
                  font-size: 0.75rem;
                  text-decoration: none;
                  background-color: rgba(255, 255, 255, 0.7);
                  backdrop-filter: blur(3px);
                  color: #000;
                  transition: background-color 0.2s;
                "
                title="Kunjungi Website">
                <i class="fas fa-globe"></i>
              </a>`
          : ''
      }
    </div>
    <div class="flex-grow-1 overflow-hidden">
      <div class="fw-bold fs-5 mb-1 text-truncate" style="max-width: 100%;">
        ${station.name}
      </div>
      <div class="scroll-container text-muted small" style="max-width: 100%;">
        <div class="scroll-content">
          ${displayCountry || 'Unknown'} • ${station.bitrate || '-'} kbps • ${station.codec || '-'}
        </div>
      </div>
    </div>
  </div>
`;

    requestAnimationFrame(() => {
      setupScrollingAnimation(nowPlaying);
    });


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

    // Mulai pemutaran dan atur Media Session
    if (audioPlayer.src !== station.url_resolved) {
      audioPlayer.src = station.url_resolved;
      audioPlayer
        .play()
        .then(() => {
          setPlayButtonsState(null);

          // ✅ Tambahkan Media Session API di sini
          if ("mediaSession" in navigator) {

            navigator.mediaSession.metadata = new MediaMetadata({
              title: station.name || "Radio",
              artist: displayCountry || "",
              album: station.tags || "",
              artwork: [{
                src: station.favicon || "./image/default-radio.png",
                sizes: "512x512",
                type: "image/png",
                onerror: "./image/default-radio.png",
              }, ],
            });

            navigator.mediaSession.setActionHandler("play", () => {
              audioPlayer.play();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
              audioPlayer.pause();
            });
          }
        })
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

  async function updateMinimizedInfo(station) {
    const displayCountry = await getCountryNameFromCode(station.countrycode);
    minTitle.textContent = station.name || "Tidak ada lagu";
    minDescription.textContent = displayCountry || "Deskripsi tidak tersedia";
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

    const radioList = document.getElementById('radioList');
    if (radioList) {
      radioList.style.marginBottom = isMinimized ? '80px' : '';
    }
  }

  // Exit logic
  exitBtn.addEventListener('click', () => {
    floatingPlayer.classList.remove('show');
    setTimeout(() => floatingPlayer.classList.add('d-none'), 300);
    audioPlayer.pause();
    resetFloatingPlayerUI();

    // 🔽 Hapus highlight radio aktif
    document.querySelectorAll('.list-group-item').forEach(li => {
      li.classList.remove('active-station');
    });
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