document.addEventListener("DOMContentLoaded", () => {
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

  const checkTime = d.ts ? new Date(d.ts).toLocaleString() : "Not recorded";

  function badge(text, cls) {
    return `<span class="badge ${cls}">${text}</span>`;
  }

  const rooms = Array.isArray(d.rooms) ? d.rooms : [];

  const damagedRooms = rooms
    .map(room => {
      const items = (room.items || []).filter(i => i.status === "Damaged");
      return { name: room.name || "Room", items };
    })
    .filter(room => room.items.length > 0);

  let overallStatus = "";
  let overallDesc = "";

  if (damagedRooms.length === 0) {
    overallStatus = `<div class="overall-status badge good">All Good</div>`;
    overallDesc = `<div class="overall-desc">No issues were reported during this inspection.</div>`;
  } else {
    overallStatus = `<div class="overall-status badge warn">Issues Found</div>`;
    overallDesc = `<div class="overall-desc">Some damage was reported. Details are listed by room below.</div>`;
  }

  let html = "";

  html += `<p><strong>Date & Time of Inspection:</strong> ${checkTime}</p>`;

  if (d.address) {
    html += `<p><strong>Property Address:</strong> ${d.address}</p>`;
  }

  if (d.tenant) {
    html += `<p><strong>Occupant / Tenant:</strong> ${d.tenant}</p>`;
  }

  if (d.landlord) {
    html += `<p><strong>Landlord / Agent:</strong> ${d.landlord}</p>`;
  }

  html += overallStatus + overallDesc;

  if (damagedRooms.length === 0) {
    if (d.notes) {
      html += `<h3>General Notes</h3><p>${String(d.notes).replace(/\n/g, "<br>")}</p>`;
    }
    reportContainer.innerHTML = html;
    return;
  }

  damagedRooms.forEach(room => {
    html += `<h3>${room.name}</h3><ul>`;
    room.items.forEach(item => {
      const label = item.label || "Item";
      const notes = item.notes ? String(item.notes).replace(/\n/g, "<br>") : "Damage reported";
      html += `<li><strong>${label}:</strong> ${notes}</li>`;
    });
    html += `</ul>`;
  });

  if (d.notes) {
    html += `<h3>General Notes</h3><p>${String(d.notes).replace(/\n/g, "<br>")}</p>`;
  }

  reportContainer.innerHTML = html;
});
