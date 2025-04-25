// parseBarcode.js
export const parseBarcodeJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);

    // 유효성 검사 (필수 키 확인)
    const requiredKeys = [
      "barcode", "company", "department", "location", "assetCategory",
      "itemName", "assetStatus", "manufacturer", "model",
      "acquisitionDate", "acquisitionPrice", "registrant"
    ];

    const isValid = requiredKeys.every((key) => key in parsed);
    if (!isValid) throw new Error("필수 키가 누락됨");

    return parsed;
  } catch (error) {
    console.error("QR 데이터 파싱 실패:", error);
    return null;
  }
};
