(function(){
  var nav = document.querySelector('.nav');
  var row = document.querySelector('.navRow');
  var links = document.querySelector('.links');
  if (!nav || !row || !links) return;

  function ensureStylesheet(href){
    if (document.querySelector('link[href="' + href + '"]')) return;
    var sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = href;
    document.head.appendChild(sheet);
  }
  ensureStylesheet('mobile-fixes.css');
  ensureStylesheet('content-fixes.css');

  var themeButton = links.querySelector('.themeToggle') || row.querySelector('.themeToggle');
  if (!row.querySelector('.menuToggle')) {
    var menuButton = document.createElement('button');
    menuButton.className = 'menuToggle';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Buka menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(menuButton);
  }
  var menuToggle = row.querySelector('.menuToggle');
  if (themeButton && !row.querySelector('.mobileHeaderThemeToggle')) {
    var mobileThemeButton = document.createElement('button');
    mobileThemeButton.className = 'themeToggle mobileHeaderThemeToggle';
    mobileThemeButton.type = 'button';
    mobileThemeButton.setAttribute('aria-label', 'Toggle light and dark mode');
    row.insertBefore(mobileThemeButton, row.querySelector('.navCta') || menuToggle);
  }
  var mobileMenu = document.querySelector('.mobileNavMenu');
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobileNavMenu';
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    mobileMenu.innerHTML = [
      '<div class="mobileNavScrim" data-menu-close></div>',
      '<div class="mobileNavPanel" role="dialog" aria-label="Menu mudah alih">',
      '<div class="mobileNavPanelHead">',
      '<a class="mobileNavBrand" href="index.html" aria-label="Salut Transport Home">',
      '<span class="mobileNavLogo"><img src="assets/logo.png" alt=""></span>',
      '<span><strong>SALUT</strong><small>TRANSPORT</small></span>',
      '</a>',
      '<button class="mobileNavClose" type="button" aria-label="Tutup menu" data-menu-close>×</button>',
      '</div>',
      '<nav class="mobileNavLinks" aria-label="Mobile navigation">',
      '<a href="index.html#kenapa">Kenapa Kami</a>',
      '<a href="index.html#pakej">Pakej</a>',
      '<a href="index.html#daftar">Cara Daftar</a>',
      '<a href="index.html#tentang">Tentang</a>',
      '<a href="index.html#kawasan">Kawasan</a>',
      '<a href="index.html#faq">FAQ</a>',
      '<a href="index.html#review">Testimoni</a>',
      '</nav>',
      '<div class="mobileNavActions">',
      '<div class="mobileThemeRow"><span>Tema</span><button class="themeToggle mobileThemeToggle" type="button" aria-label="Toggle light and dark mode"></button></div>',
      '<a class="mobileNavPrimary" href="index.html#contact">Semak Slot</a>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(mobileMenu);
  } else if (mobileMenu.parentElement !== document.body) {
    document.body.appendChild(mobileMenu);
  }

  var lastMenuFocus = null;
  function setMenu(open, restoreFocus){
    if (open) lastMenuFocus = document.activeElement;
    nav.classList.toggle('menuOpen', open);
    document.body.classList.toggle('mobileMenuLocked', open);
    document.body.classList.toggle('mobileMenuOpen', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    if (mobileMenu) {
      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      mobileMenu.inert = !open;
    }
    if (open) {
      window.requestAnimationFrame(function(){
        var closeButton = mobileMenu ? mobileMenu.querySelector('.mobileNavClose') : null;
        if (closeButton) closeButton.focus({preventScroll:true});
      });
    } else if (restoreFocus !== false && lastMenuFocus && document.contains(lastMenuFocus)) {
      lastMenuFocus.focus({preventScroll:true});
    }
  }
  function closeMenu(restoreFocus){
    setMenu(false, restoreFocus);
  }
  menuToggle.addEventListener('click', function(event){
    event.stopPropagation();
    var shouldOpen = !nav.classList.contains('menuOpen');
    setMenu(shouldOpen, true);
  });
  links.querySelectorAll('a').forEach(function(link){ link.addEventListener('click', closeMenu); });
  mobileMenu.querySelectorAll('a').forEach(function(item){ item.addEventListener('click', function(){ closeMenu(false); }); });
  mobileMenu.querySelectorAll('[data-menu-close]').forEach(function(item){ item.addEventListener('click', function(){ closeMenu(true); }); });
  var mobilePanel = mobileMenu.querySelector('.mobileNavPanel');
  if (mobilePanel) {
    mobilePanel.addEventListener('click', function(event){ event.stopPropagation(); });
  }
  document.addEventListener('click', function(event){ if (nav.classList.contains('menuOpen') && !nav.contains(event.target)) closeMenu(true); });
  document.addEventListener('keydown', function(event){ if (event.key === 'Escape') closeMenu(true); });

  var key = 'theme';
  var buttons = document.querySelectorAll('.themeToggle');
  function preferredTheme(){
    var stored = localStorage.getItem(key) || localStorage.getItem('salut-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }
  function upgradeThemeButton(button){
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-label', 'Toggle light and dark mode');
    button.innerHTML = '<span class="themeTrack" aria-hidden="true"><span class="themeThumb"><svg class="themeIcon themeMoon" viewBox="0 0 24 24" fill="none"><path d="M20 15.4A7.8 7.8 0 0 1 8.6 4a8.2 8.2 0 1 0 11.4 11.4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="themeIcon themeSun" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span></span>';
  }
  function apply(mode){
    var dark = mode === 'dark';
    document.documentElement.setAttribute('data-theme', mode);
    document.body.classList.toggle('darkMode', dark);
    buttons.forEach(function(button){
      button.setAttribute('aria-checked', mode === 'light' ? 'true' : 'false');
    });
    localStorage.setItem(key, mode);
    localStorage.setItem('salut-theme', mode);
  }
  buttons.forEach(upgradeThemeButton);
  apply(preferredTheme());
  buttons.forEach(function(button){
    if (button.dataset.themeBound === 'true') return;
    button.dataset.themeBound = 'true';
    button.addEventListener('click', function(){ apply(document.body.classList.contains('darkMode') ? 'light' : 'dark'); });
  });

  var heroGallery = document.querySelector('.heroGallery');
  if (heroGallery && heroGallery.dataset.heroImages) {
    var heroImages = heroGallery.dataset.heroImages.split(',').map(function(path){ return path.trim(); }).filter(Boolean);
    if (heroImages.length) {
      heroGallery.innerHTML = heroImages.map(function(path, index){
        return '<img class="heroSlide' + (index === 0 ? ' isActive' : '') + '" src="' + path + '" alt="">';
      }).join('');
    }
  }
  var heroSlides = Array.prototype.slice.call(document.querySelectorAll('.heroSlide'));
  var heroPrev = document.querySelector('.heroSlidePrev');
  var heroNext = document.querySelector('.heroSlideNext');
  var heroDotsWrap = document.querySelector('.heroSlideDots');
  var heroDots = [];
  var heroIndex = 0;
  var heroTimer = null;
  if (heroDotsWrap && heroSlides.length > 1) {
    heroDotsWrap.innerHTML = heroSlides.map(function(_, index){
      return '<button type="button" class="heroSlideDot' + (index === 0 ? ' isActive' : '') + '" aria-label="Papar gambar ' + (index + 1) + '"></button>';
    }).join('');
    heroDots = Array.prototype.slice.call(heroDotsWrap.querySelectorAll('.heroSlideDot'));
  } else if (heroDotsWrap) {
    heroDotsWrap.hidden = true;
  }
  function showHeroSlide(index){
    if (!heroSlides.length) return;
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach(function(slide, slideIndex){
      slide.classList.toggle('isActive', slideIndex === heroIndex);
    });
    heroDots.forEach(function(dot, dotIndex){
      dot.classList.toggle('isActive', dotIndex === heroIndex);
      dot.setAttribute('aria-current', dotIndex === heroIndex ? 'true' : 'false');
    });
  }
  function nextHeroSlide(){ showHeroSlide(heroIndex + 1); }
  function resetHeroTimer(){
    if (!heroSlides.length) return;
    window.clearInterval(heroTimer);
    heroTimer = window.setInterval(nextHeroSlide, 5200);
  }
  if (heroSlides.length) {
    if (heroPrev) heroPrev.addEventListener('click', function(){ showHeroSlide(heroIndex - 1); resetHeroTimer(); });
    if (heroNext) heroNext.addEventListener('click', function(){ showHeroSlide(heroIndex + 1); resetHeroTimer(); });
    heroDots.forEach(function(dot, dotIndex){
      dot.addEventListener('click', function(){ showHeroSlide(dotIndex); resetHeroTimer(); });
    });
    resetHeroTimer();
  }

  document.querySelectorAll('.whatsappForm').forEach(function(form){
    form.addEventListener('submit', function(event){
      event.preventDefault();
      var lines = ['Assalamualaikum, saya nak semak slot van sekolah.', ''];
      new FormData(form).forEach(function(value, key){ if (value) lines.push(key + ': ' + value); });
      window.open('https://wa.me/60123539977?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });

  document.querySelectorAll('.sheetRegistrationForm').forEach(function(form){
    var status = form.querySelector('.sheetFormStatus');
    var birthInput = form.querySelector('input[name="tarikhLahir"]');
    var ageInput = form.querySelector('input[name="umur"]');
    var schoolLevelInput = form.querySelector('select[name="darjahTingkatan2027"]');
    var tripSelect = form.querySelector('[data-trip-select]');
    var tripOne = form.querySelector('[data-trip-one]');
    var tripTwo = form.querySelector('[data-trip-two]');
    var tripOneTitle = form.querySelector('[data-trip-one-title]');
    var submitButton = form.querySelector('button[type="submit"]');
    var requestStorageKey = 'salut-registration-request-id';
    function makeRequestId(){
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      var bytes = new Uint8Array(16);
      if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
      else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      return Array.prototype.map.call(bytes, function(value){ return value.toString(16).padStart(2, '0'); }).join('');
    }
    function currentRequestId(){
      var existing = sessionStorage.getItem(requestStorageKey);
      if (existing) return existing;
      var created = makeRequestId();
      sessionStorage.setItem(requestStorageKey, created);
      return created;
    }
    function normalizePhone(value){
      var digits = String(value || '').replace(/\D/g, '');
      if (!digits) return '';
      if (digits.indexOf('60') === 0) return digits;
      if (digits.charAt(0) === '0') return '6' + digits;
      return '60' + digits;
    }
    function isValidPhone(value){
      return /^60\d{9,10}$/.test(normalizePhone(value));
    }
    function normalizeIc(value){
      return String(value || '').replace(/\D/g, '').slice(0, 12);
    }
    function titleCase(value){
      return String(value || '').toLowerCase().replace(/\b([a-z])/g, function(letter){ return letter.toUpperCase(); });
    }
    function setTripFields(container, active){
      if (!container) return;
      container.hidden = !active;
      container.querySelectorAll('input,select,textarea').forEach(function(field){
        field.disabled = !active;
        field.required = active;
        if (!active) field.value = '';
      });
    }
    function updateTripFields(){
      var value = tripSelect ? tripSelect.value : '';
      if (tripOneTitle) {
        tripOneTitle.textContent = value === 'BALIK' ? 'Perjalanan balik' : 'Perjalanan pergi';
      }
      setTripFields(tripOne, value === 'PERGI' || value === 'BALIK');
      setTripFields(tripTwo, value === 'PERGI DAN BALIK');
    }
    if (tripSelect) {
      tripSelect.addEventListener('change', updateTripFields);
      updateTripFields();
    }
    function schoolLevel2027(birthYear){
      var levels = {
        2020: 'Darjah 1', 2019: 'Darjah 2', 2018: 'Darjah 3', 2017: 'Darjah 4',
        2016: 'Darjah 5', 2015: 'Darjah 6', 2014: 'Tingkatan 1', 2013: 'Tingkatan 2',
        2012: 'Tingkatan 3', 2011: 'Tingkatan 4', 2010: 'Tingkatan 5'
      };
      return levels[birthYear] || 'Perlu semakan';
    }
    if (birthInput && ageInput) {
      var updateSchoolYear = function(){
        if (!birthInput.value) {
          ageInput.value = '';
          if (schoolLevelInput) schoolLevelInput.value = '';
          return;
        }
        var birthDate = new Date(birthInput.value + 'T00:00:00');
        var age = 2027 - birthDate.getFullYear();
        ageInput.value = age >= 0 ? String(age) : '';
        if (schoolLevelInput) schoolLevelInput.value = schoolLevel2027(birthDate.getFullYear());
      };
      birthInput.addEventListener('change', updateSchoolYear);
      updateSchoolYear();
    }
    function setStatus(message, type){
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('isSuccess', type === 'success');
      status.classList.toggle('isError', type === 'error');
    }
    var guardianPhoneFields = [
      {name: 'telefonAyah', label: 'ayah'},
      {name: 'telefonIbu', label: 'ibu'}
    ];
    guardianPhoneFields.forEach(function(item){
      var field = form.elements[item.name];
      if (!field) return;
      field.addEventListener('input', function(){
        field.setCustomValidity(field.value && !isValidPhone(field.value)
          ? 'Masukkan nombor telefon ' + item.label + ' yang lengkap, contoh 0181234567.'
          : '');
      });
    });
    form.addEventListener('invalid', function(event){
      var item = guardianPhoneFields.find(function(candidate){ return candidate.name === event.target.name; });
      if (!item || !event.target.value || isValidPhone(event.target.value)) return;
      event.target.setCustomValidity('Masukkan nombor telefon ' + item.label + ' yang lengkap, contoh 0181234567.');
      setStatus('No. telefon ' + item.label + ' tidak lengkap. Semak nombor tersebut dan cuba lagi.', 'error');
    }, true);
    form.addEventListener('submit', function(event){
      event.preventDefault();
      if (form.dataset.submitting === 'true') return;
      var endpoint = form.dataset.endpoint || '';
      if (!endpoint) {
        setStatus('Google Sheet endpoint belum disambungkan. Deploy Google Apps Script dahulu, kemudian masukkan Web App URL.', 'error');
        return;
      }
      var payload = {};
      new FormData(form).forEach(function(value, key){ payload[key] = value; });
      payload.clientRequestId = currentRequestId();
      payload.termsAccepted = payload.termsAccepted === 'true';
      payload.privacyAccepted = payload.privacyAccepted === 'true';
      payload.namaAnak = titleCase(payload.namaAnak);
      payload.namaIbu = titleCase(payload.namaIbu);
      payload.namaAyah = titleCase(payload.namaAyah);
      payload.telefonIbu = normalizePhone(payload.telefonIbu);
      payload.telefonAyah = normalizePhone(payload.telefonAyah);
      var invalidPhone = guardianPhoneFields.find(function(item){ return !isValidPhone(payload[item.name]); });
      if (invalidPhone) {
        var invalidField = form.elements[invalidPhone.name];
        if (invalidField) {
          invalidField.setCustomValidity('Masukkan nombor telefon ' + invalidPhone.label + ' yang lengkap, contoh 0181234567.');
          invalidField.reportValidity();
          invalidField.focus();
        }
        setStatus('No. telefon ' + invalidPhone.label + ' tidak lengkap. Semak nombor tersebut dan cuba lagi.', 'error');
        return;
      }
      payload.icIbu = normalizeIc(payload.icIbu);
      payload.icAyah = normalizeIc(payload.icAyah);
      setStatus('Pendaftaran sedang dihantar — biasanya siap dalam 1–2 saat. Jangan refresh halaman ini.', '');
      form.dataset.submitting = 'true';
      var submitLabel = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sedang dihantar…';
      }
      var reassuranceTimer = window.setTimeout(function(){
        if (form.dataset.submitting === 'true') setStatus('Pendaftaran sudah diterima dan sedang disahkan. Jangan refresh atau tekan semula.', '');
      }, 1800);
      function sendRegistration(attempt){
        return fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        }).then(function(response){
          return response.json().catch(function(){ return null; }).then(function(data){
            if (response.ok && data && data.success) return data;
            var retryable = !response.ok && response.status >= 500;
            if (retryable && attempt < 2) {
              setStatus('Pendaftaran sedang disahkan. Jangan tutup halaman ini...', '');
              return new Promise(function(resolve){ setTimeout(resolve, 1500); }).then(function(){
                return sendRegistration(attempt + 1);
              });
            }
            throw new Error('registration_rejected');
          });
        }).catch(function(error){
          if (attempt < 2 && error && error.message !== 'registration_rejected') {
            setStatus('Pendaftaran sedang disahkan. Jangan tutup halaman ini...', '');
            return new Promise(function(resolve){ setTimeout(resolve, 1500); }).then(function(){
              return sendRegistration(attempt + 1);
            });
          }
          throw error;
        });
      }
      sendRegistration(1).then(function(data){
        sessionStorage.removeItem(requestStorageKey);
        form.reset();
        updateTripFields();
        setStatus('Pendaftaran berjaya dihantar. ID rujukan: ' + data.submissionId, 'success');
      }).catch(function(){
        setStatus('Pendaftaran belum dapat disahkan. Jangan isi borang baharu — tekan Hantar Pendaftaran sekali lagi atau hubungi WhatsApp.', 'error');
      }).finally(function(){
        window.clearTimeout(reassuranceTimer);
        form.dataset.submitting = 'false';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
      });
    });
  });

  var mapFrame = document.getElementById('schoolMap');
  var mapName = document.getElementById('schoolMapName');
  var mapArea = document.getElementById('schoolMapArea');
  var mapLink = document.getElementById('schoolMapLink');
  document.querySelectorAll('.schoolSelect').forEach(function(button){
    button.addEventListener('click', function(){
      var query = button.dataset.query || '';
      var name = button.dataset.name || query;
      var area = button.dataset.area || '';
      var mapUrl = button.dataset.mapUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query));
      document.querySelectorAll('.schoolCard').forEach(function(card){ card.classList.remove('isActive'); });
      var activeCard = button.closest('.schoolCard');
      if (activeCard) activeCard.classList.add('isActive');
      if (mapName) mapName.textContent = name;
      if (mapArea) mapArea.textContent = area;
      if (mapLink) mapLink.href = mapUrl;
      if (mapFrame) mapFrame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
    });
  });

  var faqDaftar = document.querySelector('[data-go-daftar]');
  if (faqDaftar) {
    faqDaftar.addEventListener('click', function(event){
      if (event.target.closest('summary')) return;
      document.getElementById('daftar')?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  var floatingWhatsapp = document.querySelector('.whatsappBox');
  var chatBox = document.querySelector('.mobileWhatsAppChat');
  var chatOverlay = document.querySelector('.whatsappChatOverlay');
  var whatsappDefaultMessage = 'Assalamualaikum! Saya nak tanya tentang servis van sekolah Salut Transport.';
  var whatsappMessages = {
    slot: 'Assalamualaikum, saya nak semak slot van sekolah untuk anak saya.',
    price: 'Assalamualaikum, saya nak tanya harga pakej van sekolah Salut Transport.',
    area: 'Assalamualaikum, saya nak tanya kawasan yang diliputi oleh Salut Transport.'
  };
  function whatsappUrl(message){
    return 'https://wa.me/60123539977?text=' + encodeURIComponent(message || whatsappDefaultMessage);
  }
  if (floatingWhatsapp && !chatBox) {
    chatBox = document.createElement('div');
    chatBox.className = 'mobileWhatsAppChat';
    chatBox.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(chatBox, floatingWhatsapp.nextSibling);
  }
  if (floatingWhatsapp && chatBox) {
    if (!chatOverlay) {
      chatOverlay = document.createElement('button');
      chatOverlay.className = 'whatsappChatOverlay';
      chatOverlay.type = 'button';
      chatOverlay.setAttribute('aria-label', 'Tutup chat WhatsApp');
      chatOverlay.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(chatOverlay, chatBox);
    }
    floatingWhatsapp.setAttribute('role', 'button');
    floatingWhatsapp.setAttribute('aria-label', 'Buka chat WhatsApp Salut Transport');
    floatingWhatsapp.setAttribute('aria-expanded', 'false');
    floatingWhatsapp.innerHTML = '<span class="whatsappFloatingIcon" aria-hidden="true"></span><span class="whatsappUnreadBadge" aria-hidden="true">1</span>';
    chatBox.setAttribute('role', 'dialog');
    chatBox.setAttribute('aria-modal', 'false');
    chatBox.setAttribute('aria-label', 'Chat WhatsApp Salut Transport');
    chatBox.innerHTML = [
      '<div class="chatHead">',
      '<div class="chatIdentity">',
      '<span class="chatAvatar" aria-hidden="true"><img src="assets/logo.png" alt=""><i></i></span>',
      '<span><strong>Salut Transport</strong><small>Online sekarang</small></span>',
      '</div>',
      '<button type="button" class="chatClose" aria-label="Tutup chat">×</button>',
      '</div>',
      '<div class="chatBody">',
      '<p class="chatBubble">Assalamualaikum! Ada apa yang boleh kami bantu untuk perjalanan sekolah anak?</p>',
      '<div class="chatQuickReplies" aria-label="Pilihan mesej pantas">',
      '<button type="button" data-message-key="slot">Semak slot van sekolah</button>',
      '<button type="button" data-message-key="price">Tanya harga pakej</button>',
      '<button type="button" data-message-key="area">Tanya kawasan diliputi</button>',
      '</div>',
      '</div>',
      '<div class="chatFooter">',
      '<a class="chatSend" href="' + whatsappUrl(whatsappDefaultMessage) + '" target="_blank" rel="noopener"><span aria-hidden="true"></span>Buka WhatsApp</a>',
      '</div>'
    ].join('');
    var closeChat = chatBox.querySelector('.chatClose');
    var sendChat = chatBox.querySelector('.chatSend');
    var quickReplies = Array.prototype.slice.call(chatBox.querySelectorAll('.chatQuickReplies button'));
    var lastChatFocus = null;
    var chatOpenedKey = 'salut-whatsapp-opened';
    var chatAutoKey = 'salut-whatsapp-auto-shown';
    function removeUnread(){
      floatingWhatsapp.classList.add('hasOpened');
      sessionStorage.setItem(chatOpenedKey, 'true');
    }
    if (sessionStorage.getItem(chatOpenedKey) === 'true') {
      floatingWhatsapp.classList.add('hasOpened');
    }
    function focusableChatItems(){
      return Array.prototype.slice.call(chatBox.querySelectorAll('button,a[href],textarea,input,select,[tabindex]:not([tabindex="-1"])')).filter(function(item){
        return !item.disabled && item.offsetParent !== null;
      });
    }
    function setChat(open, restoreFocus){
      if (open) lastChatFocus = document.activeElement;
      chatBox.classList.toggle('isOpen', open);
      chatBox.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('whatsappChatOpen', open);
      if (chatOverlay) {
        chatOverlay.classList.toggle('isOpen', open);
        chatOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      }
      floatingWhatsapp.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        removeUnread();
        setTimeout(function(){ if (closeChat) closeChat.focus({preventScroll:true}); }, 80);
      } else if (restoreFocus !== false && lastChatFocus && document.contains(lastChatFocus)) {
        lastChatFocus.focus({preventScroll:true});
      }
    }
    floatingWhatsapp.addEventListener('click', function(event){
      event.preventDefault();
      setChat(!chatBox.classList.contains('isOpen'), true);
    });
    if (closeChat) {
      closeChat.addEventListener('click', function(){ setChat(false, true); });
    }
    if (chatOverlay) {
      chatOverlay.addEventListener('click', function(){ setChat(false, true); });
    }
    document.addEventListener('pointerdown', function(event){
      if (!chatBox.classList.contains('isOpen')) return;
      if (chatBox.contains(event.target)) return;
      if (floatingWhatsapp.contains(event.target)) return;
      if (event.target.closest && event.target.closest('.themeToggle')) return;
      setChat(false, true);
    });
    quickReplies.forEach(function(reply){
      reply.addEventListener('click', function(){
        var key = reply.dataset.messageKey;
        var message = whatsappMessages[key] || whatsappDefaultMessage;
        quickReplies.forEach(function(item){ item.classList.toggle('isSelected', item === reply); });
        if (sendChat) sendChat.href = whatsappUrl(message);
      });
    });
    chatBox.addEventListener('keydown', function(event){
      if (event.key === 'Escape') {
        event.preventDefault();
        setChat(false, true);
        return;
      }
      if (event.key !== 'Tab' || !chatBox.classList.contains('isOpen')) return;
      var items = focusableChatItems();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener('keydown', function(event){
      if (event.key === 'Escape' && chatBox.classList.contains('isOpen')) {
        setChat(false, true);
      }
    });
    if (sessionStorage.getItem(chatAutoKey) !== 'true') {
      sessionStorage.setItem(chatAutoKey, 'true');
      window.setTimeout(function(){
        if (!chatBox.classList.contains('isOpen')) setChat(true, false);
      }, 4200);
    }
    if (sendChat) {
      sendChat.addEventListener('click', function(){
        setChat(false, false);
      });
    }
  }

  var fleetLightbox = document.getElementById('fleetLightbox');
  var fleetLightboxImage = fleetLightbox ? fleetLightbox.querySelector('.fleetLightboxImage') : null;
  var fleetLightboxClose = fleetLightbox ? fleetLightbox.querySelector('.fleetLightboxClose') : null;
  var lastFleetTrigger = null;
  function closeFleetPreview(){
    if (!fleetLightbox) return;
    fleetLightbox.classList.remove('isOpen');
    fleetLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFleetTrigger) lastFleetTrigger.focus();
  }
  document.querySelectorAll('.fleetPreview').forEach(function(button){
    button.addEventListener('click', function(){
      if (!fleetLightbox || !fleetLightboxImage) return;
      lastFleetTrigger = button;
      fleetLightboxImage.src = button.getAttribute('data-src') || button.querySelector('img')?.src || '';
      fleetLightboxImage.alt = button.querySelector('img')?.alt || 'Van Salut Transport';
      fleetLightbox.classList.add('isOpen');
      fleetLightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (fleetLightboxClose) fleetLightboxClose.focus();
    });
  });
  if (fleetLightboxClose) fleetLightboxClose.addEventListener('click', closeFleetPreview);
  if (fleetLightbox) {
    fleetLightbox.addEventListener('click', function(event){
      if (event.target === fleetLightbox) closeFleetPreview();
    });
  }
  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape' && fleetLightbox && fleetLightbox.classList.contains('isOpen')) closeFleetPreview();
  });
})();
