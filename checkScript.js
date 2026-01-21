import { savePhoto, deletePhoto, getPhoto } from "./photoStore.js";

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

    const headerEl = document.createElement("div");
    headerEl.className = "room-header";

    const nameInput = document.createElement("input");
    nameInput.className = "room-name";
    nameInput.value = template.label === "Bedroom" ? `Bedroom ${roomId}` : template.label;

    const removeBtn = document.createElement("button");
    removeBtn.className = "room-remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => roomsContainer.removeChild(roomEl);

    headerEl.append(nameInput, removeBtn);

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
  statusSelect.innerHTML = `
    <option value="OK">OK</option>
    <option value="Damaged">Damaged</option>
  `;

  const notesInput = document.createElement("textarea");
  notesInput.className = "notes";
  notesInput.rows = 2;
  notesInput.placeholder = "Describe the damage";
  notesInput.style.display = "none";

  // COLLAPSIBLE PHOTO SECTION
  const photoSection = document.createElement("div");
  photoSection.className = "photo-section";
  photoSection.style.display = "none";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "photo-toggle-btn";
  toggleBtn.textContent = "Photos ▼";

  const photoContent = document.createElement("div");
  photoContent.className = "photo-content";
  photoContent.style.display = "none";

  // TWO BUTTONS
  const takePhotoBtn = document.createElement("button");
  takePhotoBtn.className = "add-photo-btn";
  takePhotoBtn.textContent = "Take Photo (Camera)";

  const uploadPhotoBtn = document.createElement("button");
  uploadPhotoBtn.className = "add-photo-btn";
  uploadPhotoBtn.textContent = "Upload From Files";

  const photoList = document.createElement("div");
  photoList.className = "photo-list";

  let photoIds = [];

  // Toggle collapse
  toggleBtn.onclick = () => {
    const open = photoContent.style.display === "block";
    photoContent.style.display = open ? "none" : "block";
    toggleBtn.textContent = open ? "Photos ▶" : "Photos ▼";
  };

  // Helper to add a photo from a File object
  async function handlePhotoFile(file) {
    const id = "photo_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    await savePhoto(id, file);
    photoIds.push(id);
    renderPhotos();
  }

  // TAKE PHOTO (camera only)
  takePhotoBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = () => {
      const file = input.files[0];
      if (file) handlePhotoFile(file);
    };

    input.click();
  };

  // UPLOAD FROM FILES
  uploadPhotoBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files[0];
      if (file) handlePhotoFile(file);
    };

    input.click();
  };

  // Render previews
  function renderPhotos() {
    photoList.innerHTML = "";

    photoIds.forEach(id => {
      const wrapper = document.createElement("div");
      wrapper.className = "photo-wrapper";

      const img = document.createElement("img");
      img.className = "photo-preview";

      const delBtn = document.createElement("button");
      delBtn.className = "delete-photo-btn";
      delBtn.textContent = "Delete Photo";

      delBtn.onclick = async () => {
        await deletePhoto(id);
        photoIds = photoIds.filter(x => x !== id);
        renderPhotos();
      };

      getPhoto(id).then(blob => {
        if (blob) img.src = URL.createObjectURL(blob);
      });

      wrapper.append(img, delBtn);
      photoList.appendChild(wrapper);
    });
  }

  photoContent.append(takePhotoBtn, uploadPhotoBtn, photoList);
  photoSection.append(toggleBtn, photoContent);

  // Show/hide on status change
  statusSelect.onchange = () => {
    const damaged = statusSelect.value === "Damaged";
    notesInput.style.display = damaged ? "block" : "none";
    photoSection.style.display = damaged ? "block" : "none";

    if (!damaged) {
      photoIds.forEach(id => deletePhoto(id));
      photoIds = [];
      photoList.innerHTML = "";
      photoContent.style.display = "none";
      toggleBtn.textContent = "Photos ▼";
    }
  };

  controls.append(statusSelect, notesInput, photoSection);
  itemEl.append(itemLabel, controls);

  // Attach getter for report
  itemEl.getPhotoIds = () => photoIds;

  itemsContainer.appendChild(itemEl);
});


    roomEl.append(headerEl, itemsContainer);
    return roomEl;
  }

  addRoomBtn.onclick = () => {
    const roomEl = createRoomElement(roomTypeSelect.value);
    roomsContainer.appendChild(roomEl);
  };

  function collectRooms() {
    return [...roomsContainer.querySelectorAll(".room")].map(roomEl => ({
      name: roomEl.querySelector(".room-name").value.trim(),
      items: [...roomEl.querySelectorAll(".item")].map(itemEl => ({
        label: itemEl.dataset.label,
        status: itemEl.querySelector(".status").value,
        notes: itemEl.querySelector(".notes").value.trim(),
        photoIds: itemEl.getPhotoIds()
      }))
    }));
  }

  createReportBtn.onclick = () => {
    const data = {
      ts: new Date().toISOString(),
      address: addressInput.value.trim(),
      tenant: tenantInput.value.trim(),
      landlord: landlordInput.value.trim(),
      notes: generalNotesInput.value.trim(),
      rooms: collectRooms()
    };

    const encoded = encodeURIComponent(JSON.stringify(data));
    window.location.href = `report.html?d=${encoded}`;
  };
});
