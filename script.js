const STORAGE_MENU = 'opuspos_menu';
const STORAGE_HISTORY = 'opuspos_orders';
let menuItems = [];
let cart = [];
let orderHistory = [];
let editingItemId = null;
let activeFilter = 'all';

const state = {
  selectedPage: 'dashboard',
};

const ui = {
  pages: document.querySelectorAll('.page'),
  navButtons: document.querySelectorAll('.nav-link'),
  themeToggle: document.getElementById('themeToggle'),
  liveTime: document.getElementById('liveTime'),
  liveDate: document.getElementById('liveDate'),
  statOrders: document.getElementById('statOrders'),
  statSales: document.getElementById('statSales'),
  statRevenue: document.getElementById('statRevenue'),
  statTopItem: document.getElementById('statTopItem'),
  peakHour: document.getElementById('peakHour'),
  popularCategory: document.getElementById('popularCategory'),
  availableItems: document.getElementById('availableItems'),
  salesTrendChart: document.getElementById('salesTrendChart'),
  menuItemsList: document.getElementById('menuItemsList'),
  billingMenuList: document.getElementById('billingMenuList'),
  cartItems: document.getElementById('cartItems'),
  subtotalAmount: document.getElementById('subtotalAmount'),
  totalAmount: document.getElementById('totalAmount'),
  discountInput: document.getElementById('discountInput'),
  invoiceItems: document.getElementById('invoiceItems'),
  invoiceStatus: document.getElementById('invoiceStatus'),
  orderHistoryBody: document.getElementById('orderHistoryBody'),
  reportDaily: document.getElementById('reportDaily'),
  reportWeekly: document.getElementById('reportWeekly'),
  reportMonthly: document.getElementById('reportMonthly'),
  reportTopItem: document.getElementById('reportTopItem'),
  bestItemsList: document.getElementById('bestItemsList'),
  peakSalesBars: document.getElementById('peakSalesBars'),
  paymentBackdrop: document.getElementById('paymentBackdrop'),
  paymentModal: document.getElementById('paymentModal'),
  paymentLoading: document.getElementById('paymentLoading'),
  paymentQRStep: document.getElementById('paymentQRStep'),
  paymentSuccessStep: document.getElementById('paymentSuccessStep'),
  paymentQRCode: document.getElementById('paymentQRCode'),
  payAmountText: document.getElementById('payAmountText'),
  payRefText: document.getElementById('payRefText'),
  successTxId: document.getElementById('successTxId'),
  successTimestamp: document.getElementById('successTimestamp'),
  printReceiptArea: document.getElementById('printReceiptArea'),
  receiptPrintContent: document.getElementById('receiptPrintContent'),
  toastContainer: document.getElementById('toastContainer'),
  menuSearch: document.getElementById('menuSearch'),
  billingSearch: document.getElementById('billingSearch'),
  globalSearch: document.getElementById('globalSearch'),
};

const sampleData = [
  { id: 'm1', name: 'Idly', category: 'South Indian', price: 20, available: true, image: 'IDLY.png', description: 'Soft steamed rice cakes served with sambar and coconut chutney.' },
  { id: 'm2', name: 'Dosa', category: 'South Indian', price: 60, available: true, image: 'dosa.png', description: 'Crispy fermented crepe with spicy potato masala and chutney.' },
  { id: 'm3', name: 'Vada', category: 'South Indian', price: 15, available: true, image: 'vada.png', description: 'Golden lentil donut with aromatic spices, served hot with sambar.' },
  { id: 'm4', name: 'Poori', category: 'South Indian', price: 60, available: true, image: 'poori.png', description: 'Fluffy deep-fried bread paired with potato masala and chutney.' },
  { id: 'm5', name: 'Chappathi', category: 'South Indian', price: 60, available: true, image: 'chappathi.png', description: 'Whole wheat flatbread served warm with coconut chutney and curry.' },
  { id: 'm6', name: 'Pongal', category: 'South Indian', price: 70, available: true, image: 'pongal.png', description: 'Creamy rice and lentil porridge tempered with cumin and ghee.' },
  { id: 'm7', name: 'Tea', category: 'Beverages', price: 20, available: true, image: 'tea.png', description: 'Refreshing masala tea brewed with aromatic spices and milk.' },
  { id: 'm8', name: 'Coffee', category: 'Beverages', price: 30, available: true, image: 'coffee.png', description: 'Strong filter coffee served hot with a rich crema layer.' }
];

const loadState = () => {
  const savedMenu = JSON.parse(localStorage.getItem(STORAGE_MENU) || 'null');
  menuItems = Array.isArray(savedMenu) && savedMenu.length ? savedMenu : sampleData;
  const savedHistory = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || 'null');
  orderHistory = Array.isArray(savedHistory) ? savedHistory : [];
};

const saveState = () => {
  localStorage.setItem(STORAGE_MENU, JSON.stringify(menuItems));
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(orderHistory));
};

const $ = (selector) => document.querySelector(selector);

const switchPage = (pageId) => {
  ui.pages.forEach((page) => page.classList.toggle('active', page.id === `${pageId}Page`));
  ui.navButtons.forEach((button) => button.classList.toggle('active', button.dataset.page === pageId));
  state.selectedPage = pageId;
};

const formatCurrency = (value) => {
  return `₹${value.toFixed(2)}`;
};

const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => toast.classList.remove('visible'), 3600);
  toast.addEventListener('transitionend', () => toast.remove());
};

const updateClock = () => {
  const now = new Date();
  ui.liveTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ui.liveDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const buildSalesData = () => {
  const totals = { daily: 0, weekly: 0, monthly: 0, byItem: {}, categories: {}, hours: {} };
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (const order of orderHistory) {
    totals.daily += order.total;
    totals.weekly += order.total;
    totals.monthly += order.total;
    order.items.forEach((item) => {
      totals.byItem[item.id] = (totals.byItem[item.id] || 0) + item.quantity;
      totals.categories[item.category] = (totals.categories[item.category] || 0) + item.quantity;
    });
    const hour = new Date(order.timestamp).getHours();
    totals.hours[hour] = (totals.hours[hour] || 0) + order.total;
  }
  return totals;
};

const renderDashboard = () => {
  const totals = buildSalesData();
  const totalOrders = orderHistory.length;
  const topItemKey = Object.keys(totals.byItem).sort((a,b) => totals.byItem[b] - totals.byItem[a])[0];
  const topItem = menuItems.find((item) => item.id === topItemKey)?.name || 'No orders yet';
  ui.statOrders.textContent = totalOrders;
  ui.statSales.textContent = formatCurrency(totals.weekly);
  ui.statRevenue.textContent = formatCurrency(totals.daily);
  ui.statTopItem.textContent = topItem;
  ui.popularCategory.textContent = Object.keys(totals.categories).sort((a,b) => totals.categories[b] - totals.categories[a])[0] || 'N/A';
  ui.availableItems.textContent = menuItems.filter((item) => item.available).length;
  const peakHour = Object.keys(totals.hours).sort((a,b) => totals.hours[b] - totals.hours[a])[0];
  ui.peakHour.textContent = peakHour !== undefined ? `${peakHour}:00 - ${peakHour}:59` : 'No data yet';
  renderSalesChart(totals.hours);
};

const renderSalesChart = (hours) => {
  const series = Array.from({ length: 12 }, (_, idx) => ({ hour: 8 + idx, value: hours[8 + idx] || 0 }));
  const maxValue = Math.max(60, ...series.map((point) => point.value));
  const path = series.map((point, index) => {
    const x = 20 + index * 60;
    const y = 280 - (point.value / maxValue) * 240;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const area = `${path} L 740 300 L 20 300 Z`;
  ui.salesTrendChart.innerHTML = `
    <defs>
      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(124,92,255,0.8)" />
        <stop offset="100%" stop-color="rgba(124,92,255,0.1)" />
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#salesGradient)" opacity="0.9"></path>
    <path d="${path}" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="4" stroke-linecap="round" />
    ${series.map((point, index) => {
      const x = 20 + index * 60;
      const y = 280 - (point.value / maxValue) * 240;
      return `<circle cx="${x}" cy="${y}" r="6" fill="#7c5cff" />`;
    }).join('')}
  `;
};

const filterMenuItems = (items, text = '', category = activeFilter) => {
  return items.filter((item) => {
    const matchText = text.trim().length ? item.name.toLowerCase().includes(text.toLowerCase()) || item.category.toLowerCase().includes(text.toLowerCase()) : true;
    const matchCategory = category === 'all' ? true : item.category === category;
    return matchText && matchCategory;
  });
};

const renderMenuList = () => {
  const filteredItems = filterMenuItems(menuItems, ui.menuSearch.value, activeFilter);
  ui.menuItemsList.innerHTML = filteredItems.map((item) => {
    return `
      <div class="menu-card" draggable="true" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" />
        <div class="menu-card-content">
          <div class="menu-card-title">
            <h3>${item.name}</h3>
            <span class="status-pill">${item.available ? 'Available' : 'Out of stock'}</span>
          </div>
          <div class="menu-card-body"><p>${item.description || 'No description added.'}</p></div>
          <div class="menu-card-meta">
            <span>${item.category}</span>
            <strong>${formatCurrency(item.price)}</strong>
          </div>
          <div class="menu-actions">
            <button class="secondary-btn edit-item" data-id="${item.id}">Edit</button>
            <button class="secondary-btn delete-item" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  connectDragHandlers();
};

const renderBillingMenu = () => {
  const filteredItems = filterMenuItems(menuItems, ui.billingSearch.value, 'all');
  ui.billingMenuList.innerHTML = filteredItems.map((item) => {
    return `
      <article class="billing-item">
        <div class="billing-item-info">
          <h3>${item.name}</h3>
          <span>${item.category} · ${item.available ? 'Ready' : 'Unavailable'}</span>
          <strong>${formatCurrency(item.price)}</strong>
        </div>
        <button class="add-to-cart" data-id="${item.id}" ${item.available ? '' : 'disabled'}>${item.available ? 'Add' : 'Sold'}</button>
      </article>
    `;
  }).join('');
};

const updateCart = () => {
  ui.cartItems.innerHTML = cart.map((cartItem) => {
    return `
      <div class="cart-item">
        <div>
          <h3>${cartItem.name}</h3>
          <span>${formatCurrency(cartItem.price)} × ${cartItem.quantity}</span>
        </div>
        <div class="cart-qty">
          <button class="adjust-qty" data-id="${cartItem.id}" data-action="decrease">−</button>
          <span>${cartItem.quantity}</span>
          <button class="adjust-qty" data-id="${cartItem.id}" data-action="increase">+</button>
        </div>
      </div>
    `;
  }).join('');
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0;
  const discountPercent = Number(ui.discountInput.value) || 0;
  const discount = subtotal * (discountPercent / 100);
  const total = Math.max(0, subtotal + tax - discount);
  ui.subtotalAmount.textContent = formatCurrency(subtotal);
  ui.totalAmount.textContent = formatCurrency(total);
  ui.invoiceItems.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  ui.invoiceStatus.textContent = cart.length ? 'Pending' : 'Empty';
};

const renderOrderHistory = () => {
  ui.orderHistoryBody.innerHTML = orderHistory.slice().reverse().map((order, index) => {
    const date = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <tr>
        <td>${orderHistory.length - index}</td>
        <td>${order.txId}</td>
        <td>${order.items.length}</td>
        <td>${formatCurrency(order.total)}</td>
        <td>${order.status}</td>
        <td>${date}</td>
      </tr>
    `;
  }).join('');
};

const renderReports = () => {
  const totals = buildSalesData();
  ui.reportDaily.textContent = formatCurrency(totals.daily);
  ui.reportWeekly.textContent = formatCurrency(totals.weekly);
  ui.reportMonthly.textContent = formatCurrency(totals.monthly);
  const topItemKey = Object.keys(totals.byItem).sort((a,b) => totals.byItem[b] - totals.byItem[a])[0];
  ui.reportTopItem.textContent = menuItems.find((item) => item.id === topItemKey)?.name || 'None';
  ui.bestItemsList.innerHTML = Object.entries(totals.byItem).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => {
    const item = menuItems.find((entry) => entry.id === id);
    return `
      <li><span>${item?.name || 'Item removed'}</span><strong>${count} sold</strong></li>
    `;
  }).join('') || '<li>No orders yet</li>';
  const peakHours = Array.from({ length: 6 }, (_, idx) => 10 + idx);
  ui.peakSalesBars.innerHTML = peakHours.map((hour) => {
    const amount = totals.hours[hour] || 0;
    const height = Math.max(20, Math.min(220, (amount / Math.max(60, ...Object.values(totals.hours))) * 220));
    return `<div class="bar-item"><span style="block-size:${height}px"></span><small>${hour}:00</small></div>`;
  }).join('');
};

const openPaymentModal = () => {
  if (!cart.length) {
    showToast('Your cart is empty.', 'warning');
    return;
  }
  ui.paymentBackdrop.classList.remove('hide');
  ui.paymentModal.classList.remove('hide');
  setTimeout(() => ui.paymentModal.classList.add('show'), 10);
  ui.paymentLoading.classList.remove('hide');
  ui.paymentQRStep.classList.add('hide');
  ui.paymentSuccessStep.classList.add('hide');
  const total = Number(ui.totalAmount.textContent.replace('₹',''));
  ui.payAmountText.textContent = formatCurrency(total);
  ui.payRefText.textContent = `OPUS-${Date.now().toString().slice(-6)}`;
  setTimeout(() => {
    ui.paymentLoading.classList.add('hide');
    ui.paymentQRStep.classList.remove('hide');
    const qrData = `upi://pay?pa=opuspos@upi&pn=OpusPOS&am=${total.toFixed(2)}&cu=INR&tn=Restaurant+Payment`;
    ui.paymentQRCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}`;
  }, 1200);
};

const closePaymentModal = () => {
  ui.paymentModal.classList.remove('show');
  setTimeout(() => ui.paymentBackdrop.classList.add('hide'), 250);
  setTimeout(() => ui.paymentModal.classList.add('hide'), 250);
};

const completePaymentFlow = () => {
  const total = Number(ui.totalAmount.textContent.replace('$',''));
  const txId = `TX${Date.now().toString().slice(-8)}`;
  const timestamp = new Date().toLocaleString();
  ui.successTxId.textContent = txId;
  ui.successTimestamp.textContent = timestamp;
  ui.paymentQRStep.classList.add('hide');
  ui.paymentSuccessStep.classList.remove('hide');
  ui.paymentBackdrop.classList.remove('hide');
  ui.paymentModal.classList.add('show');
  const orderRecord = {
    txId,
    timestamp: new Date().toISOString(),
    items: cart.map((item) => ({ ...item })),
    total,
    status: 'Paid',
  };
  orderHistory.push(orderRecord);
  cart = [];
  saveState();
  renderOrderHistory();
  renderDashboard();
  renderReports();
  renderBillingMenu();
  updateCart();
  prepareReceipt(orderRecord);
};

const prepareReceipt = (currentOrder) => {
  const lines = currentOrder.items.map((item) => `
    <div class="receipt-row">
      <span>${item.name} ×${item.quantity}</span>
      <strong>${formatCurrency(item.price * item.quantity)}</strong>
    </div>
  `).join('');
  ui.receiptPrintContent.innerHTML = `
    <div class="receipt-header">
      <div>
        <div class="receipt-logo">OP</div>
        <div>
          <h2>OpusPOS Restaurant</h2>
          <p>Premium dining payments</p>
        </div>
      </div>
      <div>
        <p>Bill #: ${currentOrder.txId}</p>
        <p>${new Date(currentOrder.timestamp).toLocaleString()}</p>
      </div>
    </div>
    ${lines}
    <div class="receipt-row"><span>Total Paid</span><strong>${formatCurrency(currentOrder.total)}</strong></div>
    <div class="receipt-row"><span>Payment</span><strong>${currentOrder.status}</strong></div>
    <p style="margin-block-start:24px;color:var(--muted);">Thank you for using OpusPOS. Retain this receipt for your records.</p>
  `;
};

const printReceipt = () => {
  const currentOrder = orderHistory[orderHistory.length - 1];
  const lines = currentOrder.items.map((item) => `
    <div class="receipt-row">
      <span>${item.name} ×${item.quantity}</span>
      <strong>${formatCurrency(item.price * item.quantity)}</strong>
    </div>
  `).join('');
  ui.receiptPrintContent.innerHTML = `
    <div class="receipt-header">
      <div>
        <div class="receipt-logo">OP</div>
        <div>
          <h2>OpusPOS Restaurant</h2>
          <p>Premium dining payments</p>
        </div>
      </div>
      <div>
        <p>Bill #: ${currentOrder.txId}</p>
        <p>${new Date(currentOrder.timestamp).toLocaleString()}</p>
      </div>
    </div>
    ${lines}
    <div class="receipt-row"><span>Total Paid</span><strong>${formatCurrency(currentOrder.total)}</strong></div>
    <div class="receipt-row"><span>Payment</span><strong>${currentOrder.status}</strong></div>
    <p style="margin-block-start:24px;color:var(--muted);">Thank you for using OpusPOS. Retain this receipt for your records.</p>
  `;
  ui.printReceiptArea.classList.remove('hide');
  setTimeout(() => window.print(), 50);
};

const addMenuItem = (itemData) => {
  const newItem = { ...itemData, id: `m${Date.now()}`, available: itemData.available === 'true' || itemData.available === true };
  menuItems.unshift(newItem);
  saveState();
  renderMenuList();
  renderBillingMenu();
  showToast('Menu item added', 'success');
};

const updateMenuItem = (itemId, itemData) => {
  const itemIndex = menuItems.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return;
  menuItems[itemIndex] = { ...menuItems[itemIndex], ...itemData, available: itemData.available === 'true' || itemData.available === true };
  saveState();
  renderMenuList();
  renderBillingMenu();
  showToast('Menu item updated', 'success');
};

const removeMenuItem = (itemId) => {
  menuItems = menuItems.filter((item) => item.id !== itemId);
  cart = cart.filter((item) => item.id !== itemId);
  saveState();
  renderMenuList();
  renderBillingMenu();
  updateCart();
  showToast('Menu item deleted', 'danger');
};

const fillFormForEdit = (itemId) => {
  const item = menuItems.find((entry) => entry.id === itemId);
  if (!item) return;
  editingItemId = itemId;
  $('#menuFormTitle').textContent = 'Edit item';
  const form = document.getElementById('menuForm');
  form.name.value = item.name;
  form.category.value = item.category;
  form.price.value = item.price;
  form.image.value = item.image;
  form.available.value = item.available.toString();
  form.description.value = item.description;
};

const resetForm = () => {
  editingItemId = null;
  $('#menuFormTitle').textContent = 'Add new item';
  document.getElementById('menuForm').reset();
};

const connectDragHandlers = () => {
  const cards = document.querySelectorAll('.menu-card');
  cards.forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', card.dataset.id);
      card.style.opacity = '0.5';
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '';
    });
  });
};

const setupDragTargets = () => {
  document.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('dragover', (event) => {
      event.preventDefault();
      pill.classList.add('drag-target');
    });
    pill.addEventListener('dragleave', () => {
      pill.classList.remove('drag-target');
    });
    pill.addEventListener('drop', (event) => {
      event.preventDefault();
      pill.classList.remove('drag-target');
      const id = event.dataTransfer.getData('text/plain');
      const item = menuItems.find((entry) => entry.id === id);
      if (item) {
        item.category = pill.dataset.filter;
        saveState();
        renderMenuList();
        renderBillingMenu();
        showToast(`${item.name} moved to ${item.category}`, 'info');
      }
    });
  });
};

const setupEvents = () => {
  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => switchPage(button.dataset.page));
  });
  ui.menuSearch.addEventListener('input', renderMenuList);
  ui.billingSearch.addEventListener('input', renderBillingMenu);
  ui.globalSearch.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    if (!query) return;
    showToast(`Search: ${query}`, 'info');
  });
  ui.discountInput.addEventListener('input', updateCart);
  $('#addItemButton').addEventListener('click', () => {
    switchPage('menu');
    resetForm();
    document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth' });
  });
  $('#cancelMenuEdit').addEventListener('click', resetForm);
  $('#menuForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      name: event.target.name.value,
      category: event.target.category.value,
      price: Number(event.target.price.value),
      image: event.target.image.value || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
      available: event.target.available.value,
      description: event.target.description.value,
    };
    if (editingItemId) {
      updateMenuItem(editingItemId, data);
    } else {
      addMenuItem(data);
    }
    resetForm();
  });
  document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('.edit-item')) {
      fillFormForEdit(target.dataset.id);
      document.getElementById('menuForm').scrollIntoView({ behavior: 'smooth' });
    }
    if (target.matches('.delete-item')) {
      removeMenuItem(target.dataset.id);
    }
    if (target.matches('.add-to-cart')) {
      const item = menuItems.find((entry) => entry.id === target.dataset.id);
      if (!item || !item.available) return;
      const existing = cart.find((entry) => entry.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...item, quantity: 1 });
      }
      updateCart();
      showToast(`${item.name} added to cart`, 'success');
    }
    if (target.matches('.adjust-qty')) {
      const id = target.dataset.id;
      const action = target.dataset.action;
      const item = cart.find((entry) => entry.id === id);
      if (!item) return;
      if (action === 'decrease') {
        item.quantity = Math.max(1, item.quantity - 1);
      } else {
        item.quantity += 1;
      }
      updateCart();
    }
    if (target.matches('#clearCartBtn')) {
      cart = [];
      updateCart();
      showToast('Cart cleared', 'warning');
    }
    if (target.matches('#payNowBtn')) {
      openPaymentModal();
    }
    if (target.matches('#closePaymentModal') || target.matches('#paymentBackdrop') || target.matches('#closeSuccessModal')) {
      closePaymentModal();
    }
    if (target.matches('#simulatePayBtn')) {
      completePaymentFlow();
    }
    if (target.matches('#printReceiptBtn')) {
      printReceipt();
    }
    if (target.matches('#toastPreviewBtn')) {
      showToast('Notifications operating normally.', 'info');
    }
    if (target.matches('#exportReportBtn')) {
      exportReportsCSV();
    }
    if (target.matches('#clearHistoryBtn')) {
      orderHistory = [];
      saveState();
      renderOrderHistory();
      renderDashboard();
      renderReports();
      showToast('Order history cleared', 'warning');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      ui.globalSearch.focus();
    }
    if (event.altKey) {
      if (event.key === '1') switchPage('dashboard');
      if (event.key === '2') switchPage('menu');
      if (event.key === '3') switchPage('billing');
      if (event.key === '4') switchPage('reports');
      if (event.key === '5') switchPage('orders');
    }
  });
  ui.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    ui.themeToggle.querySelector('.toggle-thumb').style.transform = document.body.classList.contains('light-mode') ? 'translateX(28px)' : 'translateX(0)';
  });
  document.addEventListener('click', (event) => {
    if (event.target.matches('.pill')) {
      document.querySelectorAll('.pill').forEach((pill) => pill.classList.remove('active'));
      event.target.classList.add('active');
      activeFilter = event.target.dataset.filter;
      renderMenuList();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('#printReceiptArea')) {
      ui.printReceiptArea.classList.add('hide');
    }
  });
};

const exportReportsCSV = () => {
  if (!orderHistory.length) {
    showToast('No report data available yet.', 'warning');
    return;
  }
  const header = ['Transaction', 'Timestamp', 'Items', 'Total', 'Status'];
  const rows = orderHistory.map((order) => [order.txId, order.timestamp, order.items.length, order.total.toFixed(2), order.status]);
  const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');
  const link = document.createElement('a');
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  link.download = `opuspos-report-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Report exported', 'success');
};

const init = () => {
  loadState();
  setupDragTargets();
  setupEvents();
  renderMenuList();
  renderBillingMenu();
  updateCart();
  renderOrderHistory();
  renderDashboard();
  renderReports();
  updateClock();
  setInterval(updateClock, 1000);
};

init();
