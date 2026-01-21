import { savePhoto, deletePhoto, getPhoto } from "./photoStore.js";

document.addEventListener("DOMContentLoaded", () => {
  const addressInput = document.getElementById("address");
  const tenantInput = document.getElementById("tenant");
  const landlordInput = document.getElementById("landlord");
  const generalNotesInput = document.getElementById("generalNotes");

  const furnishedToggle = document.getElementById("furnishedToggle");
  const roomTypeSelect = document.getElementById("roomTypeSelect");
  const addRoomBtn = document.getElementById("addRoomBtn");
  const roomsContainer = document.getElementById("rooms");
  const createReportBtn = document.getElementById("createReportBtn");

  let roomCounter = 1;
  let furnishedMode = false; // default unfurnished

  // STRUCTURAL ITEMS (always shown)
  const STRUCTURAL_TEMPLATES = {
    kitchen: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"],
    bathroom: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"],
    bedroom: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"],
    living: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"],
    hallway: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"],
    custom: ["Walls", "Doors", "Windows", "Flooring", "Light Fittings", "Fixtures & Fittings"]
  };

  // FURNITURE ITEMS (only shown when furnished)
  const FURNITURE_TEMPLATES = {
    kitchen: ["Dining Table", "Chairs"],
    bathroom: [],
    bedroom: ["Bed", "Mattress", "Wardrobe", "Bedside Table"],
    living: ["Sofa", "TV Unit", "Coffee Table", "Curtains/Blinds"],
    hallway: ["Console Table", "Shoe Rack"],
    custom: []
  };

  const ROOM_LABELS = {
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    bedroom: "Bedroom",
    living: "Living Room",
    hallway: "Hallway",
    custom: "Custom Room"
  };

  // Create a room element
  function createRoomElement(typeKey) {
    const roomId = roomCounter++;
    const roomEl = document.createElement("div");
    roomEl.className = "room";
    roomEl.dataset.type = typeKey;

    const headerEl = document.createElement("div");
    headerEl.className = "room-header";

    const nameInput = document.createElement("input");
    nameInput.className = "room-name";
    nameInput.value =
      typeKey === "bedroom" ? `Bedroom ${roomId}` : ROOM_LABELS[typeKey];

    const removeBtn = document.createElement("button");
    removeBtn.className = "room-remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => roomsContainer.removeChild(roomEl);

    headerEl.append(nameInput, removeBtn);

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "room-items";

    // Add structural items
    STRUCTURAL_TEMPLATES[typeKey].forEach(label => {
      itemsContainer.appendChild(createItemElement(label));
    });

    // Add furniture items if furnished
    if (furnishedMode) {
      FURNITURE_TEMPLATES[typeKey].forEach(label => {
        itemsContainer.appendChild(createItemElement(label, true));
      });
    }

    // Add custom item button + inline input
    const addCustomBtn = document.createElement("button");
    addCustomBtn.className = "add-custom-btn";
    addCustomBtn.textContent = "+ Add Item";

    const customInputWrapper = document.createElement("div");
    customInputWrapper.className = "custom-item-input";
    customInputWrapper.style.display = "none";

    const customInput = document.createElement("input");
    customInput.placeholder = "Item name";

    const customAddBtn = document.createElement("button");
    customAddBtn.textContent = "Add";

    customInputWrapper.append(customInput, customAddBtn);

    addCustomBtn.onclick = () => {
      customInputWrapper.style.display = "flex";
      customInput.focus();
    };

    customAddBtn.onclick = () => {
      const label = customInput.value.trim();
      if (!label) return;

      itemsContainer.appendChild(createItemElement(label, false, true));

      customInput.value = "";
      customInputWrapper.style.display = "none";
    };

    roomEl.append(headerEl, itemsContainer, addCustomBtn, customInputWrapper);
    return roomEl;
  }

  // Create an item element
  function createItemElement(label, isFurniture = false, isCustom = false) {
    const itemEl = document.createElement("div");
    itemEl.className = "item";
    itemEl.dataset.label = label;
    itemEl.dataset.furniture = isFurniture ? "1" : "0";
    itemEl.dataset.custom = isCustom ? "1" : "0";

    const itemLabel = document.createElement("div");
    itemLabel.className = "item-label";
    itemLabel.textContent = label;

    // Remove button for custom items only
    if (isCustom) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-custom-btn";
      removeBtn.textContent = "Remove";
      removeBtn.style.marginLeft = "10px";
      removeBtn.onclick = () => itemEl.remove();
      itemLabel.append(removeBtn);
    }

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

    // PHOTO SECTION
    const photoSection = document.createElement("div");
    photoSection.className = "photo-section";
    photoSection.style.display = "none";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "photo-toggle-btn";
    toggleBtn.textContent = "Photos ▼";

    const photoContent = document.createElement("div");
    photoContent.className = "photo-content";
    photoContent.style.display = "none";

    const takePhotoBtn = document.createElement("button");
    takePhotoBtn.className = "add-photo-btn";
    takePhotoBtn.textContent = "Take Photo (Camera)";

    const uploadPhotoBtn = document.createElement("button");
    uploadPhotoBtn.className = "add-photo-btn";
    uploadPhotoBtn.textContent = "Upload From Files";

    const photoList = document.createElement("div");
    photoList.className = "photo-list";

    let photoIds = [];

    toggleBtn.onclick = () => {
      const open = photoContent.style.display === "block";
      photoContent.style.display = open ? "none" : "block";
      toggleBtn.textContent = open ? "Photos ▶" : "Photos ▼";
    };

    async function handlePhotoFile(file) {
      const id =
        "photo_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      await savePhoto(id, file);
      photoIds.push(id);
      renderPhotos();
    }

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
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = () => (img.src = reader.result);
          reader.readAsDataURL(blob);
        });

        wrapper.append(img, delBtn);
        photoList.appendChild(wrapper);
      });
    }

    photoContent.append(takePhotoBtn, uploadPhotoBtn, photoList);
    photoSection.append(toggleBtn, photoContent);

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

    itemEl.getPhotoIds = () => photoIds;

    return itemEl;
  }

  // Add room
  addRoomBtn.onclick = () => {
    const roomEl = createRoomElement(roomTypeSelect.value);
    roomsContainer.appendChild(roomEl);
  };

  // Furnished toggle
  furnishedToggle.onchange = () => {
    furnishedMode = furnishedToggle.checked;

    [...roomsContainer.querySelectorAll(".room")].forEach(roomEl => {
      const type = roomEl.dataset.type;
      const itemsContainer = roomEl.querySelector(".room-items");

      // Remove existing furniture items
      [...itemsContainer.querySelectorAll(".item")].forEach(item => {
        if (item.dataset.furniture === "1") item.remove();
      });

      // Add furniture if furnished
      if (furnishedMode) {
        FURNITURE_TEMPLATES[type].forEach(label => {
          itemsContainer.appendChild(createItemElement(label, true));
        });
      }
    });
  };

  // Collect rooms
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

  // Create report
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
