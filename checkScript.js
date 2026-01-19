document.addEventListener("DOMContentLoaded", () => {
  const addressInput = document.getElementById("address");
  const tenantInput = document.getElementById("tenant");
  const landlordInput = document.getElementById("landlord");
  const generalNotesInput = document.getElementById("generalNotes");

  const roomTypeSelect = document.getElementById("roomTypeSelect");
  const addRoomBtn = document.getElementById("addRoomBtn");
  const roomsContainer = document.getElementById("rooms");
  const createReportBtn = document.getElementById("createReportBtn");

  let roomCounter = 1;

  const ROOM_TEMPLATES = {
    kitchen: {
      label: "Kitchen",
      items: ["Walls", "Cabinets", "Worktops", "Sink", "Appliances", "Flooring", "Windows", "Doors"]
    },
    bathroom: {
      label: "Bathroom",
      items: ["Walls", "Tiles", "Shower/Bath", "Toilet", "Sink", "Flooring", "Ventilation", "Doors"]
    },
    bedroom: {
      label: "Bedroom",
      items: ["Walls", "Doors", "Windows", "Flooring", "Wardrobes"]
    },
    living: {
      label: "Living Room",
      items: ["Walls", "Doors", "Windows", "Flooring", "Fixtures"]
    },
    hallway: {
      label: "Hallway",
      items: ["Walls", "Doors", "Flooring", "Lighting"]
    },
    custom: {
      label: "Custom Room",
      items: ["Walls", "Doors", "Windows", "Flooring"]
    }
  };

  function createRoomElement(typeKey) {
    const template = ROOM_TEMPLATES[typeKey];
    if (!template) return;

    const roomId = roomCounter++;
    const roomEl = document.createElement("div");
    roomEl.className = "room";
    roomEl.dataset.roomId = String(roomId);

    const headerEl = document.createElement("div");
    headerEl.className = "room-header";

    const nameInput = document.createElement("input");
    nameInput.className = "room-name";
    nameInput.placeholder = "Room name";
    nameInput.value = template.label === "Bedroom"
      ? `Bedroom ${roomId}`
      : template.label;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "room-remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      roomsContainer.removeChild(roomEl);
    });

    headerEl.appendChild(nameInput);
    headerEl.appendChild(removeBtn);

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "room-items";

    template.items.forEach(label => {
      const itemEl = document.createElement("div");
      itemEl.className = "item";
      itemEl.dataset.label = label;

      const itemLabel = document.createElement("div");
      itemLabel.className = "item-label";
      itemLabel.textContent = label;

      const controls = document.createElement("div");
      controls.className = "item-controls";

      const statusSelect = document.createElement("select");
      statusSelect.className = "status";
      const okOpt = document.createElement("option");
      okOpt.value = "OK";
      okOpt.textContent = "OK";
      const dmgOpt = document.createElement("option");
      dmgOpt.value = "Damaged";
      dmgOpt.textContent = "Damaged";
      statusSelect.appendChild(okOpt);
      statusSelect.appendChild(dmgOpt);
      statusSelect.value = "OK";

      const notesInput = document.createElement("textarea");
      notesInput.className = "notes";
      notesInput.rows = 2;
      notesInput.placeholder = "Describe the damage";
      notesInput.style.display = "none";

      statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Damaged") {
          notesInput.style.display = "block";
        } else {
          notesInput.style.display = "none";
          notesInput.value = "";
        }
      });

      controls.appendChild(statusSelect);
      controls.appendChild(notesInput);

      itemEl.appendChild(itemLabel);
      itemEl.appendChild(controls);
      itemsContainer.appendChild(itemEl);
    });

    roomEl.appendChild(headerEl);
    roomEl.appendChild(itemsContainer);

    return roomEl;
  }

  addRoomBtn.addEventListener("click", () => {
    const typeKey = roomTypeSelect.value;
    const roomEl = createRoomElement(typeKey);
    if (roomEl) {
      roomsContainer.appendChild(roomEl);
      roomEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  function collectRooms() {
    const roomEls = roomsContainer.querySelectorAll(".room");
    const rooms = [];

    roomEls.forEach(roomEl => {
      const name = roomEl.querySelector(".room-name")?.value.trim() || "Room";
      const items = [];

      roomEl.querySelectorAll(".item").forEach(itemEl => {
        const label = itemEl.dataset.label || "";
        const status = itemEl.querySelector(".status")?.value || "OK";
        const notes = itemEl.querySelector(".notes")?.value.trim() || "";

        items.push({ label, status, notes });
      });

      rooms.push({ name, items });
    });

    return rooms;
  }

  function buildDataPayload() {
    return {
      ts: new Date().toISOString(),
      address: addressInput.value.trim(),
      tenant: tenantInput.value.trim(),
      landlord: landlordInput.value.trim(),
      notes: generalNotesInput.value.trim(),
      rooms: collectRooms()
    };
  }

  createReportBtn.addEventListener("click", () => {
    const data = buildDataPayload();

    if (!data.address) {
      const proceed = confirm("No property address entered. Continue anyway?");
      if (!proceed) return;
    }

    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = `report.html?d=${encoded}`;
    window.location.href = url;
  });
});
