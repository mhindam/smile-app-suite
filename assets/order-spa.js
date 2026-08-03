// order-spa.js - modular JS with customer persistence and order tracking
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

const STORAGE_CART = 'smile_cart_v1';
const STORAGE_CUSTOMER = 'smile_customer_v1';

let state = {
  category: 'all',
  cart: {}, // id -> qty
  payment: {method: 'cod', sub:null, paid:false, receipt:null},
};

function $(id){ return document.getElementById(id); }

const elements = {
  categories: $('categories'), products: $('products'), cartBar: $('cartBar'), cartTotal: $('cartTotal'), cartCount: $('cartCount'), openCheckout: $('openCheckout'), overlay: $('overlay'), itemsList: $('itemsList'), modalTotal: $('modalTotal'), confirmOrderBtn: $('confirmOrderBtn'), closeModal: $('closeModal'), inputName: $('inputName'), inputPhone: $('inputPhone'), inputAddress: $('inputAddress'), paymentMethods: $('paymentMethods'), payNowFlow: $('payNowFlow'), paymentDetails: $('paymentDetails'), paidSection: $('paidSection'), iPaidBtn: $('iPaidBtn'), receiptUpload: $('receiptUpload'), receiptInput: $('receiptInput'), receiptName: $('receiptName'), successView: $('successView'), orderIdEl: $('orderId'), openTrackBtn: $('openTrackBtn'), trackOverlay: $('trackOverlay'), trackBtn: $('trackBtn'), trackInput: $('trackInput'), trackResult: $('trackResult'), trkId: $('trkId'), trkTime: $('trkTime'), trkStatus: $('trkStatus'), closeTrackBtn: $('closeTrackBtn')
};

function money(v){ return v + ' ر.س'; }

// Storage
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_CART);
    if(raw){ state.cart = JSON.parse(raw).cart || {}; }
    const custRaw = localStorage.getItem(STORAGE_CUSTOMER);
    if(custRaw){ const c = JSON.parse(custRaw); if(c.name) elements.inputName.value = c.name; if(c.phone) elements.inputPhone.value = c.phone; if(c.address) elements.inputAddress.value = c.address; }
  }catch(e){ console.warn('loadState',e); }
}
function saveCart(){ try{ localStorage.setItem(STORAGE_CART, JSON.stringify({cart:state.cart})); }catch(e){console.warn(e);} }
function saveCustomer(){ try{ const c = {name: elements.inputName.value.trim(), phone: elements.inputPhone.value.trim(), address: elements.inputAddress.value.trim()}; localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(c)); }catch(e){console.warn(e);} }

// Render
function renderCategories(){ elements.categories.innerHTML=''; CATEGORIES.forEach(cat=>{ const d=document.createElement('div'); d.className='cat'+(state.category===cat.id?' active':''); d.textContent=cat.name; d.tabIndex=0; d.onclick=()=>{ state.category=cat.id; renderCategories(); renderProducts(); }; d.onkeydown=(e)=>{ if(e.key==='Enter') d.click(); }; elements.categories.appendChild(d); }); }
function renderProducts(){ elements.products.innerHTML=''; const items = PRODUCTS.filter(p=> state.category==='all' ? true: p.cat===state.category); items.forEach(p=>{ const card = document.createElement('article'); card.className='product'; card.tabIndex=0; card.onclick=()=> addToCart(p.id); card.onkeydown=(e)=>{ if(e.key==='Enter') addToCart(p.id); }; card.innerHTML = `<img class="img" loading="lazy" alt="${p.name}" src="${p.img}" /><div class="meta"><div class="title">${p.name}</div><div class="price">${money(p.price)}</div></div>`; elements.products.appendChild(card); }); }

// Cart
function addToCart(productId){ state.cart[productId] = (state.cart[productId]||0) + 1; updateCartUI(); saveCart(); }
function updateCartUI(){ const entries = Object.entries(state.cart).filter(([k,v])=>v>0); const count = entries.reduce((s,[k,v])=> s+v,0); const total = entries.reduce((s,[k,v])=>{ const prod = PRODUCTS.find(p=>p.id==k); return s + prod.price * v; },0); elements.cartCount.textContent = count + ' عنصر'; elements.cartTotal.textContent = money(total); elements.modalTotal.textContent = money(total); if(count>0){ elements.cartBar.classList.add('visible'); elements.cartBar.setAttribute('aria-hidden','false'); } else { elements.cartBar.classList.remove('visible'); elements.cartBar.setAttribute('aria-hidden','true'); } }

// Modal & focus trap
let lastFocused=null; let trapOverlay=null; function trapFocus(container){ trapOverlay = container; const focusableEls = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'); if(focusableEls.length>0){ const firstFocusable = focusableEls[0]; const lastFocusable = focusableEls[focusableEls.length-1]; container.addEventListener('keydown', function handle(e){ if(e.key==='Tab'){ if(e.shiftKey){ if(document.activeElement===firstFocusable){ e.preventDefault(); lastFocusable.focus(); } } else { if(document.activeElement===lastFocusable){ e.preventDefault(); firstFocusable.focus(); } } } if(e.key==='Escape'){ closeModal(); } }); } }
function releaseFocusTrap(){ if(trapOverlay){ trapOverlay.removeEventListener('keydown', ()=>{}); trapOverlay=null; } }

function openModal(){ renderItemsList(); elements.overlay.classList.add('open'); elements.overlay.setAttribute('aria-hidden','false'); lastFocused = document.activeElement; setTimeout(()=>{ elements.inputName.focus(); },50); renderPaymentUI(); validateConfirmState(); trapFocus(elements.overlay); }
function closeModal(){ elements.overlay.classList.remove('open'); elements.overlay.setAttribute('aria-hidden','true'); releaseFocusTrap(); if(lastFocused) lastFocused.focus(); }

function renderItemsList(){ elements.itemsList.innerHTML=''; const entries = Object.entries(state.cart).filter(([k,v])=>v>0); if(entries.length===0){ elements.itemsList.innerHTML = '<div class="muted">السلة فارغة</div>'; return; } entries.forEach(([id,qty])=>{ const prod = PRODUCTS.find(p=>p.id==id); const item = document.createElement('div'); item.className='cart-item'; item.innerHTML = `<div style="text-align:right"><div style="font-weight:800">${prod.name}</div><div class="muted">${money(prod.price)} لكل وحدة</div></div><div class="qty-controls"><button class="qty-btn" data-act="dec" data-id="${id}">-</button><div style="min-width:34px;text-align:center">${qty}</div><button class="qty-btn" data-act="inc" data-id="${id}">+</button></div>`; elements.itemsList.appendChild(item); }); elements.itemsList.querySelectorAll('.qty-btn').forEach(btn=>{ btn.onclick = ()=>{ const act=btn.dataset.act; const id=btn.dataset.id; if(act==='inc') state.cart[id] = (state.cart[id]||0)+1; else { state.cart[id] = Math.max(0,(state.cart[id]||0)-1); } if(state.cart[id]===0) delete state.cart[id]; renderItemsList(); updateCartUI(); saveCart(); validateConfirmState(); } }); }

// Payment UI
elements.paymentMethods.addEventListener('click', (e)=>{ const opt = e.target.closest('.payment-option'); if(!opt) return; const method = opt.dataset.method; state.payment.method = method; elements.paymentMethods.querySelectorAll('.payment-option').forEach(o=>{ o.classList.toggle('active', o.dataset.method===method); o.setAttribute('aria-checked', o.dataset.method===method); }); renderPaymentUI(); validateConfirmState(); });

function renderPaymentUI(){ if(state.payment.method==='now'){ elements.payNowFlow.style.display='flex'; } else { elements.payNowFlow.style.display='none'; elements.paymentDetails.style.display='none'; elements.paidSection.hidden=true; elements.receiptUpload.style.display='none'; state.payment.sub=null; state.payment.paid=false; state.payment.receipt=null; elements.receiptName.textContent=''; } }

document.querySelectorAll('.payment-sub').forEach(btn=>{ btn.addEventListener('click', ()=>{ document.querySelectorAll('.payment-sub').forEach(b=>b.classList.toggle('active', b===btn)); state.payment.sub = btn.dataset.sub; elements.paymentDetails.style.display='block'; elements.paidSection.hidden=false; elements.receiptUpload.style.display='none'; state.payment.paid=false; state.payment.receipt=null; elements.receiptName.textContent=''; elements.paymentDetails.textContent = state.payment.sub==='insta' ? 'يرجى التحويل إلى انستا: store_insta_account' : 'يرجى التحويل إلى المحفظة: 010XXXXXXX'; validateConfirmState(); }) });

elements.iPaidBtn.addEventListener('click', ()=>{ elements.receiptUpload.style.display='flex'; state.payment.paid=false; validateConfirmState(); });

elements.receiptInput.addEventListener('change', async (e)=>{ const file = e.target.files[0]; if(!file) return; elements.receiptName.textContent = file.name; const data = await readFileAsDataURL(file); state.payment.receipt = {name:file.name, data, file}; state.payment.paid = true; validateConfirmState(); });
function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }) }

// Validation
['inputName','inputPhone','inputAddress'].forEach(id=>{ $(id).addEventListener('input', validateConfirmState); });
function validateConfirmState(){ const nameOk = elements.inputName.value.trim().length>0; const phoneOk = elements.inputPhone.value.trim().length>0; const addrOk = elements.inputAddress.value.trim().length>0; const cartNotEmpty = Object.keys(state.cart).length>0; let paymentOk = true; if(state.payment.method==='now'){ if(!state.payment.sub) paymentOk=false; if(!state.payment.paid) paymentOk=false; } const enabled = cartNotEmpty && nameOk && phoneOk && addrOk && paymentOk; elements.confirmOrderBtn.disabled = !enabled; }

// Submit
async function submitOrder(){ const items = Object.entries(state.cart).map(([id,qty])=>{ const prod = PRODUCTS.find(p=>p.id==id); return {id:prod.id,name:prod.name,unitPrice:prod.price,qty,subtotal:prod.price*qty}; }); const totalAmount = items.reduce((s,i)=>s+i.subtotal,0); const payload = { customer: {name: elements.inputName.value.trim(), phone: elements.inputPhone.value.trim(), address: elements.inputAddress.value.trim()}, items, total: totalAmount, payment: {method: state.payment.method, sub: state.payment.sub} };
  const apiUrl = (window.APP_CONFIG && window.APP_CONFIG.apiBase ? window.APP_CONFIG.apiBase : '') + '/api/orders';
  const form = new FormData(); form.append('payload', JSON.stringify(payload)); if(state.payment.receipt && state.payment.receipt.file){ form.append('receipt', state.payment.receipt.file, state.payment.receipt.name); }
  const btn = elements.confirmOrderBtn; btn.disabled=true; btn.textContent='جارٍ الإرسال...';
  try{
    const resp = await fetch(apiUrl, { method:'POST', body: form });
    if(!resp.ok) throw new Error('Network response not ok');
    const data = await resp.json();
    const id = data.orderId || ('#ORD-' + Math.floor(Math.random()*90000 + 10000));
    // save customer for next time
    saveCustomer();
    // success
    showSuccess(id);
    state.cart = {}; state.payment = {method:'cod', sub:null, paid:false, receipt:null}; elements.inputName.value=''; elements.inputPhone.value=''; elements.inputAddress.value=''; elements.receiptName.textContent=''; saveCart(); updateCartUI(); closeModal();
  }catch(err){ console.error(err); alert('حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة لاحقاً.'); }
  finally{ btn.disabled=false; btn.textContent='تأكيد الطلب'; }
}

// show success
function showSuccess(id){ document.querySelector('header.app-header').style.display='none'; elements.categories.style.display='none'; elements.products.style.display='none'; elements.cartBar.style.display='none'; elements.successView.classList.add('show'); elements.successView.setAttribute('aria-hidden','false'); elements.orderIdEl.textContent = id; }

// Tracking feature (privacy-preserving)
function openTrackModal(){ elements.trackOverlay.classList.add('open'); elements.trackOverlay.setAttribute('aria-hidden','false'); elements.trackInput.focus(); trapFocus(elements.trackOverlay); }
function closeTrackModal(){ elements.trackOverlay.classList.remove('open'); elements.trackOverlay.setAttribute('aria-hidden','true'); elements.trackResult.style.display='none'; releaseFocusTrap(); }

async function trackOrderFlow(){ const id = elements.trackInput.value.trim(); if(!id){ alert('ادخل رقم الطلب'); return; }
  // try calling server tracking endpoint, fallback to simulated
  const apiTrack = (window.APP_CONFIG && window.APP_CONFIG.apiBase ? window.APP_CONFIG.apiBase : '') + '/api/orders/track?orderId=' + encodeURIComponent(id);
  try{
    const resp = await fetch(apiTrack); if(!resp.ok) throw new Error('no track'); const data = await resp.json(); // expect { orderId, time, status }
    renderTrackResult({orderId: data.orderId || id, time: data.time || new Date().toISOString(), status: data.status || 'غير معروف'});
  }catch(e){ // simulate
    const simulated = simulateTracking(id); // returns {orderId,time,status}
    // slight delay for realism
    setTimeout(()=> renderTrackResult(simulated), 600);
  }
}

function simulateTracking(orderId){ // deterministic-ish status based on hash of id + time
  const statuses = ['تم استلام الطلب','قيد التحضير','في الطريق','تم التسليم'];
  // use simple hash to pick status
  let h=0; for(let i=0;i<orderId.length;i++){ h = (h*31 + orderId.charCodeAt(i))%1000; }
  const idx = Math.floor((h/1000)*statuses.length);
  const status = statuses[Math.min(idx, statuses.length-1)];
  const time = new Date().toISOString();
  return {orderId, time, status};
}

function renderTrackResult({orderId, time, status}){
  elements.trackResult.style.display='flex'; elements.trkId.textContent = orderId; elements.trkTime.textContent = new Date(time).toLocaleString('ar-EG'); elements.trkStatus.textContent = status;
}

// Wire up
$('openCheckout').addEventListener('click', openModal); $('closeModal').addEventListener('click', closeModal); $('confirmOrderBtn').addEventListener('click', submitOrder);
$('overlay').addEventListener('click', (e)=>{ if(e.target === $('overlay')) closeModal(); });
$('openTrackBtn').addEventListener('click', openTrackModal); $('closeTrackBtn').addEventListener('click', closeTrackModal); $('trackBtn').addEventListener('click', trackOrderFlow);
$('trackInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') trackOrderFlow(); });

// init
loadState(); renderCategories(); renderProducts(); updateCartUI(); validateConfirmState();

// small dash animation style
const st = document.createElement('style'); st.textContent='@keyframes dash{to{stroke-dashoffset:0}}'; document.head.appendChild(st);

