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
            if (unavailableSeats.includes(seatId)) {
                seatButton.disabled = true;
                seatButton.classList.add("unavailable");
            }
            seatRow.appendChild(seatButton);
        }
        venueMap.appendChild(seatRow);
    }
});