document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi viewer dengan skinview3d
    const skinViewer = new skinview3d.SkinViewer({
        container: document.getElementById('minecraft-viewer'),
        width: 600,
        height: 400,
        skin: 'https://minecraftskinstealer.com/skin/Steve' // Skin default
    });
    
    // Atur pencahayaan
    skinViewer.cameraLight.intensity = 0.8;
    skinViewer.globalLight.intensity = 0.2;
    
    // Atur rotasi awal
    skinViewer.player.rotation.y = Math.PI / 4;
    
    // Variabel untuk animasi
    let isRecording = false;
    let animationFrames = [];
    let startTime = null;
    
    // Fungsi untuk memperbarui rotasi bagian tubuh
    function updateBoneRotation(bone, axis, value) {
        const rotation = skinViewer.player[bone].rotation;
        rotation[axis] = value * Math.PI / 180; // Konversi dari derajat ke radian
        
        // Jika sedang merekam, simpan frame
        if (isRecording) {
            const currentTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Cari apakah sudah ada frame untuk waktu ini
            let frameIndex = animationFrames.findIndex(frame => frame.time === currentTime);
            
            if (frameIndex === -1) {
                // Buat frame baru
                animationFrames.push({
                    time: currentTime,
                    bones: {}
                });
                frameIndex = animationFrames.length - 1;
            }
            
            // Pastikan objek bone ada
            if (!animationFrames[frameIndex].bones[bone]) {
                animationFrames[frameIndex].bones[bone] = {
                    rotation: {}
                };
            }
            
            // Simpan rotasi
            animationFrames[frameIndex].bones[bone].rotation[axis] = value;
        }
    }
    
    // Event listener untuk kontrol slider
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', (e) => {
            const bone = e.target.dataset.bone;
            const axis = e.target.dataset.axis;
            const value = parseFloat(e.target.value);
            
            updateBoneRotation(bone, axis, value);
        });
    });
    
    // Tombol Start
    document.getElementById('start-btn').addEventListener('click', () => {
        isRecording = true;
        startTime = Date.now();
        animationFrames = [];
        
        // Reset semua slider ke posisi awal
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.value = 0;
        });
        
        // Reset rotasi model
        Object.keys(skinViewer.player).forEach(bone => {
            if (skinViewer.player[bone].rotation) {
                skinViewer.player[bone].rotation.set(0, 0, 0);
            }
        });
        
        // Tambahkan frame awal
        animationFrames.push({
            time: "0.0",
            bones: {}
        });
        
        // Tambahkan animasi subtle ke tombol
        document.getElementById('start-btn').style.transform = 'scale(0.95)';
        setTimeout(() => {
            document.getElementById('start-btn').style.transform = 'scale(1)';
        }, 200);
    });
    
    // Tombol Stop
    document.getElementById('stop-btn').addEventListener('click', () => {
        isRecording = false;
        
        // Konversi frame animasi ke format JSON Minecraft
        const animationData = {
            format_version: "1.8.0",
            animations: {
                "animation.player.custom": {
                    animation_length: parseFloat(animationFrames[animationFrames.length - 1].time),
                    loop: false,
                    bones: {}
                }
            }
        };
        
        // Proses frame animasi
        animationFrames.forEach(frame => {
            Object.keys(frame.bones).forEach(bone => {
                if (!animationData.animations["animation.player.custom"].bones[bone]) {
                    animationData.animations["animation.player.custom"].bones[bone] = {
                        rotation: {}
                    };
                }
                
                animationData.animations["animation.player.custom"].bones[bone].rotation[frame.time] = [
                    frame.bones[bone].rotation.x || 0,
                    frame.bones[bone].rotation.y || 0,
                    frame.bones[bone].rotation.z || 0
                ];
            });
        });
        
        // Tampilkan JSON di textarea
        document.getElementById('json-result').value = JSON.stringify(animationData, null, 2);
        
        // Tambahkan animasi subtle ke tombol
        document.getElementById('stop-btn').style.transform = 'scale(0.95)';
        setTimeout(() => {
            document.getElementById('stop-btn').style.transform = 'scale(1)';
        }, 200);
    });
    
    // Tombol Delete
    document.getElementById('delete-btn').addEventListener('click', () => {
        isRecording = false;
        animationFrames = [];
        
        // Reset semua slider ke posisi awal
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.value = 0;
        });
        
        // Reset rotasi model
        Object.keys(skinViewer.player).forEach(bone => {
            if (skinViewer.player[bone].rotation) {
                skinViewer.player[bone].rotation.set(0, 0, 0);
            }
        });
        
        // Kosongkan textarea JSON
        document.getElementById('json-result').value = '';
        
        // Tambahkan animasi subtle ke tombol
        document.getElementById('delete-btn').style.transform = 'scale(0.95)';
        setTimeout(() => {
            document.getElementById('delete-btn').style.transform = 'scale(1)';
        }, 200);
    });
    
    // Upload skin
    document.getElementById('skin-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                skinViewer.loadSkin(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Reset skin
    document.getElementById('reset-skin').addEventListener('click', () => {
        skinViewer.loadSkin('https://minecraftskinstealer.com/skin/Steve');
        document.getElementById('skin-input').value = '';
    });
    
    // Salin JSON
    document.getElementById('copy-json').addEventListener('click', () => {
        const jsonText = document.getElementById('json-result').value;
        if (jsonText) {
            navigator.clipboard.writeText(jsonText)
                .then(() => {
                    // Tampilkan notifikasi
                    const button = document.getElementById('copy-json');
                    const originalText = button.textContent;
                    button.textContent = 'Tersalin!';
                    button.style.backgroundColor = '#5cb85c';
                    
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '#5bc0de';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Gagal menyalin teks: ', err);
                });
        }
    });
    
    // Animasi idle untuk model
    let idleAnimation = null;
    
    function startIdleAnimation() {
        if (idleAnimation) return;
        
        idleAnimation = setInterval(() => {
            if (!isRecording) {
                // Animasi idle subtle
                const time = Date.now() * 0.001;
                skinViewer.player.head.rotation.y = Math.sin(time) * 0.05;
                skinViewer.player.body.rotation.y = Math.sin(time) * 0.02;
            }
        }, 50);
    }
    
    function stopIdleAnimation() {
        if (idleAnimation) {
            clearInterval(idleAnimation);
            idleAnimation = null;
        }
    }
    
    // Mulai animasi idle
    startIdleAnimation();
    
    // Hentikan animasi idle saat merekam
    document.getElementById('start-btn').addEventListener('click', stopIdleAnimation);
    document.getElementById('stop-btn').addEventListener('click', startIdleAnimation);
    document.getElementById('delete-btn').addEventListener('click', startIdleAnimation);
});
