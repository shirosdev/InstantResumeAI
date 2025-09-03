import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo; Previous
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;