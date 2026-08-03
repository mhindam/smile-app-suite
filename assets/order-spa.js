// order-spa.js - modular JS
const CATEGORIES = [
  {id:'all', name:'الكل'},
  {id:'drinks', name:'مشروبات'},
  {id:'meals', name:'مأكولات'},
  {id:'sweets', name:'حلويات'},
];

const PRODUCTS = [
  {id:1, cat:'drinks', name:'قهوة اسبريسو', price:12, img:'https://picsum.photos/seed/espresso/240/240'},
  {id:2, cat:'drinks', name:'شاي نعناع', price:8, img:'https://picsum.photos/seed/minttea/240/240'},
  {id:3, cat:'meals', name:'برجر لحم', price:35, img:'https://picsum.photos/seed/burger/240/240'},
  {id:4, cat:'meals', name:'سلطة سيزر', price:22, img:'https://picsum.photos/seed/caesar/240/240'},
  {id:5, cat:'sweets', name:'تشيز كيك', price:18, img:'https://picsum.photos/seed/cheesecake/240/240'},
  {id:6, cat:'sweets', name:'آيس كريم', price:10, img:'https://picsum.photos/seed/icecream/240/240'},
  {id:7, cat:'drinks', name:'عصير برتقال', price:14, img:'https://picsum.photos/seed/orangejuice/240/240'},
  {id:8, cat:'meals', name:'بيتزا مارجريتا', price:45, img:'https://picsum.photos/seed/pizza/240/240'},
];

const STORAGE_KEY = 'smile_cart_v1';

let state = {
  category: 'all',
  cart: {}, // id -> qty
  payment: {method: 'cod', sub:null, paid:false, receipt:null},
};

const elements = {};
['categories','products','cartBar','cartTotal','cartCount','openCheckout','overlay','itemsList','modalTotal','confirmOrderBtn','closeModal','inputName','inputPhone','inputAddress','paymentMethods','payNowFlow','paymentDetails','paidSection','iPaidBtn','receiptUpload','receiptInput','receiptName','paymentSubBtns','successView','orderId'].forEach(id=>{
  elements[id] = document.getElementById(id) || (id==='paymentSubBtns' ? document.querySelectorAll('.payment-sub') : null);
});

function money(v){ return v + ' ر.س'; }

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state.cart = parsed.cart || {};
      // keep payment minimal (don't store receipts)
    }
  }catch(e){ console.warn('Failed to load storage', e); }
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({cart:state.cart})); }catch(e){console.warn(e)}
}

function renderCategories(){
  const el = document.getElementById('categories'); el.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const d = document.createElement('div'); d.className = 'cat' + (state.category===cat.id ? ' active':''); d.textContent = cat.name; d.tabIndex=0;
    d.onclick = ()=>{ state.category=cat.id; renderCategories(); renderProducts(); }
    d.onkeydown = (e)=>{ if(e.key==='Enter') d.click(); }
    el.appendChild(d);
  })
}

function renderProducts(){
  const el = document.getElementById('products'); el.innerHTML='';
  const items = PRODUCTS.filter(p=> state.category==='all' ? true: p.cat===state.category);
  items.forEach(p=>{
    const card = document.createElement('article'); card.className='product'; card.tabIndex=0;
    card.onclick = ()=> addToCart(p.id);
    card.onkeydown = (e)=>{ if(e.key==='Enter') addToCart(p.id); }
    card.innerHTML = `
      <img class="img" loading="lazy" alt="${p.name}" src="${p.img}" />
      <div class="meta">
        <div class="title">${p.name}</div>
        <div class="price">${money(p.price)}</div>
      </div>
    `;
    el.appendChild(card);
  })
}

function addToCart(productId){
  state.cart[productId] = (state.cart[productId]||0) + 1; updateCartUI(); saveState();
}

function updateCartUI(){
  const entries = Object.entries(state.cart).filter(([k,v])=>v>0);
  const count = entries.reduce((s,[k,v])=> s+v,0);
  const total = entries.reduce((s,[k,v])=>{
    const prod = PRODUCTS.find(p=>p.id==k); return s + prod.price * v;
  },0);
  elements.cartCount.textContent = count + ' عنصر';
  elements.cartTotal.textContent = money(total);
  elements.modalTotal.textContent = money(total);
  const bar = document.getElementById('cartBar');
  if(count>0){ bar.classList.add('visible'); bar.setAttribute('aria-hidden','false'); } else { bar.classList.remove('visible'); bar.setAttribute('aria-hidden','true'); }
}

// Modal logic with focus trap
let lastFocused = null;
function openModal(){
  renderItemsList();
  elements.overlay.classList.add('open'); elements.overlay.setAttribute('aria-hidden','false');
  lastFocused = document.activeElement;
  setTimeout(()=>{ elements.inputName.focus(); },50);
  state.payment.method = document.querySelector('#payCod').checked ? 'cod' : 'now';
  renderPaymentUI(); validateConfirmState();
  trapFocus(elements.overlay);
}
function closeModal(){ elements.overlay.classList.remove('open'); elements.overlay.setAttribute('aria-hidden','true'); releaseFocusTrap(); if(lastFocused) lastFocused.focus(); }

function renderItemsList(){
  const list = document.getElementById('itemsList'); list.innerHTML='';
  const entries = Object.entries(state.cart).filter(([k,v])=>v>0);
  if(entries.length===0){ list.innerHTML = '<div class="muted">السلة فارغة</div>'; return; }
  entries.forEach(([id,qty])=>{
    const prod = PRODUCTS.find(p=>p.id==id);
    const item = document.createElement('div'); item.className='cart-item';
    item.innerHTML = `
      <div style="text-align:right">
        <div style="font-weight:800">${prod.name}</div>
        <div class="muted">${money(prod.price)} لكل وحدة</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-act="dec" data-id="${id}">-</button>
        <div style="min-width:34px;text-align:center">${qty}</div>
        <button class="qty-btn" data-act="inc" data-id="${id}">+</button>
      </div>
    `;
    list.appendChild(item);
  });
  list.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const act = btn.dataset.act; const id = btn.dataset.id;
      if(act==='inc') state.cart[id] = (state.cart[id]||0)+1; else { state.cart[id] = Math.max(0,(state.cart[id]||0)-1); }
      if(state.cart[id]===0) delete state.cart[id]; renderItemsList(); updateCartUI(); saveState(); validateConfirmState();
    }
  })
}

// Payment UI
const paymentMethodsEl = document.getElementById('paymentMethods');
paymentMethodsEl.addEventListener('click', (e)=>{
  const opt = e.target.closest('.payment-option'); if(!opt) return;
  const method = opt.dataset.method; state.payment.method = method;
  paymentMethodsEl.querySelectorAll('.payment-option').forEach(o=>{ o.classList.toggle('active', o.dataset.method===method); o.setAttribute('aria-checked', o.dataset.method===method); });
  renderPaymentUI(); validateConfirmState();
});

function renderPaymentUI(){
  const payNowFlow = document.getElementById('payNowFlow');
  const paymentDetails = document.getElementById('paymentDetails');
  const paidSection = document.getElementById('paidSection');
  const receiptUpload = document.getElementById('receiptUpload');
  if(state.payment.method==='now'){
    payNowFlow.style.display='flex';
  }else{
    payNowFlow.style.display='none';
    paymentDetails.style.display='none'; paidSection.hidden=true; receiptUpload.style.display='none';
    state.payment.sub=null; state.payment.paid=false; state.payment.receipt=null; document.getElementById('receiptName').textContent='';
  }
}

document.querySelectorAll('.payment-sub').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.payment-sub').forEach(b=>b.classList.toggle('active', b===btn));
    state.payment.sub = btn.dataset.sub; const paymentDetails = document.getElementById('paymentDetails');
    paymentDetails.style.display='block'; document.getElementById('paidSection').hidden=false; document.getElementById('receiptUpload').style.display='none';
    state.payment.paid=false; state.payment.receipt=null; document.getElementById('receiptName').textContent='';
    paymentDetails.textContent = state.payment.sub==='insta' ? 'يرجى التحويل إلى انستا: store_insta_account' : 'يرجى التحويل إلى المحفظة: 010XXXXXXX';
    validateConfirmState();
  })
});

document.getElementById('iPaidBtn').addEventListener('click', ()=>{
  document.getElementById('receiptUpload').style.display='flex'; state.payment.paid=false; validateConfirmState();
});

document.getElementById('receiptInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0]; if(!file) return; document.getElementById('receiptName').textContent = file.name;
  const data = await readFileAsDataURL(file); state.payment.receipt = {name:file.name, data, file}; state.payment.paid = true; validateConfirmState();
});

function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }) }

// Validation & submit
['inputName','inputPhone','inputAddress'].forEach(id=>{ document.getElementById(id).addEventListener('input', validateConfirmState); });

function validateConfirmState(){
  const nameOk = document.getElementById('inputName').value.trim().length>0;
  const phoneOk = document.getElementById('inputPhone').value.trim().length>0;
  const addrOk = document.getElementById('inputAddress').value.trim().length>0;
  const cartNotEmpty = Object.keys(state.cart).length>0;
  let paymentOk = true;
  if(state.payment.method==='now'){ if(!state.payment.sub) paymentOk=false; if(!state.payment.paid) paymentOk=false; }
  const enabled = cartNotEmpty && nameOk && phoneOk && addrOk && paymentOk;
  document.getElementById('confirmOrderBtn').disabled = !enabled;
}

// Submit with FormData to provided API
async function submitOrder(){
  const items = Object.entries(state.cart).map(([id,qty])=>{
    const prod = PRODUCTS.find(p=>p.id==id); return {id:prod.id,name:prod.name,unitPrice:prod.price,qty,subtotal:prod.price*qty};
  });
  const totalAmount = items.reduce((s,i)=>s+i.subtotal,0);
  const payload = {
    customer: {name: document.getElementById('inputName').value.trim(), phone: document.getElementById('inputPhone').value.trim(), address: document.getElementById('inputAddress').value.trim()},
    items, total: totalAmount,
    payment: {method: state.payment.method, sub: state.payment.sub}
  };

  const apiUrl = (window.APP_CONFIG && window.APP_CONFIG.apiBase ? window.APP_CONFIG.apiBase : '') + '/api/orders';

  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if(state.payment.receipt && state.payment.receipt.file){ form.append('receipt', state.payment.receipt.file, state.payment.receipt.name); }

  // UI state
  const btn = document.getElementById('confirmOrderBtn'); btn.disabled=true; btn.textContent='جارٍ الإرسال...';
  try{
    const resp = await fetch(apiUrl, { method: 'POST', body: form });
    if(!resp.ok) throw new Error('Network response not ok');
    const data = await resp.json();
    const id = data.orderId || ('#ORD-' + Math.floor(Math.random()*90000 + 10000));
    // success
    showSuccess(id);
    // reset
    state.cart = {}; state.payment = {method:'cod', sub:null, paid:false, receipt:null};
    document.getElementById('inputName').value=''; document.getElementById('inputPhone').value=''; document.getElementById('inputAddress').value=''; document.getElementById('receiptName').textContent='';
    saveState(); updateCartUI(); closeModal();
  }catch(err){
    console.error(err); alert('حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة لاحقاً.');
  }finally{ btn.disabled=false; btn.textContent='تأكيد الطلب'; }
}

// keep fakePost as fallback (commented)
async function fakePost(url, payload){ console.log('fakePost',url,payload); return new Promise(res=>setTimeout(()=>res({ok:true,orderId:'#ORD-'+Math.floor(Math.random()*90000+10000)}),900)); }

// show success
function showSuccess(id){ document.querySelector('header.app-header').style.display='none'; document.getElementById('categories').style.display='none'; document.getElementById('products').style.display='none'; document.getElementById('cartBar').style.display='none'; const sv = document.getElementById('successView'); sv.classList.add('show'); sv.setAttribute('aria-hidden','false'); document.getElementById('orderId').textContent = id; }

// Focus trap implementation
let focusableEls = []; let firstFocusable = null; let lastFocusable = null; let trapOverlay = null;
function trapFocus(container){ trapOverlay = container; focusableEls = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'); if(focusableEls.length>0){ firstFocusable = focusableEls[0]; lastFocusable = focusableEls[focusableEls.length-1]; container.addEventListener('keydown', handleTrap); }}
function releaseFocusTrap(){ if(trapOverlay) trapOverlay.removeEventListener('keydown', handleTrap); trapOverlay = null; }
function handleTrap(e){ if(e.key==='Tab'){ if(e.shiftKey){ if(document.activeElement===firstFocusable){ e.preventDefault(); lastFocusable.focus(); } } else { if(document.activeElement===lastFocusable){ e.preventDefault(); firstFocusable.focus(); } } } if(e.key==='Escape'){ closeModal(); } }

// wire UI
document.getElementById('openCheckout').addEventListener('click', openModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('confirmOrderBtn').addEventListener('click', submitOrder);

// overlay click closes
document.getElementById('overlay').addEventListener('click', (e)=>{ if(e.target === document.getElementById('overlay')) closeModal(); });

// init
loadState(); renderCategories(); renderProducts(); updateCartUI(); validateConfirmState();

// small dash animation style
const st = document.createElement('style'); st.textContent='@keyframes dash{to{stroke-dashoffset:0}}'; document.head.appendChild(st);

