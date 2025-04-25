// src/page/MyInfor/EditModal.js
import React, { useState, useEffect } from 'react';
import './editModal.css';

// 대분류 소분류 연결
const companyOptions = {
  '평택공장': ['전산운영팀', '경영기획팀', '생산팀'],
  '우신에너지': ['경영관리팀', '자재관리팀', '구매팀'],
};

const categoryOptions = {
  'IT자산': ['노트북', '모니터', '서버'],
  '사무자산': ['책상', '의자', '캐비닛'],
};

const statusOptions = ['사용', '대기', '수리중', '폐기'];

const EditModal = ({ item, onSave, onClose }) => {
  const [editedItem, setEditedItem] = useState(item);

  const [selectedCompany, setSelectedCompany] = useState(item.company || '');
  const [selectedDepartment, setSelectedDepartment] = useState(item.department || '');

  const [selectedCategory, setSelectedCategory] = useState(item.assetCategory || '');
  const [selectedItemName, setSelectedItemName] = useState(item.itemName || '');

  useEffect(() => {
    if (selectedCompany && !companyOptions[selectedCompany]?.includes(selectedDepartment)) {
      setSelectedDepartment('');
    }
    if (selectedCategory && !categoryOptions[selectedCategory]?.includes(selectedItemName)) {
      setSelectedItemName('');
    }
  }, [selectedCompany, selectedCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedItem({ ...editedItem, [name]: value });
  };

  const handleCompanyChange = (e) => {
    const newCompany = e.target.value;
    setSelectedCompany(newCompany);
    setSelectedDepartment('');
    setEditedItem({ ...editedItem, company: newCompany, department: '' });
  };

  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setSelectedDepartment(newDepartment);
    setEditedItem({ ...editedItem, department: newDepartment });
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    setSelectedItemName('');
    setEditedItem({ ...editedItem, assetCategory: newCategory, itemName: '' });
  };

  const handleItemNameChange = (e) => {
    const newItemName = e.target.value;
    setSelectedItemName(newItemName);
    setEditedItem({ ...editedItem, itemName: newItemName });
  };

  const handleSave = () => {
    onSave(editedItem);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>자산 수정</h2>

        <label>바코드</label>
        <input name="barcode" value={editedItem.barcode} onChange={handleChange} />

        <label>회사구분</label>
        <select name="company" value={selectedCompany} onChange={handleCompanyChange}>
          <option value="">선택</option>
          {Object.keys(companyOptions).map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>

        <label>부서구분</label>
        <select name="department" value={selectedDepartment} onChange={handleDepartmentChange} disabled={!selectedCompany}>
          <option value="">선택</option>
          {companyOptions[selectedCompany]?.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <label>세부위치</label>
        <input name="location" value={editedItem.location} onChange={handleChange} />

        <label>취득구분</label>
        <input name="acquisitionType" value={editedItem.acquisitionType} onChange={handleChange} />

        <label>자산분류</label>
        <select name="assetCategory" value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">선택</option>
          {Object.keys(categoryOptions).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>품목</label>
        <select name="itemName" value={selectedItemName} onChange={handleItemNameChange} disabled={!selectedCategory}>
          <option value="">선택</option>
          {categoryOptions[selectedCategory]?.map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <label>자산상태</label>
        <select name="assetStatus" value={editedItem.assetStatus} onChange={handleChange}>
          <option value="">선택</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <label>제조사</label>
        <input name="manufacturer" value={editedItem.manufacturer} onChange={handleChange} />

        <label>모델</label>
        <input name="model" value={editedItem.model} onChange={handleChange} />

        <label>취득일자</label>
        <input name="acquisitionDate" value={editedItem.acquisitionDate} onChange={handleChange} />

        <label>취득가</label>
        <input name="acquisitionPrice" value={editedItem.acquisitionPrice} onChange={handleChange} />

        <div className="modal-button-group">
          <button onClick={handleSave}>수정 완료</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
