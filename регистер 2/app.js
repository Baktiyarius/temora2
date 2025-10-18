// Простая логика клиента — auth, навигация, прайс, запись и профиль.
// Работает полностью на localStorage; если доступен API, будет делать запросы.

const DB = {
  usersKey: 'temora_users',
  sessionsKey: 'temora_session',
  bookingsKey: 'temora_bookings',
  mastersKey: 'temora_masters'
}

// Начальные данные прайса (полный предоставленный прайс)
const initialMasters = [
  { name: 'Айгерим', category: 'Ресницы', services: [
    ['Классика',9000],['2D/мокрый эффект',10000],['3D',11000],['4D/5D',12000]
  ]},
  { name: 'Айдана', category: 'Ресницы', services: [['Классика',6000],['Мокрый эффект',7000]]},
  { name: 'Улболсый', category: 'Ресницы', services: [['Классика',9000],['2D/мокрый эффект',10000],['3D',11000],['4D/5D',12000],['Знакомство (скидка)',-2000]]},
  { name: 'Дильназ', category: 'Ресницы', services: [['Классика',4000],['2D/мокрый эффект',5000],['3D',6000]]},

  { name: 'Айгерим', category: 'Брови', services: [['Коррекция пинцетом',1000],['Коррекция воском',2000],['Окрашивание',2000],['Ламинирование+ботокс',6000]]},
  { name: 'Айдана', category: 'Брови', services: [['Коррекция пинцетом',1000],['Коррекция воском',2000],['Окрашивание',2000],['Ламинирование+ботокс',6000],['Ламинирование ресниц + ботокс + окрашивание',7000]]},
  { name: 'Индира', category: 'Брови', services: [['Брови',15000],['Губы',15000],['Межресничка',15000]]},

  { name: 'Айхана', category: 'Маникюр', services: [['Маникюр (чистка)',3000],['Маникюр чистка + гель',6000],['Наращивание ногтей',8000]]},
  { name: 'Ирина Гульная', category: 'Маникюр', services: [['Наращивание ногтей',8000],['Маникюр (чистка)',2000],['Маникюр чистка + гель',4000],['Полный педикюр',5000]]},
  { name: 'Гульная', category: 'Маникюр', services: [['Маникюр (чистка)',1500],['Маникюр чистка + гель',2000],['Полный педикюр',3000]]},
  { name: 'Дополнительно', category: 'Маникюр', services: [['Чистое снятие',1000]]}
];

function $(sel){return document.querySelector(sel)}
function $all(sel){return Array.from(document.querySelectorAll(sel))}

// helpers
function save(key,val){localStorage.setItem(key,JSON.stringify(val))}
function load(key,def){const v=localStorage.getItem(key); return v?JSON.parse(v):def}

// init data
if(!localStorage.getItem(DB.mastersKey)) save(DB.mastersKey, initialMasters)
if(!localStorage.getItem(DB.usersKey)) save(DB.usersKey, [{id:1,name:'Админ',email:'admin@temora.kz',phone:'',password:'',role:'admin'}])
if(!localStorage.getItem(DB.bookingsKey)) save(DB.bookingsKey, [])

// UI refs
const loader = $('#loader')
const navLinks = $all('.nav-link')
const adminLink = $('.admin-link')
const btnLogin = $('#btn-login')
const btnLogout = $('#btn-logout')
const greeting = $('#greeting')
const welcomeTitle = $('#welcome-title')
const hamburger = $('#hamburger')
const toastBox = $('#toast')

// Auth modal
const authModal = $('#auth-modal')
const authForm = $('#auth-form')
const authClose = $('#auth-close')
const adminModal = $('#admin-modal')
const adminForm = $('#admin-form')
const adminCancel = $('#admin-cancel')
const adminPassword = $('#admin-password')
const confirmModal = $('#confirm-modal')
const confirmText = $('#confirm-text')
const confirmYes = $('#confirm-yes')
const confirmNo = $('#confirm-no')

function showLoader(show=true){loader.style.display = show? 'flex':'none'}

// Navigation
navLinks.forEach(a=>a.addEventListener('click',(e)=>{
  e.preventDefault(); const t=a.dataset.target; navigateTo(t)
}))

function navigateTo(target){
  $all('.section').forEach(s=>s.style.display='none')
  const el = $('#'+target)
  if(el) el.style.display='block'
  navLinks.forEach(n=>n.classList.toggle('active', n.dataset.target===target))
}

// Auth
function currentUser(){return sessionStorage.getItem(DB.sessionsKey)? JSON.parse(sessionStorage.getItem(DB.sessionsKey)) : null}
function setCurrentUser(u){ if(u) sessionStorage.setItem(DB.sessionsKey, JSON.stringify(u)); else sessionStorage.removeItem(DB.sessionsKey)}

function refreshAuthUI(){
  const user = currentUser()
  if(user){
    greeting.textContent = `Привет, ${user.name}`
    btnLogin.style.display='none'; btnLogout.style.display='inline-block'
    if(user.email==='admin@temora.kz') adminLink.style.display='inline-block'
    else adminLink.style.display='none'
    welcomeTitle.textContent = `Добро пожаловать, ${user.name}!`;
    navigateTo('home')
  } else {
    greeting.textContent=''
    btnLogin.style.display='inline-block'; btnLogout.style.display='none'
    adminLink.style.display='none'
    welcomeTitle.textContent = 'Добро пожаловать!'
  }
}

btnLogin.addEventListener('click',()=>{authModal.style.display='flex'})
authClose.addEventListener('click',()=>{authModal.style.display='none'})
adminCancel.addEventListener('click', ()=>{ adminModal.style.display='none'; adminPassword.value = '' })

// mobile menu
if(hamburger){ hamburger.addEventListener('click', ()=>{ const nav = document.querySelector('.nav-main'); nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex' }) }
// improved mobile menu: toggle mobile class and overlay
let navOverlay = document.createElement('div'); navOverlay.className = 'nav-overlay'; document.body.appendChild(navOverlay)
if(hamburger){ hamburger.addEventListener('click', ()=>{
  const nav = document.querySelector('.nav-main');
  const open = nav.classList.toggle('mobile');
  if(open){ nav.classList.add('mobile'); navOverlay.style.display='block' } else { nav.classList.remove('mobile'); navOverlay.style.display='none' }
})
  navOverlay.addEventListener('click', ()=>{ const nav = document.querySelector('.nav-main'); nav.classList.remove('mobile'); navOverlay.style.display='none' })
}

// toast
function toast(msg, time=3000){ if(!toastBox) return alert(msg); const el = document.createElement('div'); el.className='message'; el.textContent = msg; toastBox.appendChild(el); setTimeout(()=>{ el.style.opacity=0; setTimeout(()=>el.remove(),400) }, time) }

// Confirm modal helper
let _confirmCallback = null
function showConfirm(text, cb){ if(!confirmModal) return cb && cb(); confirmText.textContent = text; confirmModal.style.display = 'flex'; _confirmCallback = cb }
confirmYes && confirmYes.addEventListener('click', ()=>{ confirmModal.style.display='none'; if(_confirmCallback) _confirmCallback(); _confirmCallback = null })
confirmNo && confirmNo.addEventListener('click', ()=>{ confirmModal.style.display='none'; _confirmCallback = null })

authForm.addEventListener('submit',e=>{
  e.preventDefault();
  const name = $('#auth-name').value.trim();
  const email = $('#auth-email').value.trim().toLowerCase();
  const phone = $('#auth-phone').value.trim();
  const password = $('#auth-password').value || '';

  let users = load(DB.usersKey,[])
  let user = users.find(u=>u.email===email)
  if(!user){
    // register
    const id = Date.now();
    user = {id,name,email,phone,password,role: email==='admin@temora.kz' ? 'admin' : 'user'}
    users.push(user); save(DB.usersKey, users)
  } else {
    // login — basic passwordless fallback or match
    if(user.password && password !== user.password){ toast('Неверный пароль'); return }
  }

  setCurrentUser({id:user.id,name:user.name,email:user.email,role:user.role,phone:user.phone})
  authModal.style.display='none'
  refreshAuthUI(); renderProfile(); renderBookingForm(); renderPrice(); renderAdmin(); toast('Вы успешно вошли')
})

btnLogout.addEventListener('click',()=>{ setCurrentUser(null); refreshAuthUI() })

// Price rendering
function renderPrice(){
  const masters = load(DB.mastersKey, [])
  const container = $('#price-content'); container.innerHTML=''
  const categories = [...new Set(masters.map(m=>m.category))]
  categories.forEach(cat=>{
    const catEl = document.createElement('div');
    catEl.innerHTML = `<h3>${cat}</h3>`
    const list = document.createElement('div'); list.className='service-list'
    masters.filter(m=>m.category===cat).forEach(m=>{
      const card = document.createElement('div'); card.className='card'; card.style.transition='transform .15s ease, box-shadow .15s ease'
      card.innerHTML = `<strong>${m.name}</strong><div>${m.services.map(s=>`<div>${s[0]} — ${s[1]>0? s[1]+ '₸' : 'Скидка '+Math.abs(s[1])+'₸'}</div>`).join('')}</div>`
      card.addEventListener('mouseenter',()=>{card.style.transform='translateY(-6px)'; card.style.boxShadow='0 12px 30px rgba(0,0,0,.08)'});
      card.addEventListener('mouseleave',()=>{card.style.transform=''; card.style.boxShadow=''});
      list.appendChild(card)
    })
    catEl.appendChild(list); container.appendChild(catEl)
  })
}

// Booking form
function renderBookingForm(){
  const masters = load(DB.mastersKey, [])
  const masterSelect = $('#booking-master');
  const serviceSelect = $('#booking-service');
  const timeSelect = $('#booking-time');
  masterSelect.innerHTML=''; serviceSelect.innerHTML=''; timeSelect.innerHTML=''
  masters.forEach((m,idx)=>{ const opt=document.createElement('option'); opt.value=idx; opt.textContent=m.name + ' — '+m.category; masterSelect.appendChild(opt) })

  function fillServices(){
    serviceSelect.innerHTML='';
    const m = masters[masterSelect.value]
    if(!m) return
    m.services.forEach((s,si)=>{ const o=document.createElement('option'); o.value=si; o.textContent=`${s[0]} — ${s[1]>0? s[1] + '₸' : 'Скидка '+Math.abs(s[1])+'₸'}`; serviceSelect.appendChild(o) })
    updatePrice()
  }
  function fillTimes(){
    timeSelect.innerHTML=''; for(let h=9;h<=19;h++){ const o=document.createElement('option'); o.value=`${h}:00`; o.textContent=`${h}:00`; timeSelect.appendChild(o) }
  }

  masterSelect.addEventListener('change',fillServices)
  serviceSelect.addEventListener('change',updatePrice)
  fillServices(); fillTimes(); updatePrice()

  // autofill booking name/phone from profile if available
  const cu = currentUser(); if(cu){ const bn = $('#booking-name'); const bp = $('#booking-phone'); if(bn && !bn.value) bn.value = cu.name || ''; if(bp && !bp.value) bp.value = cu.phone || '' }

  function updatePrice(){
    const masters = load(DB.mastersKey, [])
    const m = masters[masterSelect.value];
    if(!m) return $('#booking-price').textContent='0₸'
    const s = m.services[serviceSelect.value]
    const price = s? s[1] : 0
    $('#booking-price').textContent = price>0? price + '₸' : 'Скидка '+Math.abs(price)+'₸'
  }

  $('#booking-form').addEventListener('submit',e=>{
    e.preventDefault();
    const user = currentUser(); if(!user){ toast('Пожалуйста, войдите'); authModal.style.display='flex'; return }
    const masters = load(DB.mastersKey, [])
    const m = masters[masterSelect.value]; if(!m){ toast('Выберите мастера'); return }
    const s = m.services[serviceSelect.value]; if(!s){ toast('Выберите услугу'); return }
    const date = $('#booking-date').value; const time = $('#booking-time').value
    if(!date || !time){ toast('Выберите дату и время'); return }
    const nameField = $('#booking-name').value.trim(); const phoneField = $('#booking-phone').value.trim()
    if(!nameField || !phoneField){ toast('Укажите имя и телефон'); return }
    const booking = {id:Date.now(), userId:user.id, name:nameField, phone:phoneField, master:m.name, category:m.category, service:s[0], price:s[1], date,time}
    const bookings = load(DB.bookingsKey, [])
    bookings.push(booking); save(DB.bookingsKey, bookings)
    $('#booking-message').textContent=''
    toast('Вы успешно записались 💅')
    renderProfile(); renderAdmin();
    // clear form date
    $('#booking-date').value = ''
  })
}

// Profile
function renderProfile(){
  const user = currentUser(); if(!user) return
  $('#profile-name').value = user.name; $('#profile-email').value = user.email; $('#profile-phone').value = user.phone || ''
  const bookings = load(DB.bookingsKey,[]).filter(b=>b.userId===user.id)
  const list = $('#profile-records-list'); list.innerHTML=''
  if(bookings.length===0) list.textContent='У вас пока нет записей.'
  bookings.forEach(b=>{
    const el = document.createElement('div'); el.className='card'; el.innerHTML = `<div><strong>${b.service}</strong> — ${b.master} — ${b.date} ${b.time} — ${b.price>0?b.price+'₸': 'Скидка '+Math.abs(b.price)+'₸'}</div>`
    list.appendChild(el)
  })
}

$('#save-profile').addEventListener('click',()=>{
  const user = currentUser(); if(!user) return
  const users = load(DB.usersKey,[])
  const u = users.find(x=>x.id===user.id); if(!u) return
  u.name = $('#profile-name').value.trim(); u.phone = $('#profile-phone').value.trim()
  save(DB.usersKey, users)
  setCurrentUser({id:u.id,name:u.name,email:u.email,role:u.role,phone:u.phone})
  refreshAuthUI(); toast('Профиль сохранён')
})

  $('#delete-account').addEventListener('click',()=>{
    const user = currentUser(); if(!user) return
    showConfirm('Удалить аккаунт? Это действие необратимо.', ()=>{
      let users = load(DB.usersKey,[]); users = users.filter(u=>u.id!==user.id); save(DB.usersKey, users)
      let bookings = load(DB.bookingsKey,[]); bookings = bookings.filter(b=>b.userId!==user.id); save(DB.bookingsKey, bookings)
      setCurrentUser(null); refreshAuthUI(); toast('Аккаунт удалён')
    })
  })

// Admin
function renderAdmin(){
  const user = currentUser(); const isAdmin = user && user.email==='admin@temora.kz'
  if(!isAdmin){
    // show admin modal instead of prompt
    adminModal.style.display = 'flex'
    adminForm.onsubmit = function(ev){
      ev.preventDefault(); const pass = adminPassword.value.trim(); if(!pass) return
      fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:pass})})
        .then(r=>{ if(!r.ok) throw new Error('Неверный пароль'); return r.json() })
        .then(()=>{ adminModal.style.display='none'; adminPassword.value=''; setCurrentUser({...user,role:'admin'}); refreshAuthUI(); renderAdmin(); toast('Вход администратора успешен') })
        .catch(()=>{ toast('Неверный пароль') })
    }
    return
  }

  const users = load(DB.usersKey,[])
  const bookings = load(DB.bookingsKey,[])
  const masters = load(DB.mastersKey,[])
  const udiv = $('#admin-users'); udiv.innerHTML=''
  users.forEach(u=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<strong>${u.name}</strong><div>${u.email}</div><div>${u.phone||''}</div>`; udiv.appendChild(d) })

  const rdiv = $('#admin-records'); rdiv.innerHTML=''
  if(bookings.length===0) rdiv.textContent='Нет записей'
  bookings.forEach(b=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<div><strong>${b.name}</strong> ${b.phone} — ${b.service} — ${b.master} — ${b.date} ${b.time} <button data-id='${b.id}' class='btn danger admin-del'>Удалить</button></div>`; rdiv.appendChild(d) })
  $all('.admin-del').forEach(btn=>btn.addEventListener('click',e=>{ const id = Number(btn.dataset.id); showConfirm('Удалить запись?', ()=>{ let bs=load(DB.bookingsKey,[]); bs=bs.filter(b=>b.id!==id); save(DB.bookingsKey,bs); renderAdmin(); renderProfile(); toast('Запись удалена') }) }))

  const mdiv = $('#admin-masters'); mdiv.innerHTML=''
  masters.forEach((m,mi)=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<div><strong>${m.name}</strong><div>${m.services.map((s,si)=>`<div>${s[0]} — ${s[1]}</div>`).join('')}</div><button class='btn' data-mi='${mi}'>Редактировать</button></div>`; mdiv.appendChild(d) })
}

// startup
showLoader(true)
setTimeout(()=>{
  showLoader(false); refreshAuthUI(); renderPrice(); renderBookingForm(); renderProfile(); renderAdmin();
}, 600)

// initial navigation
navigateTo('home')
