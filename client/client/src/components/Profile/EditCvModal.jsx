import React, { useState } from "react";
import { FiX, FiUploadCloud, FiFileText, FiCheckCircle } from "react-icons/fi";
import api from "../../utils/api";
import toast from "react-hot-toast";

const EditCvModal = ({ setModalFn, profileData, refetchProfileFn }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("File too large (max 5MB)");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("cv", file);

        try {
            await api.post("/user/update-cv", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("CV updated successfully!");
            refetchProfileFn();
            setModalFn(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload CV");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">Upload CV</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Resume</p>
                    </div>
                    <button onClick={() => setModalFn(false)} className="p-2 transition-colors rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div 
                        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${file ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-primary/30 hover:bg-white'}`}
                        onClick={() => document.getElementById('cvInput').click()}
                    >
                        <input 
                            id="cvInput"
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                        />
                        
                        <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-transform duration-300 ${file ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-200' : 'bg-white text-slate-400 shadow-sm'}`}>
                            {file ? <FiCheckCircle size={32} /> : <FiUploadCloud size={32} />}
                        </div>

                        {file ? (
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{file.name}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">File selected</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900">Click to upload CV</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF, DOC (Max 5MB)</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${!file || uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:shadow-primary/20 active:scale-[0.98]'}`}
                        >
                            {uploading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Uploading...</span>
                                </div>
                            ) : "Confirm Upload"}
                        </button>
                        <button
                            onClick={() => setModalFn(false)}
                            className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCvModal;
