import { useEffect, useState, useCallback } from "react";
import { TbMessageDots } from "react-icons/tb";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../stores";
import {
    ChangeAvatarModal,
    ClientPostedJobs,
    EditAboutModal,
    EditCvModal,
    EditHourlyRateModal,
    EditTagsModal,
    Loader,
    ReviewsDisplay,
    ViewCvModal,
} from "../components";
import toast from "react-hot-toast";
import api from "../utils/api";
import default_avatar from "../assets/default_avatar.svg";
import {
    FiEdit,
    FiMapPin,
    FiCheckCircle,
    FiStar,
    FiFileText,
    FiDownloadCloud
} from "react-icons/fi";
import capitalize from "../utils/capitalize";

function Profile() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const { userData: currentUserData } = useAuth();
    const [currentProfileData, setCurrentProfileData] = useState(null);
    const [changeAvatarModal, setChangeAvatarModal] = useState(false);
    const [editHourlyRateModal, setEditHourlyRateModal] = useState(false);
    const [editAboutModal, setEditAboutModal] = useState(false);
    const [editTagsModal, setEditTagsModal] = useState(false);
    const [editCvModal, setEditCvModal] = useState(false);
    const [viewCvModal, setViewCvModal] = useState(false);

    // Redirect if userId is undefined
    useEffect(() => {
        if (!userId) {
            toast.error("Invalid profile URL");
            navigate("/");
        }
    }, [userId, navigate]);

    const fetchSetCurrentProfileData = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await api.get(`/user/profiles/${userId}`);
            setCurrentProfileData(response.data.data);
        } catch (error) {
            toast.error("Failed to load profile");
            console.error(error);
            navigate("/");
        }
    }, [userId, navigate]);
    const getJoinedTime = (createdAt) => {
        const now = new Date();
        const createdTime = new Date(createdAt);
        const timeDifference = Math.floor((now - createdTime) / 1000);

        if (timeDifference < 60) return `${timeDifference} seconds ago`;
        if (timeDifference < 3600) {
            const minutes = Math.floor(timeDifference / 60);
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        }
        if (timeDifference < 86400) {
            const hours = Math.floor(timeDifference / 3600);
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        }
        const days = Math.floor(timeDifference / 86400);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    };

    useEffect(() => {
        fetchSetCurrentProfileData();
    }, [fetchSetCurrentProfileData]);

    if (!currentProfileData)
        return <Loader />;

    const isOwnProfile = userId === currentUserData?._id;
    const isFreelancer = currentProfileData.role === "freelancer";
    const isClient = currentProfileData.role === "client";

    return (
        <>
            {changeAvatarModal && (
                <ChangeAvatarModal
                    setModal={setChangeAvatarModal}
                    refetchProfile={fetchSetCurrentProfileData}
                />
            )}

            {editHourlyRateModal && (
                <EditHourlyRateModal
                    setModalFn={setEditHourlyRateModal}
                    profileData={currentProfileData}
                    refetchProfileFn={fetchSetCurrentProfileData}
                />
            )}
            {editTagsModal && (
                <EditTagsModal
                    setModalFn={setEditTagsModal}
                    profileData={currentProfileData}
                    refetchProfileFn={fetchSetCurrentProfileData}
                />
            )}

            {editAboutModal && (
                <EditAboutModal
                    setModalFn={setEditAboutModal}
                    profileData={currentProfileData}
                    refetchProfileFn={fetchSetCurrentProfileData}
                />
            )}

            {editCvModal && (
                <EditCvModal
                    setModalFn={setEditCvModal}
                    profileData={currentProfileData}
                    refetchProfileFn={fetchSetCurrentProfileData}
                />
            )}

            {viewCvModal && (
                <ViewCvModal
                    setModalFn={setViewCvModal}
                    cvUrl={currentProfileData.cv}
                />
            )}

            <div className="max-w-6xl min-h-screen px-4 py-8 mx-auto bg-slate-50">
                {/* Profile Header */}
                <div className="mb-8 overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
                    {/* Hero Section */}
                    <div className="h-32 bg-gradient-to-r from-primary/10 to-emerald-500/10"></div>
                    
                    <div className="px-6 py-6 md:px-8">
                        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                            {/* Avatar */}
                            <div className="relative -mt-20">
                                <img
                                    src={currentProfileData.avatar ?? default_avatar}
                                    alt={`Profile of ${currentProfileData?.name?.firstName}`}
                                    className="object-cover w-32 h-32 border-4 border-white shadow-lg md:w-40 md:h-40 rounded-2xl"
                                />
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setChangeAvatarModal(true)}
                                        className="absolute p-3 text-white transition-all shadow-lg bottom-2 right-2 bg-primary rounded-xl hover:bg-primary/90"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Header Info */}
                            <div className="flex flex-col justify-between flex-1">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-black md:text-4xl text-slate-900">
                                            {capitalize(currentProfileData?.name?.firstName)}{" "}
                                            {currentProfileData?.name?.middleName && capitalize(currentProfileData?.name?.middleName) + " "}
                                            {capitalize(currentProfileData?.name?.lastName)}
                                        </h1>
                                        {currentProfileData.kycVerified && (
                                            <div className="flex items-center justify-center flex-shrink-0 rounded-full w-7 h-7 bg-emerald-100 text-emerald-600" title="Verified">
                                                <FiCheckCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center text-sm font-medium gap-x-6 gap-y-2 text-slate-600">
                                        {currentProfileData?.kyc?.address?.temporary.city && (
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="w-4 h-4 text-primary" />
                                                <span>{capitalize(currentProfileData?.kyc?.address?.temporary.city)}</span>
                                            </div>
                                        )}
                                        {isFreelancer && (
                                            <div className="flex items-center gap-2">
                                                <FiStar className="w-4 h-4 text-primary" />
                                                <span>{currentProfileData.tags?.length || 0} Specialties</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-4">
                                    {!isOwnProfile && (
                                        <button 
                                            onClick={() => navigate('/inbox')}
                                            className="flex items-center justify-center transition-all rounded-lg w-11 h-11 bg-slate-100 text-slate-600 hover:bg-primary hover:text-white"
                                        >
                                            <TbMessageDots className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Sidebar */}
                    <div className="space-y-6 md:col-span-1">
                        {/* Status & Rate */}
                        <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-slate-200">
                            <div className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 ${currentProfileData.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${currentProfileData.available ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                {currentProfileData.available ? "Ready for Work" : "Currently Unavailable"}
                            </div>

                            {isFreelancer && (
                                <div className="p-4 border bg-primary/5 border-primary/20 rounded-xl">
                                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Hourly Rate</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        Rs. {currentProfileData.hourlyRate}
                                        <span className="ml-1 text-sm font-bold text-slate-500">/hr</span>
                                    </p>
                                    {isOwnProfile && (
                                        <button 
                                            onClick={() => setEditHourlyRateModal(true)}
                                            className="mt-3 text-xs font-bold text-primary hover:underline"
                                        >
                                            Edit Rate
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="h-px bg-slate-200"></div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Joined</p>
                                <p className="text-sm font-bold text-slate-700">{getJoinedTime(currentProfileData.createdAt)}</p>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black tracking-wide uppercase text-slate-900">About</h3>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => setEditAboutModal(true)}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700">
                                {currentProfileData.about || "No bio added yet"}
                            </p>
                        </div>

                        {/* CV Section - Freelancer Only */}
                        {isFreelancer && (
                            <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black tracking-wide uppercase text-slate-900">Curriculum Vitae</h3>
                                    {isOwnProfile && (
                                        <button 
                                            onClick={() => setEditCvModal(true)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            {currentProfileData.cv ? "Update" : "Upload"}
                                        </button>
                                    )}
                                </div>
                                
                                {currentProfileData.cv ? (
                                    <div className="relative group overflow-hidden border border-slate-200 rounded-2xl bg-slate-50 transition-all hover:shadow-xl hover:shadow-primary/5">
                                        {/* Preview Image & Link */}
                                        <div 
                                            onClick={() => setViewCvModal(true)}
                                            className="block aspect-[3/4] w-full overflow-hidden relative cursor-pointer"
                                        >
                                            <img 
                                                src={currentProfileData.cv.includes("cloudinary.com") 
                                                    ? currentProfileData.cv.replace(".pdf", ".jpg").replace("/upload/", "/upload/w_500,h_700,c_fill,pg_1,q_auto,f_auto/") 
                                                    : "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
                                                } 
                                                alt="CV Preview"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop";
                                                }}
                                            />
                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                    <FiFileText size={16} />
                                                    View Full CV
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Info Strip */}
                                        <div className="p-4 flex items-center justify-between bg-white border-t border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    <FiFileText size={16} />
                                                </div>
                                                <p className="text-xs font-black text-slate-700 truncate max-w-[120px]">Resume_Profile.pdf</p>
                                            </div>
                                            <a 
                                                href={currentProfileData.cv} 
                                                download
                                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FiDownloadCloud size={18} />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-200">
                                            <FiFileText size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No CV uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Skills/Expertise */}
                        {isFreelancer && (
                            <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black tracking-wide uppercase text-slate-900">Expertise</h3>
                                    {isOwnProfile && (
                                        <button 
                                            onClick={() => setEditTagsModal(true)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {currentProfileData.tags && currentProfileData.tags.length > 0 ? (
                                        currentProfileData.tags.map((tag) => (
                                            <span key={tag} className="px-3 py-2 text-xs font-bold border rounded-lg bg-primary/10 text-primary border-primary/20">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No skills listed yet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Projects/Jobs Section */}
                        {isClient && (
                            <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                                <h3 className="mb-6 text-sm font-black tracking-wide uppercase text-slate-900">Posted Projects</h3>
                                <ClientPostedJobs clientId={currentProfileData?._id} />
                            </div>
                        )}

                        {/* Reviews Section - Freelancer Only */}
                        {!isClient && currentProfileData?.role === "freelancer" && (
                            <div className="space-y-6 md:col-span-2">
                                <ReviewsDisplay freelancerId={currentProfileData?._id} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
export default Profile;
