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

const seatMessage = document.getElementById("seat-message");
const seatInfo = document.getElementById("seat-info");
const addToCartButton = document.getElementById("add-to-cart");

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
