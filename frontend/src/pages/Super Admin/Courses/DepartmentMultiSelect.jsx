import React, { useState, useEffect, useRef } from "react";

const DepartmentMultiSelect = ({ 
  departments, 
  selectedDepartments = [], 
  onChange,
  placeholder = "Chọn khoa/phòng..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDepartment = (deptId) => {
    const newSelected = selectedDepartments.includes(deptId)
      ? selectedDepartments.filter(id => id !== deptId)
      : [...selectedDepartments, deptId];
    onChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDepartments.length === departments.length) {
      onChange([]); // Bỏ chọn tất cả
    } else {
      onChange(departments.map(dept => dept._id)); // Chọn tất cả
    }
  };

  return (
    <div className="multi-select-container" ref={dropdownRef}>
      <div 
        className="multi-select-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDepartments.length === 0 ? (
          <span className="placeholder">{placeholder}</span>
        ) : (
          <span>
            Đã chọn {selectedDepartments.length} khoa/phòng
          </span>
        )}
        <span className="dropdown-icon">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm khoa/phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="options-container">
            <div 
              className="option-item select-all"
              onClick={toggleSelectAll}
            >
              <input
                type="checkbox"
                checked={selectedDepartments.length === departments.length}
                readOnly
              />
              <span>Chọn tất cả</span>
            </div>

            {filteredDepartments.length > 0 ? (
              filteredDepartments.map(dept => (
                <div 
                  key={dept._id}
                  className="option-item"
                  onClick={() => toggleDepartment(dept._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept._id)}
                    readOnly
                  />
                  <span>{dept.name}</span>
                </div>
              ))
            ) : (
              <div className="no-results">Không tìm thấy kết quả</div>
            )}
          </div>

          <div className="dropdown-footer">
            {selectedDepartments.length === 0 && (
              <small>Nếu không chọn, khóa học sẽ áp dụng cho tất cả</small>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentMultiSelect;