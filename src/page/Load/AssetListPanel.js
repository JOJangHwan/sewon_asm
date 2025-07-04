// src/components/AssetListPanel.js
import React, { useState } from 'react';
import './AssetListPanel.css';

export default function AssetListPanel({ assets, selected, setSelected }) {
  const [filter, setFilter] = useState('');
  // 품명 필드는 상황에 따라 name/childCategory/model 중 하나만 있을 수 있음
  const getDisplayName = (a) => a.name || a.childCategory || a.model || '';
  const filtered = assets.filter(a => getDisplayName(a).toLowerCase().includes(filter.toLowerCase()));

  const allChecked = filtered.length > 0 && filtered.every(a => selected.includes(a.barcode));
  const handleAll = () => {
    if (allChecked) {
      setSelected(selected.filter(bc => !filtered.some(a => a.barcode === bc)));
    } else {
      setSelected([...new Set([...selected, ...filtered.map(a => a.barcode)])]);
    }
  };

  return (
    <div className="asset-table-wrap">
      {/* <input
        className="asset-filter"
        placeholder="품명 검색"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 4, width: "90%" }}
      /> */}
      <table className="asset-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" checked={allChecked} onChange={handleAll} />
            </th>
            <th className="th-barcode">바코드</th>
            <th className="th-name">품명</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={3} className="empty">검색결과 없음</td></tr>
          ) : (
            filtered.map((a, i) => (
              <tr
                key={a.barcode}
                className={
                  (selected.includes(a.barcode) ? "selected-row" : "") +
                  (i % 2 === 1 ? " odd" : "")
                }
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(a.barcode)}
                    onChange={() =>
                      setSelected(sel =>
                        sel.includes(a.barcode)
                          ? sel.filter(x => x !== a.barcode)
                          : [...sel, a.barcode]
                      )
                    }
                  />
                </td>
                <td className="td-barcode">{a.barcode}</td>
                <td className="td-name">{getDisplayName(a) || "이름없음"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
