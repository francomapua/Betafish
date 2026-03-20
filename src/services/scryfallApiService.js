const SCRYFALL_BASE_URL = 'https://api.scryfall.com';

const defaultHeaders = {
  'User-Agent': 'Betafish/1.0',
  'Accept': 'application/json;q=0.9,*/*;q=0.8',
  'Content-Type': 'application/json',
};

const COLLECTION_LIMIT = 75;

async function fetchCardByExactName(name) {
  const response = await fetch(
    `${SCRYFALL_BASE_URL}/cards/named?exact=${encodeURIComponent(name)}`,
    { headers: defaultHeaders }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Scryfall named request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchCardSymbols() {
  const response = await fetch(`${SCRYFALL_BASE_URL}/symbology`, {
    headers: defaultHeaders,
  });

  if (!response.ok) {
    throw new Error(`Scryfall symbology request failed: ${response.status}`);
  }

  return response.json();
}

export async function searchCards(query) {
  const response = await fetch(
    `${SCRYFALL_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`,
    { headers: defaultHeaders }
  );

  if (!response.ok) {
    throw new Error(`Scryfall request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchCardsByNames(names) {
  const cardsByName = new Map();
  const unresolvedNames = [];

  for (let index = 0; index < names.length; index += COLLECTION_LIMIT) {
    const chunk = names.slice(index, index + COLLECTION_LIMIT);
    const response = await fetch(`${SCRYFALL_BASE_URL}/cards/collection`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        identifiers: chunk.map((name) => ({ name })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Scryfall collection request failed: ${response.status}`);
    }

    const result = await response.json();

    result.data?.forEach((card) => {
      cardsByName.set(card.name.toLowerCase(), card);
    });

    result.not_found?.forEach((entry) => {
      unresolvedNames.push(entry.name);
    });
  }

  const resolvedFallbackCards = await Promise.all(
    unresolvedNames.map(async (name) => ({
      name,
      card: await fetchCardByExactName(name),
    }))
  );

  const missingNames = [];

  resolvedFallbackCards.forEach(({ name, card }) => {
    if (!card) {
      missingNames.push(name);
      return;
    }

    cardsByName.set(name.toLowerCase(), card);
    cardsByName.set(card.name.toLowerCase(), card);
  });

  return {
    cardsByName,
    missingNames,
  };
}