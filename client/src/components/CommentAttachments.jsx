import React, { useEffect, useRef, useState } from "react";
import { Button } from "./FormControls";
import { API_URL } from "../constants";

const imageType = file => ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", bmp: "image/bmp", svg: "image/svg+xml" })[file.file_name?.split(".").pop().toLowerCase()];

function ImageCarousel({ images, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const image = images[index];
  useEffect(() => {
    const element = dialog.current;
    const previouslyFocused = document.activeElement;
    const previouslyLocked = document.body.classList.contains("overflow-hidden");
    document.body.classList.add("overflow-hidden");
    element.showModal();
    return () => {
      element.close();
      if (!previouslyLocked) document.body.classList.remove("overflow-hidden");
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    setSource(""); setError("");
    // Fetch the authorized download as a blob so its attachment disposition
    // does not trigger a download when opening the preview.
    const url = image.storage_key ? API_URL.replace(/\/$/, "") + new URL(image.link, location.origin).pathname.replace(/^\/api/, "") : image.link;
    fetch(url, { credentials: image.storage_key ? "include" : "same-origin", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Unable to load image");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(new Blob([blob], { type: imageType(image) }));
      setSource(objectUrl);
    }).catch(err => { if (!controller.signal.aborted) setError("Unable to load this image. You can try downloading it below."); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [image]);
  function move(offset) { setIndex(current => (current + offset + images.length) % images.length); }
  return <dialog ref={dialog} aria-label="Comment images" className="fixed inset-0 m-auto max-h-[90dvh] w-[min(95vw,64rem)] max-w-none overflow-y-auto rounded-xl border border-slate-200 bg-surface p-4 text-slate-900 shadow-xl backdrop:bg-black/70 sm:p-6"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="min-w-0 truncate text-lg font-semibold" title={image.file_name}>{image.file_name}</h2>
      <Button type="button" onClick={onClose} aria-label="Close image viewer">Close</Button>
    </div>
    <div className="flex h-[55dvh] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:h-[60dvh]">
      {error ? <p role="alert" className="p-4 text-sm text-red-700">{error}</p> : source ? <img key={source} src={source} alt={image.file_name} className="h-full w-full object-contain" onError={() => setError("Unable to display this image. You can try downloading it below.")} /> : <p role="status" className="p-4 text-sm text-slate-500">Loading image…</p>}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <Button type="button" disabled={images.length < 2} aria-label="Previous image" onClick={() => move(-1)}>← Previous</Button>
      <p role="status" aria-live="polite" className="text-sm text-slate-500">{index + 1} of {images.length}</p>
      <Button type="button" disabled={images.length < 2} aria-label="Next image" onClick={() => move(1)}>Next →</Button>
    </div>
    <a className="mt-4 inline-block text-sm text-primary underline" href={image.link} target="_blank" rel="noreferrer">Download image</a>
  </dialog>;
}

export function CommentAttachments({ files = [] }) {
  const [open, setOpen] = useState(false);
  const images = files.filter(file => imageType(file));
  return <div className="space-y-2">
    {files.map((file, index) => <a className="mt-2 block break-all text-sm text-primary underline" key={file._id || index} href={file.link} rel="noreferrer" target="_blank">{file.file_name}{file.size != null ? ` (${(file.size / 1024).toFixed(1)} KB)` : ""}</a>)}
    {images.length > 0 && <Button type="button" onClick={() => setOpen(true)}>View images ({images.length})</Button>}
    {open && <ImageCarousel images={images} onClose={() => setOpen(false)} />}
  </div>;
}
