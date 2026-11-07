const ticketPrices = {
    VIP: 50,
    Standard: 30,
    Economy: 20 };
    
const venueSections = [
    { name: "VIP", rows: 3, seatsPerRow: 8},
    { name: "Standard", rows: 4, seatsPerRow: 10},
    { name: "Economy", rows: 4, seatsPerRow: 12}];
    
const unavailableSeats = ["VIP-A3", "VIP-A4", "Standard-B5", "Economy-C7"];

const venueMap = document.getElementById("venue-map");
const zoomLevel = document.getElementById("zoom-level");

let mapScale = 1;
let mapOffsetX = 0;
let mapOffsetY = 0;

function updateMapTransform() {
    venueMap.style.transform =
        `translate(${mapOffsetX}px, ${mapOffsetY}px) scale(${mapScale})`;
}

function updateMapView() {
    updateMapTransform();
    zoomLevel.textContent = `${Math.round(mapScale * 100)}%`;
}

document.getElementById("zoom-in").addEventListener("click", () => {
    mapScale = Math.min(mapScale + 0.1, 1.8);
    updateMapView();
});

document.getElementById("zoom-out").addEventListener("click", () => {
    mapScale = Math.max(mapScale - 0.1, 0.7);
    updateMapView();
});
document.getElementById("move-up").addEventListener("click", () => {
    mapOffsetY -= 30;
    updateMapView();
});

document.getElementById("move-down").addEventListener("click", () => {
    mapOffsetY += 30;
    updateMapView();
});

document.getElementById("move-left").addEventListener("click", () => {
    mapOffsetX -= 30;
    updateMapView();
});

document.getElementById("move-right").addEventListener("click", () => {
    mapOffsetX += 30;
    updateMapView();
});

document.getElementById("reset-view").addEventListener("click", () => {
    mapScale = 1;
    mapOffsetX = 0;
    mapOffsetY = 0;
    updateMapView();
});

const mapViewport = document.querySelector(".map-viewport");

let isDraggingMap = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragMoved = false;
let suppressNextSeatClick = false;
let dragRenderFrame = null;
let wheelZoomResetTimer = null;
let wheelZoomDirection = 0;
let pinchGestureActive = false;
let pinchStartScale = 1;
let lastPinchGestureTime = 0;

mapViewport.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    pinchGestureActive = true;
    pinchStartScale = mapScale;
    lastPinchGestureTime = performance.now();
    mapViewport.classList.add("is-zooming");
    clearTimeout(wheelZoomResetTimer);
    wheelZoomResetTimer = null;
}, { passive: false });

mapViewport.addEventListener("gesturechange", (event) => {
    event.preventDefault();

    if (!pinchGestureActive) return;

    lastPinchGestureTime = performance.now();
    mapScale = Math.min(1.8, Math.max(0.7, pinchStartScale * event.scale));
    updateMapView();
}, { passive: false });

mapViewport.addEventListener("gestureend", (event) => {
    event.preventDefault();
    pinchGestureActive = false;
    lastPinchGestureTime = performance.now();
    mapViewport.classList.remove("is-zooming");
}, { passive: false });

mapViewport.addEventListener("wheel", (event) => {
    event.preventDefault();

    if (
        pinchGestureActive ||
        event.ctrlKey ||
        performance.now() - lastPinchGestureTime < 250
    ) {
        clearTimeout(wheelZoomResetTimer);
        wheelZoomResetTimer = null;
        return;
    }

    if (event.deltaY === 0) return;

    wheelZoomDirection = event.deltaY < 0 ? 1 : -1;

    clearTimeout(wheelZoomResetTimer);
    wheelZoomResetTimer = setTimeout(() => {
        if (pinchGestureActive || performance.now() - lastPinchGestureTime < 250) {
            wheelZoomResetTimer = null;
            return;
        }

        mapScale = Math.min(1.8, Math.max(0.7, mapScale + wheelZoomDirection * 0.1));
        updateMapView();
        wheelZoomResetTimer = null;
    }, 140);
}, { passive: false });

mapViewport.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || event.target.closest(".map-controls")) {
        return;
    }

    event.preventDefault();
    isDraggingMap = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOffsetX = mapOffsetX;
    dragOffsetY = mapOffsetY;
    dragMoved = false;
});

window.addEventListener("mousemove", (event) => {
    if (!isDraggingMap) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (!dragMoved && Math.hypot(deltaX, deltaY) < 5) return;

    if (!dragMoved) {
        dragMoved = true;
        mapViewport.classList.add("is-dragging");
    }

    mapOffsetX = dragOffsetX + deltaX;
    mapOffsetY = dragOffsetY + deltaY;

    if (dragRenderFrame === null) {
        dragRenderFrame = requestAnimationFrame(() => {
            updateMapTransform();
            dragRenderFrame = null;
        });
    }
});

function stopDraggingMap() {
    if (!isDraggingMap) return;

    isDraggingMap = false;

    if (dragRenderFrame !== null) {
        cancelAnimationFrame(dragRenderFrame);
        dragRenderFrame = null;
        updateMapTransform();
    }

    mapViewport.classList.remove("is-dragging");

    if (dragMoved) {
        suppressNextSeatClick = true;
        setTimeout(() => {
            suppressNextSeatClick = false;
        }, 0);
    }

    dragMoved = false;
}

window.addEventListener("mouseup", stopDraggingMap);
window.addEventListener("blur", stopDraggingMap);

mapViewport.addEventListener("click", (event) => {
    if (!suppressNextSeatClick) return;

    suppressNextSeatClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
}, true);

let selectedSeats = [];
let cart = [];

try {
    const savedCart = localStorage.getItem("venueCart");
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    if (Array.isArray(parsedCart)) {
        cart = parsedCart;
    } else {
        localStorage.removeItem("venueCart");
    }
} catch {
    localStorage.removeItem("venueCart");
}
function saveCart() {
    localStorage.setItem("venueCart", JSON.stringify(cart));
}

const seatMessage = document.getElementById("seat-message");
const seatInfo = document.getElementById("seat-info");
const addToCartButton = document.getElementById("add-to-cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

function renderSelection() {
    if (selectedSeats.length === 0) {
        seatInfo.innerHTML = "";
        seatMessage.textContent = "Select one or more available seats.";
        addToCartButton.disabled = true;
        addToCartButton.textContent = "Add Selected Seats to Cart";
        return;
    }

    const selectedTotal = selectedSeats.reduce((sum, seat) => {
        return sum + ticketPrices[seat.section];
    }, 0);

    seatMessage.textContent = `${selectedSeats.length} seat${selectedSeats.length === 1 ? "" : "s"} selected.`;
    seatInfo.innerHTML = selectedSeats.map(seat => `
        <p><strong>${seat.section}</strong> — Row ${seat.row}, Seat ${seat.number}: ${ticketPrices[seat.section].toFixed(2)} AZN</p>
    `).join("") + `
        <p><strong>Selected total:</strong> ${selectedTotal.toFixed(2)} AZN</p>
    `;

    addToCartButton.disabled = false;
    addToCartButton.textContent = `Add ${selectedSeats.length} Seat${selectedSeats.length === 1 ? "" : "s"} to Cart`;
}

function renderCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    } else {
        cart.forEach(ticket => {
            const ticketElement = document.createElement("div");

            ticketElement.classList.add("cart-item");

            ticketElement.innerHTML = `
            <p><strong>${ticket.section}</strong></p>
            <p>Row: ${ticket.row}</p>
            <p>Seat: ${ticket.number}</p>
            <p>Price: ${ticket.price.toFixed(2)} AZN</p>
            <button class="remove-ticket" data-seat-id="${ticket.id}">
                Remove
            </button>
        `;

            cartItems.appendChild(ticketElement);

            const removeButton = ticketElement.querySelector(".remove-ticket");

            removeButton.addEventListener("click", () => {
            removeFromCart(ticket.id);
            });
        });
    }

    const total = cart.reduce((sum, ticket) => {
        return sum + ticket.price;
    }, 0);

    cartTotal.textContent = `Total: ${total.toFixed(2)} AZN`;
}
function removeFromCart(seatId) {
    const removedTicket = cart.find(ticket => ticket.id === seatId);
    cart = cart.filter(ticket => ticket.id !== seatId);
    saveCart();

    const seatButton = document.getElementById(seatId);

    if (seatButton) {
        seatButton.classList.remove("in-cart");

        if (!unavailableSeats.includes(seatId)) {
            seatButton.disabled = false;
        }

        seatButton.setAttribute("aria-pressed", "false");

        if (removedTicket) {
            seatButton.setAttribute(
                "aria-label",
                `${removedTicket.section} section, row ${removedTicket.row}, seat ${removedTicket.number}, available`
            );
        }
    }
    renderCart();
    seatMessage.textContent = "Ticket removed from your cart.";
}

addToCartButton.addEventListener("click", () => {
    if (selectedSeats.length === 0) {
        return;
    }

    const ticketsToAdd = selectedSeats.filter(seat => {
        return !cart.some(ticket => ticket.id === seat.id);
    });

    if (ticketsToAdd.length === 0) {
        seatMessage.textContent = "These seats are already in your cart.";
        return;
    }

    ticketsToAdd.forEach(seat => {
        const ticket = {
            ...seat,
            price: ticketPrices[seat.section]
        };

        cart.push(ticket);

        const seatButton = document.getElementById(ticket.id);
        if (seatButton) {
            seatButton.classList.remove("selected");
            seatButton.classList.add("in-cart");
            seatButton.disabled = true;
            seatButton.setAttribute("aria-pressed", "false");
            seatButton.setAttribute(
                "aria-label",
                `${ticket.section} section, row ${ticket.row}, seat ${ticket.number}, in cart`
            );
        }
    });

    saveCart();
    const addedCount = ticketsToAdd.length;
    selectedSeats = [];
    renderSelection();

    renderCart();
    seatMessage.textContent = `${addedCount} seat${addedCount === 1 ? "" : "s"} added to your cart.`;
});


venueMap.innerHTML = "";
venueSections.forEach(section => {
    const sectionTitle = document.createElement("h3");
    sectionTitle.textContent = section.name;
    venueMap.appendChild(sectionTitle);

    for (let row = 0; row < section.rows; row++) {
        const rowLabel = String.fromCharCode(65 + row);
        const seatRow = document.createElement("div");
        for (let seat = 1; seat <= section.seatsPerRow; seat++) {
            const seatButton = document.createElement("button");
            const seatId = `${section.name}-${rowLabel}${seat}`;
            seatButton.textContent = seat;
            seatButton.id = seatId;
            seatButton.setAttribute(
                "aria-label",
                `${section.name} section, row ${rowLabel}, seat ${seat}, available` );

            seatButton.setAttribute("aria-pressed", "false");
            seatButton.classList.add("seat");
            seatButton.addEventListener("click", () => {
                if (seatButton.disabled) {
                    return;
                }

                const existingSelectionIndex = selectedSeats.findIndex(selectedSeat => {
                    return selectedSeat.id === seatId;
                });

                if (existingSelectionIndex >= 0) {
                    selectedSeats.splice(existingSelectionIndex, 1);
                    seatButton.classList.remove("selected");
                    seatButton.setAttribute("aria-pressed", "false");
                    seatButton.setAttribute(
                        "aria-label",
                        `${section.name} section, row ${rowLabel}, seat ${seat}, available`
                    );
                } else {
                    const seatSelection = {
                        id: seatId,
                        section: section.name,
                        row: rowLabel,
                        number: seat
                    };

                    selectedSeats.push(seatSelection);
                    seatButton.classList.add("selected");
                    seatButton.setAttribute("aria-pressed", "true");
                    seatButton.setAttribute(
                        "aria-label",
                        `${section.name} section, row ${rowLabel}, seat ${seat}, selected`
                    );
                }

                renderSelection();
            });

            if (unavailableSeats.includes(seatId)) {
                seatButton.setAttribute(
                    "aria-label",
                    `${section.name} section, row ${rowLabel}, seat ${seat}, unavailable` );

                seatButton.disabled = true;
                seatButton.classList.add("unavailable");
            } else if (cart.some(ticket => ticket.id === seatId)) {
                seatButton.setAttribute(
                    "aria-label",
                    `${section.name} section, row ${rowLabel}, seat ${seat}, in cart` );
                seatButton.disabled = true;
                seatButton.classList.add("in-cart");
            }
            seatRow.appendChild(seatButton);
        }
        venueMap.appendChild(seatRow);
    }
});
renderSelection();
renderCart();
