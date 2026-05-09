import React from "react";
import { FiX, FiFileText } from "react-icons/fi";

const ViewCvModal = ({ setModalFn, cvUrl }) => {
    const isCloudinary = cvUrl?.includes("cloudinary.com");
    
    // Cloudinary can render PDFs as images. 
    // We use pg_1 to get the first page for the "image" view.
    const previewImageUrl = isCloudinary 
        ? cvUrl.replace(".pdf", ".jpg").replace("/upload/", "/upload/w_1200,q_auto,f_auto,pg_1/") 
        : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
            <div className="w-full max-w-5xl bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 max-h-[92vh] flex flex-col border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group transition-all hover:scale-105">
                            <FiFileText size={28} className="group-hover:rotate-6 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Curriculum Vitae</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                Digital Professional Resume
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setModalFn(false)} 
                            className="p-3.5 transition-all rounded-2xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 active:scale-90"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-slate-50/50 custom-scrollbar scroll-smooth">
                    <div className="relative w-full max-w-4xl mx-auto">
                        {/* Background Decoration */}
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 to-emerald-500/5 rounded-[3rem] -z-10 blur-2xl"></div>
                        
                        <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200/60 transition-all duration-500">
                            {previewImageUrl ? (
                                <div className="relative group">
                                    <img 
                                        src={previewImageUrl} 
                                        alt="CV Preview" 
                                        className="w-full h-auto block select-none pointer-events-none"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop";
                                        }}
                                    />
                                    {/* Subtle Overlay Hint */}
                                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-4 py-2 bg-slate-900/10 backdrop-blur-md rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest border border-white/20">
                                            Quick Preview Mode
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-200/30">
                                    <iframe 
                                        src={`${cvUrl}#toolbar=0&navpanes=0`} 
                                        title="CV Preview" 
                                        className="w-full h-[78vh] border-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Strip */}
                <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Verified Secure Document</p>
                    </div>
                    
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        © {new Date().getFullYear()} Nepwork Marketplace
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ViewCvModal;
