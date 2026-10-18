
interface Product {
    id: number;
    title: string;
    price: number;
    rating: number;
    category: string;
    thumbnail: string;
    description: string;
}

interface ProductResponse {
    products: Product[];
    total: number;
    skip: number;
    limit: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

// Application data
let allProducts: Product[] = [];
let selectedCategory: string = "all";
let cart: CartItem[] = [];
let wishlist: number[] = loadWishlist();

// ------------------------------------
// LOAD PRODUCTS FROM API
// ------------------------------------

async function getProducts(): Promise<void> {
    const message = document.getElementById("message");
    const wishlistMessage = document.getElementById("wishlist-message");

    if (message) {
        message.textContent = "Loading products...";
    }

    if (wishlistMessage) {
        wishlistMessage.textContent = "Loading wishlist...";
    }

    try {
        const response = await fetch("https://dummyjson.com/products");

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const data: ProductResponse = await response.json();

        allProducts = data.products;

        // Create category options
        const categoryFilter = document.getElementById(
            "category-filter"
        ) as HTMLSelectElement | null;

        if (categoryFilter) {
            categoryFilter.innerHTML =
                '<option value="all">All Categories</option>';

            const categories = [
                ...new Set(allProducts.map(product => product.category))
            ];

            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }

        // Restore cart and update the cart badge
        loadCart();
        displayCart();

        // Display products on the main page
        if (document.getElementById("product-container")) {
            applyFilters();
        }

        // Display saved wishlist products
        displayWishlist();

    } catch (error) {
        if (message) {
            message.textContent =
                "Unable to load products. Please try again.";
        }

        if (wishlistMessage) {
            wishlistMessage.textContent =
                "Unable to load wishlist products. Please try again.";
        }

        console.error("Error fetching products:", error);
    }
}

// ------------------------------------
// SEARCH, CATEGORY FILTER AND SORTING
// ------------------------------------

function getVisibleProducts(): Product[] {
    const searchInput = document.getElementById(
        "search-input"
    ) as HTMLInputElement | null;

    const categoryFilter = document.getElementById(
        "category-filter"
    ) as HTMLSelectElement | null;

    const sortPrice = document.getElementById(
        "sort-price"
    ) as HTMLSelectElement | null;

    const searchText = searchInput?.value.toLowerCase().trim() ?? "";

    // Keep category selection in sync with the dropdown
    if (categoryFilter) {
        selectedCategory = categoryFilter.value;
    }

    const filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.title
            .toLowerCase()
            .includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const sortValue = sortPrice?.value ?? "default";

    if (sortValue === "low-high") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "high-low") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    return filteredProducts;
}

function applyFilters(): void {
    displayProducts(getVisibleProducts());
}

// ------------------------------------
// DISPLAY PRODUCT CARDS
// ------------------------------------

function displayProducts(products: Product[]): void {
    const container = document.getElementById("product-container");
    const message = document.getElementById("message");

    if (!container || !message) return;

    container.innerHTML = "";

    if (products.length === 0) {
        message.textContent = "No products found.";
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p>Rating: ${product.rating}</p>
            <p>Category: ${product.category}</p>
            <button class="add-to-cart">Add to Cart</button>
            <button class="wishlist-button"></button>
        `;

        // Add to Cart button
        const addButton = card.querySelector(
            ".add-to-cart"
        ) as HTMLButtonElement;

        const alreadyAdded = cart.some(
            item => item.product.id === product.id
        );

        if (alreadyAdded) {
            addButton.textContent = "Added to Cart";
            addButton.classList.add("added");
        }

        addButton.addEventListener("click", event => {
            event.stopPropagation();
            addToCart(product.id);

            addButton.textContent = "Added to Cart";
            addButton.classList.add("added");
        });

        // Wishlist button
        const wishlistButton = card.querySelector(
            ".wishlist-button"
        ) as HTMLButtonElement;

        updateWishlistButton(wishlistButton, product.id);

        wishlistButton.addEventListener("click", event => {
            event.stopPropagation();
            toggleWishlist(product.id);
        });

        // Product details
        card.addEventListener("click", () => {
            const detail = document.getElementById("product-detail");

            if (!detail) return;

            detail.hidden = false;

            detail.innerHTML = `
                <h2>${product.title}</h2>
                <img src="${product.thumbnail}"
                     alt="${product.title}" width="180">
                <p>${product.description}</p>
                <p>Price: $${product.price.toFixed(2)}</p>
                <p>Rating: ${product.rating}</p>
                <p>Category: ${product.category}</p>
                <button id="close-detail">Close Details</button>
            `;

            document.getElementById("close-detail")
                ?.addEventListener("click", () => {
                    detail.hidden = true;
                });
        });

        container.appendChild(card);
    });

    message.textContent = `Showing ${products.length} products`;
}

// ------------------------------------
// SEARCH AND FILTER EVENT LISTENERS
// ------------------------------------

document.getElementById("search-input")
    ?.addEventListener("input", applyFilters);

document.getElementById("category-filter")
    ?.addEventListener("change", applyFilters);

document.getElementById("sort-price")
    ?.addEventListener("change", applyFilters);

// ------------------------------------
// VIEW CART AND WISHLIST BUTTONS
// ------------------------------------

document.getElementById("view-cart-button")
    ?.addEventListener("click", () => {
        window.location.href = "cart.html";
    });

document.getElementById("view-wishlist-button")
    ?.addEventListener("click", () => {
        window.location.href = "wishlist.html";
    });

// ------------------------------------
// ADD PRODUCT TO CART
// ------------------------------------

function addToCart(productId: number): void {
    const product = allProducts.find(
        item => item.id === productId
    );

    if (!product) return;

    const existingItem = cart.find(
        item => item.product.id === productId
    );

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            product,
            quantity: 1
        });
    }

    saveCart();
    displayCart();
}

// ------------------------------------
// DISPLAY CART AND UPDATE CART BADGE
// ------------------------------------

function displayCart(): void {
    const container = document.getElementById("cart-container");
    const count = document.getElementById("cart-count");
    const totalElement = document.getElementById("cart-total");

    // Count all units, including repeated quantities
    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // Update the View Cart badge on the product page
    const cartBadge = document.getElementById("cart-badge");

    if (cartBadge) {
        cartBadge.textContent = totalQuantity.toString();
    }

    // The remaining cart display is only for cart.html
    if (!container || !count || !totalElement) return;

    container.innerHTML = "";

    if (cart.length === 0) {
        container.textContent = "Your cart is empty.";
    }

    cart.forEach(item => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
            <p>${item.product.title}</p>
            <p>Price: $${item.product.price.toFixed(2)}</p>
            <p>Quantity: ${item.quantity}</p>
            <button class="decrease-quantity">-</button>
            <button class="increase-quantity">+</button>
            <button class="remove-item">Remove</button>
        `;

        cartItem.querySelector(".decrease-quantity")
            ?.addEventListener("click", () => {
                changeQuantity(item.product.id, -1);
            });

        cartItem.querySelector(".increase-quantity")
            ?.addEventListener("click", () => {
                changeQuantity(item.product.id, 1);
            });

        cartItem.querySelector(".remove-item")
            ?.addEventListener("click", () => {
                removeFromCart(item.product.id);
            });

        container.appendChild(cartItem);
    });

    const totalPrice = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    count.textContent = `Cart items: ${totalQuantity}`;
    totalElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
}

// ------------------------------------
// CHANGE QUANTITY
// ------------------------------------

function changeQuantity(productId: number, change: number): void {
    const item = cart.find(
        cartItem => cartItem.product.id === productId
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    displayCart();
}

// ------------------------------------
// REMOVE PRODUCT FROM CART
// ------------------------------------

function removeFromCart(productId: number): void {
    cart = cart.filter(
        item => item.product.id !== productId
    );

    saveCart();
    displayCart();
}

// ------------------------------------
// SAVE AND RESTORE CART
// ------------------------------------

function saveCart(): void {
    localStorage.setItem(
        "shopping-cart",
        JSON.stringify(cart)
    );
}

function loadCart(): void {
    try {
        const savedCart = localStorage.getItem("shopping-cart");

        if (!savedCart) {
            cart = [];
            return;
        }

        const parsedCart: CartItem[] = JSON.parse(savedCart);

        cart = parsedCart
            .filter(item =>
                item &&
                item.product &&
                allProducts.some(
                    product => product.id === item.product.id
                ) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
            .map(item => ({
                product: allProducts.find(
                    product => product.id === item.product.id
                )!,
                quantity: item.quantity
            }));

        saveCart();

    } catch (error) {
        cart = [];
        console.error("Unable to restore cart:", error);
    }
}

// ------------------------------------
// WISHLIST FUNCTIONS
// ------------------------------------

function loadWishlist(): number[] {
    try {
        const savedWishlist = localStorage.getItem("wishlist");

        if (!savedWishlist) return [];

        const parsed: unknown = JSON.parse(savedWishlist);

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (id): id is number =>
                typeof id === "number" &&
                Number.isInteger(id) &&
                id > 0
        );
    } catch (error) {
        console.error("Unable to restore wishlist:", error);
        return [];
    }
}

function saveWishlist(): void {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function updateWishlistButton(
    button: HTMLButtonElement,
    productId: number
): void {
    button.textContent = wishlist.includes(productId)
        ? "♥ Added to Wishlist"
        : "♡ Add to Wishlist";
}

function toggleWishlist(productId: number): void {
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
    } else {
        wishlist.push(productId);
    }

    saveWishlist();

    // Re-render filtered products and update wishlist buttons
    if (document.getElementById("product-container")) {
        applyFilters();
    }

    displayWishlist();
}

// ------------------------------------
// DISPLAY WISHLIST PAGE
// ------------------------------------

function displayWishlist(): void {
    const container = document.getElementById("wishlist-container");
    const message = document.getElementById("wishlist-message");

    // This section exists only on wishlist.html
    if (!container || !message) return;

    container.innerHTML = "";

    const savedProducts = allProducts.filter(
        product => wishlist.includes(product.id)
    );

    if (savedProducts.length === 0) {
        message.textContent = "Your wishlist is empty.";
        return;
    }

    message.textContent =
        `You have ${savedProducts.length} saved products.`;

    savedProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p>Rating: ${product.rating}</p>
            <p>Category: ${product.category}</p>
            <button class="remove-wishlist-button">
                Remove from Wishlist
            </button>
        `;

        card.querySelector(".remove-wishlist-button")
            ?.addEventListener("click", () => {
                wishlist = wishlist.filter(
                    id => id !== product.id
                );

                saveWishlist();
                displayWishlist();
            });

        container.appendChild(card);
    });
}

// ------------------------------------
// START THE WEBSITE
// ------------------------------------

getProducts();
