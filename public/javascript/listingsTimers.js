function updateTimers() {
    document.querySelectorAll('.timer').forEach(function (el) {
        var end = new Date(el.dataset.endtime).getTime();
        var now = Date.now();
        var diff = end - now;
        if (diff <= 0) {
            el.textContent = 'Ending soon...';
            return;
        }
        var hours = Math.floor(diff / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        var secs = Math.floor((diff % 60000) / 1000);
        el.textContent = 'Time left: ' + hours + 'h ' + mins + 'm ' + secs + 's';
    });
}
updateTimers();
setInterval(updateTimers, 1000);