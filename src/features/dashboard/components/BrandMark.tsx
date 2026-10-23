/** The site mark, drawn once in public/brand/mark.svg (also the favicon and touch icon). */
export function BrandMark() {
  return <img className="brand-mark" src={`${import.meta.env.BASE_URL}brand/mark.svg`} alt="" width={32} height={32} />;
}

/** Mark plus wordmark, as used in the header. */
export function Brand() {
  return (
    <>
      <BrandMark />
      <span className="brand-text">
        <span className="brand-name">台灣曬熱指南</span>
        <span className="brand-sub">紫外線與熱傷害</span>
      </span>
    </>
  );
}
