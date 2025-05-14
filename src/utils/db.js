// import { openDB } from 'idb';

// const DB_NAME = 'sewon-db';
// const DB_VERSION = 1;

// // 스토어 이름 상수화
// const STORE_ASSETS = 'assets';
// const STORE_INSPECTION = 'inspection';

// // DB 초기화
// export const initDB = async () => {
//   return await openDB(DB_NAME, DB_VERSION, {
//     upgrade(db) {
//       if (!db.objectStoreNames.contains(STORE_ASSETS)) {
//         db.createObjectStore(STORE_ASSETS, { keyPath: 'barcode' });
//       }
//       if (!db.objectStoreNames.contains(STORE_INSPECTION)) {
//         db.createObjectStore(STORE_INSPECTION, { keyPath: 'barcode' });
//       }
//     },
//   });
// };

// //
// // 🔍 기준 자산 조회용 (assets)
// //

// export const getAsset = async (barcode) => {
//   const db = await initDB();
//   return await db.get(STORE_ASSETS, barcode);
// };

// export const saveAsset = async (item) => {
//   const db = await initDB();
//   await db.put(STORE_ASSETS, item);
// };

// //
// // 📋 실사 스캔 데이터 처리 (inspection)
// //

// export const saveItem = async (item) => {
//   const db = await initDB();
//   await db.put(STORE_INSPECTION, item);
// };

// export const getAllItems = async () => {
//   const db = await initDB();
//   return await db.getAll(STORE_INSPECTION);
// };

// export const deleteItem = async (barcode) => {
//   const db = await initDB();
//   await db.delete(STORE_INSPECTION, barcode);
// };

// export const clearInspection = async () => {
//   const db = await initDB();
//   await db.clear(STORE_INSPECTION);
// };

import { openDB } from 'idb';

const DB_NAME = 'sewon-db';
const DB_VERSION = 2; // 🔥 반드시 올려줘야 meta가 반영됨

// 스토어 이름 상수화
const STORE_ASSETS = 'assets';
const STORE_INSPECTION = 'inspection';
const STORE_META = 'meta'; // 실사 메타데이터 저장용

// DB 초기화
export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'barcode' });
      }
      if (!db.objectStoreNames.contains('inspection')) {
        db.createObjectStore('inspection', { keyPath: 'barcode' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' }); // ✅ 필수
      }
    }
  });
};

//
// 🔍 기준 자산 조회/저장 (assets)
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

//
// 📍 실사 위치 및 메타데이터 저장용 (meta)
//

// 현재 실사 위치 저장/조회
export const saveLocation = async (location) => {
  const db = await initDB();
  await db.put(STORE_META, { key: 'currentLocation', value: location });
};

export const getLocation = async () => {
  try {
    const db = await initDB();
    const entry = await db.get(STORE_META, 'currentLocation');
    return entry?.value || '';
  } catch (err) {
    console.error('실사 위치 불러오기 실패:', err);
    return '';
  }
};

// 일반 메타데이터 저장/조회 (예: 실사일, 실사자, 실사건수)
export const saveMeta = async (key, value) => {
  const db = await initDB();
  await db.put(STORE_META, { key, value });
};

export const getMeta = async (key) => {
  try {
    const db = await initDB();
    const entry = await db.get(STORE_META, key);
    return entry?.value || null;
  } catch (err) {
    console.error(`메타(${key}) 불러오기 실패:`, err);
    return null;
  }
};
