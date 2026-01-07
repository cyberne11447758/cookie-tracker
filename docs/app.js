fetch("data/results.json")
  .then(r => r.json())
  .then(data => {
    const rows = document.getElementById("rows");

    // Sort: Still Selling first (highest remaining first), then Goal Met
    data.sort((a, b) => {
      if (a.status !== b.status)
        return a.status === "Still Selling" ? -1 : 1;
      return (b.remaining || 0) - (a.remaining || 0);
    });

    for (const scout of data) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${scout.name}</td>
        <td class="${scout.status === "Goal Met" ? "met" : "selling"}">
          ${scout.status} ${scout.remaining ? `(${scout.remaining} left)` : ""}
        </td>
        <td><a href="${scout.url}" target="_blank">Buy Cookies</a></td>
      `;

      rows.appendChild(tr);
    }

    document.getElementById("updated").textContent =
      "Last updated: " + new Date(data[0]?.lastChecked).toLocaleString();
  })
  .catch(err => console.error("Failed to load JSON:", err));
