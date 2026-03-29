import React from "react";

const SYMBOL_PATTERN = /(\{[^}]+\})/g;

function truncateText(text, maxLength) {
  if (!text) {
    return "";
  }

  const compactText = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim();

  if (compactText.length <= maxLength) {
    return compactText;
  }

  return `${compactText.slice(0, maxLength - 1).trimEnd()}…`;
}

function renderSymbolToken(token, symbolMap, key, className) {
  const symbolUrl = symbolMap[token];

  if (!symbolUrl) {
    return token;
  }

  return (
    <img
      key={key}
      src={symbolUrl}
      alt={token}
      className={className}
      draggable="false"
    />
  );
}

function renderTextWithSymbols(text, symbolMap, options = {}) {
  if (!text) {
    return null;
  }

  const {
    lineClassName = "",
    symbolClassName = "",
    lineBreakCount = 1,
  } = options;
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const segments = line.split(SYMBOL_PATTERN).filter(Boolean);

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        <span className={lineClassName}>
          {segments.map((segment, segmentIndex) => {
            if (segment.startsWith("{") && segment.endsWith("}")) {
              return renderSymbolToken(
                segment,
                symbolMap,
                `symbol-${lineIndex}-${segmentIndex}`,
                symbolClassName
              );
            }

            return (
              <React.Fragment key={`text-${lineIndex}-${segmentIndex}`}>
                {segment}
              </React.Fragment>
            );
          })}
        </span>
        {lineIndex < lines.length - 1
          ? Array.from({ length: lineBreakCount }, (_, breakIndex) => (
            <br key={`break-${lineIndex}-${breakIndex}`} />
          ))
          : null}
      </React.Fragment>
    );
  });
}

function getRulesTextPresentation(text) {
  const newlineCount = (text.match(/\n/g) ?? []).length;
  const densityScore = text.length + newlineCount * 48;

  if (densityScore > 720) {
    return {
      containerClassName: "text-[5.5px] leading-[1.02]",
      symbolClassName: "mx-[0.4px] inline-block h-[0.82em] w-[0.82em] align-[-0.14em]",
    };
  }

  if (densityScore > 560) {
    return {
      containerClassName: "text-[6px] leading-[1.06]",
      symbolClassName: "mx-[0.45px] inline-block h-[0.88em] w-[0.88em] align-[-0.15em]",
    };
  }

  if (densityScore > 420) {
    return {
      containerClassName: "text-[6.5px] leading-[1.12]",
      symbolClassName: "mx-[0.45px] inline-block h-[0.94em] w-[0.94em] align-[-0.16em]",
    };
  }

  return {
    containerClassName: "text-[7px] leading-[1.18]",
    symbolClassName: "mx-[0.5px] inline-block h-[1em] w-[1em] align-[-0.16em]",
  };
}

function CardPrint({
  name,
  typeLine,
  manaCost,
  description,
  stats,
  cardTag,
  flipLabel,
  symbolMap,
}) {
  const rulesText = truncateText(description, 900);
  const rulesTextPresentation = getRulesTextPresentation(rulesText);

  return (
    <div className="m-3 h-[40mm] w-[63mm] overflow-hidden rounded-md border border-stone-700 bg-stone-900 text-zinc-100 shadow-sm print:m-0 print:border-black print:bg-white print:text-black print:shadow-none">
      <div className="flex h-full flex-col p-2">
        <div className="flex items-start justify-between gap-2 border-b border-stone-700 pb-1 print:border-black">
          <h2 className="min-w-0 flex-1 text-[10px] leading-tight font-bold uppercase tracking-[0.04em]">
            <span className="block">{name}</span>
          </h2>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {cardTag ? (
              <span className="rounded border border-amber-400/40 bg-amber-500/10 px-1 py-px text-[5px] font-semibold uppercase tracking-[0.08em] text-amber-200 print:border-black print:bg-black print:text-white">
                {cardTag}
              </span>
            ) : null}
            {flipLabel ? (
              <span className="rounded border border-sky-400/40 bg-sky-500/10 px-1 py-px text-[5px] font-semibold uppercase tracking-[0.08em] text-sky-200 print:border-black print:bg-white print:text-black">
                {flipLabel}
              </span>
            ) : null}
          </div>
        </div>

        {(typeLine || manaCost) ? (
          <div className="mt-1 flex items-start justify-between gap-2 border-b border-stone-800 pb-1 text-[7px] leading-tight text-stone-300 print:border-black print:text-black">
            <p className="min-w-0 flex-1">{typeLine}</p>
            {manaCost ? (
              <span className="max-w-[20mm] shrink-0 text-right text-[7px] leading-tight text-amber-200 print:text-black">
                <span className="inline-flex flex-wrap justify-end gap-px align-top">
                  {renderTextWithSymbols(manaCost, symbolMap, {
                    lineClassName: "inline",
                    symbolClassName: "mx-[0.5px] inline-block h-[0.8em] w-[0.8em] align-[-0.12em]",
                  })}
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={`mt-1 flex-1 overflow-hidden whitespace-pre-line wrap-break-word text-zinc-200 print:text-black ${rulesTextPresentation.containerClassName}`}
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 11,
          }}
        >
          {rulesText
            ? renderTextWithSymbols(rulesText, symbolMap, {
              lineClassName: "inline",
              lineBreakCount: 2,
              symbolClassName: rulesTextPresentation.symbolClassName,
            })
            : "No rules text."}
        </div>

        {stats ? (
          <div className="mt-1 border-t border-stone-700 pt-1 text-right text-[8px] font-semibold leading-none text-emerald-300 print:border-black print:text-black">
            {stats}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CardPrint;