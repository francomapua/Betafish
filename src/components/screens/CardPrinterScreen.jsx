import { useEffect, useState } from "react";

import { fetchCardSymbols, fetchCardsByNames, searchCards } from "../../services/scryfallApiService";
import CardPrint from "../card-printer/CardPrint";
import ButtonLink from "../ui/ButtonLink";

const SECTION_HEADER_PATTERN = /^(commander|companion|deck|mainboard|maybeboard|sideboard|tokens?)\s*:?(?:\s*\(\d+\))?$/i;
const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 400;
const DOUBLE_FACED_LAYOUTS = new Set(["transform", "modal_dfc", "double_faced_token", "reversible_card"]);
const SPLIT_LAYOUTS = new Set(["split", "aftermath"]);

function getEntityStats(entity) {
  if (entity.defense) {
    return `Defense ${entity.defense}`;
  }

  if (entity.power && entity.toughness) {
    return `${entity.power}/${entity.toughness}`;
  }

  if (entity.loyalty) {
    return `Loyalty ${entity.loyalty}`;
  }

  return "";
}

function getCardTag(layout, typeLine) {
  if (SPLIT_LAYOUTS.has(layout)) {
    return "Split";
  }

  if (layout === "adventure") {
    return "Adventure";
  }

  if (typeLine?.includes("Saga")) {
    return "Saga";
  }

  if (typeLine?.includes("Battle")) {
    return "Battle";
  }

  if (typeLine?.includes("Planeswalker")) {
    return "Walker";
  }

  return "";
}

function buildFaceSummary(face, options = {}) {
  const {
    includeTypeLine = false,
    prefix = "",
  } = options;
  const heading = `${prefix}${face.name ?? ""}${face.mana_cost ? ` ${face.mana_cost}` : ""}`.trim();

  return [
    heading,
    includeTypeLine ? face.type_line : null,
    face.oracle_text,
  ].filter(Boolean).join("\n");
}

function getPrintableDescription(card) {
  if (SPLIT_LAYOUTS.has(card.layout) && card.card_faces?.length) {
    return card.card_faces
      .map((face) => buildFaceSummary(face))
      .join("\n");
  }

  if (card.layout === "adventure" && card.card_faces?.length) {
    return card.card_faces
      .map((face, faceIndex) => buildFaceSummary(face, {
        includeTypeLine: faceIndex === 0,
        prefix: faceIndex === 1 ? "Adventure - " : "",
      }))
      .join("\n");
  }

  return getOracleText(card);
}

function buildPrintableEntries(card) {
  if (DOUBLE_FACED_LAYOUTS.has(card.layout) && card.card_faces?.length > 1) {
    return card.card_faces.map((face, faceIndex) => ({
      id: `${card.id}-${faceIndex}`,
      name: face.name ?? card.name,
      typeLine: face.type_line ?? "",
      manaCost: face.mana_cost ?? "",
      description: face.oracle_text ?? "",
      stats: getEntityStats(face),
      cardTag: getCardTag(card.layout, face.type_line ?? ""),
      flipLabel: faceIndex === 0 ? "Flip Front" : "Flip Back",
    }));
  }

  return [{
    id: card.id,
    name: card.name,
    typeLine: getTypeLine(card),
    manaCost: getManaCost(card),
    description: getPrintableDescription(card),
    stats: getStats(card),
    cardTag: getCardTag(card.layout, getTypeLine(card)),
    flipLabel: "",
  }];
}

function stripExporterMetadata(line) {
  let normalizedLine = line.trim();
  const trailingMetadataPatterns = [
    /\s+\[[^\]]*\]\s*$/u,
    /\s+\*[^*]+\*\s*$/u,
    /\s+\([^)]+\)\s+[A-Za-z0-9-]+\s*$/u,
    /\s+\([^)]+\)\s*$/u,
  ];

  let previousValue;

  do {
    previousValue = normalizedLine;
    trailingMetadataPatterns.forEach((pattern) => {
      normalizedLine = normalizedLine.replace(pattern, "").trim();
    });
  } while (normalizedLine !== previousValue);

  return normalizedLine;
}

function parseCardList(cardListText) {
  return cardListText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !SECTION_HEADER_PATTERN.test(line))
    .map((line) => line.replace(/^[-*]\s*/, ""))
    .map((line) => {
      const quantityMatch = line.match(/^(\d+)\s*x?\s*(.+)$/i);

      if (!quantityMatch) {
        return {
          name: stripExporterMetadata(line),
          quantity: 1,
        };
      }

      return {
        name: stripExporterMetadata(quantityMatch[2]),
        quantity: Number(quantityMatch[1]),
      };
    })
    .filter((entry) => entry.name);
}

function buildCardResults(parsedEntries, cardsByName) {
  return parsedEntries.flatMap((entry) => {
    const card = cardsByName.get(entry.name.toLowerCase());

    if (!card) {
      return [];
    }

    return Array.from({ length: entry.quantity }, () => buildPrintableEntries(card)).flat();
  });
}

function getOracleText(card) {
  if (card.oracle_text) {
    return card.oracle_text;
  }

  return card.card_faces
    ?.map((face) => face.oracle_text)
    .filter(Boolean)
    .join(" // ") ?? "";
}

function getTypeLine(card) {
  if (card.type_line) {
    return card.type_line;
  }

  return card.card_faces
    ?.map((face) => face.type_line)
    .filter(Boolean)
    .join(" // ") ?? "";
}

function getManaCost(card) {
  if (card.mana_cost) {
    return card.mana_cost;
  }

  return card.card_faces
    ?.map((face) => face.mana_cost)
    .filter(Boolean)
    .join(" // ") ?? "";
}

function getStats(card) {
  if (card.defense) {
    return `Defense ${card.defense}`;
  }

  if (card.power && card.toughness) {
    return `${card.power}/${card.toughness}`;
  }

  if (card.loyalty) {
    return `Loyalty ${card.loyalty}`;
  }

  if (card.card_faces) {
    const faceStats = card.card_faces
      .map((face) => {
        if (face.power && face.toughness) {
          return `${face.power}/${face.toughness}`;
        }

        if (face.loyalty) {
          return `Loyalty ${face.loyalty}`;
        }

        return null;
      })
      .filter(Boolean);

    return faceStats.join(" // ");
  }

  return "";
}

function CardPrinterScreen() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [missingCards, setMissingCards] = useState([]);
  const [symbolMap, setSymbolMap] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingCards, setIsSearchingCards] = useState(false);
  const [searchStatusMessage, setSearchStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSymbols = async () => {
      try {
        const result = await fetchCardSymbols();

        if (!isMounted) {
          return;
        }

        const nextSymbolMap = Object.fromEntries(
          (result.data ?? []).map((symbol) => [symbol.symbol, symbol.svg_uri])
        );

        setSymbolMap(nextSymbolMap);
      } catch (error) {
        console.error("Error loading card symbols:", error);
      }
    };

    loadSymbols();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = searchInput.trim();

    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setIsSearchingCards(false);
      setSearchStatusMessage("");
      return undefined;
    }

    if (trimmedQuery.length < LIVE_SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setIsSearchingCards(false);
      setSearchStatusMessage(`Type at least ${LIVE_SEARCH_MIN_LENGTH} characters to search.`);
      return undefined;
    }

    let isCancelled = false;
    setIsSearchingCards(true);
    setSearchStatusMessage("Searching cards...");

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await searchCards(trimmedQuery);

        if (isCancelled) {
          return;
        }

        const nextResults = result.data ?? [];
        setSearchResults(nextResults);
        setSearchStatusMessage(nextResults.length === 0 ? "No cards found." : "");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Error searching cards:", error);
        setSearchResults([]);
        setSearchStatusMessage("Could not search Scryfall right now.");
      } finally {
        if (!isCancelled) {
          setIsSearchingCards(false);
        }
      }
    }, LIVE_SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const handleSearch = async () => {
    const parsedEntries = parseCardList(query);

    if (parsedEntries.length === 0) {
      setCards([]);
      setMissingCards([]);
      setErrorMessage("Paste at least one card name to search.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const uniqueNames = [...new Set(parsedEntries.map((entry) => entry.name))];
      const { cardsByName, missingNames } = await fetchCardsByNames(uniqueNames);

      setCards(buildCardResults(parsedEntries, cardsByName));
      setMissingCards(missingNames);
    } catch (error) {
      console.error("Error searching cards:", error);
      setCards([]);
      setMissingCards([]);
      setErrorMessage("Could not fetch cards from Scryfall.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCard = (card) => {
    setQuery((currentQuery) => {
      const trimmedQuery = currentQuery.trim();
      const nextLine = `1x ${card.name}`;

      if (!trimmedQuery) {
        return nextLine;
      }

      return `${trimmedQuery}\n${nextLine}`;
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 px-4 py-8 text-zinc-100 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 print:max-w-none">
        <div className="print:hidden">
          <div className="mb-4 w-full max-w-40">
            <ButtonLink to="/">Back</ButtonLink>
          </div>
          <h1 className="text-3xl uppercase tracking-[0.08em] text-amber-200">Card Printer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
            Paste one card per line or drop in exports from Archidekt, Moxfield, or ManaBox. Press Enter to search or Shift+Enter for a new line.
          </p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-lg print:hidden">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg uppercase tracking-[0.08em] text-amber-200">Quick Add</h2>
              <p className="mt-1 text-sm text-stone-300">
                  Search Scryfall and add individual cards to the print list input.
              </p>
            </div>
            {isSearchingCards ? (
              <span className="text-xs uppercase tracking-[0.08em] text-amber-200">Searching...</span>
            ) : null}
          </div>

          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search for a card to add"
            className="mt-4 w-full rounded-lg border border-stone-700 bg-stone-950 p-3 text-sm leading-6 text-zinc-100 outline-none transition focus:border-amber-300"
          />

          {searchStatusMessage ? (
            <p className="mt-3 text-sm text-stone-300">{searchStatusMessage}</p>
          ) : null}

          {searchResults.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {searchResults.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-stone-950/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">{card.name}</p>
                    <p className="truncate text-xs text-stone-400">{getTypeLine(card)}</p>
                  </div>
                  <button
                    onClick={() => handleAddCard(card)}
                    className="shrink-0 rounded-md border border-stone-600 px-3 py-1 text-xs font-semibold text-zinc-100 transition hover:border-amber-300 hover:text-amber-200"
                  >
                    Add to List
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-lg print:hidden">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"1x Aether Hub (drc) 145 [Land]\n1 Sol Ring\n1 Lightning Bolt [M11]"}
            className="min-h-56 w-full rounded-lg border border-stone-700 bg-stone-950 p-3 text-sm leading-6 text-zinc-100 outline-none transition focus:border-amber-300"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="rounded-md bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-300"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>

            <button
              onClick={handlePrint}
              disabled={cards.length === 0 || isLoading}
              className="rounded-md border border-stone-600 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:border-stone-800 disabled:text-stone-500"
            >
              Print Cards
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-3 text-sm text-rose-300">{errorMessage}</p>
          ) : null}

          {missingCards.length > 0 ? (
            <p className="mt-3 text-sm text-stone-300">
              Not found: {missingCards.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="print:hidden">
          {isLoading ? (
            <p className="text-sm uppercase tracking-[0.08em] text-amber-200">Loading cards...</p>
          ) : (
            <p className="text-sm text-stone-400">
              {cards.length > 0 ? `${cards.length} insert${cards.length === 1 ? "" : "s"} ready to print.` : "Search results will appear below."}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 print:rounded-none print:border-0 print:bg-white print:p-0">
          <div className="flex flex-wrap justify-center print:justify-start print:gap-0">
            {cards.map((card, index) => (
              <CardPrint
                key={`${card.id}-${index}`}
                name={card.name}
                typeLine={card.typeLine}
                manaCost={card.manaCost}
                description={card.description}
                stats={card.stats}
                cardTag={card.cardTag}
                flipLabel={card.flipLabel}
                symbolMap={symbolMap}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardPrinterScreen;