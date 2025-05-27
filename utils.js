import {
    app
} from './databases/config.js';
import {
    getDatabase,
    ref,
    get
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-database.js";

const db = getDatabase(app);

const checkFirebaseConnection = async () => {
    const testRef = ref(db, '/'); // root database

    try {
        const snapshot = await get(testRef);
        console.log("✅ Firebase terhubung.");
        if (snapshot.exists()) {
            console.log("📦 Data berhasil ditemukan");
        } else {
            console.log("⚠️ Firebase terhubung tapi database kosong.");
        }
    } catch (error) {
        console.error("❌ Gagal mengakses Firebase:", error);
    }
};

checkFirebaseConnection();

document.getElementById('codeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('codeInput');
    const form = document.getElementById('codeForm');
    const status = document.getElementById('loginStatus');
    const codeHelp = document.getElementById('codeHelp');
    const iconStatus = document.getElementById('iconStatus');
    const inputCode = input.value.trim();

    try {
        const codeRef = ref(db, 'codelogin/code');
        const snapshot = await get(codeRef);

        if (snapshot.exists()) {
            const storedCode = snapshot.val();

            if (inputCode === storedCode) {
                // Hide form, show status
                form.classList.add('d-none');
                status.classList.remove('d-none');

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = './admin-lu8o0m74-3dz9wka8';
                }, 3000);
            } else {
                // Ganti teks bantuan & ikon saat salah
                codeHelp.textContent = 'Kode salah. Coba lagi.';
                codeHelp.classList.remove('text-white');
                codeHelp.classList.add('text-modal-orange');

                iconStatus.classList.remove('fa-lock', 'text-modal-orange');
                iconStatus.classList.add('fa-times', 'icon-error');

                // Reset setelah 2 detik
                setTimeout(() => {
                    codeHelp.textContent = 'masukkan code akses';
                    codeHelp.classList.remove('text-danger');
                    codeHelp.classList.add('text-white');

                    iconStatus.classList.remove('fa-times', 'icon-error');
                    iconStatus.classList.add('fa-lock', 'text-modal-orange');
                }, 2000);
            }
        } else {
            alert('❌ Tidak ada kode admin terdaftar.');
        }
    } catch (error) {
        console.error('❌ Gagal mengakses Firebase:', error);
        alert('❌ Terjadi kesalahan saat memverifikasi kode.');
    }
});
