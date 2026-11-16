import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import App from "./App";
import { Button } from "../components/FormControls";
import { deleteView } from "../store/tasksFilterSlice";
import { buttonStyles } from "../constants";

export function ViewPage() {
  const { viewId } = useParams();
  return <SavedViewPage key={viewId} viewId={viewId} />;
}

function SavedViewPage({ viewId }) {
  const view = useSelector(state => state.tasks.views.find(item => item.id === viewId));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await dispatch(deleteView(viewId)).unwrap();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  const isSavedView = view && viewId !== "mine";
  return <App viewActions={isSavedView ? <>
      {!busy && <Link className={buttonStyles.primary.join(" ")} to={"/view/" + viewId + "/edit"}>Edit view</Link>}
      <Button type="button" disabled={busy} className="rounded-lg border border-red-300 px-4 py-2 text-md font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={() => setConfirming(true)}>Delete view</Button>
    </> : null} viewFeedback={isSavedView && (confirming || error) ? <div className="mb-6 space-y-3">
    {confirming && <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4" role="region" aria-label="Confirm view deletion">
      <p className="text-sm text-slate-700">Delete “{view.name}”? Your tasks will be kept.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={remove} className="rounded-lg bg-red-500 px-4 py-2 text-md font-medium text-white hover:bg-red-700 disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</Button>
        <Button className='rounded-lg px-4 py-2 text-md font-medium bg-green-700 text-white disabled:opacity-50' type="button" disabled={busy} onClick={() => setConfirming(false)}>Keep view</Button>
      </div>
    </div>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div> : null} />;
}
