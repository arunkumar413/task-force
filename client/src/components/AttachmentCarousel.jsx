import React, { useState } from "react";

export function AttachmentCarousel({ attachmentData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  const handleNext = () => {
    if (currentIndex + itemsPerPage < attachmentData.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  const commentAttachmentElements = attachmentData.map(function (item, index) {
    return (
      <img
        key={item.id.toString()}
        style={{ width: 60, height: 60 }}
        src={item.link}
      />
    );
  });

  const carouselElements = commentAttachmentElements.slice(
    currentIndex,
    currentIndex + itemsPerPage
  );

  return (
    <div
      className="AttachmentCarousel"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      <svg
        onClick={handlePrev}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-chevron-left"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {carouselElements}

      <svg
        onClick={handleNext}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-chevron-right"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </div>
  );
}
