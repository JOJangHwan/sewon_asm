import { openDB } from 'idb';

const DB_NAME = 'sewon-db';
const DB_VERSION = 1;

// 스토어 이름 상수화
const STORE_ASSETS = 'assets';
const STORE_INSPECTION = 'inspection';

// DB 초기화
export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'barcode' });
      }
      if (!db.objectStoreNames.contains(STORE_INSPECTION)) {
        db.createObjectStore(STORE_INSPECTION, { keyPath: 'barcode' });
      }
    },
  });
};

//
// 🔍 기준 자산 조회용 (assets)
//

export const getAsset = async (barcode) => {
  const db = await initDB();
  return await db.get(STORE_ASSETS, barcode);
};

export const saveAsset = async (item) => {
  const db = await initDB();
  await db.put(STORE_ASSETS, item);
};

//
// 📋 실사 스캔 데이터 처리 (inspection)
//

export const saveItem = async (item) => {
  const db = await initDB();
  await db.put(STORE_INSPECTION, item);
};

export const getAllItems = async () => {
  const db = await initDB();
  return await db.getAll(STORE_INSPECTION);
};

export const deleteItem = async (barcode) => {
  const db = await initDB();
  await db.delete(STORE_INSPECTION, barcode);
};

export const clearInspection = async () => {
  const db = await initDB();
  await db.clear(STORE_INSPECTION);
};
