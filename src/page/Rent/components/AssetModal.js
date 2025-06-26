
import React, { useEffect, useState, useMemo } from 'react';
import './AssetModal.css';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import SlidePanel from './AssetSearchPanel';
import { authFetchWithRefresh } from '../../../utils/authFetchWithRefresh';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

export default function AssetFormModal({ isOpen, onClose, mode = 'rent' }) {

  //로그인 상태
  const [userName, setUserName]   = useState('');
  const [userDept, setUserDept]   = useState('');
  const [usercorporation,setCorporation] =useState('');

//법인 상태
const [corporations, setCorporations] = useState([]);
const [corporationId, setCorporationId] = useState('');
const [affiliationId, setAffiliationId] = useState('');
const [locationId, setLocationId] = useState('');

//대여위치 상태태
const [rentalCorporationId, setRentalCorporationId] = useState('');
const [rentalAffiliationId, setRentalAffiliationId] = useState('');
const [rentalLocationId, setRentalLocationId] = useState('');

  const [formData, setFormData] = useState({
    assetId: '', 
    assetType: '',
    itemName: '',
    asset: '',
    detailLocation: '',
    registrar: '',
    startDate: '',
    endDate: '',
  });

   // ② 모달이 열릴 때 localStorage 값을 읽어온다
 useEffect(() => {
  // console.log('[DEBUG] isOpen:', isOpen);
   if (!isOpen) return;

  // localStorage 에 해당 값이 없으면 기본 문자열로 대체
  console.log(localStorage);
  const department =localStorage.getItem('department');
  const corporation = localStorage.getItem('corporation');
  const corDep = corporation+" "+department;
   setUserName(localStorage.getItem('name') || '알 수 없음');
   setUserDept(corDep || '부서 미설정');

   (async () => {
    try {
      const res = await authFetchWithRefresh(`${API_BASE}/corporations`);
    
      const text = await res.text(); // ✅ 먼저 텍스트로만 한번 읽음
      console.log('[응답 원문]', text);
    
      if (!res.ok) {
        console.error('법인 응답 실패', res.status);
        return;
      }
    
      const json = JSON.parse(text); // ✅ text를 json으로 수동 파싱
      console.log('[파싱된 JSON]', json);
    
      if (json.code === 1) {
        setCorporations(json.data.corporationList || []);
      } else {
        console.warn('법인 코드 != 1', json);
      }
    
    } catch (err) {
      console.error('법인 불러오기 오류 ❗', err);
    }
  })();
 }, [isOpen]);

 const affiliations = useMemo(() => {
  return corporations.find(c => c.corporationId === Number(corporationId))?.affiliationList || [];
}, [corporationId, corporations]);

const locations = useMemo(() => {
  return affiliations.find(a => a.affiliationId === Number(affiliationId))?.locations || [];
}, [affiliationId, affiliations]);

const rentalAffiliations = useMemo(() => {
  return corporations.find(c => c.corporationId === Number(rentalCorporationId))?.affiliationList || [];
}, [rentalCorporationId, corporations]);

const rentalLocations = useMemo(() => {
  return rentalAffiliations.find(a => a.affiliationId === Number(rentalAffiliationId))?.locations || [];
}, [rentalAffiliationId, rentalAffiliations]);


  
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const handleChangeDate = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssetSelect = (asset) => {
      setFormData({
        assetId:         asset.id, 
          assetType:        asset.parentCategory   ?? '',  // 대분류
         itemName:         asset.childCategory    ?? '',  // 품목
          asset:            asset.barcode          ?? '',  // 바코드
          detailLocation:   asset.location         ?? '',  // 세부위치
          registrar:        asset.registerName     ?? '',  // 등록자
          startDate: '',
          endDate: '',
        });
    setIsSlideOpen(false);
  };

  const handleSubmit = async () => {
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
    if (!rentalCorporationId || !rentalAffiliationId || !rentalLocationId) {
      alert("대여위치를 모두 선택해야 합니다.");
      return;
    }
    const payload = {
      ...formData,
      rentalCorporationId,
      rentalAffiliationId,
      rentalLocationId,
    };

    const body = {
      assetId:    Number(formData.assetId),
      locationId: Number(rentalLocationId),
      fromDate:   formData.startDate,   // YYYY-MM-DD
      toDate:     formData.endDate,
    };
    try{
      const res = await authFetchWithRefresh(
        `${API_BASE}/rental/request`,{
          method: 'POST',
          headers:{ 'Content-Type': 'application/json' },
          body:   JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (json.code === 1) {
        alert('✅ 대여 신청 완료!');
        onClose(true);
    }else{
      alert(`❌ 실패: ${json.message || '서버 오류'}`);
    }

    

    //alert(mode === 'rent' ? '대여 신청이 완료되었습니다.' : '반납 처리가 완료되었습니다.');
    //onClose();
  }catch(err){
    console.error('대여 신청 오류', err);
    alert('🚨 서버와 통신할 수 없습니다.');
     }          // ← catch 끝
     }          // ← ★ handleSubmit 함수 닫기 ★
    
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
        <span>신청자 :</span> <span>{userName}</span>
        </div>
        <div className="row">
        <span>소속 :</span> <span>{userDept}</span>
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
  <span>대여위치 :</span>
  <select value={rentalCorporationId} onChange={e => {
    setRentalCorporationId(e.target.value);
    setRentalAffiliationId('');
    setRentalLocationId('');
  }}>
    <option value="">회사 구분</option>
    {corporations.map(c => (
      <option key={c.corporationId} value={c.corporationId}>{c.name}</option>
    ))}
  </select>

  <select value={rentalAffiliationId} onChange={e => {
    setRentalAffiliationId(e.target.value);
    setRentalLocationId('');
  }} disabled={!rentalCorporationId}>
    <option value="">부서 선택</option>
    {rentalAffiliations.map(a => (
      <option key={a.affiliationId} value={a.affiliationId}>{a.department}</option>
    ))}
  </select>

  <select
    value={rentalLocationId}
    onChange={e => {
      setRentalLocationId(e.target.value);
    }}
    disabled={!rentalAffiliationId}
  >
    <option value="">세부위치 선택</option>
    {rentalLocations.map(l => (
      <option key={l.locationId} value={l.locationId}>{l.location}</option>
    ))}
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
