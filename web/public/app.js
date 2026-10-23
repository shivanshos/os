const statusMessage = document.querySelector("#catalog-status");
const integrationList = document.querySelector("#integration-list");
const collectionList = document.querySelector("#collection-list");
const searchInput = document.querySelector("#resource-search");
const categoryFilter = document.querySelector("#category-filter");

function labelFor(value) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createIntegrationCard(integration) {
  const card = document.createElement("article");
  card.className = "integration-card";

  const title = document.createElement("h3");
  title.textContent = integration.name;

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const category = document.createElement("span");
  category.textContent = labelFor(integration.category);

  const status = document.createElement("span");
  status.className = "status-pill";
  status.textContent = labelFor(integration.status);

  meta.append(category, status);
  card.append(title, meta);
  return card;
}

function createCollectionCard(collection) {
  const card = document.createElement("article");
  card.className = "collection-card";

  const title = document.createElement("h3");
  title.textContent = collection.name;

  card.append(title);
  return card;
}

function updateIntegrations(integrations) {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const category = categoryFilter.value;
  const matches = integrations.filter((integration) => {
    const matchesCategory = !category || integration.category === category;
    const matchesText = `${integration.name} ${integration.category}`
      .toLocaleLowerCase()
      .includes(query);
    return matchesCategory && matchesText;
  });

  integrationList.replaceChildren(...matches.map(createIntegrationCard));
  statusMessage.textContent = matches.length
    ? `${matches.length} planned integration${matches.length === 1 ? "" : "s"} shown.`
    : "No planned integrations match those filters.";
}

async function loadCatalog() {
  try {
    const response = await fetch("/catalog.json", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Catalog request failed with HTTP ${response.status}.`);
    }

    const catalog = await response.json();
    if (!Array.isArray(catalog.integrations) || !Array.isArray(catalog.collections)) {
      throw new TypeError("The catalog response has an unexpected shape.");
    }

    collectionList.replaceChildren(...catalog.collections.map(createCollectionCard));
    updateIntegrations(catalog.integrations);
    searchInput.addEventListener("input", () => updateIntegrations(catalog.integrations));
    categoryFilter.addEventListener("change", () => updateIntegrations(catalog.integrations));
  } catch (error) {
    integrationList.replaceChildren();
    collectionList.replaceChildren();
    statusMessage.textContent = "The catalog could not be loaded. Please try again later.";
    console.error("Unable to load the OS resource catalog.", error);
  }
}

loadCatalog();
