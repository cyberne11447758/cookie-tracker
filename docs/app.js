fetch("../docs/data/results.json")
  .then(r => r.json())
  .then(data => {
    const rows = document.getElementById("rows");

    data.sort((a, b) => {
      if (a.status !== b.status)
        return a.status === "Still Selling" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const scout of data) {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${scout.name}</td>
        <td class="${scout.status === "Goal Met" ? "met" : "selling"}">
          ${scout.status}
          ${scout.remaining ? `(${scout.remaining} left)` : ""}
        </td>
        <td><a href="${scout.url}" target="_blank">Buy Cookies</a></td>
      `;

      rows.appendChild(tr);
    }

    document.getElementById("updated").textContent =
      "Last updated: " + new Date(data[0]?.lastChecked).toLocaleString();
  });

