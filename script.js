let products = [];
let categories = [];
let carouselImages = [];
let logo = "";
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentSlide = 0;
let slideInterval;
let selectedCategoryId = null;
let sellers = {};
let currentSellerEmail = null; // Vendedor logado no admin
let clientSellerEmail = null; // Vendedor vindo do URL

const BASE_URL = window.location.origin + window.location.pathname;
const BIN_ID = "67bdbccdad19ca34f8119b7c"; // Verifique se este ID está correto
const API_KEY = "$2a$10$xjoWmrung9GfKAsbopGYjeOW4G5rKFyo0TNCMqf9Uyp/3ogucOnCa"; // Verifique se esta chave está correta

// Extrai o vendedor do URL
function getSellerFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const seller = urlParams.get("seller")?.toLowerCase() || null;
  console.log("Seller extraído da URL:", seller);
  return seller;
}

// Carrega dados do JSONBin
function loadDataFromJSONBin() {
  console.log("Iniciando carregamento de dados do JSONBin...");
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    headers: { "X-Master-Key": API_KEY },
  })
    .then((response) => {
      console.log(
        "Resposta recebida do JSONBin:",
        response.status,
        response.statusText
      );
      if (!response.ok) {
        throw new Error(
          `Erro na requisição: ${response.status} - ${response.statusText}`
        );
      }
      return response.json();
    })
    .then((data) => {
      console.log("Dados brutos recebidos do JSONBin:", data);
      if (!data.record) {
        throw new Error(
          "Nenhum dado 'record' encontrado na resposta do JSONBin."
        );
      }
      products = data.record.products || [];
      categories = data.record.categories || [];
      carouselImages = data.record.carouselImages || [];
      logo = data.record.logo || "https://via.placeholder.com/40x40?text=Logo";
      sellers = data.record.sellers || {};
      clientSellerEmail = getSellerFromUrl();
      console.log("Dados processados com sucesso:", {
        products,
        categories,
        carouselImages,
        logo,
        sellers,
        clientSellerEmail,
      });
      loadInitialData();
      updateHeaderLogo();
    })
    .catch((error) => {
      console.error("Erro ao carregar dados do JSONBin:", error);
      // Carrega dados padrão em caso de falha
      products = [
        {
          id: "1",
          name: "Produto Exemplo 1",
          price: 99.9,
          promoPrice: 79.9,
          image: "https://via.placeholder.com/150",
          description: "Descrição do produto exemplo 1.",
          categoryId: "cat1",
          sellerEmail: "vendedor@example.com",
        },
        {
          id: "2",
          name: "Produto Exemplo 2",
          price: 49.9,
          image: "https://via.placeholder.com/150",
          description: "Descrição do produto exemplo 2.",
          categoryId: "cat2",
          sellerEmail: "vendedor@example.com",
        },
      ];
      categories = [
        { id: "cat1", name: "Eletrônicos" },
        { id: "cat2", name: "Roupas" },
      ];
      carouselImages = ["https://via.placeholder.com/600x400?text=Slide+1"];
      logo = "https://via.placeholder.com/40x40?text=Logo";
      sellers = {
        "vendedor@example.com": {
          email: "vendedor@example.com",
          password: "12345",
          phone: "5511999999999",
        },
      };
      clientSellerEmail = getSellerFromUrl();
      console.log("Dados padrão carregados devido a erro:", {
        products,
        sellers,
        clientSellerEmail,
      });
      loadInitialData();
      updateHeaderLogo();
    });
}

// Salva dados no JSONBin
async function saveToJSONBin() {
  try {
    const dataToSave = { products, categories, carouselImages, logo, sellers };
    console.log("Tentando salvar dados no JSONBin:", dataToSave);
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY,
      },
      body: JSON.stringify(dataToSave),
    });
    if (!response.ok) {
      throw new Error(
        `Erro ao salvar no JSONBin: ${response.status} - ${response.statusText}`
      );
    }
    const result = await response.json();
    console.log("Dados salvos com sucesso no JSONBin:", result);
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Erro ao salvar dados no JSONBin:", error);
    alert(
      "Houve um problema ao salvar os dados. Verifique sua conexão ou tente novamente mais tarde."
    );
    throw error;
  }
}

// Atualiza o logotipo no cabeçalho
function updateHeaderLogo() {
  const headerTitle = document.getElementById("header-title");
  if (!headerTitle) {
    console.error("Elemento 'header-title' não encontrado no DOM.");
    return;
  }
  headerTitle.innerHTML = `
    <div style="display: flex; align-items: center;">
      <img src="${logo}" alt="Logotipo" style="max-height: 40px; margin-right: 8px; border-radius: 4px;">
      <h1 style="font-size: 1rem;">Vitrine de Ofertas</h1>
    </div>
  `;
}

// Formata o preço
function formatPrice(price) {
  return `R$ ${price
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

// Carrega dados iniciais
function loadInitialData() {
  console.log("Carregando dados iniciais...");
  renderNavBar();
  renderProducts();
  renderCarousel();
  startCarousel();
  updateCartCount();
  renderCart();
}

// Renderiza a barra de navegação
function renderNavBar() {
  const navBar = document.getElementById("nav-bar");
  if (!navBar) {
    console.error("Elemento 'nav-bar' não encontrado no DOM.");
    return;
  }
  navBar.innerHTML = "";
  const allCategoriesItem = document.createElement("div");
  allCategoriesItem.className = `nav-item ${
    !selectedCategoryId ? "active" : ""
  }`;
  allCategoriesItem.textContent = "Todas";
  allCategoriesItem.onclick = () => filterProducts(null);
  navBar.appendChild(allCategoriesItem);

  categories.forEach((category) => {
    const navItem = document.createElement("div");
    navItem.className = `nav-item ${
      selectedCategoryId === category.id ? "active" : ""
    }`;
    navItem.textContent = category.name;
    navItem.onclick = () => filterProducts(category.id);
    navBar.appendChild(navItem);
  });

  const contactSellerItem = document.createElement("div");
  contactSellerItem.className = "nav-item contact-seller";
  contactSellerItem.innerHTML = `<span style="font-size: 0.9rem;">📞</span> Fale com o Vendedor`;
  contactSellerItem.onclick = contactSeller;
  navBar.appendChild(contactSellerItem);
}

// Função para contato com o vendedor
function contactSeller() {
  const sellerEmail =
    clientSellerEmail ||
    (cart.length > 0
      ? products.find((p) => p.id === cart[0].productId)?.sellerEmail
      : null) ||
    Object.keys(sellers)[0];
  const sellerPhone = sellers[sellerEmail]?.phone;

  console.log(
    "Contato com vendedor. sellerEmail:",
    sellerEmail,
    "sellerPhone:",
    sellerPhone
  );

  if (!sellerPhone) {
    alert(
      `Nenhum número de WhatsApp cadastrado para o vendedor ${
        sellerEmail || "desconhecido"
      }!`
    );
    return;
  }

  let cleanPhone = sellerPhone.replace(/\D/g, "");
  if (cleanPhone.length === 11) cleanPhone = "55" + cleanPhone;
  if (!/^\d{12,13}$/.test(cleanPhone) || !cleanPhone.startsWith("55")) {
    alert(
      `Número de WhatsApp inválido para o vendedor ${sellerEmail}: ${sellerPhone}. Deve conter 12 ou 13 dígitos e começar com 55.`
    );
    return;
  }

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Olá, gostaria de mais informações sobre os produtos da Vitrine de Ofertas!"
  )}`;
  console.log("Abrindo WhatsApp com URL:", whatsappUrl);
  window.open(whatsappUrl, "_blank");
}

// Filtra produtos por categoria
function filterProducts(categoryId) {
  selectedCategoryId = categoryId;
  renderNavBar();
  renderProducts();
}

// Abre o modal administrativo
function openAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (!modal) {
    console.error("Modal 'admin-modal' não encontrado no DOM.");
    return;
  }
  modal.style.display = "block";
  setTimeout(() => modal.classList.add("show"), 10);
  document.getElementById("admin-email").value = currentSellerEmail || "";
  document.getElementById("admin-password").value = "";
  document.getElementById("admin-login").style.display = "block";
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("register-form").style.display = "none";
}

// Fecha o modal administrativo
function closeAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (!modal) return;
  modal.classList.remove("show");
  setTimeout(() => (modal.style.display = "none"), 300);
  document.getElementById("edit-form").style.display = "none";
  document.getElementById("admin-form").style.display = "block";
  currentSellerEmail = null;
}

// Mostra o formulário de registro
function showRegisterForm() {
  document.getElementById("admin-login").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("register-email").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-phone").value = "";
}

// Mostra o formulário de login
function showLoginForm() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("admin-login").style.display = "block";
}

// Verifica senha para login administrativo
function checkPassword() {
  const emailInput = document.getElementById("admin-email").value.toLowerCase();
  const passwordInput = document.getElementById("admin-password").value;
  if (sellers[emailInput] && sellers[emailInput].password === passwordInput) {
    currentSellerEmail = emailInput;
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    renderAdminProducts();
    renderCarouselItems();
    renderCategoryItems();
    populateCategorySelects();
    document.getElementById("seller-phone").value =
      sellers[currentSellerEmail]?.phone || "";
    generateSellerLink();
  } else {
    document.getElementById("error-message").textContent =
      "Senha ou e-mail incorretos! Tente novamente.";
    showPasswordErrorModal();
  }
}

// Registra um novo vendedor
async function registerSeller(event) {
  event.preventDefault();
  const emailInput = document
    .getElementById("register-email")
    .value.toLowerCase();
  const passwordInput = document.getElementById("register-password").value;
  const phoneInput = document.getElementById("register-phone").value;

  if (!emailInput || !passwordInput || !phoneInput) {
    document.getElementById("error-message").textContent =
      "Por favor, preencha e-mail, senha e telefone!";
    showPasswordErrorModal();
    return;
  }

  if (sellers[emailInput]) {
    document.getElementById("error-message").textContent =
      "Este e-mail já está cadastrado!";
    showPasswordErrorModal();
    return;
  }

  if (passwordInput.length < 5) {
    document.getElementById("error-message").textContent =
      "A senha deve ter pelo menos 5 caracteres!";
    showPasswordErrorModal();
    return;
  }

  let cleanedPhone = phoneInput.replace(/\D/g, "");
  if (cleanedPhone.length === 11) cleanedPhone = "55" + cleanedPhone;
  if (!/^\d{12,13}$/.test(cleanedPhone) || !cleanedPhone.startsWith("55")) {
    document.getElementById("error-message").textContent =
      "Número de WhatsApp inválido! Use o formato 5511987654321 (12 ou 13 dígitos, começando com 55).";
    showPasswordErrorModal();
    return;
  }

  sellers[emailInput] = {
    email: emailInput,
    password: passwordInput,
    phone: cleanedPhone,
  };
  try {
    await saveToJSONBin();
    alert(
      `Vendedor cadastrado com sucesso! E-mail: ${emailInput}, Telefone: ${cleanedPhone}. Faça login para continuar.`
    );
    showLoginForm();
  } catch (error) {
    document.getElementById("error-message").textContent =
      "Erro ao salvar o cadastro. Tente novamente.";
    showPasswordErrorModal();
  }
}

// Gera o link personalizado do vendedor
function generateSellerLink() {
  showShareLinkModal();
}

// Preenche os selects de categoria
function populateCategorySelects() {
  const addSelect = document.getElementById("product-category");
  const editSelect = document.getElementById("edit-product-category");
  if (!addSelect || !editSelect) {
    console.error("Selects de categoria não encontrados no DOM.");
    return;
  }
  addSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  editSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  categories.forEach((category) => {
    const optionAdd = document.createElement("option");
    optionAdd.value = category.id;
    optionAdd.textContent = category.name;
    addSelect.appendChild(optionAdd);

    const optionEdit = document.createElement("option");
    optionEdit.value = category.id;
    optionEdit.textContent = category.name;
    editSelect.appendChild(optionEdit);
  });
}

// Alterna entre entrada de URL e arquivo para imagens
function toggleImageInput() {
  const method = document.getElementById("image-method").value;
  const urlInput = document.getElementById("product-image-url");
  const fileInput = document.getElementById("product-image-file");
  if (method === "url") {
    urlInput.style.display = "block";
    fileInput.style.display = "none";
    urlInput.required = true;
    fileInput.required = false;
  } else {
    urlInput.style.display = "none";
    fileInput.style.display = "block";
    urlInput.required = false;
    fileInput.required = true;
  }
}

function toggleEditImageInput() {
  const method = document.getElementById("edit-image-method").value;
  const urlInput = document.getElementById("edit-product-image-url");
  const fileInput = document.getElementById("edit-product-image-file");
  if (method === "url") {
    urlInput.style.display = "block";
    fileInput.style.display = "none";
    urlInput.required = true;
    fileInput.required = false;
  } else {
    urlInput.style.display = "none";
    fileInput.style.display = "block";
    urlInput.required = false;
    fileInput.required = true;
  }
}

// Obtém imagem de arquivo
function getImageFromFile(inputId) {
  return new Promise((resolve) => {
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
}

// Adiciona produto
async function addProduct(event) {
  event.preventDefault();
  const name = document.getElementById("product-name").value;
  const price = parseFloat(document.getElementById("product-price").value);
  const promoPrice = document.getElementById("product-promo-price").value
    ? parseFloat(document.getElementById("product-promo-price").value)
    : null;
  const method = document.getElementById("image-method").value;
  const description = document.getElementById("product-description").value;
  const categoryId = document.getElementById("product-category").value;

  let image;
  if (method === "url") {
    image = document.getElementById("product-image-url").value;
    if (!image) {
      alert("Por favor, forneça uma URL válida!");
      return;
    }
  } else {
    image = await getImageFromFile("product-image-file");
    if (!image) {
      alert("Por favor, selecione uma imagem válida!");
      return;
    }
  }

  const newProduct = {
    id: Date.now().toString(),
    name,
    price,
    promoPrice,
    image,
    description,
    categoryId,
    sellerEmail: currentSellerEmail,
  };
  products.push(newProduct);
  renderProducts();
  renderAdminProducts();
  document.getElementById("admin-form").reset();
  toggleImageInput();
  alert("Produto cadastrado com sucesso!");
  await saveToJSONBin();
}

// Renderiza produtos
function renderProducts() {
  const productsGrid = document.getElementById("products");
  if (!productsGrid) {
    console.error("Elemento 'products' não encontrado no DOM.");
    return;
  }
  productsGrid.innerHTML = "";
  const filteredProducts = selectedCategoryId
    ? products.filter((p) => p.categoryId === selectedCategoryId)
    : products;

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = "<p>Nenhum produto nesta categoria.</p>";
  } else {
    filteredProducts.forEach((product) => {
      const productCard = `
        <div class="product-card">
          <img src="${product.image}" alt="${
        product.name
      }" onclick="showDescription('${product.id}')">
          <div class="click-hint">Clique na imagem para ver descrição</div>
          <h3>${product.name}</h3>
          <div class="price-container">
            ${
              product.promoPrice !== null && product.promoPrice !== undefined
                ? `<span class="original-price">${formatPrice(
                    product.price
                  )}</span>
                 <span class="promo-price">${formatPrice(
                   product.promoPrice
                 )}</span>`
                : `<span class="single-price">${formatPrice(
                    product.price
                  )}</span>`
            }
          </div>
          <button onclick="addToCart(event, '${
            product.id
          }')">Adicionar ao Carrinho</button>
        </div>
      `;
      productsGrid.innerHTML += productCard;
    });
  }
}

// Renderiza produtos no admin
function renderAdminProducts() {
  const adminProducts = document.getElementById("admin-products");
  if (!adminProducts) {
    console.error("Elemento 'admin-products' não encontrado no DOM.");
    return;
  }
  adminProducts.innerHTML = "<h3>Seus Produtos Cadastrados</h3>";
  const sellerProducts = products.filter(
    (p) => p.sellerEmail === currentSellerEmail
  );
  if (sellerProducts.length === 0) {
    adminProducts.innerHTML += "<p>Nenhum produto cadastrado ainda.</p>";
  } else {
    sellerProducts.forEach((product) => {
      const category = categories.find((c) => c.id === product.categoryId);
      const productItem = `
        <div class="product-admin-item">
          <div>
            <img src="${product.image}" alt="${product.name}">
            <span>${product.name} - ${
        product.promoPrice !== null && product.promoPrice !== undefined
          ? `De ${formatPrice(product.price)} para ${formatPrice(
              product.promoPrice
            )}`
          : formatPrice(product.price)
      } (${category ? category.name : "Sem categoria"})</span>
          </div>
          <div>
            <button class="edit-btn" onclick="openEditForm('${
              product.id
            }')">Editar</button>
            <button onclick="deleteProduct('${product.id}')">Excluir</button>
          </div>
        </div>
      `;
      adminProducts.innerHTML += productItem;
    });
  }
}

// Exclui produto
function deleteProduct(productId) {
  if (confirm("Tem certeza que deseja excluir este produto?")) {
    products = products.filter(
      (p) => p.id !== productId || p.sellerEmail !== currentSellerEmail
    );
    renderProducts();
    renderAdminProducts();
    saveToJSONBin();
  }
}

// Abre formulário de edição
function openEditForm(productId) {
  const product = products.find(
    (p) => p.id === productId && p.sellerEmail === currentSellerEmail
  );
  if (product) {
    document.getElementById("edit-product-id").value = product.id;
    document.getElementById("edit-product-name").value = product.name;
    document.getElementById("edit-product-price").value = product.price;
    document.getElementById("edit-product-promo-price").value =
      product.promoPrice || "";
    document.getElementById("edit-product-image-url").value = product.image;
    document.getElementById("edit-product-description").value =
      product.description;
    document.getElementById("edit-product-category").value = product.categoryId;

    document.getElementById("admin-form").style.display = "none";
    document.getElementById("edit-form").style.display = "block";
    toggleEditImageInput();
  }
}

// Edita produto
async function editProduct(event) {
  event.preventDefault();
  const id = document.getElementById("edit-product-id").value;
  const name = document.getElementById("edit-product-name").value;
  const price = parseFloat(document.getElementById("edit-product-price").value);
  const promoPrice = document.getElementById("edit-product-promo-price").value
    ? parseFloat(document.getElementById("edit-product-promo-price").value)
    : null;
  const method = document.getElementById("edit-image-method").value;
  const description = document.getElementById("edit-product-description").value;
  const categoryId = document.getElementById("edit-product-category").value;

  let image;
  if (method === "url") {
    image = document.getElementById("edit-product-image-url").value;
    if (!image) {
      alert("Por favor, forneça uma URL válida!");
      return;
    }
  } else {
    image = await getImageFromFile("edit-product-image-file");
    if (!image) {
      image = products.find((p) => p.id === id).image;
    }
  }

  const productIndex = products.findIndex(
    (p) => p.id === id && p.sellerEmail === currentSellerEmail
  );
  if (productIndex !== -1) {
    products[productIndex] = {
      id,
      name,
      price,
      promoPrice,
      image,
      description,
      categoryId,
      sellerEmail: currentSellerEmail,
    };
    renderProducts();
    renderAdminProducts();
    document.getElementById("edit-form").style.display = "none";
    document.getElementById("admin-form").style.display = "block";
    alert("Produto alterado com sucesso!");
    await saveToJSONBin();
  }
}

// Adiciona categoria
function addCategory(event) {
  event.preventDefault();
  const name = document.getElementById("category-name").value;
  const newCategory = { id: `cat${Date.now()}`, name };
  categories.push(newCategory);
  renderCategoryItems();
  renderNavBar();
  populateCategorySelects();
  document.getElementById("category-form").reset();
  alert("Categoria adicionada com sucesso!");
  saveToJSONBin();
}

// Exclui categoria
function deleteCategory(categoryId) {
  if (
    confirm(
      "Tem certeza que deseja excluir esta categoria? Produtos associados ficarão sem categoria."
    )
  ) {
    categories = categories.filter((c) => c.id !== categoryId);
    products = products.map((p) =>
      p.categoryId === categoryId ? { ...p, categoryId: null } : p
    );
    renderCategoryItems();
    renderNavBar();
    renderProducts();
    renderAdminProducts();
    populateCategorySelects();
    saveToJSONBin();
  }
}

// Renderiza categorias no admin
function renderCategoryItems() {
  const categoryItems = document.getElementById("category-items");
  if (!categoryItems) {
    console.error("Elemento 'category-items' não encontrado no DOM.");
    return;
  }
  categoryItems.innerHTML = "<h3>Categorias Cadastradas</h3>";
  if (categories.length === 0) {
    categoryItems.innerHTML += "<p>Nenhuma categoria cadastrada ainda.</p>";
  } else {
    categories.forEach((category) => {
      const categoryItem = `
        <div class="category-item">
          <span>${category.name}</span>
          <button onclick="deleteCategory('${category.id}')">Excluir</button>
        </div>
      `;
      categoryItems.innerHTML += categoryItem;
    });
  }
}

// Adiciona ao carrinho
function addToCart(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const cartItem = cart.find((item) => item.productId === productId);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  updateCartCount();
  renderCart();
  saveToJSONBin();

  showCartSuccessModal();
  if (event.target.closest(".description-content")) {
    closeDescriptionModal();
  }
}

// Renderiza o carrinho
function renderCart() {
  const cartItems = document.getElementById("cart-items");
  if (!cartItems) {
    console.error("Elemento 'cart-items' não encontrado no DOM.");
    return;
  }
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const itemPrice =
        product.promoPrice !== null && product.promoPrice !== undefined
          ? product.promoPrice
          : product.price;
      const itemTotal = itemPrice * item.quantity;
      total += itemTotal;
      const cartItem = `
        <div class="cart-item">
          <span>${product.name}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="decreaseQuantity('${item.productId}')">−</button>
            <span>${item.quantity}x</span>
            <button onclick="increaseQuantity('${item.productId}')">+</button>
            <span>${formatPrice(itemTotal)}</span>
          </div>
        </div>
      `;
      cartItems.innerHTML += cartItem;
    }
  });

  document.getElementById("cart-total").textContent = `Total: ${formatPrice(
    total
  )}`;
}

// Aumenta quantidade no carrinho
function increaseQuantity(productId) {
  const cartItem = cart.find((item) => item.productId === productId);
  if (cartItem) {
    cartItem.quantity++;
    updateCartCount();
    renderCart();
    saveToJSONBin();
  }
}

// Diminui quantidade no carrinho
function decreaseQuantity(productId) {
  const cartItem = cart.find((item) => item.productId === productId);
  if (cartItem) {
    if (cartItem.quantity > 1) {
      cartItem.quantity--;
    } else {
      cart = cart.filter((item) => item.productId !== productId);
    }
    updateCartCount();
    renderCart();
    saveToJSONBin();
  }
}

// Atualiza contador do carrinho
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) {
    console.error("Elemento 'cart-count' não encontrado no DOM.");
    return;
  }
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// Alterna visibilidade do carrinho
function toggleCart() {
  const modal = document.getElementById("cart-modal");
  if (!modal) {
    console.error("Modal 'cart-modal' não encontrado no DOM.");
    return;
  }
  if (modal.style.display === "block") {
    modal.classList.remove("show");
    setTimeout(() => (modal.style.display = "none"), 300);
  } else {
    modal.style.display = "block";
    setTimeout(() => modal.classList.add("show"), 10);
  }
  renderCart();
}

// Checkout (Fale com o Vendedor no carrinho)
function checkout() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  let message = "Olá, gostaria de saber sobre esse(s) produto(s):\n";
  let sellerPhone = null;

  const sellerEmail =
    clientSellerEmail ||
    (cart.length > 0
      ? products.find((p) => p.id === cart[0].productId)?.sellerEmail
      : null) ||
    Object.keys(sellers)[0];
  sellerPhone = sellers[sellerEmail]?.phone;

  console.log(
    "Checkout. sellerEmail:",
    sellerEmail,
    "sellerPhone:",
    sellerPhone
  );

  if (!sellerPhone) {
    alert(
      `Nenhum número de WhatsApp cadastrado para o vendedor ${
        sellerEmail || "desconhecido"
      }!`
    );
    return;
  }

  let cleanPhone = sellerPhone.replace(/\D/g, "");
  if (cleanPhone.length === 11) cleanPhone = "55" + cleanPhone;
  if (!/^\d{12,13}$/.test(cleanPhone) || !cleanPhone.startsWith("55")) {
    alert(
      `Número de WhatsApp inválido para o vendedor ${sellerEmail}: ${sellerPhone}. Deve conter 12 ou 13 dígitos e começar com 55.`
    );
    return;
  }

  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const itemPrice =
        product.promoPrice !== null && product.promoPrice !== undefined
          ? product.promoPrice
          : product.price;
      const itemTotal = itemPrice * item.quantity;
      message += `${product.name} (${item.quantity}x) - ${formatPrice(
        itemTotal
      )}\n`;
    }
  });

  message += `Total: ${document.getElementById("cart-total").textContent}`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    message
  )}`;
  console.log("Abrindo WhatsApp com URL:", whatsappUrl);
  window.open(whatsappUrl, "_blank");

  cart = [];
  updateCartCount();
  renderCart();
  toggleCart();
  saveToJSONBin();
}

// Adiciona imagem ao carrossel
function addCarouselImage(event) {
  event.preventDefault();
  const imageUrl = document.getElementById("carousel-image-url").value;
  if (imageUrl) {
    carouselImages.push(imageUrl);
    renderCarousel();
    document.getElementById("carousel-form").reset();
    alert("Imagem adicionada ao carrossel com sucesso!");
    startCarousel();
    saveToJSONBin();
  } else {
    alert("Insira a URL da imagem!");
  }
}

// Exclui imagem do carrossel
function deleteCarouselImage(index) {
  if (confirm("Tem certeza que deseja excluir esta imagem do carrossel?")) {
    carouselImages.splice(index, 1);
    if (currentSlide >= carouselImages.length) {
      currentSlide = carouselImages.length - 1;
    }
    if (currentSlide < 0) currentSlide = 0;
    renderCarousel();
    if (carouselImages.length === 0) stopCarousel();
    saveToJSONBin();
  }
}

// Renderiza o carrossel
function renderCarousel() {
  const carouselContainer = document.getElementById("carousel-container");
  if (!carouselContainer) {
    console.error("Elemento 'carousel-container' não encontrado no DOM.");
    return;
  }
  carouselContainer.innerHTML = "";
  carouselImages.forEach((image) => {
    const slide = `<img src="${image}" class="carousel-slide" alt="Carrossel">`;
    carouselContainer.innerHTML += slide;
  });
  updateCarousel();
  renderCarouselItems();
}

// Atualiza o carrossel
function updateCarousel() {
  const carouselContainer = document.getElementById("carousel-container");
  if (carouselImages.length > 0) {
    carouselContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
  } else {
    carouselContainer.style.transform = "translateX(0)";
  }
}

// Próximo slide
function nextSlide() {
  if (carouselImages.length > 1) {
    currentSlide = (currentSlide + 1) % carouselImages.length;
    updateCarousel();
  }
}

// Slide anterior
function prevSlide() {
  if (carouselImages.length > 1) {
    currentSlide =
      (currentSlide - 1 + carouselImages.length) % carouselImages.length;
    updateCarousel();
  }
}

// Inicia o carrossel
function startCarousel() {
  if (carouselImages.length > 1 && !slideInterval) {
    slideInterval = setInterval(nextSlide, 5000);
  }
}

// Para o carrossel
function stopCarousel() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

// Renderiza itens do carrossel no admin
function renderCarouselItems() {
  const carouselItems = document.getElementById("carousel-items");
  if (!carouselItems) {
    console.error("Elemento 'carousel-items' não encontrado no DOM.");
    return;
  }
  carouselItems.innerHTML = "<h3>Imagens do Carrossel</h3>";
  carouselImages.forEach((image, index) => {
    const item = `
      <div class="carousel-item">
        <div>
          <img src="${image}" alt="Imagem ${index + 1}">
          <span>Imagem ${index + 1}</span>
        </div>
        <button onclick="deleteCarouselImage(${index})">Excluir</button>
      </div>
    `;
    carouselItems.innerHTML += item;
  });
}

// Atualiza o logotipo
function updateLogo(event) {
  event.preventDefault();
  const logoUrl = document.getElementById("logo-url").value;
  if (logoUrl) {
    logo = logoUrl;
    updateHeaderLogo();
    document.getElementById("logo-form").reset();
    alert("Logotipo atualizado com sucesso!");
    saveToJSONBin();
  } else {
    alert("Insira a URL do logotipo!");
  }
}

// Atualiza o número de telefone do vendedor
async function updateSellerPhone(event) {
  event.preventDefault();
  const phoneInput = document.getElementById("seller-phone").value;
  let cleanedPhone = phoneInput.replace(/\D/g, "");

  if (cleanedPhone.length === 11) cleanedPhone = "55" + cleanedPhone;

  if (!/^\d{12,13}$/.test(cleanedPhone) || !cleanedPhone.startsWith("55")) {
    alert(
      "Por favor, insira um número de WhatsApp válido! Exemplo: 5511987654321 (12 ou 13 dígitos, começando com 55)."
    );
    return;
  }

  if (currentSellerEmail) {
    sellers[currentSellerEmail].phone = cleanedPhone;
    console.log(
      `Atualizando telefone para ${currentSellerEmail}: ${cleanedPhone}`
    );
    try {
      await saveToJSONBin();
      alert(
        `Seu número foi atualizado com sucesso: ${cleanedPhone}\nCompartilhe seu link personalizado com seus clientes!`
      );
      document.getElementById("seller-phone").value = cleanedPhone;
      generateSellerLink();
    } catch (error) {
      alert("Erro ao salvar o número. Tente novamente.");
    }
  } else {
    alert("Erro: Nenhum vendedor logado!");
  }
}

// Mostra descrição do produto
function showDescription(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    const modal = document.getElementById("description-modal");
    const content = document.getElementById("description-content");

    content.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <div class="price-container">
        ${
          product.promoPrice !== null && product.promoPrice !== undefined
            ? `<span class="original-price">${formatPrice(product.price)}</span>
             <span class="promo-price">${formatPrice(
               product.promoPrice
             )}</span>`
            : `<span class="single-price">${formatPrice(product.price)}</span>`
        }
      </div>
      <p>${product.description}</p>
      <button onclick="addToCart(event, '${
        product.id
      }')">Adicionar ao Carrinho</button>
    `;

    modal.style.display = "block";
    setTimeout(() => modal.classList.add("show"), 10);
  }
}

// Fecha o modal de descrição
function closeDescriptionModal() {
  const modal = document.getElementById("description-modal");
  modal.classList.remove("show");
  setTimeout(() => (modal.style.display = "none"), 400);
}

// Mostra modal de sucesso do carrinho
function showCartSuccessModal() {
  const modal = document.getElementById("cart-success-modal");
  modal.classList.add("show");
}

// Fecha modal de sucesso do carrinho
function closeCartSuccessModal() {
  const modal = document.getElementById("cart-success-modal");
  modal.classList.remove("show");
}

// Mostra modal de erro
function showPasswordErrorModal() {
  const modal = document.getElementById("password-error-modal");
  modal.classList.add("show");
}

// Fecha modal de erro
function closePasswordErrorModal() {
  const modal = document.getElementById("password-error-modal");
  modal.classList.remove("show");
}

// Mostra a modal com o link de compartilhamento (admin)
function showShareLinkModal() {
  const modal = document.getElementById("share-link-modal");
  const shareLinkInput = document.getElementById("share-link");
  const sellerLink = `${BASE_URL}?seller=${encodeURIComponent(
    currentSellerEmail || ""
  )}`;

  shareLinkInput.value = sellerLink;
  document.getElementById("copy-success").style.display = "none";

  modal.style.display = "block";
  setTimeout(() => modal.classList.add("show"), 10);
}

// Fecha a modal de compartilhamento (admin)
function closeShareLinkModal() {
  const modal = document.getElementById("share-link-modal");
  modal.classList.remove("show");
  setTimeout(() => (modal.style.display = "none"), 300);
}

// Copia o link para a área de transferência (admin)
function copyShareLink() {
  const shareLinkInput = document.getElementById("share-link");
  shareLinkInput.select();
  document.execCommand("copy");
  const successMessage = document.getElementById("copy-success");
  successMessage.style.display = "block";
  setTimeout(() => (successMessage.style.display = "none"), 2000);
}

// Mostra a modal com o link público
function showPublicShareLinkModal() {
  const modal = document.getElementById("public-share-link-modal");
  const shareLinkInput = document.getElementById("public-share-link");
  const sellerEmail =
    clientSellerEmail ||
    (cart.length > 0
      ? products.find((p) => p.id === cart[0].productId)?.sellerEmail
      : null) ||
    Object.keys(sellers)[0];
  const sellerLink = `${BASE_URL}?seller=${encodeURIComponent(
    sellerEmail || ""
  )}`;

  shareLinkInput.value = sellerLink;
  document.getElementById("public-copy-success").style.display = "none";

  modal.style.display = "block";
  setTimeout(() => modal.classList.add("show"), 10);
}

// Fecha a modal de compartilhamento público
function closePublicShareLinkModal() {
  const modal = document.getElementById("public-share-link-modal");
  modal.classList.remove("show");
  setTimeout(() => (modal.style.display = "none"), 300);
}

// Copia o link público para a área de transferência
function copyPublicShareLink() {
  const shareLinkInput = document.getElementById("public-share-link");
  shareLinkInput.select();
  document.execCommand("copy");
  const successMessage = document.getElementById("public-copy-success");
  successMessage.style.display = "block";
  setTimeout(() => (successMessage.style.display = "none"), 2000);
}

// Inicializa o sistema
console.log("Inicializando o sistema...");
loadDataFromJSONBin();
