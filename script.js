document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");

    // Hamburger Toggle
    toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        sidebar.classList.toggle("show");
    });

    // Navbar Menu Navigation
    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();

            // Remove active class from previously active link
            document.querySelector(".nav-link.active")?.classList.remove("active");
            link.classList.add("active");

            // Remove active class from all sections
            sections.forEach(sec => sec.classList.remove("active"));

            // Get the target section ID and make it active
            const targetId = link.getAttribute("data-section");
            const targetSection = document.getElementById(targetId);
            targetSection.classList.add("active");

            // Scroll to the top of the page after navigation
            scrollToTop();

            // If the target section is 'home' and it's the first time, add hash to URL
            if (targetId === 'home' && !location.hash) {
                history.replaceState(null, null, "#homescreen");
            } else {
                // Remove hash from URL after navigation to ensure clean URL
                history.replaceState(null, null, " ");
            }
        });
    });

    function scrollToTop() {
        // Scroll ke bawah sedikit (misalnya 100px)
        window.scrollTo({
            top: window.scrollY + 5,
            behavior: 'smooth'
        });

        // Setelah 300ms, scroll ke atas
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 300); // ubah delay sesuai kebutuhan
    }

    function handleHashOnLoad() {
        const hash = location.hash;

        // Aktifkan section "home" terlebih dahulu
        const homeSection = document.getElementById("home");
        if (homeSection) {
            homeSection.classList.add("active");
        }

        if (!hash || hash === "#") {
            // Jika tidak ada hash, tambahkan #homescreen ke URL
            history.replaceState(null, null, "#homescreen");
            scrollToTop();
        } else {
            const targetSection = document.querySelector(hash);
            if (targetSection) {
                targetSection.classList.add("active");
                scrollToTop();
            }

            // Tetap tampilkan hash sebagai #homescreen di URL
            history.replaceState(null, null, "#homescreen");
        }
    }

    // Call handleHashOnLoad when the page loads
    window.addEventListener("load", handleHashOnLoad);


    window.addEventListener("scroll", () => {
        const footer = document.getElementById("footer");
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;

        if (scrolled >= scrollable - 1) {
            footer.classList.add("visible");
        } else {
            footer.classList.remove("visible");
        }
    });

    const section = document.querySelectorAll('.home-sub');
    const navDots = document.querySelectorAll('.home-sidebar .dot');

    function updateActiveDotByScroll() {
        let currentSection = '';
        section.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute('id');
            }
        });

        navDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('href') === '#' + currentSection) {
                dot.classList.add('active');
            }
        });
    }

    function setActiveDotByHash() {
        const hash = location.hash;

        if (hash) {
            // Jika ada hash di URL, aktifkan yang sesuai
            for (const dot of navDots) {
                if (dot.getAttribute('href') === hash) {
                    dot.classList.add('active');
                    break;
                }
            }
        }
    }

    // Event listener untuk scroll
    window.addEventListener('scroll', updateActiveDotByScroll);

    // Back to top button functionality
    const backToTopButton = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add("show");
        } else {
            backToTopButton.classList.remove("show");
        }
    });
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Download Button Animation
    document.getElementById("downloadBtn").addEventListener("click", function (e) {
        e.preventDefault();
        const btn = this;
        const iconContainer = btn.querySelector(".btn-icon i");
        const text = btn.querySelector(".btn-text");
        const dotAnim = btn.querySelector(".dot-anim");
        const progressBar = btn.querySelector(".progress-bar-anim");
        btn.classList.add("loading", "bouncing");
        text.textContent = "Downloading";
        dotAnim.classList.remove("d-none"); // Show dots
        progressBar.style.width = "100%";
        setTimeout(() => {
            iconContainer.className = "fas fa-check me-2";
            text.textContent = "Download Selesai";
            dotAnim.classList.add("d-none");
            document.getElementById("realDownload").click();
            setTimeout(() => {
                iconContainer.className = "fas fa-download me-2";
                text.textContent = "Download Resume";
                progressBar.style.width = "0%";
                btn.classList.remove("loading", "bouncing");
            }, 1500);
        }, 1300);
    });

    const items = document.querySelectorAll('.accordion-button');

    items.forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.querySelector('.chevron-icon');
            if (btn.classList.contains('collapsed')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    const accordion = document.querySelector('#accordionSkills');

    accordion.addEventListener('show.bs.collapse', function (event) {
        const button = event.target.previousElementSibling.querySelector('.accordion-button');
        const icon = button.querySelector('.chevron-icon');
        icon.style.transform = 'rotate(180deg)';
    });

    accordion.addEventListener('hide.bs.collapse', function (event) {
        const button = event.target.previousElementSibling.querySelector('.accordion-button');
        const icon = button.querySelector('.chevron-icon');
        icon.style.transform = 'rotate(0deg)';
    });

    // pengalaman kerja
    
    // Script untuk filter tombol 
    const buttons = document.querySelectorAll("[data-filter]");
    const item = document.querySelectorAll(".experience-item");
    const noExperience = document.getElementById("no-experience");

    let currentFilter = "magang";

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.getAttribute("data-filter");

            // Hapus semua kelas warna dan active dari semua tombol
            buttons.forEach(btn => {
                btn.classList.remove("active", "btn-info", "btn-warning", "btn-outline-info", "btn-outline-warning");
            });

            // Tambahkan warna dan active ke tombol yang dipilih
            if (filter === "kerja") {
                buttons.forEach(btn => {
                    btn.classList.add("btn-outline-warning");
                });
                button.classList.add("btn-warning"); // aktif
            } else if (filter === "magang") {
                buttons.forEach(btn => {
                    btn.classList.add("btn-outline-info");
                });
                button.classList.add("btn-info"); // aktif
            }
        });
    });

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.getAttribute("data-filter");

            // Reset tombol filter
            buttons.forEach(btn => {
                btn.classList.remove("active", "btn-info", "btn-warning", "btn-outline-info", "btn-outline-warning");
            });

            // Set semua tombol sesuai tema filter
            if (filter === "kerja") {
                buttons.forEach(btn => btn.classList.add("btn-outline-warning"));
                button.classList.add("btn-warning");
            } else if (filter === "magang") {
                buttons.forEach(btn => btn.classList.add("btn-outline-info"));
                button.classList.add("btn-info");
            }

            button.classList.add("active");

            // Menampilkan item yang sesuai dengan filter
            renderItems(filter);
        });
    });

    function getFilteredItems(filter) {
        return Array.from(item).filter(item => item.getAttribute("data-category") === filter);
    }

    function renderItems(filter) {
        const filtered = getFilteredItems(filter);
        const totalItems = filtered.length;

        // Reset semua item
        item.forEach(item => item.style.display = "none");

        if (totalItems === 0) {
            noExperience.style.display = "block";
            return;
        } else {
            noExperience.style.display = "none";
        }

        filtered.forEach(item => {
            item.style.display = "block";
        });
    }

    // Filter pertama kali
    const defaultBtn = document.querySelector("[data-filter='magang']");
    if (defaultBtn) {
        buttons.forEach(btn => btn.classList.remove("active"));
        defaultBtn.classList.add("active");
        renderItems("magang");
    }

    // Add filter button click events
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            const filter = button.getAttribute("data-filter");
            renderItems(filter);
        });
    });

    document.addEventListener('click', function (event) {
        const clickedCard = event.target.closest('.sertificate-card');

        document.querySelectorAll('.sertificate-card').forEach(card => {
            // Jika klik di luar card, hapus semua .active
            if (clickedCard !== card) {
                card.classList.remove('active');
            }
        });

        // Jika klik di dalam card, tambahkan class .active
        if (clickedCard) {
            clickedCard.classList.add('active');
        }
    }); 
    
    // contact
    const contactItems = document.querySelectorAll(".contact-item");

    // Saat item diklik (untuk mobile)
    contactItems.forEach((item) => {
        item.addEventListener("clickstart", function (e) {
            // Jika item sudah aktif, klik ulang akan menonaktifkan
            const isActive = item.classList.contains("active");

            // Hapus .active dari semua item
            contactItems.forEach((el) => el.classList.remove("active"));

            // Kalau sebelumnya belum aktif, aktifkan sekarang
            if (!isActive) {
                item.classList.add("active");
            }

            e.stopPropagation(); // Mencegah dianggap klik luar
        });
    });

    // Jika pengguna klik di luar komponen (mobile)
    document.addEventListener("touchstart", function (e) {
        if (!e.target.closest(".contact-item")) {
            contactItems.forEach((item) => item.classList.remove("active"));
        }
    });

    // Untuk desktop juga
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".contact-item")) {
            contactItems.forEach((item) => item.classList.remove("active"));
        }
    });

    const hash = window.location.hash;
    if (hash === "#manage") {
        const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
        loginModal.show();
    } // Optional: remove #manage from URL after opening 
    window.history.replaceState({}, document.title, window.location.pathname);

});