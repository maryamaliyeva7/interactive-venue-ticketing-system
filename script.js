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

let selectedSeat = null;
let cart = [];

const seatMessage = document.getElementById("seat-message");
const seatInfo = document.getElementById("seat-info");
const addToCartButton = document.getElementById("add-to-cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

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
            `;

            cartItems.appendChild(ticketElement);
        });
    }

    const total = cart.reduce((sum, ticket) => {
        return sum + ticket.price;
    }, 0);

    cartTotal.textContent = `Total: ${total.toFixed(2)} AZN`;
}

addToCartButton.addEventListener("click", () => {
    if (selectedSeat === null) {
        return;
    }

    const alreadyInCart = cart.some(ticket => {
        return ticket.id === selectedSeat.id;
    });

    if (alreadyInCart) {
        seatMessage.textContent = "This seat is already in your cart.";
        return;
    }

    const ticket = {
        ...selectedSeat,
        price: ticketPrices[selectedSeat.section]
    };

    cart.push(ticket);

    renderCart();

    seatMessage.textContent = "Seat added to your cart.";
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
            seatButton.classList.add("seat");
            seatButton.addEventListener("click", () => {
                if (seatButton.disabled) {
                    return;
                }
                if (selectedSeat !== null) {
                    document.getElementById(selectedSeat.id)
                        .classList.remove("selected");
                }
                selectedSeat = {
                    id: seatId,
                    section: section.name,
                    row: rowLabel,
                    number: seat
                };
                seatButton.classList.add("selected");
                seatMessage.textContent = "You've selected a seat to inspect.";
            
                seatInfo.innerHTML = `
                    <p><strong>Section:</strong> ${selectedSeat.section}</p>
                    <p><strong>Row:</strong> ${selectedSeat.row}</p>
                    <p><strong>Seat:</strong> ${selectedSeat.number}</p>
                    <p><strong>Price:</strong> ${ticketPrices[selectedSeat.section]} AZN</p>
                `;
                addToCartButton.disabled = false;
            });

            if (unavailableSeats.includes(seatId)) {
                seatButton.disabled = true;
                seatButton.classList.add("unavailable");
            }
            seatRow.appendChild(seatButton);
        }
        venueMap.appendChild(seatRow);
    }
});
