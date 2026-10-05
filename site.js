(function(){
  function ensureStylesheet(href){
    if (document.querySelector('link[href="' + href + '"]')) return;
    var sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = href;
    document.head.appendChild(sheet);
  }
  ensureStylesheet('mobile-fixes.css');
  ensureStylesheet('content-fixes.css');
  ensureStylesheet('chat.css');
  ['go-live.css', 'chrome.css', 'home.css', 'reg.css', 'policy.css', 'chat.css'].forEach(function(href){
    var lateSheet = document.querySelector('link[href="' + href + '"]');
    if (lateSheet) document.head.appendChild(lateSheet);
  });

  function containDialogFocus(event, dialog){
    if (event.key !== 'Tab' || !dialog) return;
    var items = Array.from(dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')).filter(function(item){
      return !item.disabled && item.tabIndex >= 0 && item.getClientRects().length > 0;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Header: the mobile drawer opens from the right, under the sticky header, so the
  // menu button stays visible and turns into a close button.
  var menuButton = document.querySelector('.st-menu-button');
  var drawer = document.getElementById('st-mobile-menu');
  var backdrop = document.querySelector('.st-backdrop');
  function menuIsOpen(){ return !!(drawer && drawer.classList.contains('show')); }
  function setMenu(open, restoreFocus){
    if (!menuButton || !drawer) return;
    drawer.classList.toggle('show', open);
    if (backdrop) backdrop.classList.toggle('show', open);
    menuButton.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuButton.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    drawer.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open && restoreFocus !== false) menuButton.focus({preventScroll: true});
  }
  if (menuButton && drawer) {
    menuButton.addEventListener('click', function(){ setMenu(!menuIsOpen(), true); });
    if (backdrop) backdrop.addEventListener('click', function(){ setMenu(false, true); });
    drawer.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){ setMenu(false, false); });
    });
    document.addEventListener('keydown', function(event){
      if (!menuIsOpen()) return;
      if (event.key === 'Escape') {
        setMenu(false, true);
        return;
      }
      if (event.key !== 'Tab') return;
      var items = [menuButton].concat(Array.from(drawer.querySelectorAll('a[href]')));
      var index = items.indexOf(document.activeElement);
      if (index === -1 || (event.shiftKey && index === 0) || (!event.shiftKey && index === items.length - 1)) {
        event.preventDefault();
        items[event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index === items.length - 1 ? 0 : index + 1)].focus();
      }
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth > 980 && menuIsOpen()) setMenu(false, false);
    });
  }

  // Theme: the switch shows the sun in light mode and slides to the moon in dark mode.
  var key = 'theme';
  var buttons = document.querySelectorAll('.st-theme-toggle');
  function storedTheme(){
    try { return localStorage.getItem(key) || localStorage.getItem('salut-theme'); } catch (error) { return null; }
  }
  function preferredTheme(){
    var stored = storedTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  }
  function apply(mode){
    var dark = mode === 'dark';
    document.documentElement.setAttribute('data-theme', mode);
    document.body.classList.toggle('darkMode', dark);
    buttons.forEach(function(button){
      button.setAttribute('aria-checked', dark ? 'true' : 'false');
      button.setAttribute('title', dark ? 'Tukar ke mod cerah' : 'Tukar ke mod gelap');
    });
    try {
      localStorage.setItem(key, mode);
      localStorage.setItem('salut-theme', mode);
    } catch (error) {}
  }
  apply(preferredTheme());
  buttons.forEach(function(button){
    button.addEventListener('click', function(){ apply(document.body.classList.contains('darkMode') ? 'light' : 'dark'); });
  });

  var heroGallery = document.querySelector('.heroGallery');
  if (heroGallery && heroGallery.dataset.heroImages && !heroGallery.querySelector('.heroSlide')) {
    var heroImages = heroGallery.dataset.heroImages.split(',').map(function(path){ return path.trim(); }).filter(Boolean);
    if (heroImages.length) {
      heroGallery.innerHTML = heroImages.map(function(path, index){
        return '<img class="heroSlide' + (index === 0 ? ' isActive' : '') + '" src="' + path + '" alt="" loading="' + (index === 0 ? 'eager' : 'lazy') + '">';
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
  function stopHeroTimer(){
    window.clearInterval(heroTimer);
    heroTimer = null;
  }
  if (heroSlides.length) {
    if (heroPrev) heroPrev.addEventListener('click', function(){ showHeroSlide(heroIndex - 1); stopHeroTimer(); });
    if (heroNext) heroNext.addEventListener('click', function(){ showHeroSlide(heroIndex + 1); stopHeroTimer(); });
    heroDots.forEach(function(dot, dotIndex){
      dot.addEventListener('click', function(){ showHeroSlide(dotIndex); stopHeroTimer(); });
    });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroTimer = window.setInterval(function(){ if (!document.hidden) nextHeroSlide(); }, 6500);
    }
  }

  document.querySelectorAll('.whatsappForm').forEach(function(form){
    form.addEventListener('submit', function(event){
      event.preventDefault();
      var lines = ['Assalamualaikum, saya nak semak slot van sekolah.', ''];
      new FormData(form).forEach(function(value, key){ if (value) lines.push(key + ': ' + value); });
      window.open('https://wa.me/60123539977?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });

  document.querySelectorAll('.sheetRegistrationForm, [data-registration-form]').forEach(function(form){
    var status = form.querySelector('.sheetFormStatus, [data-form-status]');
    // One form per family: each child has a card ([data-child]) whose field names end in -1 … -5.
    var MAX_CHILDREN = 5;
    var childList = form.querySelector('[data-children]');
    var addChildButton = form.querySelector('[data-child-add]');
    var CHILD_FIELDS = ['namaAnak', 'tarikhLahir', 'darjahTingkatan2027', 'jantina', 'sekolah', 'sesiSekolah', 'pilihanPerjalanan',
      'pickupPoint', 'dropOff', 'pickupPoint1', 'dropOff1', 'pickupPoint2', 'dropOff2'];
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
    function childCards(){
      return Array.prototype.slice.call(form.querySelectorAll('[data-child]'));
    }
    function updateTripFields(card){
      var tripSelect = card.querySelector('[data-trip-select]');
      var tripOneTitle = card.querySelector('[data-trip-one-title]');
      var value = tripSelect ? tripSelect.value : '';
      if (tripOneTitle) {
        tripOneTitle.textContent = value === 'BALIK' ? 'Perjalanan balik' : 'Perjalanan pergi';
      }
      setTripFields(card.querySelector('[data-trip-one]'), value === 'PERGI' || value === 'BALIK');
      setTripFields(card.querySelector('[data-trip-two]'), value === 'PERGI DAN BALIK');
    }
    // Card n uses names like "sekolah-n"; after a card is added or removed the cards are numbered 1, 2, 3… again.
    function renumberChildren(){
      var cards = childCards();
      cards.forEach(function(card, index){
        var n = index + 1;
        card.querySelectorAll('[name]').forEach(function(field){ field.name = field.name.replace(/-\d+$/, '-' + n); });
        var title = card.querySelector('[data-child-title]');
        if (title) {
          title.textContent = 'Anak ' + n;
          title.id = 'stRegChild' + n;
          card.setAttribute('aria-labelledby', title.id);
        }
        var remove = card.querySelector('[data-child-remove]');
        if (remove) remove.hidden = cards.length === 1;
      });
      if (addChildButton) {
        addChildButton.hidden = cards.length >= MAX_CHILDREN;
        var addLabel = addChildButton.querySelector('span');
        if (addLabel) addLabel.textContent = 'Tambah anak ke-' + (cards.length + 1);
      }
    }
    function clearChildCard(card){
      card.querySelectorAll('.st-reg-field-error').forEach(function(note){ note.parentNode.removeChild(note); });
      card.querySelectorAll('input,select,textarea').forEach(function(field){
        field.setCustomValidity('');
        if (field.type === 'radio' || field.type === 'checkbox') field.checked = false;
        else if (field.tagName === 'SELECT') field.selectedIndex = 0;
        else field.value = '';
      });
      updateTripFields(card);
    }
    function addChild(){
      var cards = childCards();
      if (!childList || !cards.length || cards.length >= MAX_CHILDREN) return;
      var card = cards[0].cloneNode(true);
      // Rename and clear the copy before it joins the form: a checked radio sharing card 1's name would
      // otherwise untick card 1's choice.
      var n = cards.length + 1;
      card.querySelectorAll('[name]').forEach(function(field){ field.name = field.name.replace(/-\d+$/, '-' + n); });
      clearChildCard(card);
      childList.appendChild(card);
      renumberChildren();
      var title = card.querySelector('[data-child-title]');
      card.scrollIntoView({block: 'start'});
      if (title) { title.tabIndex = -1; title.focus({preventScroll: true}); }
    }
    function resetChildren(){
      childCards().slice(1).forEach(function(card){ card.parentNode.removeChild(card); });
      childCards().forEach(function(card){ clearChildCard(card); });
      renumberChildren();
    }
    if (childList) {
      childCards().forEach(updateTripFields);
      renumberChildren();
      if (addChildButton) addChildButton.addEventListener('click', addChild);
      childList.addEventListener('click', function(event){
        var remove = event.target.closest('[data-child-remove]');
        if (!remove) return;
        var card = remove.closest('[data-child]');
        if (!card || childCards().length === 1) return;
        card.parentNode.removeChild(card);
        renumberChildren();
        if (addChildButton && !addChildButton.hidden) addChildButton.focus();
      });
      childList.addEventListener('change', function(event){
        var card = event.target.closest('[data-child]');
        if (!card) return;
        if (event.target.matches('[data-trip-select]')) updateTripFields(card);
        if (event.target.matches('[data-birth]')) updateSchoolYear(card);
      });
    }

    var progressLinks = Array.prototype.slice.call(form.querySelectorAll('.formProgress a'));
    var progressSections = progressLinks.map(function(link){
      var id = (link.getAttribute('href') || '').replace('#', '');
      return document.getElementById(id);
    });
    function sectionIsComplete(section){
      if (!section) return false;
      var fields = Array.prototype.slice.call(section.querySelectorAll('input,select,textarea')).filter(function(field){
        return !field.disabled && field.offsetParent !== null;
      });
      if (!fields.length) return false;
      return fields.every(function(field){
        if (field.type === 'checkbox') return !field.required || field.checked;
        if (!field.required) return field.checkValidity();
        return field.checkValidity() && String(field.value || '').trim() !== '';
      });
    }
    function refreshProgress(){
      progressSections.forEach(function(section, index){
        if (progressLinks[index]) progressLinks[index].classList.toggle('isDone', sectionIsComplete(section));
      });
    }
    if (progressLinks.length && progressSections.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          var index = progressSections.indexOf(entry.target);
          if (index === -1 || !progressLinks[index]) return;
          progressLinks[index].classList.toggle('isCurrent', entry.isIntersecting);
        });
      }, { rootMargin: '-30% 0px -55% 0px' });
      progressSections.forEach(function(section){ if (section) spy.observe(section); });
    }
    form.addEventListener('input', refreshProgress);
    form.addEventListener('change', refreshProgress);
    refreshProgress();
    function schoolLevel2027(birthYear){
      var levels = {
        2020: 'Darjah 1', 2019: 'Darjah 2', 2018: 'Darjah 3', 2017: 'Darjah 4',
        2016: 'Darjah 5', 2015: 'Darjah 6', 2014: 'Tingkatan 1', 2013: 'Tingkatan 2',
        2012: 'Tingkatan 3', 2011: 'Tingkatan 4', 2010: 'Tingkatan 5'
      };
      return levels[birthYear] || 'Perlu semakan';
    }
    function updateSchoolYear(card){
      var birthInput = card.querySelector('[data-birth]');
      var ageInput = card.querySelector('[data-age]');
      var schoolLevelInput = card.querySelector('[data-level]');
      if (!birthInput || !ageInput) return;
      if (!birthInput.value) {
        ageInput.value = '';
        if (schoolLevelInput) schoolLevelInput.value = '';
        return;
      }
      var birthDate = new Date(birthInput.value + 'T00:00:00');
      var age = 2027 - birthDate.getFullYear();
      ageInput.value = age >= 0 ? String(age) : '';
      if (schoolLevelInput) schoolLevelInput.value = schoolLevel2027(birthDate.getFullYear());
    }
    childCards().forEach(updateSchoolYear);
    function setStatus(message, type, withWhatsApp){
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('isSuccess', type === 'success');
      status.classList.toggle('isError', type === 'error');
      if (withWhatsApp) {
        // Fixed text only: the parent's details never go into the WhatsApp link.
        var link = document.createElement('a');
        link.href = 'https://wa.me/60123539977?text=' + encodeURIComponent('Assalamualaikum Salut Transport. Saya cuba hantar pendaftaran 2027 di salut.my tetapi tidak berjaya.');
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'hubungi kami di WhatsApp.';
        status.appendChild(document.createTextNode(' '));
        status.appendChild(link);
      }
    }
    // The server names the field it rejected; open its part of the form and point the parent to it.
    function showServerFieldError(name){
      var field = name ? form.elements[name] : null;
      if (field && !field.tagName && field.length) field = field[0];
      if (!field || !field.tagName) return false;
      var fixedLabels = {jantina: 'Jantina', termsAccepted: 'Pengesahan T&C', privacyAccepted: 'Persetujuan Notis Privasi'};
      var labelText = field.closest('label') && field.closest('label').querySelector('span');
      var label = fixedLabels[name.replace(/-\d+$/, '')] || (labelText ? labelText.textContent.replace('*', '').trim() : 'yang ditanda');
      var childNumber = /-(\d+)$/.exec(name);
      if (childNumber) label += ' (Anak ' + childNumber[1] + ')';
      var message = 'Maklumat "' + label + '" perlu disemak. Betulkan, kemudian tekan Hantar Pendaftaran semula.';
      field.setCustomValidity(message);
      // Keep the message under the field too: the browser's own bubble fades after a few seconds.
      var holder = field.closest('.st-reg-field') || field.closest('fieldset') || field.closest('label') || field.parentNode;
      var note = document.createElement('span');
      note.className = 'st-reg-field-error';
      note.setAttribute('role', 'alert');
      note.textContent = message;
      holder.appendChild(note);
      var clear = function(){
        field.setCustomValidity('');
        if (note.parentNode) note.parentNode.removeChild(note);
        field.removeEventListener('input', clear);
        field.removeEventListener('change', clear);
      };
      field.addEventListener('input', clear);
      field.addEventListener('change', clear);
      field.reportValidity();
      setStatus(message, 'error');
      field.scrollIntoView({block: 'center'});
      field.focus({preventScroll: true});
      return true;
    }
    var guardianPhoneFields = [
      {name: 'telefonAyah', label: 'ayah'},
      {name: 'telefonIbu', label: 'ibu'}
    ];
    // At least one guardian (ayah or ibu) is needed, so single-parent families can register.
    // A guardian who is filled in needs a name and phone, and at least one of them needs an IC.
    // With nothing filled in yet, ayah's fields are required, as before.
    var guardians = [
      {name: 'namaAyah', phone: 'telefonAyah', ic: 'icAyah'},
      {name: 'namaIbu', phone: 'telefonIbu', ic: 'icIbu'}
    ];
    function hasValue(name){
      var field = form.elements[name];
      return !!(field && String(field.value || '').trim());
    }
    function setRequired(name, on){
      var field = form.elements[name];
      if (!field) return;
      field.required = on;
      var mark = field.closest('label') && field.closest('label').querySelector('b');
      if (mark) mark.hidden = !on;
    }
    function updateGuardianRequired(){
      var given = guardians.map(function(g){ return hasValue(g.name) || hasValue(g.phone) || hasValue(g.ic); });
      if (!given[0] && !given[1]) given[0] = true;
      var hasIc = guardians.some(function(g, index){ return given[index] && hasValue(g.ic); });
      var icOwner = given.indexOf(true);
      guardians.forEach(function(g, index){
        setRequired(g.name, given[index]);
        setRequired(g.phone, given[index]);
        setRequired(g.ic, given[index] && (hasValue(g.ic) || (!hasIc && index === icOwner)));
      });
    }
    guardians.forEach(function(g){
      [g.name, g.phone, g.ic].forEach(function(name){
        if (form.elements[name]) form.elements[name].addEventListener('input', updateGuardianRequired);
      });
    });
    updateGuardianRequired();
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
    // Leaving or refreshing while the registration is being sent asks the parent to stay first.
    window.addEventListener('beforeunload', function(event){
      if (form.dataset.submitting !== 'true') return;
      event.preventDefault();
      event.returnValue = '';
    });
    form.addEventListener('submit', function(event){
      event.preventDefault();
      if (form.dataset.submitting === 'true') return;
      var endpoint = form.dataset.endpoint || '';
      if (!endpoint) {
        setStatus('Google Sheet endpoint belum disambungkan. Deploy Google Apps Script dahulu, kemudian masukkan Web App URL.', 'error');
        return;
      }
      var payload = {};
      new FormData(form).forEach(function(value, key){ if (!/-\d+$/.test(key)) payload[key] = value; });
      payload.clientRequestId = currentRequestId();
      payload.termsAccepted = payload.termsAccepted === 'true';
      payload.privacyAccepted = payload.privacyAccepted === 'true';
      // Each child card becomes one entry; fields of a trip that was not chosen are disabled and left out.
      payload.children = childCards().map(function(card, index){
        var child = {};
        CHILD_FIELDS.forEach(function(base){
          var field = form.elements[base + '-' + (index + 1)];
          if (!field) return;
          var single = field.tagName ? field : field[0];
          if (single && single.disabled) return;
          if (field.value) child[base] = String(field.value);
        });
        child.namaAnak = titleCase(child.namaAnak);
        return child;
      });
      payload.namaIbu = titleCase(payload.namaIbu);
      payload.namaAyah = titleCase(payload.namaAyah);
      payload.telefonIbu = normalizePhone(payload.telefonIbu);
      payload.telefonAyah = normalizePhone(payload.telefonAyah);
      var invalidPhone = guardianPhoneFields.find(function(item){ return payload[item.name] && !isValidPhone(payload[item.name]); });
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
      setStatus('Pendaftaran sedang dihantar. Jangan tutup atau refresh halaman ini.', '');
      form.dataset.submitting = 'true';
      var submitLabel = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('isBusy');
        submitButton.textContent = 'Sedang dihantar…';
      }
      // A ticking count shows the page is still working, so parents do not leave or refresh while it saves (about 5-15 s).
      var sendStarted = Date.now();
      var reassuranceTimer = window.setInterval(function(){
        if (form.dataset.submitting !== 'true') return;
        var seconds = Math.round((Date.now() - sendStarted) / 1000);
        if (seconds < 3) return;
        var wait = seconds < 8 ? 'Menyimpan maklumat pendaftaran…'
          : seconds < 20 ? 'Hampir siap, biasanya kurang 15 saat. Jangan tutup atau refresh halaman ini.'
          : 'Sistem agak sibuk dan masih memproses. Jangan tekan Hantar semula.';
        setStatus(wait + ' (' + seconds + ' saat)', '');
      }, 1000);
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
            var rejected = new Error('registration_rejected');
            rejected.status = response.status;
            rejected.field = data && data.error && data.error.field;
            throw rejected;
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
        resetChildren();
        updateGuardianRequired();
        var message = 'Pendaftaran berjaya dihantar. ID rujukan: ' + data.submissionId;
        setStatus(message, 'success');
        refreshProgress();
        form.dispatchEvent(new CustomEvent('registrationsuccess', {detail: {submissionId: data.submissionId, paymentUrl: data.paymentUrl, feeRm: data.feeRm}}));
      }).catch(function(error){
        var httpStatus = error && error.status;
        if (httpStatus === 400) {
          if (!showServerFieldError(error.field)) {
            setStatus('Sebahagian maklumat tidak dapat diterima. Muat semula halaman dan cuba lagi, atau', 'error', true);
          }
        } else if (httpStatus === 429) {
          setStatus('Terlalu banyak cubaan dalam masa singkat. Tunggu 1 minit, kemudian tekan Hantar Pendaftaran semula. Jika masih gagal,', 'error', true);
        } else {
          setStatus('Pendaftaran belum dapat disahkan. Jangan isi borang baharu — tekan Hantar Pendaftaran sekali lagi. Jika masih gagal,', 'error', true);
        }
      }).finally(function(){
        window.clearInterval(reassuranceTimer);
        form.dataset.submitting = 'false';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('isBusy');
          submitButton.textContent = submitLabel;
        }
      });
    });
  });

  // Registration page: show the official form one part at a time. Without this block
  // all three parts simply stay visible.
  document.querySelectorAll('[data-registration-form]').forEach(function(form){
    var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
    if (!steps.length) return;
    var shell = form.closest('.st-reg-shell') || document;
    var layout = shell.querySelector('[data-reg-layout]');
    var complete = shell.querySelector('[data-reg-complete]');
    // Two step lists: the full one beside the form and the short one in the sticky bar on phones.
    var stepLists = Array.prototype.slice.call(shell.querySelectorAll('[data-reg-steps]'));
    var stickyBar = shell.querySelector('[data-reg-sticky]');
    var topline = shell.querySelector('[data-reg-topline]');
    var count = shell.querySelector('[data-reg-count]');
    var percent = shell.querySelector('[data-reg-percent]');
    var progress = shell.querySelector('[data-reg-progress]');
    var summary = form.querySelector('[data-reg-summary]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;
    form.classList.add('st-reg-js');
    shell.classList.add('st-reg-ready');
    if (stickyBar) stickyBar.hidden = false;
    if (topline) topline.hidden = false;
    if (progress) progress.hidden = false;
    if (summary) summary.hidden = false;

    ['icAyah', 'icIbu'].forEach(function(name){
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('input', function(){
        var digits = field.value.replace(/[\s-]/g, '');
        field.setCustomValidity(field.value && !/^\d{12}$/.test(digits) ? 'Masukkan 12 digit No. IC, contoh 800101145678.' : '');
      });
    });
    function pad(number){ return number < 10 ? '0' + number : String(number); }
    function fieldValue(name){
      var field = form.elements[name];
      return field && field.value ? String(field.value).trim() : '';
    }
    function addSummaryRow(term, details){
      var row = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = details || '-';
      row.appendChild(dt);
      row.appendChild(dd);
      summary.appendChild(row);
    }
    function fillSummary(){
      if (!summary) return;
      while (summary.firstChild) summary.removeChild(summary.firstChild);
      form.querySelectorAll('[data-child]').forEach(function(card, index){
        var n = '-' + (index + 1);
        var trip = [fieldValue('sesiSekolah' + n), fieldValue('pilihanPerjalanan' + n)].filter(Boolean).join(' · ');
        addSummaryRow('Anak ' + (index + 1), [fieldValue('namaAnak' + n), fieldValue('sekolah' + n), trip].filter(Boolean).join(' — '));
      });
      addSummaryRow('Alamat', fieldValue('alamatRumah'));
    }
    function showStep(index, moveFocus){
      current = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach(function(step, stepIndex){ step.hidden = stepIndex !== current; });
      stepLists.forEach(function(list){
        Array.prototype.forEach.call(list.children, function(item, itemIndex){
          item.classList.toggle('current', itemIndex === current);
          item.classList.toggle('finished', itemIndex < current);
          if (itemIndex === current) item.setAttribute('aria-current', 'step');
          else item.removeAttribute('aria-current');
        });
      });
      var share = Math.round((current + 1) / steps.length * 100);
      if (count) count.textContent = 'BAHAGIAN ' + pad(current + 1) + ' / ' + pad(steps.length);
      if (percent) percent.textContent = share + '% diisi';
      if (progress) {
        progress.setAttribute('aria-valuenow', String(current + 1));
        progress.setAttribute('aria-label', 'Bahagian ' + (current + 1) + ' daripada ' + steps.length);
        var bar = progress.querySelector('span');
        if (bar) bar.style.width = share + '%';
      }
      if (current === steps.length - 1) fillSummary();
      if (moveFocus) {
        var card = form.closest('.st-reg-card');
        if (card && card.getBoundingClientRect().top < 90) card.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
        var heading = steps[current].querySelector('h2');
        if (heading) heading.focus({preventScroll: true});
      }
    }
    function stepIsValid(step){
      var fields = Array.prototype.slice.call(step.querySelectorAll('input,select,textarea')).filter(function(field){
        return !field.disabled && field.type !== 'hidden' && field.name !== 'website';
      });
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].checkValidity()) {
          // Centre the field so it is not hidden under the sticky header and step bar.
          fields[i].scrollIntoView({block: 'center'});
          fields[i].focus({preventScroll: true});
          fields[i].reportValidity();
          return false;
        }
      }
      return true;
    }
    form.querySelectorAll('[data-step-next]').forEach(function(button){
      button.addEventListener('click', function(){
        if (stepIsValid(steps[current])) showStep(current + 1, true);
      });
    });
    form.querySelectorAll('[data-step-back]').forEach(function(button){
      button.addEventListener('click', function(){ showStep(current - 1, true); });
    });
    // Enter in a text field moves to the next part instead of submitting early.
    form.addEventListener('keydown', function(event){
      if (event.key !== 'Enter' || current === steps.length - 1) return;
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') return;
      event.preventDefault();
      if (stepIsValid(steps[current])) showStep(current + 1, true);
    });
    // If the browser blocks submit because of a field in another part, open that part.
    form.addEventListener('invalid', function(event){
      var owner = event.target.closest('[data-step]');
      var index = steps.indexOf(owner);
      if (index !== -1 && index !== current) showStep(index, false);
    }, true);
    // The completion panel has three forms: saved (no fee), "pay the registration fee" (with the Billplz link),
    // and the result shown when Billplz sends the parent back here after paying.
    function showComplete(texts, quiet){
      if (!complete || !layout) return;
      var set = function(selector, value){ var el = complete.querySelector(selector); if (el && value) el.textContent = value; };
      set('[data-reg-complete-kicker]', texts.kicker);
      set('[data-reg-complete-title]', texts.title);
      set('[data-reg-complete-text]', texts.text);
      var idLine = complete.querySelector('[data-reg-complete-idline]');
      var idCell = complete.querySelector('[data-reg-complete-id]');
      if (idCell) idCell.textContent = texts.id || '';
      if (idLine) idLine.hidden = !texts.id;
      var pay = complete.querySelector('[data-reg-pay]');
      if (pay) {
        pay.hidden = !texts.payUrl;
        if (texts.payUrl) { pay.href = texts.payUrl; pay.textContent = texts.payLabel; }
        // The receipt (the paid Billplz bill) opens in a new tab so the parent keeps this page.
        if (texts.receipt) { pay.target = '_blank'; pay.rel = 'noopener'; } else { pay.removeAttribute('target'); pay.removeAttribute('rel'); }
      }
      var againButton = complete.querySelector('[data-reg-again]');
      if (againButton) againButton.hidden = !!texts.payUrl && !texts.receipt;
      if (quiet) return;
      layout.hidden = true;
      complete.hidden = false;
      complete.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
      var title = complete.querySelector('[data-reg-complete-title]');
      if (title) title.focus({preventScroll: true});
    }
    form.addEventListener('registrationsuccess', function(event){
      var detail = event.detail || {};
      if (!detail.paymentUrl) {
        showComplete({id: detail.submissionId || '-'});
        return;
      }
      var fee = 'RM' + (detail.feeRm || '10.00');
      showComplete({
        kicker: 'SATU LANGKAH LAGI',
        title: 'Bayar yuran pendaftaran untuk sahkan tempat.',
        text: 'Pendaftaran telah disimpan. Tempat anak disahkan selepas yuran pendaftaran ' + fee + ' dibayar. Halaman bayaran Billplz akan dibuka sebentar lagi. Link bayaran juga dihantar ke WhatsApp anda.',
        id: detail.submissionId,
        payUrl: detail.paymentUrl,
        payLabel: 'Bayar Yuran ' + fee
      });
      window.setTimeout(function(){ window.location.assign(detail.paymentUrl); }, 2500);
    });
    // Back from Billplz: ?billplz[id]=…&billplz[paid]=true|false. The real result arrives by the Billplz callback,
    // so this only tells the parent what happens next.
    var query = new URLSearchParams(window.location.search);
    var paidFlag = query.get('billplz[paid]');
    var billId = query.get('billplz[id]');
    if (billId && paidFlag) {
      if (paidFlag === 'true') {
        // Lihat Resit opens the paid Billplz bill, the same link as the button in the WhatsApp confirmation.
        var receiptUrl = /^[A-Za-z0-9_-]{4,40}$/.test(billId) ? 'https://www.billplz.com/bills/' + billId : '';
        showComplete({kicker: 'BAYARAN DITERIMA', title: 'Terima kasih! Yuran pendaftaran telah dibayar.',
          text: 'Pengesahan pendaftaran akan dihantar melalui WhatsApp dalam beberapa minit. Terima kasih kerana memilih Salut Transport.',
          payUrl: receiptUrl, payLabel: 'Lihat Resit', receipt: true});
      } else {
        showComplete({kicker: 'BAYARAN BELUM SELESAI', title: 'Bayaran belum berjaya.',
          text: 'Pendaftaran anda masih disimpan. Tekan butang Bayar Yuran dalam mesej WhatsApp kami untuk cuba lagi, atau hubungi kami di 012-353 9977.'});
      }
      if (window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
    }
    var again = complete ? complete.querySelector('[data-reg-again]') : null;
    if (again) again.addEventListener('click', function(){
      showComplete({kicker: 'PENDAFTARAN DITERIMA', title: 'Pendaftaran berjaya dihantar.',
        text: 'Simpan ID ini untuk sebarang pertanyaan. Terima kasih kerana memilih Salut Transport.'}, true);
      complete.hidden = true;
      layout.hidden = false;
      var status = form.querySelector('[data-form-status]');
      if (status) status.textContent = '';
      showStep(0, true);
    });
    showStep(0, false);

    // Add a shadow under the step bar once it is stuck below the header.
    if (stickyBar) {
      var stuckTicking = false;
      var updateStuck = function(){
        stuckTicking = false;
        var top = parseFloat(getComputedStyle(stickyBar).top) || 0;
        var card = stickyBar.parentElement.getBoundingClientRect();
        stickyBar.classList.toggle('isStuck', card.top < top - 1 && card.bottom > top + stickyBar.offsetHeight);
      };
      window.addEventListener('scroll', function(){
        if (!stuckTicking) { stuckTicking = true; requestAnimationFrame(updateStuck); }
      }, {passive: true});
      updateStuck();
    }
  });

  var mapFrame = document.getElementById('schoolMap');
  var mapName = document.getElementById('schoolMapName');
  var mapArea = document.getElementById('schoolMapArea');
  var mapLink = document.getElementById('schoolMapLink');
  var mapCta = document.getElementById('schoolMapCta');
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
      if (mapCta) mapCta.href = 'https://wa.me/60123539977?text=' + encodeURIComponent('Assalamualaikum, saya nak semak tambang untuk anak di ' + name + '.');
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
  var chatBox = document.querySelector('.st-chat');
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
    chatBox.className = 'st-chat';
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
    floatingWhatsapp.innerHTML = '<span class="whatsappFloatingIcon" aria-hidden="true"></span>';
    chatBox.setAttribute('role', 'dialog');
    chatBox.setAttribute('aria-modal', 'false');
    chatBox.setAttribute('aria-label', 'Chat WhatsApp Salut Transport');
    var replyIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/></svg>';
    chatBox.innerHTML = [
      '<div class="st-chat-head">',
      '<span class="st-chat-avatar" aria-hidden="true"><img src="assets/logo-128.png" alt=""><i></i></span>',
      '<span class="st-chat-identity"><strong>Salut Transport</strong><small class="chatAvailability">Online</small></span>',
      '<button type="button" class="st-chat-close" aria-label="Tutup chat"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>',
      '</div>',
      '<div class="st-chat-body">',
      '<span class="st-chat-day">Hari ini</span>',
      '<div class="st-chat-message">',
      '<p class="st-chat-bubble">Assalamualaikum! Ada apa yang boleh kami bantu untuk perjalanan sekolah anak?<span class="st-chat-time" data-chat-time></span></p>',
      '<div class="st-chat-replies" role="group" aria-label="Pilihan mesej pantas">',
      '<button type="button" data-message-key="slot" aria-pressed="false">' + replyIcon + 'Semak slot van sekolah</button>',
      '<button type="button" data-message-key="price" aria-pressed="false">' + replyIcon + 'Tanya harga pakej</button>',
      '<button type="button" data-message-key="area" aria-pressed="false">' + replyIcon + 'Tanya kawasan diliputi</button>',
      '</div>',
      '</div>',
      '</div>',
      '<div class="st-chat-bar">',
      '<label class="st-chat-sr" for="chatCustomMessage">Atau tulis mesej sendiri</label>',
      '<textarea id="chatCustomMessage" rows="1" maxlength="1000" placeholder="Tulis pertanyaan anda di sini…"></textarea>',
      '<a class="st-chat-send" href="' + whatsappUrl(whatsappDefaultMessage) + '" target="_blank" rel="noopener" aria-label="Buka WhatsApp untuk hantar mesej"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/></svg></a>',
      '</div>',
      '<p class="st-chat-note">Mesej akan dibuka dalam WhatsApp untuk dihantar.</p>'
    ].join('');
    var customMessage = chatBox.querySelector('#chatCustomMessage');
    // The status always shows Online (owner's choice, so parents are never put off messaging).
    // Only the message time is kept up to date, in Malaysian time.
    function updateMessageTime(){
      var stamp = chatBox.querySelector('[data-chat-time]');
      if (!stamp) return;
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kuala_Lumpur', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(new Date());
      var values = {};
      parts.forEach(function(part){ values[part.type] = part.value; });
      stamp.textContent = values.hour + ':' + values.minute;
    }
    updateMessageTime();
    window.setInterval(updateMessageTime, 60000);
    var closeChat = chatBox.querySelector('.st-chat-close');
    var sendChat = chatBox.querySelector('.st-chat-send');
    var quickReplies = Array.prototype.slice.call(chatBox.querySelectorAll('.st-chat-replies button'));
    // Grow the message field with its text, like WhatsApp, up to the CSS max-height.
    function fitMessageField(){
      if (!customMessage) return;
      customMessage.style.height = 'auto';
      customMessage.style.height = customMessage.scrollHeight + 'px';
    }
    var lastChatFocus = null;
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
    // Scrolling inside the panel must not move the page behind it. Only the message list or the
    // message field may scroll, and only while it still has room to move in that direction.
    function chatScroller(target, deltaY){
      var node = target;
      while (node && node !== chatBox) {
        if (node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
          var atTop = node.scrollTop <= 0;
          var atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return node;
        }
        node = node.parentElement;
      }
      return null;
    }
    var chatTouchY = 0;
    chatBox.addEventListener('touchstart', function(event){
      if (event.touches.length === 1) chatTouchY = event.touches[0].clientY;
    }, {passive: true});
    chatBox.addEventListener('touchmove', function(event){
      if (event.touches.length !== 1) return;
      var y = event.touches[0].clientY;
      var deltaY = chatTouchY - y;
      chatTouchY = y;
      if (!chatScroller(event.target, deltaY) && event.cancelable) event.preventDefault();
    }, {passive: false});
    chatBox.addEventListener('wheel', function(event){
      if (!chatScroller(event.target, event.deltaY)) event.preventDefault();
    }, {passive: false});

    // Close only on a tap or click outside the panel. A swipe or scroll outside it leaves the chat open.
    var outsideTap = null;
    function isOutsideChat(target){
      if (chatBox.contains(target) || floatingWhatsapp.contains(target)) return false;
      return !(target.closest && target.closest('.st-theme-toggle'));
    }
    document.addEventListener('pointerdown', function(event){
      outsideTap = chatBox.classList.contains('isOpen') && event.isPrimary && isOutsideChat(event.target)
        ? {x: event.clientX, y: event.clientY, time: Date.now()}
        : null;
    });
    document.addEventListener('pointercancel', function(){ outsideTap = null; });
    window.addEventListener('scroll', function(){ outsideTap = null; }, {passive: true});
    document.addEventListener('pointerup', function(event){
      var start = outsideTap;
      outsideTap = null;
      if (!start || !chatBox.classList.contains('isOpen') || !isOutsideChat(event.target)) return;
      var moved = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y);
      if (moved < 12 && Date.now() - start.time < 700) setChat(false, true);
    });
    quickReplies.forEach(function(reply){
      reply.addEventListener('click', function(){
        var key = reply.dataset.messageKey;
        var message = whatsappMessages[key] || whatsappDefaultMessage;
        quickReplies.forEach(function(item){
          item.classList.toggle('isSelected', item === reply);
          item.setAttribute('aria-pressed', item === reply ? 'true' : 'false');
        });
        if (customMessage) customMessage.value = message;
        fitMessageField();
        if (sendChat) sendChat.href = whatsappUrl(message);
      });
    });
    if (customMessage) customMessage.addEventListener('input', function(){
      if (sendChat) sendChat.href = whatsappUrl(customMessage.value.trim());
      quickReplies.forEach(function(item){
        item.classList.remove('isSelected');
        item.setAttribute('aria-pressed', 'false');
      });
      fitMessageField();
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
    if (sendChat) {
      sendChat.addEventListener('click', function(){
        setChat(false, false);
      });
    }
  }

  var fleetLightbox = document.getElementById('fleetLightbox');
  var fleetLightboxImage = fleetLightbox ? fleetLightbox.querySelector('.fleetLightboxImage') : null;
  var fleetLightboxClose = fleetLightbox ? fleetLightbox.querySelector('.fleetLightboxClose') : null;
  if (fleetLightbox) fleetLightbox.inert = true;
  var lastFleetTrigger = null;
  function closeFleetPreview(){
    if (!fleetLightbox) return;
    fleetLightbox.classList.remove('isOpen');
    fleetLightbox.setAttribute('aria-hidden', 'true');
    fleetLightbox.inert = true;
    document.body.style.overflow = '';
    if (lastFleetTrigger) lastFleetTrigger.focus();
  }
  document.querySelectorAll('.fleetPreview, .st-fleet-photo').forEach(function(button){
    button.addEventListener('click', function(){
      if (!fleetLightbox || !fleetLightboxImage) return;
      lastFleetTrigger = button;
      fleetLightboxImage.src = button.getAttribute('data-src') || button.querySelector('img')?.src || '';
      fleetLightboxImage.alt = button.querySelector('img')?.alt || 'Van Salut Transport';
      fleetLightbox.classList.add('isOpen');
      fleetLightbox.setAttribute('aria-hidden', 'false');
      fleetLightbox.inert = false;
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
    if (!fleetLightbox || !fleetLightbox.classList.contains('isOpen')) return;
    if (event.key === 'Escape') closeFleetPreview();
    else containDialogFocus(event, fleetLightbox);
  });

  // Homepage (index.html): hero photos, school finder and the "Semak slot" form.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stBackdrops = Array.prototype.slice.call(document.querySelectorAll('.st-hero-backdrop'));
  var stDots = Array.prototype.slice.call(document.querySelectorAll('.st-hero-gallery-dots button'));
  var stHeroIndex = 0;
  var stHeroTimer = null;
  // The 2nd and 3rd hero photos wait in data-src. Each one is fetched a few seconds before the
  // slideshow reaches it (or when a dot/arrow asks for it), so phones that scroll straight past
  // the hero never download them (about 400 KB).
  function loadStBackdrop(image){
    if (image && !image.getAttribute('src') && image.dataset.src) image.src = image.dataset.src;
  }
  var stHeroPreloadMs = 3500;
  // The hero is the first screen: once the visitor has scrolled a screen down, nothing there is visible.
  function stHeroInView(){ return window.scrollY < window.innerHeight; }
  function preloadNextStHero(){
    window.setTimeout(function(){ if (stHeroInView()) loadStBackdrop(stBackdrops[(stHeroIndex + 1) % stBackdrops.length]); }, stHeroPreloadMs);
  }
  function showStHero(index){
    if (!stBackdrops.length) return;
    stHeroIndex = (index + stBackdrops.length) % stBackdrops.length;
    loadStBackdrop(stBackdrops[stHeroIndex]);
    if (stHeroTimer) preloadNextStHero();
    stBackdrops.forEach(function(image, imageIndex){ image.classList.toggle('active', imageIndex === stHeroIndex); });
    stDots.forEach(function(dot, dotIndex){
      dot.classList.toggle('active', dotIndex === stHeroIndex);
      if (dotIndex === stHeroIndex) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  function stopStHero(){ window.clearInterval(stHeroTimer); stHeroTimer = null; }
  if (stBackdrops.length > 1) {
    var stPrev = document.querySelector('[data-hero-prev]');
    var stNext = document.querySelector('[data-hero-next]');
    if (stPrev) stPrev.addEventListener('click', function(){ showStHero(stHeroIndex - 1); stopStHero(); });
    if (stNext) stNext.addEventListener('click', function(){ showStHero(stHeroIndex + 1); stopStHero(); });
    stDots.forEach(function(dot, dotIndex){
      dot.addEventListener('click', function(){ showStHero(dotIndex); stopStHero(); });
    });
    if (!reduceMotion) {
      stHeroTimer = window.setInterval(function(){ if (!document.hidden && stHeroInView()) showStHero(stHeroIndex + 1); }, 6500);
      if (document.readyState === 'complete') preloadNextStHero();
      else window.addEventListener('load', preloadNextStHero);
    }
  }

  var stForm = document.getElementById('stSlotForm');
  function goToSlotForm(values){
    if (!stForm) return;
    Object.keys(values || {}).forEach(function(name){
      var field = stForm.elements[name];
      if (field) field.value = values[name];
    });
    var section = document.getElementById('contact');
    if (section) section.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
    var firstEmpty = Array.prototype.slice.call(stForm.querySelectorAll('input[required], select[required]')).filter(function(field){ return !field.value; })[0];
    if (firstEmpty) window.setTimeout(function(){ firstEmpty.focus({preventScroll: true}); }, reduceMotion ? 0 : 450);
  }

  var stSchools = Array.prototype.slice.call(document.querySelectorAll('.st-school'));
  var stMap = document.getElementById('stSchoolMap');
  // The Google map (about 400 KB of Google scripts) loads only when its section comes near the screen.
  // Picking a school before that sets the map's src directly, which also counts as loading it.
  function loadStMap(){ if (stMap && !stMap.getAttribute('src') && stMap.dataset.src) stMap.src = stMap.dataset.src; }
  if (stMap && 'IntersectionObserver' in window) {
    var stMapObserver = new IntersectionObserver(function(entries){
      if (entries.some(function(entry){ return entry.isIntersecting; })) { loadStMap(); stMapObserver.disconnect(); }
    }, {rootMargin: '300px 0px'});
    stMapObserver.observe(stMap);
  } else loadStMap();
  var stMapName = document.getElementById('stMapName');
  var stMapArea = document.getElementById('stMapArea');
  var stMapLink = document.getElementById('stMapLink');
  var stMapCheck = document.getElementById('stMapCheck');
  var stSelectedSchool = stSchools[0] || null;
  stSchools.forEach(function(school){
    school.addEventListener('click', function(){
      stSelectedSchool = school;
      stSchools.forEach(function(item){
        item.classList.toggle('selected', item === school);
        item.setAttribute('aria-pressed', item === school ? 'true' : 'false');
      });
      var name = school.dataset.name;
      var query = school.dataset.query || name;
      if (stMapName) stMapName.textContent = name;
      if (stMapArea) stMapArea.textContent = school.dataset.area || '';
      if (stMapLink) stMapLink.href = school.dataset.mapUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query));
      if (stMap) {
        stMap.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
        stMap.title = 'Peta lokasi ' + name;
      }
    });
  });
  if (stMapCheck) stMapCheck.addEventListener('click', function(){
    if (stSelectedSchool) goToSlotForm({school: stSelectedSchool.dataset.name});
  });

  var stSearch = document.getElementById('stSchoolSearch');
  var stCount = document.getElementById('stSchoolCount');
  var stNoResults = document.getElementById('stNoResults');
  if (stSearch) stSearch.addEventListener('input', function(){
    var term = stSearch.value.trim().toLowerCase();
    var shown = 0;
    stSchools.forEach(function(school){
      var match = !term || (school.dataset.name + ' ' + school.dataset.area).toLowerCase().indexOf(term) !== -1;
      school.hidden = !match;
      if (match) shown += 1;
    });
    if (stCount) stCount.textContent = shown + ' sekolah ditemui';
    if (stNoResults) stNoResults.hidden = shown > 0;
  });

  document.querySelectorAll('.st-fare-card [data-trip]').forEach(function(button){
    button.addEventListener('click', function(){ goToSlotForm({trip: button.dataset.trip}); });
  });

  if (stForm) stForm.addEventListener('submit', function(event){
    event.preventDefault();
    var field = function(name){ return (stForm.elements[name].value || '').trim(); };
    var lines = [
      'Assalamualaikum Salut Transport. Saya ingin semak slot & tambang van sekolah.',
      'Nama penjaga: ' + field('name'),
      'No. telefon: ' + field('phone'),
      'Sekolah anak: ' + field('school'),
      'Kawasan rumah: ' + field('area'),
      'Sesi sekolah: ' + field('session'),
      'Perjalanan: ' + field('trip')
    ];
    if (field('notes')) lines.push('Maklumat tambahan: ' + field('notes'));
    window.open('https://wa.me/60123539977?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    var note = document.getElementById('stFormNote');
    if (note) note.textContent = 'WhatsApp dibuka dengan mesej yang disediakan. Sila tekan hantar di WhatsApp.';
  });
})();
