import { getPhoto } from "./photoStore.js";

// Wait for all images inside a container to finish loading
function waitForImagesToLoad(container) {
  const images = container.querySelectorAll("img");
  const promises = [];

  images.forEach(img => {
    if (img.complete && img.naturalHeight !== 0) {
      return; // already loaded
    }

    promises.push(
      new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      })
    );
  });

  return Promise.all(promises);
}

// PDF button handler
document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
  const element = document.getElementById("report");

  // Ensure all images are loaded
  await waitForImagesToLoad(element);

  // Give browser time to paint base64 images
  await new Promise(r => setTimeout(r, 150));

  const opt = {
    margin: 10,
    filename: "inspection-report.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
});


// MAIN REPORT RENDERING
document.addEventListener("DOMContentLoaded", async () => {
  const reportContainer = document.getElementById("report");
  const raw = new URLSearchParams(window.location.search).get("d");

  if (!raw) {
    reportContainer.innerHTML = "<p>No report data.</p>";
    return;
  }

  let d;
  try {
    d = JSON.parse(decodeURIComponent(raw));
  } catch {
    reportContainer.innerHTML = "<p>Invalid report data.</p>";
    return;
  }

  const checkTime = new Date(d.ts).toLocaleString();

  let html = `
    <p><strong>Date & Time:</strong> ${checkTime}</p>
    <p><strong>Address:</strong> ${d.address || "Not provided"}</p>
  `;

  if (d.tenant) html += `<p><strong>Tenant:</strong> ${d.tenant}</p>`;
  if (d.landlord) html += `<p><strong>Landlord/Agent:</strong> ${d.landlord}</p>`;

  const damagedRooms = d.rooms
    .map(room => ({
      name: room.name,
      items: room.items.filter(i => i.status === "Damaged")
    }))
    .filter(room => room.items.length > 0);

  if (damagedRooms.length === 0) {
    html += `<h3>All Good</h3><p>No issues reported.</p>`;
    reportContainer.innerHTML = html;
    return;
  }

  damagedRooms.forEach(room => {
    html += `<h3>${room.name}</h3><ul>`;

    room.items.forEach(item => {
      html += `<li><strong>${item.label}:</strong> ${item.notes || "Damage reported"}`;

      if (item.photoIds?.length) {
        html += `<div class="report-photo-list">`;

        item.photoIds.forEach(id => {
          html += `<img id="photo-${id}" class="report-photo">`;
        });

        html += `</div>`;
      }

      html += `</li>`;
    });

    html += `</ul>`;
  });

  if (d.notes) {
    html += `<h3>General Notes</h3><p>${d.notes.replace(/\n/g, "<br>")}</p>`;
  }

  reportContainer.innerHTML = html;

  // Load photos from IndexedDB as BASE64
  for (const room of damagedRooms) {
    for (const item of room.items) {
      for (const id of item.photoIds) {
        const blob = await getPhoto(id);
        if (!blob) continue;

        const img = document.getElementById(`photo-${id}`);
        if (!img) continue;

        // Convert blob → base64 (html2pdf requires this)
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result; // base64 data URL
        };
        reader.readAsDataURL(blob);
      }
    }
  }
});
