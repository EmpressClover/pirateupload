"use client";
import React from "react";

export default function Page() {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"Uploading" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onUploadFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("filename", `image_${Date.now()}.${file.name.split(".").pop()}`);
    setBusy("Uploading");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const copyUrl = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page">
      <div className="appTitle">Pirate-Arena Upload</div>

      <div className="panel sectionStack">
        <div className="imagePreview">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Uploaded image" />
          ) : (
            <span className="subtle">No image yet. Upload one.</span>
          )}
        </div>

        <div className="sectionStack">
          <label className="subtle">Upload a file</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadFile(f);
              e.currentTarget.value = "";
            }}
          />
        </div>


        <div className="sectionStack">
          <label className="subtle">Direct image URL</label>
          <div className="inlineRow">
            <input className="textInput monoText" readOnly value={imageUrl || ""} placeholder="Will appear after upload" />
            <button className="buttonPrimary" onClick={copyUrl} disabled={!imageUrl}>
              Copy
            </button>
          </div>
        </div>

        {error && <div className="subtle" style={{ color: "#ff6b6b" }}>{error}</div>}
        {busy && <div className="muted">{busy}…</div>}
      </div>

      <div className="footerNote">5 MB Upload Limit. Created by acrimsonlily</div>
    </div>
  );
}
