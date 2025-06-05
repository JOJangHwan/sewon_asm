// import React, { useState } from 'react';
// import './AssetModal.css';
// import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
// import SlidePanel from './AssetSearchPanel';

// export default function AssetFormModal({ isOpen, onClose, mode = 'rent' }) {
//   const [formData, setFormData] = useState({
//     assetType: '',
//     itemName: '',
//     asset: '',
//     detailLocation: '',
//     registrar: '',
//     startDate: '',
//     endDate: '',
//   });
//   const [isSlideOpen, setIsSlideOpen] = useState(false);

//   const handleChangeDate = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleAssetSelect = (asset) => {
//     setFormData({
//       assetType: asset.assetType,
//       itemName: asset.itemName,
//       asset: asset.asset,
//       detailLocation: asset.detailLocation, // 초기 값 세팅
//       registrar: asset.registrar,
//       startDate: '',
//       endDate: '',
//     });
//     setIsSlideOpen(false);
//   };

//   const handleSubmit = () => {
//     if (!formData.asset) {
//       alert('자산을 선택해주세요!');
//       return;
//     }
//     alert(mode === 'rent' ? '대여 신청이 완료되었습니다.' : '반납 처리가 완료되었습니다.');
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal-background">
//       <div className="modal-content">
//         <div className="modal-top">
//           <h3>자산 {mode === 'rent' ? '대여 신청' : '반납 처리'}</h3>
//           <button className="close-btn" onClick={onClose}>
//             ✖
//           </button>
//         </div>

//         <div className="row">
//           <span>신청자 :</span> <span>홍길동</span>
//         </div>
//         <div className="row">
//           <span>소속 :</span> <span>서울사무소 전산운영P</span>
//         </div>

//         <div className="row">
//           <span>자산찾기 :</span>
//           <button className="icon-btn" onClick={() => setIsSlideOpen(true)}>
//             <FaSearch />
//           </button>
//         </div>

//         <div className="row">
//           <span>자산분류 :</span> <input value={formData.assetType} disabled />
//         </div>
//         <div className="row">
//           <span>품목 :</span> <input value={formData.itemName} disabled />
//         </div>
//         <div className="row">
//           <span>자산 :</span> <input value={formData.asset} disabled />
//         </div>
//         <div className="row">
//           <span>자산 세부 위치 :</span> <input value={formData.detailLocation} disabled />
//         </div>
//         <div className="row">
//           <span>자산등록자 :</span> <input value={formData.registrar} disabled />
//         </div>

//         {mode === 'rent' && (
//           <>
//             {/* 대여기간 */}
//             <div className="row">
//               <span>대여기간 :</span>
//               <div className="date-range">
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={formData.startDate}
//                   onChange={handleChangeDate}
//                 />
//                 <FaCalendarAlt className="calendar-icon" />
//                 <span style={{ minWidth: '20px', textAlign: 'center' }}>~</span>
//                 <input
//                   type="date"
//                   name="endDate"
//                   value={formData.endDate}
//                   onChange={handleChangeDate}
//                 />
//                 <FaCalendarAlt className="calendar-icon" />
//               </div>
//             </div>

//             {/* 세부위치 선택 */}
//             <div className="row">
//               <span>세부위치 선택 :</span>
//               <select
//                 value={formData.detailLocation}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, detailLocation: e.target.value }))
//                 }
//               >
//                 <option value="">세부위치를 선택하세요</option>
//                 <option value="전산실">전산실</option>
//                 <option value="서버실">서버실</option>
//                 <option value="회의실">회의실</option>
//                 <option value="자재창고">자재창고</option>
//                 <option value="기타">기타</option>
//               </select>
//             </div>
//           </>
//         )}

//         <button className="submit-btn" onClick={handleSubmit}>
//           {mode === 'rent' ? '대여신청' : '반납처리'}
//         </button>

//         <SlidePanel
//           isOpen={isSlideOpen}
//           onClose={() => setIsSlideOpen(false)}
//           onSelect={handleAssetSelect}
//           mode={mode}
//         />
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import './AssetModal.css';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import SlidePanel from './AssetSearchPanel';

export default function AssetFormModal({ isOpen, onClose, mode = 'rent' }) {
  const [formData, setFormData] = useState({
    assetType: '',
    itemName: '',
    asset: '',
    detailLocation: '',
    registrar: '',
    startDate: '',
    endDate: '',
  });
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const handleChangeDate = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssetSelect = (asset) => {
    setFormData({
      assetType: asset.assetType,
      itemName: asset.itemName,
      asset: asset.asset,
      detailLocation: asset.detailLocation,
      registrar: asset.registrar,
      startDate: '',
      endDate: '',
    });
    setIsSlideOpen(false);
  };

  const handleSubmit = () => {
    const {
      assetType,
      itemName,
      asset,
      detailLocation,
      registrar,
      startDate,
      endDate,
    } = formData;

    // 1) 모든 필수 항목 입력 검증
    if (
      !assetType ||
      !itemName ||
      !asset ||
      !detailLocation ||
      !registrar ||
      !startDate ||
      !endDate
    ) {
      alert('모든 필드를 입력하고 선택해야 신청이 가능합니다.');
      return;
    }

    // 2) 날짜 순서 검증
    if (startDate > endDate) {
      alert('반납일은 대여 시작일 이후여야 합니다.');
      return;
    }

    // 3) 검증 완료 후 처리 (API 호출 등)
    // 예: axios.post('/api/rent', formData).then(…).catch(…);

    alert(mode === 'rent' ? '대여 신청이 완료되었습니다.' : '반납 처리가 완료되었습니다.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-background">
      <div className="modal-content">
        <div className="modal-top">
          <h3>자산 {mode === 'rent' ? '대여 신청' : '반납 처리'}</h3>
          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        <div className="row">
          <span>신청자 :</span> <span>홍길동</span>
        </div>
        <div className="row">
          <span>소속 :</span> <span>서울사무소 전산운영P</span>
        </div>

        <div className="row">
          <span>자산찾기 :</span>
          <button className="icon-btn" onClick={() => setIsSlideOpen(true)}>
            <FaSearch />
          </button>
        </div>

        <div className="row">
          <span>자산분류 :</span> <input value={formData.assetType} disabled />
        </div>
        <div className="row">
          <span>품목 :</span> <input value={formData.itemName} disabled />
        </div>
        <div className="row">
          <span>자산 :</span> <input value={formData.asset} disabled />
        </div>
        <div className="row">
          <span>자산 세부 위치 :</span> <input value={formData.detailLocation} disabled />
        </div>
        <div className="row">
          <span>자산등록자 :</span> <input value={formData.registrar} disabled />
        </div>

        {mode === 'rent' && (
          <>
            <div className="row">
              <span>대여기간 :</span>
              <div className="date-range">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChangeDate}
                />
                <FaCalendarAlt className="calendar-icon" />
                <span style={{ minWidth: '20px', textAlign: 'center' }}>~</span>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChangeDate}
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>

            <div className="row">
              <span>세부위치 선택 :</span>
              <select
                value={formData.detailLocation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, detailLocation: e.target.value }))
                }
              >
                <option value="">세부위치를 선택하세요</option>
                <option value="전산실">전산실</option>
                <option value="서버실">서버실</option>
                <option value="회의실">회의실</option>
                <option value="자재창고">자재창고</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </>
        )}

        <button className="submit-btn" onClick={handleSubmit}>
          {mode === 'rent' ? '대여신청' : '반납처리'}
        </button>

        <SlidePanel
          isOpen={isSlideOpen}
          onClose={() => setIsSlideOpen(false)}
          onSelect={handleAssetSelect}
          mode={mode}
        />
      </div>
    </div>
  );
}
