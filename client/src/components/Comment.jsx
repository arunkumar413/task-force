import React from "react";
import Markdown from "react-markdown";
import { fakeAttachmentData } from "../dummyData/fakeAttachmentData";
import { AttachmentCarousel } from "./AttachmentCarousel";

export function Comment({
  email,
  userName,
  firstName,
  lastName,
  comment,
  commentTimeStamp,
  attachments,
}) {
  return (
    <div className="comment-item rc-Comment">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Markdown>{comment}</Markdown>
          <div className="comment-footer">
            <span className="commented-by">{email}</span>
            <span className="commented-date">{new Date().toDateString()}</span>
          </div>
        </div>
        <div className="comment-attachment-container">
          <AttachmentCarousel
            attachmentData={attachments === null ? [] : attachments}
          />
        </div>
      </div>
      {/* <p>{item.comment}</p> */}
    </div>
  );
}
