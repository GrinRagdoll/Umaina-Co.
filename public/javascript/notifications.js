(function () {
    window.appSocket = window.appSocket || io();
    var socket = window.appSocket;

    if (window.currentUsername) {
        socket.emit('registerUser', window.currentUsername);
    }

    socket.on('notification', function (data) {
        var banner = document.getElementById('notif-banner');
        if (!banner) return;

        // Clear previous contents or links
        banner.innerHTML = '';

        if (data.url) {
            // Create a clickable link inside the banner if a URL is provided
            var link = document.createElement('a');
            link.href = data.url;
            link.textContent = data.message;
            link.style.color = 'inherit';
            link.style.textDecoration = 'underline';
            banner.appendChild(link);
        } else {
            banner.textContent = data.message;
        }

        banner.className = 'notif-banner show ' + data.type;
        
        // Optional: Keep win notifications longer so they can click it (e.g., 15 seconds)
        var timeoutDuration = data.type === 'won' ? 15000 : 7000;

        setTimeout(function () {
            banner.className = 'notif-banner';
        }, timeoutDuration);
    });
})();