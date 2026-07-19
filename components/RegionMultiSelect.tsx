"use client";

import { useMemo, useState } from "react";

export interface RegionOption {
  name: string;
  count: number;
  code: string;
  nameEn: string;
}

export function RegionMultiSelect({ regions, selected, onToggle, onClear }: { regions: RegionOption[]; selected: string[]; onToggle: (name: string) => void; onClear: () => void }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => regions.filter((region) => `${region.name} ${region.nameEn} ${region.code}`.toLowerCase().includes(query.trim().toLowerCase())), [query, regions]);
  return (
    <div className="region-multiselect">
      <label className="region-search"><span className="sr-only">搜索国家或地区</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索国家或地区…"/><i aria-hidden="true">⌕</i></label>
      {selected.length > 0 && <div className="selected-region-tags" aria-label="已选择地区">{selected.map((name) => <button type="button" key={name} onClick={() => onToggle(name)}>{name}<span aria-hidden="true">×</span></button>)}<button type="button" className="clear-region-tags" onClick={onClear}>清空</button></div>}
      <div className="region-options" role="listbox" aria-multiselectable="true">
        {visible.map((region) => <button type="button" role="option" aria-selected={selected.includes(region.name)} key={region.name} onClick={() => onToggle(region.name)}><span className="region-option-code">{region.code}</span><span><strong>{region.name}</strong><small>{region.nameEn}</small></span><em>{region.count}</em><i aria-hidden="true">✓</i></button>)}
        {!visible.length && <p>没有匹配的地区</p>}
      </div>
    </div>
  );
}
