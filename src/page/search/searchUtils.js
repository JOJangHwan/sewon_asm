export function filterItems(items, {
  company,
  department,
  location,
  assetCategory,
  item,
  barcodeKeyword,    // ← 추가
  startDate,
  endDate,
  sortField,
  sortOrder
}) {
  let filtered = items.filter(it => {
    const matchCompany       = company       ? it.company        === company        : true;
    const matchDepartment    = department    ? it.department     === department     : true;
    const matchLocation      = location      ? it.location       === location       : true;
    const matchAssetCategory = assetCategory ? it.assetCategory  === assetCategory  : true;
    const matchItem          = item          ? it.itemName       === item           : true;
    const matchBarcode       = barcodeKeyword
                              ? it.barcode       === barcodeKeyword  // 정확 일치
                              : true;
    const matchStartDate     = startDate     ? it.acquisitionDate >= startDate   : true;
    const matchEndDate       = endDate       ? it.acquisitionDate <= endDate     : true;

    return (
      matchCompany &&
      matchDepartment &&
      matchLocation &&
      matchAssetCategory &&
      matchItem &&
      matchBarcode &&
      matchStartDate &&
      matchEndDate
    );
  });

  // 기존 정렬 로직 그대로
  if (sortField) {
    filtered.sort((a, b) => {
      if (sortField === "acquisitionDate") {
        return sortOrder === "asc"
          ? a.acquisitionDate.localeCompare(b.acquisitionDate)
          : b.acquisitionDate.localeCompare(a.acquisitionDate);
      }
      if (sortField === "acquisitionPrice") {
        return sortOrder === "asc"
          ? a.acquisitionPrice - b.acquisitionPrice
          : b.acquisitionPrice - a.acquisitionPrice;
      }
      return 0;
    });
  }

  return filtered;
}
