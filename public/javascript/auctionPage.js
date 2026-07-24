(function () {
    window.appSocket = window.appSocket || io();
    var socket = window.appSocket;
    var productId = window.productId;
    var bidCount = document.getElementById('bid-history').querySelectorAll('.ledger-row').length;
    socket.emit('joinProduct', productId);

    socket.on('newBid', function (data) {
        if (data.productId === productId) {
            var bidEl = document.getElementById('current-bid');
            bidEl.textContent = '$' + Number(data.currentBid).toLocaleString();

            document.getElementById('highest-bidder').textContent = data.highestBidder;

            bidCount += 1;
            var bidCountEl = document.getElementById('bid-count');
            if (bidCountEl) bidCountEl.textContent = bidCount;
            var ledgerTotalEl = document.getElementById('ledger-total');
            if (ledgerTotalEl) ledgerTotalEl.textContent = bidCount + ' entries';

            var list = document.getElementById('bid-history');
            var empty = list.querySelector('.ledger-empty');
            if (empty) empty.remove();

            var li = document.createElement('li');
            li.className = 'ledger-row';
            li.innerHTML = '<span class="ledger-num">' + String(bidCount).padStart(3, '0') + '</span>' +
                '<span class="ledger-name">' + data.highestBidder + '</span>' +
                '<span class="ledger-amount">$' + Number(data.currentBid).toLocaleString() + '</span>';
            list.insertBefore(li, list.firstChild);

            var input = document.getElementById('bid-amount');
            if (input) input.min = data.currentBid + 1;
        }
    });

    socket.on('auctionEnded', function (data) {
        if (data.productId === productId) {
            var timerStat = document.getElementById('timer-stat');
            if (timerStat) timerStat.textContent = 'Ended';
            var bidSection = document.getElementById('bid-section');
            if (bidSection) {
                bidSection.innerHTML = '<p class="login-note-live">Auction ended. Winner: ' + (data.winner || 'No bids placed') + '</p>';
            }
        }
    });

    if (window.productStatus === 'active') {
        var updateTimer = function () {
            var box = document.getElementById('timer-box');
            if (!box) return;
            var end = new Date(box.dataset.endtime).getTime();
            var now = Date.now();
            var diff = end - now;
            if (diff <= 0) {
                box.textContent = 'Ending...';
                return;
            }
            var hours = Math.floor(diff / 3600000);
            var mins = Math.floor((diff % 3600000) / 60000);
            var secs = Math.floor((diff % 60000) / 1000);
            box.textContent = hours + 'h ' + mins + 'm ' + secs + 's';
        };
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    var form = document.getElementById('bid-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var amount = document.getElementById('bid-amount').value;
            var response = await fetch('/api/bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: productId, amount: amount })
            });
            if (!response.ok) {
                var msg = await response.text();
                alert(msg);
            }
            document.getElementById('bid-amount').value = '';
        });
    }
})();