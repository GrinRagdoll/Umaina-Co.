function toggleForms() {
    var loginDiv = document.getElementById('login-section');
    var regDiv = document.getElementById('register-section');
    if (loginDiv.classList.contains('hidden')) {
        loginDiv.classList.remove('hidden');
        regDiv.classList.add('hidden');
    } else {
        loginDiv.classList.add('hidden');
        regDiv.classList.remove('hidden');
    }
}